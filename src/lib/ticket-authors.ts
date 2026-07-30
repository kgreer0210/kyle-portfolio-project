import { createAdminSupabaseClient } from "@/lib/supabase";

const fallbackAdminName = "KYGR Solutions";
const systemAuthorName = "System";
const unknownAuthorName = "Unknown author";

/**
 * Resolves ticket message authors to display names.
 *
 * The client portal can't read author names through the `profiles:author_id`
 * embed: `profiles_select_self_or_admin` only lets a user read their own row, so
 * every admin reply came back null and rendered as "Unknown author". Widening
 * that policy isn't an option — RLS is row-level, so letting clients read an
 * admin's profile row would expose the email column too. Resolving here with the
 * service role keeps the policy tight and returns names only.
 */
export async function resolveTicketAuthorNames(
  authorIds: Array<string | null | undefined>,
): Promise<Map<string, string>> {
  const ids = [...new Set(authorIds.filter((id): id is string => Boolean(id)))];
  const names = new Map<string, string>();

  if (ids.length === 0) {
    return names;
  }

  const supabase = createAdminSupabaseClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("id, full_name, role")
    .in("id", ids);

  if (error) {
    console.error("Ticket author lookup error:", error);
    return names;
  }

  (data || []).forEach((profile) => {
    const { id, full_name: fullName, role } = profile as {
      id: string;
      full_name: string | null;
      role: string | null;
    };

    // Deliberately never falls back to the email address — that would leak an
    // admin's address to every client on the thread.
    names.set(id, fullName || (role === "admin" ? fallbackAdminName : unknownAuthorName));
  });

  return names;
}

export function getTicketAuthorLabel(args: {
  authorId?: string | null;
  isSystem?: boolean | null;
  names: Map<string, string>;
}): string {
  if (args.isSystem || !args.authorId) {
    return systemAuthorName;
  }

  return args.names.get(args.authorId) || unknownAuthorName;
}

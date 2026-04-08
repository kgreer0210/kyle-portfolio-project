import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

const protectedPortalPrefixes = ["/portal"];
const protectedAdminPrefixes = ["/admin"];

function isMatchingRoute(pathname: string, prefixes: string[]) {
  return prefixes.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

function getSupabaseCredentials() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!url || !key) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY for middleware auth.",
    );
  }

  return { url, key };
}

export async function middleware(request: NextRequest) {
  const response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const { url, key } = getSupabaseCredentials();
  const supabase = createServerClient(url, key, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          request.cookies.set(name, value);
          response.cookies.set(name, value, options);
        });
      },
    },
  });

  const pathname = request.nextUrl.pathname;
  const requiresPortalAuth = isMatchingRoute(pathname, protectedPortalPrefixes);
  const requiresAdminAuth = isMatchingRoute(pathname, protectedAdminPrefixes);
  const isLoginRoute = pathname === "/login";

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user && (requiresPortalAuth || requiresAdminAuth)) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/login";
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (!user) {
    return response;
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  const role = (profile as { role?: "admin" | "client" } | null)?.role;

  if (isLoginRoute && role) {
    const destination = request.nextUrl.clone();
    destination.pathname = role === "admin" ? "/admin" : "/portal";
    destination.search = "";
    return NextResponse.redirect(destination);
  }

  if (requiresAdminAuth && role !== "admin") {
    const destination = request.nextUrl.clone();
    destination.pathname = "/portal";
    destination.search = "";
    return NextResponse.redirect(destination);
  }

  if (requiresPortalAuth && role === "admin") {
    const destination = request.nextUrl.clone();
    destination.pathname = "/admin";
    destination.search = "";
    return NextResponse.redirect(destination);
  }

  return response;
}

export const config = {
  matcher: ["/login", "/portal/:path*", "/admin/:path*"],
};

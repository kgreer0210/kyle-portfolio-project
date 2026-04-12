import { NextResponse } from "next/server";

export function jsonError(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

export function jsonFromAuthError(error: unknown) {
  const message = error instanceof Error ? error.message : "Unknown error";

  if (message === "UNAUTHORIZED") {
    return jsonError("Unauthorized", 401);
  }

  if (message === "FORBIDDEN") {
    return jsonError("Forbidden", 403);
  }

  if (message === "NO_ORGANIZATION") {
    return jsonError("No organization is associated with this user.", 403);
  }

  return null;
}

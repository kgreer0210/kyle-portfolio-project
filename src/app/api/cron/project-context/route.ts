import { NextRequest, NextResponse } from "next/server";
import { isAuthorizedCron } from "@/lib/dailyActions";
import { processContextJobs } from "@/lib/project-context/server";
import { contextEnabled } from "@/lib/project-context/schema";
export const runtime = "nodejs";
export const maxDuration = 120;
export async function GET(req: NextRequest) {
  if (
    !isAuthorizedCron(req.headers.get("authorization"), process.env.CRON_SECRET)
  )
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!contextEnabled()) return NextResponse.json({ enabled: false });
  try {
    await processContextJobs();
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json(
      { error: "Context processing unavailable." },
      { status: 503 },
    );
  }
}

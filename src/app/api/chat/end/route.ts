import { NextRequest, NextResponse } from "next/server";
import {
  claimConversationForFinalize,
  getConversationTranscript,
  writeConversationAnalytics,
} from "@/lib/chatStorage";
import { scoreChatTranscript } from "@/lib/chatLeadScoring";
import { sendChatDigestEmail } from "@/lib/notifications";

export const runtime = "nodejs";
export const maxDuration = 300;

interface EndRequestBody {
  conversationId: string;
  status?: "completed" | "abandoned";
  visitorName?: string | null;
  visitorEmail?: string | null;
}

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function POST(req: NextRequest) {
  let body: EndRequestBody;
  try {
    body = (await req.json()) as EndRequestBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!body.conversationId || !UUID_REGEX.test(body.conversationId)) {
    return NextResponse.json(
      { error: "Invalid conversationId" },
      { status: 400 },
    );
  }

  // Read the conversation + transcript first so we can decide whether the
  // session ever produced any user content (and to know when it started for
  // the digest header). The decision to actually run scoring + email comes
  // AFTER an atomic claim below.
  const { conversation, messages } = await getConversationTranscript(
    body.conversationId,
  );

  if (!conversation) {
    return NextResponse.json(
      { error: "Conversation not found" },
      { status: 404 },
    );
  }

  // Quick early-out for double-fires we can detect cheaply. The atomic
  // claim below is the authoritative race-free guard, but skipping a write
  // when we already have evidence the conversation is finalized is a small
  // optimization.
  if (conversation.status !== "active" || conversation.endedAt !== null) {
    return NextResponse.json({ ok: true, alreadyEnded: true });
  }

  const visitorName =
    body.visitorName?.trim().slice(0, 100) || conversation.visitorName || null;
  const visitorEmail =
    body.visitorEmail?.trim().slice(0, 255) ||
    conversation.visitorEmail ||
    null;

  const userMessageCount = messages.filter((m) => m.role === "user").length;
  const terminalStatus: "completed" | "abandoned" =
    userMessageCount === 0 ? "abandoned" : body.status || "completed";

  // Atomic transition active -> terminalStatus. Only ONE concurrent caller
  // can win this race; any other simultaneous /api/chat/end POSTs will get
  // back `false` and short-circuit without re-scoring or re-emailing the
  // digest. This is the canonical idempotency mechanism — the read check
  // above is just an optimization.
  const claimed = await claimConversationForFinalize(
    body.conversationId,
    terminalStatus,
  );
  if (!claimed) {
    return NextResponse.json({ ok: true, alreadyEnded: true });
  }

  // Persist any newly-captured visitor metadata immediately after the claim,
  // so even if scoring fails downstream the lead-capture record reflects
  // what the visitor gave us.
  await writeConversationAnalytics(body.conversationId, {
    visitorName,
    visitorEmail,
  });

  // Empty conversations are now finalized as "abandoned" by the claim
  // itself. No scoring, no email — just exit.
  if (userMessageCount === 0) {
    return NextResponse.json({ ok: true, scored: false });
  }

  const scoring = await scoreChatTranscript(messages, {
    name: visitorName,
    email: visitorEmail,
  });

  await writeConversationAnalytics(body.conversationId, {
    summary: scoring?.summary ?? null,
    intent: scoring?.intent ?? null,
    leadScore: scoring?.overall_score ?? null,
    scoreTier: scoring?.score_tier ?? null,
  });

  await sendChatDigestEmail({
    conversationId: body.conversationId,
    visitorName,
    visitorEmail,
    startedAt: conversation.startedAt,
    endedAt: new Date().toISOString(),
    transcript: messages.map((m) => ({ role: m.role, content: m.content })),
    scoring,
  });

  return NextResponse.json({ ok: true, scored: scoring !== null });
}

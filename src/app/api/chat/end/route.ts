import { NextRequest, NextResponse } from "next/server";
import {
  finalizeConversation,
  getConversationTranscript,
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

  // Pull the full transcript first. If there are zero user messages we don't
  // bother scoring or emailing — the visitor opened and abandoned the widget.
  const { conversation, messages } = await getConversationTranscript(
    body.conversationId,
  );

  if (!conversation) {
    return NextResponse.json(
      { error: "Conversation not found" },
      { status: 404 },
    );
  }

  // Idempotency guard: if the conversation is already finalized, do NOT
  // re-score or re-send the email digest. Multiple end calls can fire from
  // the same conversation (X button click + pagehide + tab close + a stale
  // session that re-closes a completed convo), and each one would otherwise
  // blast Kyle's inbox with a duplicate.
  if (conversation.status !== "active" || conversation.endedAt !== null) {
    return NextResponse.json({ ok: true, alreadyEnded: true });
  }

  // Honor any visitor info the client might have collected after the last
  // /api/chat turn (e.g. email captured in a dedicated UI step).
  const visitorName =
    body.visitorName?.trim().slice(0, 100) || conversation.visitorName || null;
  const visitorEmail =
    body.visitorEmail?.trim().slice(0, 255) || conversation.visitorEmail || null;

  const userMessageCount = messages.filter((m) => m.role === "user").length;

  // Empty / abandoned-before-real-engagement conversations: just mark them
  // and skip scoring + email. No noise in Kyle's inbox.
  if (userMessageCount === 0) {
    await finalizeConversation(body.conversationId, {
      status: "abandoned",
    });
    return NextResponse.json({ ok: true, scored: false });
  }

  const scoring = await scoreChatTranscript(messages, {
    name: visitorName,
    email: visitorEmail,
  });

  await finalizeConversation(body.conversationId, {
    status: body.status || "completed",
    summary: scoring?.summary ?? null,
    intent: scoring?.intent ?? null,
    leadScore: scoring?.overall_score ?? null,
    scoreTier: scoring?.score_tier ?? null,
  });

  // Send the digest. Failures are swallowed inside the helper; we still
  // return ok so the client can close the widget cleanly.
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

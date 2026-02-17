import { NextRequest, NextResponse } from "next/server";
import { Retell } from "retell-sdk";
import { supabase } from "@/lib/supabase";
import { sendEmailNotification, sendDiscordNotification } from "@/lib/notifications";

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = request.headers.get("x-retell-signature");

    // Verify webhook signature
    if (
      !Retell.verify(
        body,
        process.env.RETELL_API_KEY!,
        signature as string,
      )
    ) {
      console.error("Invalid Retell webhook signature");
      return new NextResponse(null, { status: 401 });
    }

    const { event, call } = JSON.parse(body);

    switch (event) {
      case "call_started":
        console.log("Retell call started:", call.call_id);
        break;

      case "call_ended": {
        const { error } = await supabase.from("retell_calls").upsert(
          {
            call_id: call.call_id,
            from_number: call.from_number ?? null,
            to_number: call.to_number ?? null,
            direction: call.direction ?? null,
            call_status: call.call_status ?? null,
            duration_ms: call.duration_ms ?? null,
            transcript: call.transcript ?? null,
            recording_url: call.recording_url ?? null,
            disconnection_reason: call.disconnection_reason ?? null,
            metadata: call.metadata ?? null,
          },
          { onConflict: "call_id" },
        );

        if (error) {
          console.error("Supabase insert error (call_ended):", error);
        }
        break;
      }

      case "call_analyzed": {
        const analysis = call.call_analysis ?? {};
        const customData = analysis.custom_analysis_data ?? {};

        const { error } = await supabase
          .from("retell_calls")
          .upsert(
            {
              call_id: call.call_id,
              from_number: call.from_number ?? null,
              to_number: call.to_number ?? null,
              direction: call.direction ?? null,
              call_status: call.call_status ?? null,
              duration_ms: call.duration_ms ?? null,
              transcript: call.transcript ?? null,
              recording_url: call.recording_url ?? null,
              disconnection_reason: call.disconnection_reason ?? null,
              metadata: call.metadata ?? null,
              call_summary: analysis.call_summary ?? null,
              user_sentiment: analysis.user_sentiment ?? null,
              call_successful: analysis.call_successful ?? null,
              custom_analysis_data: customData,
              analyzed_at: new Date().toISOString(),
            },
            { onConflict: "call_id" },
          );

        if (error) {
          console.error("Supabase update error (call_analyzed):", error);
        }

        // Send notifications with full analysis data
        const notificationData = {
          callId: call.call_id,
          fromNumber: call.from_number ?? null,
          duration: call.duration_ms ?? null,
          summary: analysis.call_summary ?? null,
          sentiment: analysis.user_sentiment ?? null,
          callerName: customData.caller_name ?? null,
          callReason: customData.call_reason ?? null,
          urgency: customData.urgency ?? null,
        };

        // Fire-and-forget — don't block the webhook response
        Promise.all([
          sendEmailNotification(notificationData),
          sendDiscordNotification(notificationData),
        ]).catch((err) => console.error("Notification error:", err));

        break;
      }

      default:
        console.log("Unknown Retell event:", event);
    }

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error("Retell webhook error:", error);
    return NextResponse.json(
      { error: "Webhook processing failed" },
      { status: 500 },
    );
  }
}

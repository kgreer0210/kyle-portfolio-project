import { Resend } from "resend";
import type { Qualification } from "./leadQualification";

interface CallNotificationData {
  callId: string;
  fromNumber: string | null;
  duration: number | null;
  summary: string | null;
  sentiment: string | null;
  callerName: string | null;
  callerEmail: string | null;
  callerPhone: string | null;
  callReason: string | null;
  projectDetails: string | null;
  urgency: string | null;
}

export async function sendEmailNotification(data: CallNotificationData) {
  try {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      console.error(
        "RESEND_API_KEY not configured, skipping email notification",
      );
      return;
    }

    const resend = new Resend(apiKey);
    const notificationEmail =
      process.env.CONTACT_EMAIL || "info@kygrsolutions.com";
    const durationSec = data.duration ? Math.round(data.duration / 1000) : 0;
    const caller = data.callerName || data.fromNumber || "Unknown";
    const urgencyColor =
      data.urgency === "high"
        ? "#ff0000"
        : data.urgency === "medium"
          ? "#ffa500"
          : "#00cc66";

    await resend.emails.send({
      from: "KYGR Call Alerts <info@kygrsolutions.com>",
      to: notificationEmail,
      subject: `📞 Missed Call from ${caller}${data.urgency === "high" ? " [URGENT]" : ""}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #0094c6;">New Call via Retell AI</h2>
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 8px; font-weight: bold;">Caller</td>
              <td style="padding: 8px;">${caller}</td>
            </tr>
            ${data.fromNumber ? `<tr><td style="padding: 8px; font-weight: bold;">Phone</td><td style="padding: 8px;">${data.fromNumber}</td></tr>` : ""}
            ${data.callerEmail ? `<tr><td style="padding: 8px; font-weight: bold;">Email</td><td style="padding: 8px;">${data.callerEmail}</td></tr>` : ""}
            ${data.callerPhone ? `<tr><td style="padding: 8px; font-weight: bold;">Callback #</td><td style="padding: 8px;">${data.callerPhone}</td></tr>` : ""}
            <tr>
              <td style="padding: 8px; font-weight: bold;">Duration</td>
              <td style="padding: 8px;">${durationSec}s</td>
            </tr>
            ${data.urgency ? `<tr><td style="padding: 8px; font-weight: bold;">Urgency</td><td style="padding: 8px;"><span style="color: ${urgencyColor}; font-weight: bold;">${data.urgency.toUpperCase()}</span></td></tr>` : ""}
            ${data.callReason ? `<tr><td style="padding: 8px; font-weight: bold;">Reason</td><td style="padding: 8px;">${data.callReason}</td></tr>` : ""}
            ${data.projectDetails ? `<tr><td style="padding: 8px; font-weight: bold;">Project Details</td><td style="padding: 8px;">${data.projectDetails}</td></tr>` : ""}
            ${data.sentiment ? `<tr><td style="padding: 8px; font-weight: bold;">Sentiment</td><td style="padding: 8px;">${data.sentiment}</td></tr>` : ""}
          </table>
          ${
            data.summary
              ? `
          <hr style="border: none; border-top: 1px solid #ccc; margin: 20px 0;" />
          <h3 style="color: #333;">Call Summary</h3>
          <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px;">
            <p style="white-space: pre-wrap; margin: 0;">${data.summary}</p>
          </div>
          `
              : ""
          }
          <p style="margin-top: 20px; color: #666; font-size: 12px;">
            Call ID: ${data.callId}
          </p>
        </div>
      `,
    });
  } catch (error) {
    console.error("Failed to send email notification:", error);
  }
}

export async function sendDiscordNotification(data: CallNotificationData) {
  try {
    const webhookUrl = process.env.DISCORD_WEBHOOK_URL;
    if (!webhookUrl) return;

    const durationSec = data.duration ? Math.round(data.duration / 1000) : 0;

    const embed = {
      title: "📞 New Retell Call",
      color:
        data.urgency === "high"
          ? 0xff0000
          : data.urgency === "medium"
            ? 0xffa500
            : 0x00cc66,
      fields: [
        {
          name: "Caller",
          value: data.callerName || data.fromNumber || "Unknown",
          inline: true,
        },
        { name: "Duration", value: `${durationSec}s`, inline: true },
        { name: "Sentiment", value: data.sentiment || "N/A", inline: true },
        ...(data.urgency
          ? [{ name: "Urgency", value: data.urgency, inline: true }]
          : []),
        ...(data.callerEmail
          ? [{ name: "Email", value: data.callerEmail, inline: true }]
          : []),
        ...(data.callerPhone
          ? [{ name: "Callback #", value: data.callerPhone, inline: true }]
          : []),
        ...(data.callReason
          ? [{ name: "Reason", value: data.callReason }]
          : []),
        ...(data.projectDetails
          ? [
              {
                name: "Project Details",
                value: data.projectDetails.slice(0, 1024),
              },
            ]
          : []),
        ...(data.summary
          ? [{ name: "Summary", value: data.summary.slice(0, 1024) }]
          : []),
      ],
      timestamp: new Date().toISOString(),
    };

    await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ embeds: [embed] }),
    });
  } catch (error) {
    console.error("Failed to send Discord notification:", error);
  }
}

/* ------------------------------------------------------------------ */
/*  Contact form lead notifications                                    */
/* ------------------------------------------------------------------ */

export interface ContactLeadNotificationData {
  name: string;
  email: string;
  subject: string;
  message: string;
  /** Null when the AI qualification pass failed or was skipped. */
  qualification: Qualification | null;
}

function tierBadgeColor(tier: "high" | "medium" | "low" | null): string {
  if (tier === "high") return "#00cc66";
  if (tier === "medium") return "#ffa500";
  return "#888888";
}

function tierDiscordColor(tier: "high" | "medium" | "low" | null): number {
  if (tier === "high") return 0x00cc66;
  if (tier === "medium") return 0xffa500;
  return 0x888888;
}

function escapeHtml(input: string): string {
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

/**
 * Sends the qualified-lead email via Resend. This REPLACES the old raw-only
 * contact-form email: the raw submission is included at the bottom of this
 * email so Kyle still has everything in one place, no duplicate notifications.
 */
export async function sendContactLeadEmail(
  data: ContactLeadNotificationData,
): Promise<void> {
  try {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      console.error(
        "RESEND_API_KEY not configured, skipping contact lead email",
      );
      return;
    }

    const resend = new Resend(apiKey);
    const to = process.env.CONTACT_EMAIL || "info@kygrsolutions.com";
    const q = data.qualification;
    const tier = q?.score_tier ?? null;
    const tierLabel = tier ? tier.toUpperCase() : "UNQUALIFIED";
    const color = tierBadgeColor(tier);

    const subjectPrefix = tier ? `[${tierLabel}] ` : "";
    const subjectLine = `${subjectPrefix}New lead: ${data.name} — ${data.subject}`;

    const qualRows = q
      ? `
          <tr><td style="padding: 8px; font-weight: bold;">Score</td><td style="padding: 8px;"><span style="color: ${color}; font-weight: bold;">${q.overall_score}/100 (${tierLabel})</span></td></tr>
          <tr><td style="padding: 8px; font-weight: bold;">Intent</td><td style="padding: 8px;">${escapeHtml(q.intent)}</td></tr>
          <tr><td style="padding: 8px; font-weight: bold;">Project Type</td><td style="padding: 8px;">${escapeHtml(q.project_type)}</td></tr>
          <tr><td style="padding: 8px; font-weight: bold;">Project Fit</td><td style="padding: 8px;">${q.project_fit_score}/100</td></tr>
          <tr><td style="padding: 8px; font-weight: bold;">Seriousness</td><td style="padding: 8px;">${q.seriousness_score}/100</td></tr>
          <tr><td style="padding: 8px; font-weight: bold;">Budget Signal</td><td style="padding: 8px;">${escapeHtml(q.budget_signal)}</td></tr>
          <tr><td style="padding: 8px; font-weight: bold;">Timeline</td><td style="padding: 8px;">${escapeHtml(q.timeline)}</td></tr>
        `
      : `<tr><td style="padding: 8px; color: #888;" colspan="2">AI qualification was not available for this submission.</td></tr>`;

    const reasoningBlock = q
      ? `
          <h3 style="color: #333; margin-top: 24px;">Reasoning</h3>
          <p style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 0;">${escapeHtml(q.reasoning)}</p>
          <h3 style="color: #333; margin-top: 24px;">Recommended next step</h3>
          <p style="background-color: #fffbe6; padding: 15px; border-radius: 5px; margin: 0; border-left: 3px solid ${color};">${escapeHtml(q.recommended_action)}</p>
        `
      : "";

    await resend.emails.send({
      from: "KYGR Lead Alerts <info@kygrsolutions.com>",
      to,
      replyTo: data.email,
      subject: subjectLine,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 640px; margin: 0 auto;">
          <h2 style="color: #0094c6;">New contact-form lead</h2>
          <table style="width: 100%; border-collapse: collapse;">
            <tr><td style="padding: 8px; font-weight: bold;">From</td><td style="padding: 8px;">${escapeHtml(data.name)} &lt;${escapeHtml(data.email)}&gt;</td></tr>
            <tr><td style="padding: 8px; font-weight: bold;">Subject</td><td style="padding: 8px;">${escapeHtml(data.subject)}</td></tr>
            ${qualRows}
          </table>
          ${reasoningBlock}
          <hr style="border: none; border-top: 1px solid #ccc; margin: 24px 0;" />
          <h3 style="color: #333;">Original message</h3>
          <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px;">
            <p style="white-space: pre-wrap; margin: 0;">${escapeHtml(data.message)}</p>
          </div>
          <p style="margin-top: 24px; color: #666; font-size: 12px;">
            Sent from your portfolio contact form. Reply directly to this email to respond to ${escapeHtml(data.name)}.
          </p>
        </div>
      `,
      text: [
        `${subjectPrefix}New contact-form lead`,
        "",
        `From: ${data.name} <${data.email}>`,
        `Subject: ${data.subject}`,
        ...(q
          ? [
              "",
              `Score: ${q.overall_score}/100 (${tierLabel})`,
              `Intent: ${q.intent}`,
              `Project type: ${q.project_type}`,
              `Project fit: ${q.project_fit_score}/100`,
              `Seriousness: ${q.seriousness_score}/100`,
              `Budget signal: ${q.budget_signal}`,
              `Timeline: ${q.timeline}`,
              "",
              `Reasoning: ${q.reasoning}`,
              `Recommended: ${q.recommended_action}`,
            ]
          : ["", "AI qualification was not available for this submission."]),
        "",
        "--- Original message ---",
        data.message,
      ].join("\n"),
    });
  } catch (error) {
    console.error("Failed to send contact lead email:", error);
  }
}

/**
 * Posts the qualified-lead embed to Discord. Mirrors the Retell embed style
 * but uses tier-based color coding instead of urgency.
 */
export async function sendContactLeadDiscord(
  data: ContactLeadNotificationData,
): Promise<void> {
  try {
    const webhookUrl = process.env.DISCORD_WEBHOOK_URL;
    if (!webhookUrl) return;

    const q = data.qualification;
    const tier = q?.score_tier ?? null;
    const tierLabel = tier ? tier.toUpperCase() : "UNQUALIFIED";

    const embed = {
      title: `📩 ${tierLabel} contact-form lead`,
      color: tierDiscordColor(tier),
      fields: [
        { name: "Name", value: data.name, inline: true },
        { name: "Email", value: data.email, inline: true },
        { name: "Subject", value: data.subject, inline: true },
        ...(q
          ? [
              {
                name: "Score",
                value: `${q.overall_score}/100`,
                inline: true,
              },
              { name: "Intent", value: q.intent, inline: true },
              { name: "Project Type", value: q.project_type, inline: true },
              { name: "Budget", value: q.budget_signal, inline: true },
              { name: "Timeline", value: q.timeline, inline: true },
              {
                name: "Project Fit",
                value: `${q.project_fit_score}/100`,
                inline: true,
              },
              {
                name: "Reasoning",
                value: q.reasoning.slice(0, 1024),
              },
              {
                name: "Recommended",
                value: q.recommended_action.slice(0, 1024),
              },
            ]
          : [
              {
                name: "Note",
                value: "AI qualification unavailable for this submission.",
              },
            ]),
        {
          name: "Message",
          value: data.message.slice(0, 1024),
        },
      ],
      timestamp: new Date().toISOString(),
    };

    await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ embeds: [embed] }),
    });
  } catch (error) {
    console.error("Failed to send contact lead Discord notification:", error);
  }
}

/**
 * Fan out a qualified contact-form lead to both Email and Discord. Each
 * underlying helper already swallows its own errors so one failing channel
 * won't block the other.
 */
export async function sendContactLeadNotifications(
  data: ContactLeadNotificationData,
): Promise<void> {
  await Promise.all([sendContactLeadEmail(data), sendContactLeadDiscord(data)]);
}

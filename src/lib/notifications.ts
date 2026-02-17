import { Resend } from "resend";

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
      console.error("RESEND_API_KEY not configured, skipping email notification");
      return;
    }

    const resend = new Resend(apiKey);
    const notificationEmail = process.env.CONTACT_EMAIL || "info@kygrsolutions.com";
    const durationSec = data.duration ? Math.round(data.duration / 1000) : 0;
    const caller = data.callerName || data.fromNumber || "Unknown";
    const urgencyColor = data.urgency === "high" ? "#ff0000" : data.urgency === "medium" ? "#ffa500" : "#00cc66";

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
          ${data.summary ? `
          <hr style="border: none; border-top: 1px solid #ccc; margin: 20px 0;" />
          <h3 style="color: #333;">Call Summary</h3>
          <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px;">
            <p style="white-space: pre-wrap; margin: 0;">${data.summary}</p>
          </div>
          ` : ""}
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
      color: data.urgency === "high" ? 0xff0000 : data.urgency === "medium" ? 0xffa500 : 0x00cc66,
      fields: [
        { name: "Caller", value: data.callerName || data.fromNumber || "Unknown", inline: true },
        { name: "Duration", value: `${durationSec}s`, inline: true },
        { name: "Sentiment", value: data.sentiment || "N/A", inline: true },
        ...(data.urgency ? [{ name: "Urgency", value: data.urgency, inline: true }] : []),
        ...(data.callerEmail ? [{ name: "Email", value: data.callerEmail, inline: true }] : []),
        ...(data.callerPhone ? [{ name: "Callback #", value: data.callerPhone, inline: true }] : []),
        ...(data.callReason ? [{ name: "Reason", value: data.callReason }] : []),
        ...(data.projectDetails ? [{ name: "Project Details", value: data.projectDetails.slice(0, 1024) }] : []),
        ...(data.summary ? [{ name: "Summary", value: data.summary.slice(0, 1024) }] : []),
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

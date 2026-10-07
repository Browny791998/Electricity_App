import "server-only";
import { buildReportEmail, type EmailInput } from "./report";

export interface Attachment {
  filename: string;
  bytes: Uint8Array;
}

/**
 * Emails a report via Resend. Best effort: returns false (never throws) so a
 * mail problem cannot lose a report that is already saved.
 */
export async function sendReportEmail(
  input: EmailInput,
  attachments: Attachment[],
  replyTo: string | null,
): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY;
  const to = process.env.REPORT_EMAIL_TO;
  if (!apiKey || !to) {
    console.warn("report email skipped: RESEND_API_KEY or REPORT_EMAIL_TO not set");
    return false;
  }

  const { subject, text, html } = buildReportEmail(input);
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: process.env.REPORT_EMAIL_FROM ?? "Electricity App <onboarding@resend.dev>",
        to: [to],
        ...(replyTo ? { reply_to: replyTo } : {}),
        subject,
        text,
        html,
        attachments: attachments.map((a) => ({
          filename: a.filename,
          content: Buffer.from(a.bytes).toString("base64"),
        })),
      }),
      signal: AbortSignal.timeout(15_000),
    });
    if (!res.ok) console.error("report email failed", res.status, await res.text());
    return res.ok;
  } catch (e) {
    console.error("report email error", e);
    return false;
  }
}

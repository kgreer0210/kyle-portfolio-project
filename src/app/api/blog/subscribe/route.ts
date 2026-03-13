import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { supabase } from "@/lib/supabase";

const getResendClient = () => {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    return null;
  }
  return new Resend(apiKey);
};

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

const rateLimitStore = new Map<string, RateLimitEntry>();

const RATE_LIMIT_WINDOW = 15 * 60 * 1000; // 15 minutes
const MAX_REQUESTS_PER_WINDOW = 5;

function getClientIP(request: NextRequest): string {
  const forwarded = request.headers.get("x-forwarded-for");
  const realIP = request.headers.get("x-real-ip");
  return forwarded?.split(",")[0] || realIP || "unknown";
}

function checkRateLimit(ip: string): { allowed: boolean; retryAfter?: number } {
  const now = Date.now();
  const entry = rateLimitStore.get(ip);

  if (!entry || now > entry.resetTime) {
    rateLimitStore.set(ip, {
      count: 1,
      resetTime: now + RATE_LIMIT_WINDOW,
    });
    return { allowed: true };
  }

  if (entry.count >= MAX_REQUESTS_PER_WINDOW) {
    const retryAfter = Math.ceil((entry.resetTime - now) / 1000);
    return { allowed: false, retryAfter };
  }

  entry.count++;
  return { allowed: true };
}

setInterval(
  () => {
    const now = Date.now();
    for (const [ip, entry] of rateLimitStore.entries()) {
      if (now > entry.resetTime) {
        rateLimitStore.delete(ip);
      }
    }
  },
  30 * 60 * 1000,
);

function sanitizeInput(input: string): string {
  return input.trim().replace(/[<>]/g, "");
}

function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export async function POST(request: NextRequest) {
  try {
    const body: { email: string } = await request.json();

    const clientIP = getClientIP(request);
    const rateLimitCheck = checkRateLimit(clientIP);

    if (!rateLimitCheck.allowed) {
      return NextResponse.json(
        {
          error: `Too many requests. Please try again in ${rateLimitCheck.retryAfter} seconds.`,
        },
        {
          status: 429,
          headers: {
            "Retry-After": rateLimitCheck.retryAfter?.toString() || "900",
          },
        },
      );
    }

    if (!body.email) {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 },
      );
    }

    const email = sanitizeInput(body.email);

    if (!validateEmail(email)) {
      return NextResponse.json(
        { error: "Invalid email address" },
        { status: 400 },
      );
    }

    if (email.length > 255) {
      return NextResponse.json(
        { error: "Email must be less than 255 characters" },
        { status: 400 },
      );
    }

    const { error: dbError } = await supabase
      .from("blog_subscribers")
      .insert({ email });

    if (dbError) {
      // Postgres unique constraint violation
      if (dbError.code === "23505") {
        return NextResponse.json(
          { message: "You're already subscribed!" },
          { status: 200 },
        );
      }
      console.error("Supabase insert error:", dbError);
      return NextResponse.json(
        { error: "Failed to save subscription. Please try again later." },
        { status: 500 },
      );
    }

    const contactEmail =
      process.env.CONTACT_EMAIL || "info@kygrsolutions.com";
    const resend = getResendClient();

    if (resend) {
      // Welcome email to subscriber
      await resend.emails.send({
        from: "Kyle Greer <info@kygrsolutions.com>",
        to: email,
        subject: "You're on the list — KYGR Blog",
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #0094c6;">You're on the list!</h2>
            <p>Hey there,</p>
            <p>Thanks for subscribing to the KYGR Blog. I'll send you a note as soon as new content goes live — tutorials, case studies, and insights from building software for real businesses in middle Georgia.</p>
            <p>Stay tuned,<br /><strong>Kyle Greer</strong><br />KYGR Solutions</p>
            <hr style="border: none; border-top: 1px solid #ccc; margin: 20px 0;" />
            <p style="color: #666; font-size: 12px;">You subscribed at kygrsolutions.com/blog. If this was a mistake, just ignore this email.</p>
          </div>
        `,
        text: `You're on the list!\n\nThanks for subscribing to the KYGR Blog. I'll reach out when new content goes live.\n\nStay tuned,\nKyle Greer\nKYGR Solutions`,
      });

      // Notification email to Kyle
      await resend.emails.send({
        from: "Blog Subscriptions <info@kygrsolutions.com>",
        to: contactEmail,
        subject: "New Blog Subscriber",
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #0094c6;">New Blog Subscriber</h2>
            <p><strong>${email}</strong> just subscribed to the KYGR Blog.</p>
            <p style="color: #666; font-size: 12px;">This notification was sent from your portfolio blog subscription form.</p>
          </div>
        `,
        text: `New Blog Subscriber\n\n${email} just subscribed to the KYGR Blog.`,
      });
    } else {
      console.warn("RESEND_API_KEY not configured — skipping welcome emails");
    }

    return NextResponse.json(
      { message: "Subscribed successfully!" },
      { status: 200 },
    );
  } catch (error) {
    console.error("Blog subscription error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred. Please try again later." },
      { status: 500 },
    );
  }
}

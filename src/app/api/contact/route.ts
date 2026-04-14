import { NextRequest, NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase";
import { qualifyLead } from "@/lib/leadQualification";
import { sendContactLeadNotifications } from "@/lib/notifications";

interface ContactFormData {
  name: string;
  email: string;
  subject: string;
  message: string;
  website?: string; // Honeypot field
}

// Simple in-memory rate limiting store
// In production, consider using Redis or a database for distributed systems
interface RateLimitEntry {
  count: number;
  resetTime: number;
}

const rateLimitStore = new Map<string, RateLimitEntry>();

// Rate limiting configuration
const RATE_LIMIT_WINDOW = 15 * 60 * 1000; // 15 minutes
const MAX_REQUESTS_PER_WINDOW = 5; // Max 5 submissions per 15 minutes per IP

function getClientIP(request: NextRequest): string {
  // Try to get real IP from headers (for proxies/load balancers)
  const forwarded = request.headers.get("x-forwarded-for");
  const realIP = request.headers.get("x-real-ip");
  return forwarded?.split(",")[0] || realIP || "unknown";
}

function checkRateLimit(ip: string): { allowed: boolean; retryAfter?: number } {
  const now = Date.now();
  const entry = rateLimitStore.get(ip);

  if (!entry || now > entry.resetTime) {
    // No entry or window expired, create new entry
    rateLimitStore.set(ip, {
      count: 1,
      resetTime: now + RATE_LIMIT_WINDOW,
    });
    return { allowed: true };
  }

  if (entry.count >= MAX_REQUESTS_PER_WINDOW) {
    // Rate limit exceeded
    const retryAfter = Math.ceil((entry.resetTime - now) / 1000); // seconds
    return { allowed: false, retryAfter };
  }

  // Increment count
  entry.count++;
  return { allowed: true };
}

// Cleanup old entries periodically (every 30 minutes)
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
    const body: ContactFormData = await request.json();

    // Check honeypot field - if filled, it's likely a bot
    if (body.website && body.website.trim() !== "") {
      console.warn("Honeypot field was filled - likely a bot");
      // Return success to bot to avoid letting them know they were caught
      return NextResponse.json(
        { message: "Thank you for your message! I'll get back to you soon." },
        { status: 200 },
      );
    }

    // Check rate limiting
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

    // Validate required fields
    if (!body.name || !body.email || !body.subject || !body.message) {
      return NextResponse.json(
        { error: "All fields are required" },
        { status: 400 },
      );
    }

    // Sanitize inputs
    const name = sanitizeInput(body.name);
    const email = sanitizeInput(body.email);
    const subject = sanitizeInput(body.subject);
    const message = sanitizeInput(body.message);

    // Validate email format
    if (!validateEmail(email)) {
      return NextResponse.json(
        { error: "Invalid email address" },
        { status: 400 },
      );
    }

    // Validate field lengths
    if (name.length > 100) {
      return NextResponse.json(
        { error: "Name must be less than 100 characters" },
        { status: 400 },
      );
    }

    if (email.length > 255) {
      return NextResponse.json(
        { error: "Email must be less than 255 characters" },
        { status: 400 },
      );
    }

    if (subject.length > 200) {
      return NextResponse.json(
        { error: "Subject must be less than 200 characters" },
        { status: 400 },
      );
    }

    if (message.length > 5000) {
      return NextResponse.json(
        { error: "Message must be less than 5000 characters" },
        { status: 400 },
      );
    }

    // Persist the raw submission to Supabase first so we never lose a lead
    // even if the downstream AI qualification or notification fans out fails.
    const supabase = createAdminSupabaseClient();
    const userAgent = request.headers.get("user-agent") ?? null;

    const { data: insertedLead, error: insertError } = await supabase
      .from("contact_leads")
      .insert({
        name,
        email,
        subject,
        message,
        ip_address: clientIP,
        user_agent: userAgent,
      })
      .select("id")
      .single();

    if (insertError || !insertedLead) {
      console.error("Failed to persist contact lead:", insertError);
      return NextResponse.json(
        { error: "An unexpected error occurred. Please try again later." },
        { status: 500 },
      );
    }

    // Qualify the lead with Claude Haiku via OpenRouter. Returns null on
    // missing key or any failure — the UI falls back to the medium tier so
    // qualification failures never block form submission.
    const qualification = await qualifyLead({ name, email, subject, message });

    // Write qualification results back to the row (best-effort — don't fail
    // the request if this update fails).
    if (qualification) {
      const { error: updateError } = await supabase
        .from("contact_leads")
        .update({
          qualified_at: new Date().toISOString(),
          intent: qualification.intent,
          project_type: qualification.project_type,
          project_fit_score: qualification.project_fit_score,
          budget_signal: qualification.budget_signal,
          timeline: qualification.timeline,
          seriousness_score: qualification.seriousness_score,
          overall_score: qualification.overall_score,
          score_tier: qualification.score_tier,
          reasoning: qualification.reasoning,
          recommended_action: qualification.recommended_action,
          qualification_raw: qualification,
        })
        .eq("id", insertedLead.id);

      if (updateError) {
        console.error(
          "Failed to update lead with qualification:",
          updateError,
        );
      }
    }

    // Fan out notifications. Each channel swallows its own errors so one
    // failing channel won't block the other or the response.
    await sendContactLeadNotifications({
      name,
      email,
      subject,
      message,
      qualification,
    });

    // Return the tier so the client can branch its success UI (high-intent
    // leads see a Calendly CTA instead of the standard thank-you). If
    // qualification failed, default to medium.
    const tier = qualification?.score_tier ?? "medium";

    return NextResponse.json(
      {
        message: "Thank you for your message! I'll get back to you soon.",
        tier,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Contact form error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred. Please try again later." },
      { status: 500 },
    );
  }
}

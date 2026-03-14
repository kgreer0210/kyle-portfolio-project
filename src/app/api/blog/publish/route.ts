import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { supabase } from "@/lib/supabase";
import { BlogPost } from "@/types";

const getResendClient = () => {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return null;
  return new Resend(apiKey);
};

function validateApiKey(request: NextRequest): boolean {
  const auth = request.headers.get("authorization");
  const expected = process.env.BLOG_PUBLISH_API_KEY;
  if (!expected) return false;
  return auth === `Bearer ${expected}`;
}

export async function POST(request: NextRequest) {
  if (!validateApiKey(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: Partial<BlogPost>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { id, slug, title, description, content, category, tags, readTime, publishedAt, featured } = body;

  if (!id || !slug || !title || !description || !content || !category || !readTime || !publishedAt) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  // Insert into Supabase
  const { error: insertError } = await supabase.from("blog_posts").insert({
    id,
    slug,
    title,
    description,
    content,
    category,
    tags: tags ?? [],
    read_time: readTime,
    published_at: publishedAt,
    featured: featured ?? false,
  });

  if (insertError) {
    console.error("Failed to insert blog post:", insertError);
    return NextResponse.json(
      { error: "Failed to publish post. " + insertError.message },
      { status: 500 }
    );
  }

  // Fetch all subscribers
  const { data: subscribers, error: subError } = await supabase
    .from("blog_subscribers")
    .select("email");

  if (subError) {
    console.error("Failed to fetch subscribers:", subError);
    return NextResponse.json({
      message: "Post published. Could not send subscriber emails.",
      postId: id,
    });
  }

  const resend = getResendClient();
  const postUrl = `https://kygrsolutions.com/blog/${slug}`;
  const fromAddress = "Kyle Greer <info@kygrsolutions.com>";

  if (resend && subscribers && subscribers.length > 0) {
    const emailPromises = subscribers.map((sub: { email: string }) =>
      resend.emails.send({
        from: fromAddress,
        to: sub.email,
        subject: `New post: ${title}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #0094c6;">New post from the KYGR Blog</h2>
            <h3 style="color: #1a1a2e;">${title}</h3>
            <p style="color: #666;">${description}</p>
            <a href="${postUrl}" style="display: inline-block; margin-top: 16px; padding: 12px 24px; background: #0094c6; color: white; text-decoration: none; border-radius: 6px; font-weight: bold;">
              Read it here →
            </a>
            <hr style="border: none; border-top: 1px solid #ccc; margin: 24px 0;" />
            <p style="color: #999; font-size: 12px;">
              You're receiving this because you subscribed at kygrsolutions.com/blog.
              To unsubscribe, reply to this email.
            </p>
          </div>
        `,
        text: `New post from the KYGR Blog\n\n${title}\n\n${description}\n\nRead it here: ${postUrl}`,
      })
    );

    const results = await Promise.allSettled(emailPromises);
    const failed = results.filter((r) => r.status === "rejected").length;
    if (failed > 0) {
      console.error(`${failed} subscriber email(s) failed to send.`);
    }
  } else if (!resend) {
    console.warn("RESEND_API_KEY not configured — skipping subscriber notifications");
  }

  return NextResponse.json({
    message: `Post published. Notified ${subscribers?.length ?? 0} subscriber(s).`,
    postId: id,
  });
}

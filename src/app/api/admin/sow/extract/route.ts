import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireApiAdminUser } from "@/lib/api-auth";
import { jsonError, jsonFromAuthError } from "@/lib/api-response";
import { isPendingSowPath, sowBucket } from "@/lib/sowStorage";
import { SOW_MODEL, extractSow, normalizeExtraction } from "@/lib/sowExtraction";
import { createAdminSupabaseClient } from "@/lib/supabase";

export const runtime = "nodejs";
// Reading a long PDF with a Sonnet-class model can take a minute or more.
export const maxDuration = 300;

const MAX_PDF_BYTES = 20 * 1024 * 1024;

const extractBodySchema = z.union([
  z.object({ path: z.string().min(1).max(500), fileName: z.string().min(1).max(255) }),
  z.object({ text: z.string().trim().min(200, "Paste the full SOW text.").max(200_000) }),
]);

/**
 * Read a SOW and return an editable draft. Writes nothing to the database;
 * the admin reviews the draft and creates the project separately.
 */
export async function POST(request: NextRequest) {
  try {
    await requireApiAdminUser();
  } catch (error) {
    return jsonFromAuthError(error) || jsonError("Unauthorized", 401);
  }

  let body: z.infer<typeof extractBodySchema>;
  try {
    const parsed = extractBodySchema.safeParse(await request.json());
    if (!parsed.success) {
      return jsonError(parsed.error.issues[0]?.message || "Invalid request body");
    }
    body = parsed.data;
  } catch {
    return jsonError("Invalid JSON");
  }

  try {
    let extraction;

    if ("path" in body) {
      if (!isPendingSowPath(body.path)) {
        return jsonError("Invalid upload path.");
      }

      const { data: file, error: downloadError } = await createAdminSupabaseClient()
        .storage.from(sowBucket)
        .download(body.path);

      if (downloadError || !file) {
        console.error("SOW download error:", downloadError);
        return jsonError("Couldn't read the uploaded file. Try uploading it again.", 400);
      }

      if (file.size > MAX_PDF_BYTES) {
        return jsonError("SOW files must be 20MB or smaller.");
      }

      extraction = await extractSow({
        kind: "pdf",
        data: new Uint8Array(await file.arrayBuffer()),
        fileName: body.fileName,
      });
    } else {
      extraction = await extractSow({ kind: "text", text: body.text });
    }

    return NextResponse.json({
      ...normalizeExtraction(extraction),
      extraction,
      model: SOW_MODEL,
    });
  } catch (error) {
    console.error("SOW extraction error:", error);
    return jsonError(
      "The SOW couldn't be read automatically. You can try again or enter the project by hand.",
      502,
    );
  }
}

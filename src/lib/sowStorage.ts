export const sowBucket = "sow-documents";

function sanitizeFileName(name: string): string {
  const cleaned = name.replace(/[^a-zA-Z0-9.\-_]/g, "-").replace(/-+/g, "-");
  return cleaned.slice(-120) || "sow.pdf";
}

/** Where the browser uploads a SOW before a project exists. */
export function buildPendingSowPath(fileName: string, id: string = crypto.randomUUID()) {
  return `pending/${id}/${sanitizeFileName(fileName)}`;
}

/** Final home once the project is created. */
export function buildProjectSowPath(
  organizationId: string,
  projectId: string,
  pendingPath: string,
) {
  const fileName = pendingPath.split("/").pop() || "sow.pdf";
  return `${organizationId}/${projectId}/${fileName}`;
}

/**
 * Only accept paths shaped exactly like buildPendingSowPath output, so a
 * request can't point extraction or project creation at another object.
 */
export function isPendingSowPath(path: string): boolean {
  return /^pending\/[0-9a-f-]{36}\/(?!\.+$)[a-zA-Z0-9.\-_]{1,120}$/.test(path);
}

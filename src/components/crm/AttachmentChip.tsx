import { formatFileSize } from "@/lib/crm";

export interface AttachmentChipData {
  id: string;
  file_name: string;
  file_size?: number | null;
  signedUrl: string | null;
}

export default function AttachmentChip({
  attachment,
}: {
  attachment: AttachmentChipData;
}) {
  const sizeLabel = formatFileSize(attachment.file_size);
  const label = sizeLabel
    ? `${attachment.file_name} (${sizeLabel})`
    : attachment.file_name;

  if (!attachment.signedUrl) {
    return (
      <span className="rounded-full border border-penn-blue px-4 py-2 text-sm text-text-secondary opacity-60">
        {attachment.file_name} (unavailable)
      </span>
    );
  }

  return (
    <a
      href={attachment.signedUrl}
      target="_blank"
      rel="noreferrer"
      className="rounded-full border border-penn-blue px-4 py-2 text-sm text-text-primary transition hover:border-blue-ncs"
    >
      {label}
    </a>
  );
}

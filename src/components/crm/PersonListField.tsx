"use client";

import { useEffect, useMemo, useState } from "react";

interface PersonRow {
  name: string;
  role: string;
}

interface PersonListFieldProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

const EMPTY_ROW: PersonRow = { name: "", role: "" };

function parseValue(raw: string): PersonRow[] {
  const trimmed = raw.trim();
  if (!trimmed) return [{ ...EMPTY_ROW }];
  try {
    const parsed = JSON.parse(trimmed) as unknown;
    if (Array.isArray(parsed)) {
      const rows = parsed
        .map((entry) => {
          if (entry && typeof entry === "object") {
            const obj = entry as Record<string, unknown>;
            return {
              name: typeof obj.name === "string" ? obj.name : "",
              role: typeof obj.role === "string" ? obj.role : "",
            };
          }
          return null;
        })
        .filter((r): r is PersonRow => r !== null);
      return rows.length > 0 ? rows : [{ ...EMPTY_ROW }];
    }
  } catch {
    // Legacy textarea string — fall through.
  }
  return [{ name: "", role: trimmed }];
}

function serializeRows(rows: PersonRow[]): string {
  const cleaned = rows
    .map((r) => ({ name: r.name.trim(), role: r.role.trim() }))
    .filter((r) => r.name || r.role);
  return cleaned.length === 0 ? "" : JSON.stringify(cleaned);
}

export default function PersonListField({
  value,
  onChange,
  disabled,
}: PersonListFieldProps) {
  const initialRows = useMemo(() => parseValue(value), [value]);
  const [rows, setRows] = useState<PersonRow[]>(initialRows);

  // Re-sync if the parent resets the value (e.g. step change).
  useEffect(() => {
    setRows(parseValue(value));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value === "" ? "empty" : "filled"]);

  function update(next: PersonRow[]) {
    setRows(next);
    onChange(serializeRows(next));
  }

  function setField(index: number, key: keyof PersonRow, val: string) {
    const next = rows.map((row, i) =>
      i === index ? { ...row, [key]: val } : row,
    );
    update(next);
  }

  function addRow() {
    update([...rows, { ...EMPTY_ROW }]);
  }

  function removeRow(index: number) {
    if (rows.length <= 1) {
      update([{ ...EMPTY_ROW }]);
      return;
    }
    update(rows.filter((_, i) => i !== index));
  }

  return (
    <div className="space-y-2">
      {rows.map((row, index) => (
        <div
          key={index}
          className="grid grid-cols-1 gap-2 sm:grid-cols-[minmax(0,1fr)_minmax(0,1.5fr)_auto]"
        >
          <input
            type="text"
            value={row.name}
            onChange={(e) => setField(index, "name", e.target.value)}
            disabled={disabled}
            placeholder="Name"
            aria-label={`Person ${index + 1} name`}
            className="rounded-2xl border border-penn-blue bg-rich-black px-4 py-3 text-sm text-white placeholder:text-text-secondary disabled:opacity-60"
          />
          <input
            type="text"
            value={row.role}
            onChange={(e) => setField(index, "role", e.target.value)}
            disabled={disabled}
            placeholder="Role / what they approve"
            aria-label={`Person ${index + 1} role and approvals`}
            className="rounded-2xl border border-penn-blue bg-rich-black px-4 py-3 text-sm text-white placeholder:text-text-secondary disabled:opacity-60"
          />
          <button
            type="button"
            onClick={() => removeRow(index)}
            disabled={disabled || (rows.length === 1 && !row.name && !row.role)}
            aria-label={`Remove person ${index + 1}`}
            className="self-stretch rounded-2xl border border-penn-blue/60 bg-rich-black/60 px-3 text-text-secondary transition hover:border-red-400/60 hover:text-red-200 disabled:cursor-not-allowed disabled:opacity-30 sm:self-auto"
          >
            ×
          </button>
        </div>
      ))}
      <div>
        <button
          type="button"
          onClick={addRow}
          disabled={disabled}
          className="rounded-full border border-penn-blue/60 bg-rich-black/60 px-4 py-1.5 text-xs font-medium text-text-secondary transition hover:border-blue-ncs/60 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
        >
          + Add another
        </button>
      </div>
    </div>
  );
}

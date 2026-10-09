"use client";

import { useId, useState, type KeyboardEvent, type ReactNode } from "react";

interface WorkspaceSection {
  id: string;
  label: string;
  content: ReactNode;
}

export default function WorkspaceTabs({
  sections,
  label,
}: {
  sections: WorkspaceSection[];
  label: string;
}) {
  const [selected, setSelected] = useState(sections[0]?.id);
  const prefix = useId();
  const active = sections.some((section) => section.id === selected)
    ? selected
    : sections[0]?.id;
  function handleKey(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    let next: number;
    if (event.key === "ArrowRight") next = (index + 1) % sections.length;
    else if (event.key === "ArrowLeft")
      next = (index - 1 + sections.length) % sections.length;
    else if (event.key === "Home") next = 0;
    else if (event.key === "End") next = sections.length - 1;
    else return;
    event.preventDefault();
    setSelected(sections[next].id);
    document.getElementById(`${prefix}-tab-${sections[next].id}`)?.focus();
  }
  return (
    <div className="min-w-0 space-y-6">
      <div
        role="tablist"
        aria-label={label}
        className="flex gap-5 overflow-x-auto border-b border-penn-blue"
      >
        {sections.map((section, index) => (
          <button
            key={section.id}
            type="button"
            role="tab"
            id={`${prefix}-tab-${section.id}`}
            aria-selected={active === section.id}
            aria-controls={`${prefix}-panel-${section.id}`}
            tabIndex={active === section.id ? 0 : -1}
            onClick={() => setSelected(section.id)}
            onKeyDown={(event) => handleKey(event, index)}
            className={`shrink-0 border-b-2 px-1 pb-3 text-sm font-medium transition ${active === section.id ? "border-blue-ncs text-white" : "border-transparent text-text-secondary hover:text-white"}`}
          >
            {section.label}
          </button>
        ))}
      </div>
      {sections.map((section) => (
        <div
          key={section.id}
          role="tabpanel"
          id={`${prefix}-panel-${section.id}`}
          aria-labelledby={`${prefix}-tab-${section.id}`}
          hidden={active !== section.id}
          tabIndex={0}
          className="min-w-0 outline-none"
        >
          {section.content}
        </div>
      ))}
    </div>
  );
}

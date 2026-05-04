"use client";

import { useEffect, useId, useRef, useState } from "react";

interface HelpTooltipProps {
  text: string;
  label?: string;
}

export default function HelpTooltip({
  text,
  label = "Field help",
}: HelpTooltipProps) {
  const [open, setOpen] = useState(false);
  const tooltipId = useId();
  const containerRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!open) return;
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    function handleClick(e: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    }
    window.addEventListener("keydown", handleKey);
    window.addEventListener("mousedown", handleClick);
    return () => {
      window.removeEventListener("keydown", handleKey);
      window.removeEventListener("mousedown", handleClick);
    };
  }, [open]);

  return (
    <span ref={containerRef} className="relative inline-flex">
      <button
        type="button"
        aria-label={label}
        aria-describedby={open ? tooltipId : undefined}
        aria-expanded={open}
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        onClick={(e) => {
          e.preventDefault();
          setOpen((v) => !v);
        }}
        className="flex h-5 w-5 items-center justify-center rounded-full border border-penn-blue/60 bg-rich-black/60 text-[11px] font-semibold text-text-secondary transition hover:border-blue-ncs/60 hover:text-white focus:outline-none focus-visible:border-blue-ncs focus-visible:text-white"
      >
        ?
      </button>
      {open ? (
        <span
          id={tooltipId}
          role="tooltip"
          className="pointer-events-none absolute right-0 top-full z-20 mt-2 w-72 rounded-2xl border border-penn-blue bg-oxford-blue px-3 py-2 text-xs leading-5 text-text-primary shadow-lg"
        >
          {text}
        </span>
      ) : null}
    </span>
  );
}

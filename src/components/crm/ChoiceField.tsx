"use client";

import { useRef } from "react";
import type { OnboardingChoice } from "@/types/crm";

interface ChoiceFieldProps {
  name: string;
  label: string;
  value: string;
  choices: OnboardingChoice[];
  onChange: (value: string) => void;
  disabled?: boolean;
}

/**
 * Single-select pill group that behaves like a native radio group for
 * keyboard and screen-reader users: Tab lands on the selected (or first)
 * pill, arrow keys move selection, Space/Enter selects.
 */
export default function ChoiceField({
  name,
  label,
  value,
  choices,
  onChange,
  disabled,
}: ChoiceFieldProps) {
  const buttonsRef = useRef<Array<HTMLButtonElement | null>>([]);
  const selectedIndex = choices.findIndex((choice) => choice.value === value);

  function focusAndSelect(index: number) {
    const bounded = (index + choices.length) % choices.length;
    const target = choices[bounded];
    if (!target) return;
    onChange(target.value);
    buttonsRef.current[bounded]?.focus();
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLButtonElement>, index: number) {
    if (disabled) return;
    switch (event.key) {
      case "ArrowRight":
      case "ArrowDown":
        event.preventDefault();
        focusAndSelect(index + 1);
        break;
      case "ArrowLeft":
      case "ArrowUp":
        event.preventDefault();
        focusAndSelect(index - 1);
        break;
      case " ":
      case "Enter":
        event.preventDefault();
        onChange(choices[index].value);
        break;
      default:
        break;
    }
  }

  return (
    <div
      role="radiogroup"
      aria-label={label}
      className="flex flex-wrap gap-2"
      data-field={name}
    >
      {choices.map((choice, index) => {
        const isSelected = choice.value === value;
        // Roving tabindex: only one pill is in the tab order.
        const tabIndex =
          selectedIndex === -1 ? (index === 0 ? 0 : -1) : isSelected ? 0 : -1;

        return (
          <button
            key={choice.value}
            ref={(element) => {
              buttonsRef.current[index] = element;
            }}
            type="button"
            role="radio"
            aria-checked={isSelected}
            tabIndex={tabIndex}
            disabled={disabled}
            onClick={() => onChange(choice.value)}
            onKeyDown={(event) => handleKeyDown(event, index)}
            title={choice.hint}
            className={`rounded-full border px-4 py-2 text-sm font-medium transition focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-ncs focus-visible:ring-offset-2 focus-visible:ring-offset-oxford-blue disabled:cursor-not-allowed disabled:opacity-60 ${
              isSelected
                ? "border-blue-ncs bg-blue-ncs/20 text-white"
                : "border-penn-blue bg-rich-black/40 text-text-secondary hover:border-blue-ncs/60 hover:text-white"
            }`}
          >
            {choice.label}
          </button>
        );
      })}
    </div>
  );
}

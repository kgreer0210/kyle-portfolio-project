/**
 * Test stand-in for `motion/react`: every `motion.*` element renders as the
 * plain element (or wrapped component) without animation props, so tests see
 * the final markup. Use with
 * `vi.mock("motion/react", () => import("@/test/motionMock"))`.
 */
import {
  createElement,
  forwardRef,
  type ElementType,
  type ReactNode,
} from "react";

const MOTION_PROPS = new Set([
  "initial",
  "animate",
  "exit",
  "transition",
  "variants",
  "whileHover",
  "whileTap",
  "whileInView",
  "whileFocus",
  "viewport",
  "layout",
  "layoutId",
]);

function plain(type: ElementType) {
  const Component = forwardRef<unknown, Record<string, unknown>>(
    (props, ref) => {
      const rest = Object.fromEntries(
        Object.entries(props).filter(([key]) => !MOTION_PROPS.has(key)),
      );
      return createElement(type, { ...rest, ref });
    },
  );
  Component.displayName = `motion(${String(typeof type === "string" ? type : "component")})`;
  return Component;
}

const cache = new Map<string, ReturnType<typeof plain>>();

export const motion = new Proxy(
  { create: (type: ElementType) => plain(type) },
  {
    get(target, key: string) {
      if (key === "create") return target.create;
      if (!cache.has(key)) cache.set(key, plain(key as ElementType));
      return cache.get(key);
    },
  },
) as unknown as Record<string, ElementType> & {
  create: (type: ElementType) => ElementType;
};

export const AnimatePresence = ({ children }: { children?: ReactNode }) =>
  children;

export const useReducedMotion = () => false;

// The floating controls stack in the bottom-right corner: the chat button
// sits at the bottom and Back to top sits above it. Every offset adds the
// iPhone home-indicator inset, and public pages reserve matching bottom
// padding so the stack never covers the footer's last line or a CTA.
//
// Keep these literal strings: Tailwind finds classes by scanning source.
//
// Stack per breakpoint (both buttons are 48px tall, 0.75rem apart):
//   base: 1rem    + 48px + 0.75rem + 48px = 7.75rem
//   sm:   1.5rem  + 48px + 0.75rem + 48px = 8.25rem
//   md:   2rem    + 48px + 0.75rem + 48px = 8.75rem
// The page padding adds 0.5rem of clearance above the stack.

/** Bottom-right corner for the chat button and the open chat panel. */
export const FLOATING_CORNER =
  "fixed right-4 bottom-[calc(1rem+env(safe-area-inset-bottom))] sm:right-6 sm:bottom-[calc(1.5rem+env(safe-area-inset-bottom))] md:right-8 md:bottom-[calc(2rem+env(safe-area-inset-bottom))]";

/** Back to top: one button height plus the gap above the chat button. */
export const FLOATING_ABOVE_CHAT =
  "fixed right-4 bottom-[calc(4.75rem+env(safe-area-inset-bottom))] sm:right-6 sm:bottom-[calc(5.25rem+env(safe-area-inset-bottom))] md:right-8 md:bottom-[calc(5.75rem+env(safe-area-inset-bottom))]";

/** Bottom padding for public pages so the stack never covers content. */
export const FLOATING_CLEARANCE =
  "pb-[calc(8.25rem+env(safe-area-inset-bottom))] sm:pb-[calc(8.75rem+env(safe-area-inset-bottom))] md:pb-[calc(9.25rem+env(safe-area-inset-bottom))]";

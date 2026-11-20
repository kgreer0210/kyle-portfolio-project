import type { Testimonial } from "../types";

type TestimonialAuthorProps = Pick<Testimonial, "name" | "role" | "company">;

/**
 * Name, optional role, and company for a testimonial. A missing or blank role
 * is skipped entirely so no empty line is left where a title would be.
 */
export default function TestimonialAuthor({
  name,
  role,
  company,
}: TestimonialAuthorProps) {
  const trimmedRole = role?.trim();

  return (
    <>
      <p className="text-base md:text-lg font-semibold text-text-headings">
        {name}
      </p>
      {trimmedRole ? (
        <p className="text-text-secondary text-sm mt-1">{trimmedRole}</p>
      ) : null}
      <p className="text-blue-ncs text-sm mt-1">{company}</p>
    </>
  );
}

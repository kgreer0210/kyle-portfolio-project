import { describe, expect, it } from "vitest";
import {
  assistantAskedForContact,
  EMPTY_CONTACT,
  extractEmails,
  extractPhones,
  formatUsPhone,
  mergeContactFromMessage,
  shouldAskForContact,
  type VisitorContact,
} from "@/lib/chatContact";

describe("extractEmails", () => {
  it("finds an address inside a sentence and lower-cases it", () => {
    expect(extractEmails("Sure, it's Jane.Doe+leads@Example.com.")).toEqual([
      "jane.doe+leads@example.com",
    ]);
  });

  it("returns distinct addresses only", () => {
    expect(extractEmails("a@b.co and A@B.co")).toEqual(["a@b.co"]);
  });

  it("ignores things that merely look like emails", () => {
    expect(extractEmails("see icon@2x.png and not-an-email@ ok")).toEqual([]);
    expect(extractEmails("handle @kyle on social")).toEqual([]);
  });
});

describe("extractPhones", () => {
  it.each([
    ["(478) 777-1266", "+14787771266"],
    ["478-777-1266", "+14787771266"],
    ["478.777.1266", "+14787771266"],
    ["+1 478 777 1266", "+14787771266"],
    ["1-478-777-1266", "+14787771266"],
    ["my number is 4787771266", "+14787771266"],
    ["call me at 478 777 1266 tomorrow", "+14787771266"],
    ["Reach me at (478)777-1266.", "+14787771266"],
  ])("accepts %s", (text, expected) => {
    expect(extractPhones(text)).toEqual([expected]);
  });

  it.each([
    ["a date", "We launch 2026-11-06 or 11/06/2026."],
    ["a dollar amount", "The budget is $4,787,771,266 total."],
    ["a dollar amount with dashes", "Pay $478-777-1266 upfront"],
    ["a version number", "We run version 4.78.777.1266 right now."],
    ["a bare 10-digit id with no phone word", "Order 4787771266 shipped."],
    ["a space-separated id with no phone word", "Ticket 478 777 1266 is open."],
    ["an id joined by a dash", "SKU-478-777-1266"],
    ["a number inside a longer run", "ref 14787771266999"],
    ["an N11 area code", "my number is 911-555-1234"],
    ["an invalid area code", "call 123-456-7890"],
    ["an ip address", "server at 208.167.222.2222"],
    ["too few digits", "call 777-1266"],
  ])("rejects %s", (_label, text) => {
    expect(extractPhones(text)).toEqual([]);
  });

  it("returns every distinct number it finds", () => {
    expect(
      extractPhones("work 478-777-1266, home (404) 555-0199"),
    ).toEqual(["+14787771266", "+14045550199"]);
  });
});

describe("formatUsPhone", () => {
  it("formats E.164 US numbers for display", () => {
    expect(formatUsPhone("+14787771266")).toBe("(478) 777-1266");
  });

  it("leaves anything else untouched", () => {
    expect(formatUsPhone("12345")).toBe("12345");
  });
});

describe("mergeContactFromMessage", () => {
  const withEmail: VisitorContact = { email: "first@example.com", phone: null };

  it("captures an email and a phone from one message", () => {
    expect(
      mergeContactFromMessage(
        EMPTY_CONTACT,
        "I'm at jane@example.com or (404) 555-0199",
      ),
    ).toEqual({ email: "jane@example.com", phone: "+14045550199" });
  });

  it("keeps what it already has when a message has no contact details", () => {
    expect(mergeContactFromMessage(withEmail, "Sounds great, thanks")).toEqual(
      withEmail,
    );
  });

  it("does not overwrite a captured email with a later unrelated one", () => {
    expect(
      mergeContactFromMessage(withEmail, "my friend is bob@example.com"),
    ).toEqual(withEmail);
  });

  it("replaces it only for a single value presented as a correction", () => {
    expect(
      mergeContactFromMessage(
        withEmail,
        "Actually, sorry, use second@example.com instead",
      ).email,
    ).toBe("second@example.com");
    expect(
      mergeContactFromMessage(
        withEmail,
        "actually use a@example.com or b@example.com",
      ).email,
    ).toBe("first@example.com");
  });

  it("captures nothing when one message holds several different candidates", () => {
    expect(
      mergeContactFromMessage(EMPTY_CONTACT, "ask a@example.com or b@example.com"),
    ).toEqual(EMPTY_CONTACT);
  });

  it("does not record Kyle's own number when the visitor repeats it", () => {
    expect(
      mergeContactFromMessage(
        EMPTY_CONTACT,
        "Is (478) 777-1266 the best number to call you?",
      ),
    ).toEqual(EMPTY_CONTACT);
  });

  it("treats email and phone independently", () => {
    const merged = mergeContactFromMessage(withEmail, "call me at 404-555-0199");
    expect(merged).toEqual({
      email: "first@example.com",
      phone: "+14045550199",
    });
  });
});

describe("assistantAskedForContact", () => {
  it("recognizes a question asking how to reach the visitor", () => {
    expect(
      assistantAskedForContact([
        {
          role: "assistant",
          content: "What's the best email or phone number for me to reach you?",
        },
      ]),
    ).toBe(true);
  });

  it("does not treat sharing Kyle's number as an ask", () => {
    expect(
      assistantAskedForContact([
        { role: "assistant", content: "You can call me at (478) 777-1266." },
      ]),
    ).toBe(false);
  });

  it("ignores the visitor's own messages", () => {
    expect(
      assistantAskedForContact([
        { role: "user", content: "What's the best email to reach you?" },
      ]),
    ).toBe(false);
  });
});

describe("shouldAskForContact", () => {
  const engaged = [
    {
      role: "user" as const,
      content: "I run a small bakery and our online ordering is a mess",
    },
    { role: "assistant" as const, content: "That sounds frustrating. Tell me more." },
    {
      role: "user" as const,
      content: "Customers email orders and I copy them into a spreadsheet by hand",
    },
  ];

  it("asks after a substantive exchange with no contact on file", () => {
    expect(shouldAskForContact(engaged, EMPTY_CONTACT)).toBe(true);
  });

  it("waits through a single greeting or one generic answer", () => {
    expect(
      shouldAskForContact([{ role: "user", content: "hi" }], EMPTY_CONTACT),
    ).toBe(false);
    expect(
      shouldAskForContact(
        [
          {
            role: "user",
            content: "What do you build for small businesses around here?",
          },
        ],
        EMPTY_CONTACT,
      ),
    ).toBe(false);
  });

  it("does not ask when the latest message is only a pleasantry", () => {
    expect(
      shouldAskForContact(
        [...engaged, { role: "assistant", content: "Happy to help." }, { role: "user", content: "thanks!" }],
        EMPTY_CONTACT,
      ),
    ).toBe(false);
  });

  it("never asks when an email or phone is already on file", () => {
    expect(
      shouldAskForContact(engaged, { email: "a@example.com", phone: null }),
    ).toBe(false);
    expect(
      shouldAskForContact(engaged, { email: null, phone: "+14787771266" }),
    ).toBe(false);
  });

  it("asks at most once", () => {
    const asked = [
      ...engaged,
      {
        role: "assistant" as const,
        content: "Got it. What's the best email or phone number to reach you?",
      },
      {
        role: "user" as const,
        content: "I'd rather not share that, can you just explain pricing first",
      },
    ];
    expect(shouldAskForContact(asked, EMPTY_CONTACT)).toBe(false);
  });
});

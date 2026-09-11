// @vitest-environment jsdom
import { cleanup, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import OnboardingChecklist from "@/components/crm/OnboardingChecklist";
import { buildInitialAnswers, buildOnboardingSteps } from "@/lib/onboardingFlow";
import { createDefaultPlan } from "@/lib/onboardingPresets";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: vi.fn(), push: vi.fn() }),
}));

const steps = buildOnboardingSteps({
  flowVersion: "v2",
  projectType: "new_website",
  plan: createDefaultPlan("new_website"),
  projectSummary: "A five-page marketing site.",
  known: { contactName: "Jane Doe", contactEmail: "jane@acme.test" },
});

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function renderChecklist(initialResponses = buildInitialAnswers(steps, {})) {
  return render(
    <OnboardingChecklist
      organizationId="org-1"
      status="in_progress"
      initialStep="contact"
      initialResponses={initialResponses}
      steps={steps}
    />,
  );
}

function stepButton(name: RegExp) {
  return within(screen.getByRole("navigation", { name: /onboarding steps/i })).getByRole("button", {
    name,
  });
}

describe("OnboardingChecklist saving", () => {
  const fetchMock = vi.fn<typeof fetch>();

  beforeEach(() => {
    fetchMock.mockReset();
    fetchMock.mockResolvedValue(jsonResponse({ ok: true }));
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  it("saves edits from every step, not just the active one", async () => {
    const user = userEvent.setup();
    renderChecklist();

    // Edit step 1 (contact) — the name is prefilled; change the phone.
    await user.type(screen.getByRole("textbox", { name: /^phone number/i }), "555-0100");

    // Jump ahead to step 3 without saving.
    await user.click(stepButton(/3\. Materials and access/));
    expect(stepButton(/1\. Contact/)).toHaveTextContent(/unsaved/i);

    // Edit step 3.
    const logoGroup = screen.getByRole("radiogroup", { name: /logo or brand files/i });
    await user.click(within(logoGroup).getByRole("radio", { name: "I'll send it later" }));

    // Save from step 3.
    await user.click(screen.getByRole("button", { name: /save progress/i }));

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("/api/crm/onboarding");
    const body = JSON.parse(String(init?.body)) as {
      organizationId: string;
      responses: Record<string, Record<string, string>>;
      currentStep: string;
    };
    expect(body.organizationId).toBe("org-1");
    expect(body.responses.contact.contact_phone).toBe("555-0100");
    expect(body.responses.contact.contact_name).toBe("Jane Doe");
    expect(body.responses.materials.logo_brand__status).toBe("later");
    expect(body.currentStep).toBe("materials");

    await waitFor(() => expect(stepButton(/1\. Contact/)).not.toHaveTextContent(/unsaved/i));
  });

  it("submits every answer in a single request and surfaces missing required fields", async () => {
    const user = userEvent.setup();
    fetchMock.mockResolvedValueOnce(
      jsonResponse(
        {
          error: "A few required answers are still missing.",
          missing: [
            {
              stepKey: "project",
              stepTitle: "Project confirmation",
              fieldKey: "project_confirmation",
              label: "Does this match your understanding?",
            },
          ],
        },
        400,
      ),
    );
    renderChecklist();

    await user.click(stepButton(/4\. Review and submit/));
    await user.click(screen.getByRole("button", { name: /submit onboarding/i }));

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("/api/crm/onboarding/submit");
    const body = JSON.parse(String(init?.body)) as { responses: Record<string, unknown> };
    expect(body.responses).toHaveProperty("contact");
    expect(body.responses.contact).toMatchObject({ contact_name: "Jane Doe" });

    expect(
      await screen.findByRole("button", {
        name: /Project confirmation: Does this match your understanding/,
      }),
    ).toBeInTheDocument();
  });

  it("labels a blank step as not started, never done", () => {
    renderChecklist({});
    expect(stepButton(/2\. Project confirmation/)).toHaveTextContent(/not started/i);
    expect(stepButton(/2\. Project confirmation/)).not.toHaveTextContent(/done|complete/i);
  });

  it("does not preselect the project confirmation", async () => {
    const user = userEvent.setup();
    renderChecklist();
    await user.click(stepButton(/2\. Project confirmation/));
    const radios = screen.getAllByRole("radio");
    expect(radios.every((radio) => radio.getAttribute("aria-checked") === "false")).toBe(true);
    expect(screen.queryByLabelText(/what would you like to discuss/i)).not.toBeInTheDocument();
    await user.click(screen.getByRole("radio", { name: /something I'd like to discuss/i }));
    expect(screen.getByLabelText(/what would you like to discuss/i)).toBeInTheDocument();
  });

  it("reveals the domain field only when the client has a domain", async () => {
    const user = userEvent.setup();
    renderChecklist();
    await user.click(stepButton(/3\. Materials and access/));
    expect(screen.queryByLabelText(/what's the domain/i)).not.toBeInTheDocument();
    const domainGroup = screen.getByRole("radiogroup", {
      name: /do you already have a domain name/i,
    });
    await user.click(within(domainGroup).getByRole("radio", { name: "Not sure" }));
    expect(screen.queryByLabelText(/what's the domain/i)).not.toBeInTheDocument();
    await user.click(within(domainGroup).getByRole("radio", { name: "Yes" }));
    expect(screen.getByLabelText(/what's the domain/i)).toBeInTheDocument();
  });

  it("supports arrow-key selection inside a choice group", async () => {
    const user = userEvent.setup();
    renderChecklist();
    const group = screen.getByRole("radiogroup", { name: /how do you prefer we reach you/i });
    const first = within(group).getByRole("radio", { name: "Email" });
    first.focus();
    await user.keyboard("{ArrowRight}");
    expect(within(group).getByRole("radio", { name: "Phone or text" })).toHaveAttribute(
      "aria-checked",
      "true",
    );
  });
});

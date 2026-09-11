import type { OnboardingStepDefinition } from "@/types/crm";

/**
 * Legacy (v1) onboarding questionnaire. Kept verbatim so existing drafts and
 * submissions continue to render. New clients use the admin-prepared v2 flow
 * built by `buildOnboardingSteps` in ./onboardingFlow.
 */
export const legacyOnboardingSteps: OnboardingStepDefinition[] = [
  {
    key: "account-setup",
    title: "Account Setup",
    description: "Confirm your main contact information and preferred owner.",
    fields: [
      {
        key: "primary_contact_name",
        label: "Primary contact name",
        type: "text",
        placeholder: "Who should we treat as the day-to-day lead?",
        helpText:
          "The person we'll work with day-to-day. Usually the owner, operations lead, or whoever is on point for this engagement. First and last name is fine.",
      },
      {
        key: "primary_contact_title",
        label: "Primary contact title",
        type: "text",
        placeholder: "Owner, operations manager, marketing lead, etc.",
        helpText:
          "Their role at the company — e.g. Owner, Operations Manager, Marketing Director. Helps us know who's making which decisions.",
      },
      {
        key: "primary_contact_phone",
        label: "Primary contact phone",
        type: "text",
        placeholder: "Best number for urgent issues",
        helpText:
          "Best number to reach this person, especially for urgent issues. A direct line or mobile is more useful than a main office number.",
      },
    ],
  },
  {
    key: "company-profile",
    title: "Company Profile",
    description: "Capture the core business details we should reference.",
    fields: [
      {
        key: "company_name",
        label: "Company name",
        type: "text",
        placeholder: "Legal or operating company name",
        helpText:
          "Legal or operating name of your business — whatever you'd put on an invoice.",
      },
      {
        key: "company_website",
        label: "Company website",
        type: "url",
        placeholder: "https://example.com",
        helpText:
          "Your main public website, including https://. If you have multiple sites, the one customers find first.",
      },
      {
        key: "company_overview",
        label: "Company overview",
        type: "textarea",
        aiAssist: true,
        placeholder: "What does the business do and who does it serve?",
        helpText:
          "A short description of what your business does, who you serve, and what sets you apart. 2–4 sentences. We'll reference this when we describe your business anywhere we build for you.",
      },
    ],
  },
  {
    key: "business-context",
    title: "Business Context & Goals",
    description:
      "Document your current setup, pain points, and what success looks like.",
    fields: [
      {
        key: "current_stack",
        label: "Current software and tools",
        type: "textarea",
        aiAssist: true,
        placeholder:
          "Website, CRM, payment tools, internal systems, integrations",
        helpText:
          "The software you use today — website platform, CRM, email/SMS, payments, scheduling, internal systems. Anything we'd need to integrate with, replace, or hand back at the end.",
      },
      {
        key: "operational_pain_points",
        label: "Operational pain points",
        type: "textarea",
        aiAssist: true,
        placeholder: "What is slowing the team down today?",
        helpText:
          "What's slowing your team down or costing you money? Manual data entry, dropped leads, scheduling chaos, customers waiting on hold — the things that, if fixed, would have the biggest impact.",
      },
      {
        key: "support_hours",
        label: "Preferred support hours",
        type: "radio",
        allowCustom: true,
        options: [
          "Mon–Fri, 9am–5pm ET",
          "Mon–Fri, 8am–6pm ET",
          "24/7",
          "Custom",
        ],
        helpText:
          "When should our team be available to respond to you and your customers? Pick the closest match, or choose Custom for split shifts or unusual hours.",
      },
      {
        key: "project_goals",
        label: "Goals for this engagement",
        type: "textarea",
        aiAssist: true,
        placeholder: "What does success look like over the next 3-6 months?",
        helpText:
          'What does success look like in 3–6 months? Be specific — e.g. "cut booking time in half", "launch a new site by Q3", "capture 50% more leads from the contact form". Outcomes, not features.',
      },
      {
        key: "launch_priorities",
        label: "Top launch priorities",
        type: "textarea",
        aiAssist: true,
        placeholder: "Most important deliverables, fixes, or improvements",
        helpText:
          "The first things that need to be live or fixed. List them in rough priority order — must-haves before nice-to-haves.",
      },
      {
        key: "known_constraints",
        label: "Known constraints",
        type: "checkboxes",
        options: ["Budget", "Timeline", "Compliance", "Approvals", "None"],
        helpText:
          "Anything that limits how we plan? Tick all that apply — fixed budget, hard deadline, regulated industry, or approval steps that slow things down.",
      },
    ],
  },
  {
    key: "systems-and-access",
    title: "Systems & Communication",
    description:
      "Tell us about the tools we'll need access to and how you prefer to work.",
    fields: [
      {
        key: "required_accounts",
        label: "Accounts and services involved",
        type: "textarea",
        aiAssist: true,
        placeholder:
          "Domains, hosting, analytics, APIs, repos, app stores, etc.",
        helpText:
          "Accounts we'll need access to — domain registrar, hosting, Google/Microsoft workspace, analytics, GitHub, app stores, payment processors, any APIs you use.",
      },
      {
        key: "credential_process",
        label: "How access should be shared",
        type: "textarea",
        aiAssist: true,
        placeholder:
          "Password manager, delegated access, temporary accounts, etc.",
        helpText:
          'How you prefer to share access. Examples: "Add Kyle as a delegated user", "1Password shared vault", "temporary admin account I\'ll deactivate after launch". Avoid emailing passwords.',
      },
      {
        key: "asset_locations",
        label: "Where key assets live",
        type: "textarea",
        aiAssist: true,
        placeholder:
          "Brand files, documentation, recordings, source files, credentials",
        helpText:
          'Where brand assets, source files, recordings, and documentation live. Examples: "Logos in Google Drive", "product photos in Dropbox", "old site backup on the server". Saves us bothering you for each file.',
      },
      {
        key: "preferred_channel",
        label: "Preferred communication channel",
        type: "radio",
        allowCustom: true,
        options: ["Email", "Portal tickets", "Phone", "Slack", "Other"],
        helpText:
          "How you'd like to communicate day-to-day. The portal is best for tickets and project work; email and Slack are good for quick threads; phone is best for urgent issues.",
      },
      {
        key: "decision_makers",
        label: "Decision makers and approvers",
        type: "person_list",
        helpText:
          'Who needs to sign off on major decisions or review work before launch? Add a row per person — name on the left, role and what they approve on the right. Use "+ Add another" for as many people as needed.',
      },
      {
        key: "escalation_notes",
        label: "Escalation notes",
        type: "textarea",
        aiAssist: true,
        placeholder: "How should urgent issues be escalated?",
        helpText:
          'If something is on fire, who do we call and how? After-hours phone, backup contact, or what counts as "on fire" (site down, payments failing). The rare-but-critical playbook.',
      },
    ],
  },
  {
    key: "review-and-submit",
    title: "Review and Submit",
    description: "Summarize anything else we should know before kickoff.",
    fields: [
      {
        key: "final_notes",
        label: "Final notes",
        type: "textarea",
        aiAssist: true,
        placeholder: "Anything else you want us to know before we begin?",
        helpText:
          "Anything else we should know before we start? Things you've tried that didn't work, internal politics, upcoming changes, or just stuff that's been on your mind.",
      },
    ],
  },
];

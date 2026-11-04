# Wave 975: public FAQs and reviewed questions

The homepage now has a friendly FAQ section, linked to a searchable /faqs page. Existing approved answers remain verbatim, and the contact page and footer link to the same help area. The question composer opens a draft to the canonical enquiries mailbox with a copy fallback. Permission to publish an anonymous question is optional and unticked. The interface explicitly says the visitor must send the email and nothing is sent or published automatically.

Israel chose the existing enquiries email address with reviewed answers published through the website editor. Source recon found that the existing POST /public/enquiry stores records but has no notification or answering interface. It is deliberately not presented as an email inbox, and the signed-in platform is unchanged.

The authenticated GitHub FAQ editor lets repository maintainers publish, update or remove reviewed plain-text Q&A entries without editing code. Protected core answers cannot be changed through it. It requires editorial confirmation, stores only the public question/answer, validates source before a normal non-force push, and explicitly dispatches the existing website gate/deploy. Email contents and sender details never enter the website automatically. See docs/FAQ_EDITOR_GUIDE.md.

The source-only review caught a manual-copy fallback that omitted the publication preference. It now exposes and selects the complete email draft. The search check does not assume future community answers cannot match the same topic. Browser checks cover discovery, search/reset/no-results, keyboard/pointer disclosure, question validation, both permission states, draft encoding, clipboard success/failure and contact deep links. The publication tests cover create/update/remove, immutability, protected IDs, rejected data and approval.

No local tests, builds, audits or browser captures were run. GitHub Actions is the gate; final run, screenshot review and public proof are recorded in Context Library Platform/Live-State.md and local 05-Artifacts/website-faq-2026-11-04. No real enquiry or email is sent for verification. Existing photography, team portraits, hero, Mission, About, role icons, ecosystem and compact Zoopla credit are preserved.

Copy added is confined to the requested FAQ discovery/search, question/email/copy/validation/permission states and maintainer publication controls. No new service, financial or personal-case claims were added. Existing FAQ factual and compliance text is unchanged.

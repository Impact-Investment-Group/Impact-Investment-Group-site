# Wave 1002: correct the public enquiries address

Israel requested `enquiries@impactig.co.uk` on 5 November 2026. The canonical public-site address now uses that spelling, including visible text, mailto links, metadata, FAQ drafts and enquiry/registration fallback messages. The newer request supersedes the September source comment; stale comments were corrected so a future edit does not restore the old spelling.

Only the email address is changed in public copy. Support/legal mailboxes, forms, design and the signed-in application are unchanged. No email was sent and mailbox delivery or provisioning was not tested.

The existing CI browser checks now expect the corrected FAQ recipient and require matching footer text/link on every normal route, with no retired address in the page. The regular workflow supplies the build, desktop/mobile interaction checks and screenshots. Local builds, tests and browser captures were not run. Final CI and public verification results are recorded in Context Library `Platform/Live-State.md` and local `05-Artifacts/website-email-2026-11-05/`.

Acceptance: No user-facing string added or changed beyond those this brief specifies.

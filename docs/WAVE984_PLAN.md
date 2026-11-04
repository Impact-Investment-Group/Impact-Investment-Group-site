# Wave 984: charitable commitment made visible

- Add a warm, prominent reusable charity section after the homepage mission and on About Us, retaining the restored layouts.
- Lead with the user-authorised 10% of company profits pledge and the unchanged canonical pledge sentence.
- Use the supplied Metro World Child logo plus the existing higher-resolution platform asset; no generated or altered charity marks.
- Add three accessible selectable explanations of the charity's work, sourced from official Metro World Child pages: essentials, personal support and learning.
- User chose the official Charity Commission record as the public destination: https://register-of-charities.charitycommission.gov.uk/en/charity-search/-/charity-details/3963704. Programme sources remain evidence, not additional public links.
- Official sources: https://www.metroworldchild.org/programs, https://www.metroworldchild.org/sponsor, https://www.metroworldchild.co.uk/.
- Keep charity activity separate from measured IIG outcomes; no invented donation totals, children reached, allocation or endorsement.
- Give the shared footer a compact logo and link to the commitment. Add the About section to its page outline.
- Exact new labels: Our commitment to children; Helping children build brighter futures.; 10%; of our profits; Supporting Metro World Child UK; How Metro World Child helps; Everyday essentials; Personal support; Learning and hope; View the charity record; Registered charity 1079863; Read about our commitment; Giving back. External links have an accessible new-tab note.
- Supporting descriptions will paraphrase the named sources; final strings live in src/content/charity.ts. No user-facing string added or changed beyond those this brief specifies.
- Preserve photos, headshots, teal, hero/Mission/About existing structure, role guides, FAQs and legal content; public website only.
- CI-only checks: all-page rendering/accessibility, charity controls and links, desktop/mobile screenshots, reduced motion, shared footer and regression coverage.
- Ship through the existing website deployment, inspect CI images and verify public HTML/assets. Update Context Library with measured release proof.

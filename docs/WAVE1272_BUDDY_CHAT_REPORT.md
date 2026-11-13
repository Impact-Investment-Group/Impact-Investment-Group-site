# Buddy chat and data logos

User request, 13 November 2026: improve the opened Buddy chatbox and enlarge the logos beneath "Powered by authoritative UK data".

The chat uses the existing Tailwind framework and bone-white brand tokens. Buddy has a clearer header and topic badge; existing suggested questions have recognisable topic icons, messages have distinct user and assistant treatments, and the composer has a stronger focus state and primary action. The conversation pane scrolls independently, with the phone header still reachable outside the non-modal chat. Existing copy, one-conversation history, AI readiness checks, source filtering, request cancellation and keyboard behaviour remain intact.

The five original source logos are larger in equal display areas, preserving their natural aspect ratios. The heading, licence statement and source attribution are unchanged. The existing browser size assertion now checks the larger requested treatment while retaining its count, centring and distortion checks.

Published source: `21444825e04b7dd69f28ab83ccb3f1ea308f464c`. GitHub Actions run [43422346817](https://github.com/Impact-Investment-Group/Impact-Investment-Group-site/actions/runs/43422346817) passed all build, browser, motion, page/journey, ecosystem, Buddy, council-carousel, contrast and surface checks, then published successfully on 13 November 2026. No local test, build or audit was run.

The first complete run passed the existing page, navigation, motion, contrast and carousel checks. A new keyboard-height chat case caught Chromium revealing the caret while clipping the textarea's top edge. Focusing the field now reveals its full box with native nearest scrolling and scroll margin; the strict viewport assertions remain. The empty conversation still starts at the welcome heading, and short screens retain access to the close control and AI notice through outer scrolling.

Live verification after publication: desktop and phone chat, desktop/tablet/phone proportional logo layouts, and a keyboard-height phone viewport. Buddy returned a real identity answer and then changed to the heart form for a care question in the same conversation. The short layout kept the complete message field, Send control and AI notice in view without horizontal overflow. Temporary viewport overrides were restored. The platform's matching work and separate gate are recorded in its `docs/WAVE1272_REPORT.md`.

Uncommitted visual evidence is in `05-Artifacts/buddy-academy-2026-11-13`: `after-website-chat-1280.png`, `after-website-chat-390.png`, `after-website-chat-390x320.png`, and `after-data-logos-1280.png`, `after-data-logos-768.png`, `after-data-logos-390.png`. CI logs are in its `site-ci-monitor-43422346817` directory. No data access, licence, endorsement, pricing or provider configuration changed.

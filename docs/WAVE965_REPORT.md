# Wave 965: targeted homepage restoration

Israel asked to revert the homepage hero and How the connection works section, and to centre Powered by authoritative UK data with larger logos.

The hero restores the pre-wave-964 three-photo layout from 5485b88. Desktop shows all three photographs and their captions together; mobile retains swipe, arrow, dot and keyboard controls. The existing candid image files and exact Transforming Lives teal are unchanged. Historical comments were removed from the restored component without changing its runtime layout or behaviour.

The connection section and its unused code/styles are removed. The existing mission statement returns to the mission introduction, appearing once. The other mission/demand styling and all other pages remain as published in wave 964, including the Partners ecosystem.

The UK data strip centres its heading, logo rows and attribution. All five original vector logos are enlarged with contained, proportional sizing. The wide Office for National Statistics wordmark has its own wider slot. Rows wrap and remain centred on phones. No source or factual copy changed.

No new user-facing strings. Existing hero copy restored, connection section copy removed, mission statement relocated unchanged. No image asset, form endpoint or signed-in platform change.

The existing browser suite now asserts that the removed section and its anchor are absent, all three desktop photos are visible, mobile controls work, all five data logos decode at the larger size, and every wrapped logo row is centred. The strict screenshot contrast bucket is again mobile-hero-only. No assertion or colour floor was relaxed. Local tests, builds and screenshots were not run under the GitHub Actions-only notice.

Final CI results, visual review of the downloaded homepage screenshots and live publication proof are recorded in Context Library Platform/Live-State.md and local 05-Artifacts/website-home-restoration-2026-11-04/ after the run completes.

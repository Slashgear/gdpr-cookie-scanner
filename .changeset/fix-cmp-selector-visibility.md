---
"@slashgear/gdpr-cookie-scanner": patch
---

Fix consent modal detection for CMPs that start hidden (e.g. Axeptio).

`MODAL_SELECTORS` was a single flat list where every candidate was required to
pass `isVisible()`. CMPs such as Axeptio inject their overlay as `display:none`
during initialisation and reveal it via JS animation a few hundred milliseconds
later. The visibility check caused the scanner to skip `#axeptio_overlay` and
fall through to the first matching generic heuristic (e.g. `[id*='consent']`),
which could be a completely unrelated element.

The list is now split into two:

- **`CMP_SELECTORS`** — precise, platform-specific identifiers. DOM presence
  alone is treated as a reliable signal. Once the element is found the scanner
  waits up to 3 s for it to become visible (so button extraction sees an
  interactive state) but proceeds regardless, preventing a slow CMP from
  silently falling back to a wrong heuristic.
- **`HEURISTIC_SELECTORS`** — broad patterns that could match unrelated
  elements. Visibility is still required to avoid false positives.

---
"@slashgear/gdpr-cookie-scanner": minor
---

Crop consent modal screenshot to the element; make after-reject/accept screenshots opt-in.

Two behaviour changes:

**Modal screenshot is now always captured (cropped)**
The consent modal screenshot (`modal-initial.png`) is taken whenever a modal
is detected and `outputDir` is set, regardless of the `--screenshots` flag.
The screenshot is clipped to the bounding box of the modal element instead of
capturing the full viewport, giving a tighter, more readable image. If the
bounding box cannot be determined (rare), it falls back to the viewport
screenshot.

**`--no-screenshots` replaced by `--screenshots`**
Previously all three screenshots were enabled by default and `--no-screenshots`
opted out. Now only the modal screenshot is taken by default; passing
`--screenshots` additionally captures `after-reject.png` and `after-accept.png`
(full viewport, as before). The `screenshots` field in `ScanOptions` / the
programmatic API retains the same type (`boolean`) with updated semantics:
`false` (default) = modal only; `true` = modal + after-reject + after-accept.

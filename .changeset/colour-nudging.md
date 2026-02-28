---
"@slashgear/gdpr-cookie-scanner": minor
---

feat: detect colour nudging dark pattern (green accept + grey/red reject)

Using a "positive" colour (green) on the accept button while the reject button
is visually de-emphasised (grey or red) is a documented dark pattern per
EDPB Guidelines 03/2022 § 3.3.3. The easyRefusal score now deducts 5 points
and surfaces a `nudging` warning when this pattern is detected.

A new `src/analyzers/colour.ts` module implements RGB→HSL conversion, perceptual
hue classification (green / red / grey / blue / neutral), and the nudging check.
32 unit tests cover the colour math and the compliance integration.

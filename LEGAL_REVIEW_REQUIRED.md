# 《黑山酒馆》R20 release legal review required

Status: factual provenance is closed for the active R20 runtime; legal release
acceptance is not. This document is an engineering inventory and is not legal
advice or a substitute for qualified counsel in the intended markets.

## Active runtime facts

- The R20 runtime registers exactly 58 asset roles under
  `src/heishan_r20/data/assetRoles.js`.
- R20 raster sources were generated for this formal Codex line without Qoder or
  DeepSeek images as generation inputs. Project sources, generated-file IDs,
  transformations, dimensions, and hashes are preserved under
  `art-source/heishan_r20` and `assets/heishan_r20/asset-manifest.json`.
- Twenty-seven large runtime PNGs are preserved byte-for-byte as masters and
  delivered as deterministic WebP derivatives. Six canonical character assets
  remain audited RGBA PNG. Twenty-five symbols/cues are project-authored SVG.
- Every active R20 role has `fallback: null`. Historical
  `assets/heishan_r19` files came from earlier user-created Qoder packs and are
  retained only as history; they are excluded from the R20 release policy.
- `package.json` declares no third-party runtime or development package.
- The UI uses system font families and does not bundle a third-party font.
- No analytics, advertising SDK, payment SDK, account system, remote API, or
  personal-data collection is present in the current offline/static runtime.

## Current OpenAI terms evidence

Retrieved from official OpenAI pages on 2026-07-15:

- [Terms of Use, effective 2026-01-01](https://openai.com/policies/row-terms-of-use/):
  as between the user and OpenAI and to the extent permitted by applicable law,
  the user owns Output; the user remains responsible for Content, must have
  rights to Input, must not infringe others' rights, must evaluate Output with
  human review where appropriate, and Output may not be unique.
- [Service Terms, updated 2026-06-12](https://openai.com/policies/service-terms/):
  Codex/code-generation Output may be subject to third-party licenses. Any
  applicable output indemnity depends on the governing agreement and contains
  exclusions; this project does not assume eligibility.
- [OpenAI Services Agreement](https://openai.com/policies/services-agreement/):
  business-account ownership language likewise assigns Output as between the
  customer and OpenAI to the extent permitted by law, while requiring lawful
  inputs/use and recognizing non-unique output.

Those terms support recording a project-side rights basis. They do not prove
copyright eligibility, non-infringement, trademark availability, account
authority, or release compliance in any specific jurisdiction.

## Mandatory human acceptance before commercial release

An authorized product owner and qualified reviewer must record:

1. The OpenAI account/organization and governing agreement used for each
   generation round, plus authority to accept that agreement for the owner.
2. Trademark/name clearance for `黑山酒馆`, the English/localized title, main
   character names, route names, and storefront identifiers in target markets.
3. Copyright/AI-output eligibility and disclosure obligations in every target
   jurisdiction and storefront.
4. Visual similarity, likeness, logo, watermark, readable-glyph, and cultural
   review of the final 58-role atlas, not only prompt and hash review.
5. Code similarity/open-source license scanning of the exact immutable release
   package, because Codex output can be subject to third-party licenses.
6. Privacy, telemetry, consumer-protection, age-rating, accessibility, refund,
   and storefront-policy review for the actual distribution model.
7. Written acceptance of `THIRD_PARTY_NOTICES.md` and the exact package SHA-256.

Engineering verdict: `PASS_R20_INTERNAL_PROVENANCE_INVENTORY`.

Legal verdict: `INCONCLUSIVE_EXTERNAL_LEGAL_ACCEPTANCE`.

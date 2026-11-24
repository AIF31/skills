# Document publication

Read for a document that needs checked source text or a faithful conversion of an authored export. The [Standard](../../../../00-System/Planning/Metadata-and-File-Standard.md) owns the note schema and publication policy; the [Architecture](../../../../00-System/Planning/Implementation-Architecture.md) owns job/provenance/recovery rules. This procedure generalizes the completed [source-note handoff](../../../../00-System/Planning/Handoffs/Source-Notes-Handoff-2026-10-02.md), without inheriting its fixed 22-file scope or its instruction to leave those originals at their existing names.

## Extract and preserve

Invoke `$mineru` and read the installed [MinerU skill](%USERPROFILE%/.agents/skills/mineru/SKILL.md) and current CLI help/version before execution. On a restricted Windows runner, a launcher failure such as `Access is denied` or `No Python at ...` can reflect sandbox visibility. Retry the read-only version probe through the host approval mechanism before diagnosing a broken installation; record whether that probe succeeds. A successful host probe establishes the runtime for subsequent approved MinerU commands. Use local normal-quality parsing for PDFs/scans; native Office/HTML/EPUB routes use their supported local format/tier. Preserve every requested page/slide/section, including speaker notes, tables, and media. A PDF export of a PPTX has its own page map and does not replace the original deck's identity.

For a complete PDF, the command shape is:

```powershell
mineru parse '<absolute-source.pdf>' --pages all --output '<job>/extraction.md' --json
```

Use PDF `--pages` only for PDFs. Follow returned `next_request`/locators for bounded reads. Confirm actual written-output status, existence, nonempty content, expected coverage, and warnings. Retrieve images from returned locators or render original pages with the existing WSL Poppler tools; JSON success is not a portable image bundle. Keep the exact raw output unedited in staging and record its absolute path/hash separately from the candidate/publication hash. Keep current command status and effective nonsecret configuration in the manifest.

A timeout can leave inference running: inspect and resume the existing job rather than launching a forced duplicate. Retry an explicitly transient failure once. Follow the MinerU skill's recovery gate for unavailable quality/runtime, remote uploads, downloads, and configuration changes; show the actual error and any approval-required choice. Ordinary ingestion never enables remote parsing, installs software, or changes persistent configuration implicitly.

**Done:** raw extraction is preserved and hashed, every requested unit is accounted for, original-page evidence is available, and every referenced image can be retrieved.

## Build and check the candidate

Start from [Source Note](../../../../00-System/Templates/Source%20Note.md), with `review_status: needs-review`. Use the matching authored-note template instead for an authored export. Keep extraction candidates outside the vault until content review passes; the main skill permits a metadata-only pending record beside an identified original. For PDFs, emit exactly one `## Page N` heading for each physical page in order. Other formats use evidenced slide/section/sheet context; do not manufacture PDF page numbers. Physical pages, printed slide numbers, and incremental builds remain separate in the coverage map.

On Windows, assemble large candidates through UTF-8 staging files with bounded writes, then execute scripts by filename to avoid command-length limits. Preserve Markdown backticks literally in the tool wrapper; when piping script text from PowerShell, set `$OutputEncoding` to UTF-8. Check the resulting punctuation and code operators before review so an encoding failure cannot masquerade as an OCR correction.

Compare every page/unit with the original, checking all distinct equations, exercise statements, supplied worked results, code listings, table cells, labels, diagrams, and annotations. For code, preserve identifiers, operators, literal widths, comments, and meaningful indentation. Repeated slide builds retain prior corrections and require checks of what changes. Preserve the source's printed claims, including attributed source mistakes; repair only extraction/transcription errors. Keep printed material and handwritten annotations distinguishable, using `> [!note] Annotation` where appropriate.

Record each repair in manifest `corrections` with `page` (or the format's locator), `kind`, `raw`, `corrected`, and `note`. Record each unit's `page_verdicts`/equivalent coverage evidence with its locator, logical slide position when known, verdict (`ok`, `corrected`, `image-fallback`), items checked, and comment. These records must survive in the OneDrive-synced manifest, not only in local staging.

Use original-image crops with checked captions and physical-page references for meaningful figures or unreadable notation. State original handwriting uncertainty rather than supplying guessed symbols. Crop filenames should identify their source/page and stay within the Standard's Windows path limit. Check corrections against the candidate in their original context; a common token may remain legitimately on another page. Exclude known erroneous expressions at their affected locations without globally deleting valid occurrences.

Known extraction faults from the pilot include lost primes/overbars, `×` substituted for variable x, split ligatures, HTML escapes in algorithms, flattened K-maps, detached check/cross labels, and circuit figures rendered as TeX fragments. They justify targeted checks, not assumed corrections.

Run the existing checker on a math-bearing candidate:

```powershell
node '00-System/Scripts/check-math.js' '<job>/candidate.md'
```

**Done:** every unit has a verdict, each material item is checked or faithfully preserved in a documented image fallback, and the candidate contains no known transcription error at its affected location.

## Independent review

Obtain a separate reviewer pass before calling a converted document verified. When subagents are available, delegate this bounded review with the original hash, candidate, raw extraction/warnings, page renders, correction records, and an output path in the same job staging. Follow the current user/runtime model preferences and record the actual reviewer/model/effort; never invent an independent review.

The reviewer rechecks every correction, equation/table repair, image caption/fallback, and all pages with dropped-block or missing-content warnings. They also inspect at least 10% of the otherwise `ok` pages (at least one when any exist) against original renders. For documents with no `ok` pages, inspect the reviewed corrections/fallbacks without inventing a sample. For non-PDFs, use the corresponding slide/section units. Fix findings and obtain acceptance of the changed candidate. Math compilation must pass but cannot prove fidelity to the original.

When no independent reviewer can run, retain the candidate in staging and the manifest's `needs_review` state, report the missing review, and continue unrelated inputs. Keep any pending source note metadata-only and preserve any prior accepted publication. A user can supply the independent review. Two independent specialist reviews are required for a requested quantitative study guide through its own skill, not for this source transcription.

**Done:** the manifest records an actual passing independent review and resolved findings; otherwise publication remains pending.

## Publish evidence

Follow the main skill's expected-prior-hash and native-baseline checks. Publish the reviewed note beside the original. Put received-source images in `<COURSE>/Sources/_assets/<source name>/`; use authored-note-local attachments for an authored export, as specified in the main skill. Use portable, URL-encoded relative image paths. Protect human identity/usage/correction sections above the machine-converted callout. That callout records actual tool/version/tier, conversion date, and review state.

After a native asset rename, recheck the written image links: Obsidian may shorten them to a bare filename. Restore portable relative paths under an expected-note-hash guard, update the publication hash/history, and rerun native validation before completing the manifest.

The manifest retains source hash/observed paths/metadata, request and effective configuration fingerprint, exact raw extraction path/hash, coverage/maps and returned locators, corrections, per-unit verdicts, actual review evidence, output paths/hashes, issues, and publication history. Unknown historical settings remain null. Record the candidate and expected prior publication hashes when replacing machine-derived content. Keep original bytes unchanged and write `complete` only after publication and the main skill's validation pass.

**Done:** original, reviewed publication, assets, and manifest resolve and agree; coverage and review evidence support the stated status.

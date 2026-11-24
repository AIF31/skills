---
name: vault-ingest
description: Ingest selected local files or newly added material in a named folder into the Maestría Obsidian vault. Use for prompted imports of course documents, recordings, or authored notes, and for resuming an incomplete import. Includes concept linking by default after source-content checks pass; course migrations and study-guide generation are separate workflows.
metadata:
  copilot-enabled-agents: opencode, claude, codex
---

# Vault Ingest

Process the files or folder the user names. The default result for a received document is its preserved original, a checked source note beside it, any necessary original-image assets, and a per-source manifest. After source-content checks pass, create/update related concepts through [Vault Connect](../vault-connect/SKILL.md) by default. An explicit request to skip concepts overrides this default. This is a prompted workflow; it creates no watcher or scheduler.

## Read the vault contract

Locate the vault through the current workspace or the selected path; confirm its root `AGENTS.md` and `00-System/` before writing. All paths below are relative to that root. Read:

- [Metadata and File Standard](../../../00-System/Planning/Metadata-and-File-Standard.md): destinations, filenames, properties, source publication, and dates.
- [Implementation Architecture](../../../00-System/Planning/Implementation-Architecture.md): job states, staging, provenance, recovery, and native validation.
- [Master Plan](../../../00-System/Planning/Master-Plan.md): phase boundaries. Its historical inventory and pilot status are observations, not a live intake queue.
- [Obsidian Markdown](../obsidian-markdown/SKILL.md), [Obsidian CLI](../obsidian-cli/SKILL.md), and [Obsidian Bases](../obsidian-bases/SKILL.md): note syntax, typed properties/link-aware moves, and view validation. These describe Obsidian mechanics; the Standard owns this vault's schema and destinations.
- The existing [Coursework Base](../../../00-System/Bases/Coursework.base) and the applicable implemented [template](../../../00-System/Templates/). Their current fields and filters determine note structure and view membership.

Use current files and manifests to establish implementation state. Read the applicable course map or implementation result when an old path or approval is relevant; `Planning/Archive/v1/`, `Planning/Examples/`, and early research are historical. The current Standard and Architecture supersede their old raw-OCR publication, `AI/` staging, and snapshot rules.

## 1. Bound the intake

Resolve the exact files, named directory, or paths already supplied in the conversation. If no input path can be established, ask which files or folder were added. A named directory authorizes discovery within that tree, including its subfolders; an explicit file list authorizes only those files and their required companion assets. Read existing vault records for identity and duplicate checks without expanding the import scope.

Use filesystem tools (`rg --files`, literal-path reads (PowerShell `-LiteralPath` on Windows), SHA256) for discovery. Use the CLI for Obsidian's indexed behavior. During folder discovery, skip system and agent folders, `Archive/`, `copilot/`, `.git`, dependencies/caches, `tmp/`, `AI/work/`, `AI/audits/`, parser assets, generated guides/exports, and `_assets/`. Treat a PDF and its existing source-note sidecar as one source bundle. Explicitly selected authored notes, exports, datasets, code, or standalone scans are classified individually; they are not discarded merely because automatic discovery would omit them. Distinguish OneDrive placeholders from symbolic links/junctions; stay inside the selected tree and record unreadable inputs as pending.

Build a compact intake table: observed path, SHA256, course/role evidence, existing record, proposed destination, and action (`new`, `reuse`, `resume`, `new-version`, or `needs-identity`). For “new files,” process untracked inputs and changed source bytes; report tracked pending jobs without resuming them unless requested. For a general import or an explicitly selected pending source, resume its existing job.

Show the table as a progress update and proceed with resolved entries. Ask only about missing or conflicting information needed for the affected files; continue independent entries. An empty folder or a new-files scan containing only accepted tracked inputs produces a no-change report. An explicitly selected checked source may still need its concept pass even when its original/publication is reused.

**Done:** every selected candidate has an action or a specific pending reason.

## 2. Resolve identity and reuse

Capture original path/name, full hash, bytes, filesystem UTC observations, and embedded metadata before renaming or copying. Course folders and the user's stated course provide context; document contents resolve conflicts. Use a bounded local MinerU read for document identity when needed. Keep raw metadata even when it is stale. Leave unknown lecture/session numbers, dates, deadlines, authorship, grades, and submission status empty.

Flag `(1)`-suffixed files and OneDrive conflict copies (`<name>-<COMPUTERNAME>.<ext>`) for hash/content comparison before choosing reuse or a new version. Their suffixes establish neither a session number nor a content version. Preserve the copies while identity is unresolved.

Match source-note `source_sha256` and per-source manifests against the input hash, then verify the original and published output files. Reuse a verified publication when its identity, coverage, assets, and recorded hashes agree. A changed tool version alone does not require reconverting an accepted publication. Extraction-cache reuse additionally requires the actual tool version, complete nonsecret configuration fingerprint, requested coverage, and output hashes. Legacy or incomplete configuration cannot prove an exact cache match.

Resume a pending job from its recorded stage and reconcile any already-written artifacts by hash. Missing outputs or a changed publication are issues to inspect, not permission to overwrite human edits. Different source bytes create a new version with a distinct record; similar titles or near-duplicate slide decks do not establish identity. If an old canonical original was overwritten and its recorded bytes are unavailable, retain the existing publication and record the source-version/recovery issue instead of silently repointing its citations. Reuse an existing canonical original when appropriate; preserve separate course uses, unique note IDs, and version-specific citations.

**Done:** each resolved input has a source identity and an existing or collision-free target; unresolved entries remain `needs_identity`.

## 3. Route and prepare

Use the Standard's readable, vault-unique names. Add a version or short hash only to the new file when names collide. Preserve code filenames and package structure. Create directories when their first deliverable is ready.

| Role | Destination and processing |
|---|---|
| Received slides, including PDF/PPTX | `<COURSE>/Sources/Slides/`; local MinerU and checked publication |
| Received readings, chapters, papers | `<COURSE>/Sources/Readings/`; local MinerU and checked publication |
| Assignment handout | `<COURSE>/Sources/Assignments/`; checked source plus its homework tracker link |
| Problem sets, supplied solutions, annotated copies | `<COURSE>/Sources/Problem Sessions/`; keep each content version distinct |
| Other received documents or standalone scans | `<COURSE>/Sources/Other/`; format-appropriate checked publication |
| Audio/video | `<COURSE>/Sources/Recordings/`; recording source record and local timestamped transcript |
| Received workbook, dataset, code | `<COURSE>/Sources/Other/`; short metadata/description note, preserving sheet/cell or file context rather than publishing a dump |
| Authored Markdown, homework, or exports | `Lectures/`, `Homework/<assignment>/`, `Problem Sessions/`, `Study Guides/`, or `Notes/` by role; preserve the authored body, links, assets, and export bytes |
| Authored concept note | `Concepts/`; use the Concept template and evidenced `subject`/`related_subjects` |

Use the actual files in `00-System/Templates/`: Source Note for received-source records; Homework, Lecture, Problem Session, or Concept for their corresponding authored notes; Course Home for a new course home. Read only the templates needed for this intake. For `note`, `study-guide`, or `transcript`, use the Standard's schema and an accepted same-type note when available. Resolve template variables and mint missing IDs before publication; preserve existing IDs and prose when standardizing an authored note.

For received Markdown/text, read directly and preserve the original bytes. A received `.md` original and its same-name `.md` sidecar cannot occupy the same path. Reuse an already approved representation for that source when one exists; otherwise stage a proposed distinct source-record path and resolve that representation with the user before publication, without adding metadata to or overwriting the original. Continue other resolved inputs. For an authored PDF with no corresponding note, a checked conversion can become its authored note beside the PDF, as in the existing CS-204 Exercise 02 job; its note is not `type: source`.

Stage each job in `~/Maestria-Work/<job-id>/` (`%USERPROFILE%\Maestria-Work\<job-id>\` on Windows) outside OneDrive, using the same job on resume. This location still requires the current host's filesystem permissions; request an actual sandbox escalation if necessary. Preserve exact extraction output and its SHA256. Use the Architecture's manifest contract under `00-System/Manifests/<COURSE>/`, retaining prior observations, reviews, corrections, and publication history. If course identity is unresolved, keep the provisional record in staging rather than assigning a guessed course.

- **Documents:** use the `mineru` skill (`$mineru` in Codex, `/mineru` in Claude Code) and read its installed `SKILL.md` (`~/.agents/skills/mineru/SKILL.md`; Claude Code reads it through `~/.claude/skills/mineru/`), then follow [Document publication](references/document-publication.md). If that installation path changes, resolve `mineru` from the current skill catalog. MinerU owns CLI setup, local parsing, locators, and recovery choices; Vault Ingest owns source publication and validation. PDFs use explicit full-page coverage; native Office and other non-PDF routes omit PDF-only flags.
- **Recordings:** read the available `audio-transcription` skill, the Architecture's Windows/WSL section, and the [recording identity reference](../../../.agents/skills/verified-lecture-study-guide/references/recording-and-transcription.md). Use an isolated single-file WSL job; the legacy helper's shared batch directory and basename copying can process unrelated audio. Record effective local backend/model/config, prompt-content hash, duration, and segment timestamps. Raw transcripts retain their actual review state and `raw/transcript` tag; successful ASR does not make them verified. Resolve course identity before publication; omit an unproved `LNN` and use an evidenced title when ingesting media without a known session. A requested lecture guide uses the stricter session gate in its skill.
- **Authored material:** add missing properties using the selected template/schema. Record before/after hashes and preserve relative attachments. Keep related code/data together; treat a repository as a package, not loose files to rename.

**Done:** staged outputs and evidence satisfy their format's acceptance rules, or the manifest names the exact runtime/identity/review issue.

## 4. Publish the selected material

The user request authorizes ordinary imports and normalization of the selected new files. Copy an external original into the vault by default, preserving its external copy. For new files already in the vault, use Obsidian's link-aware move/rename when needed; check live help and pass the explicit vault and path. Preserve original binary bytes. A course migration, deletion, repository move, or overwrite of conflicting authored work follows its separately authorized map and recovery rules; do not turn a new-file request into that batch.

Before writes, capture expected target hashes and a native baseline when available. Recheck hashes immediately before replacement; a concurrent edit becomes a staged reconciliation candidate. Publish converted document content only after its content review passes. Preserve identity notes, usage links, and the human correction log above the machine-converted section during reconversion. New notes have a minted unique `id`, `schema_version: 1`, the correct `subject` and `type`, flat typed properties, quoted YAML wikilinks, and evidenced dates. Unknown values remain YAML null. Accepted frontmatter datetimes use local Asia/Riyadh time; precise UTC observations stay in the manifest.

If identity and destination are resolved but extraction or review is pending, place the unchanged original and a metadata-only Source Note at their standard paths when that can be done safely. Link the original and manifest, record the pending reason above the machine-converted callout, and leave that section without unchecked transcription. Keep `review_status: needs-review` and the manifest's applicable pending state (`needs_runtime`, `needs_quality_choice`, `needs_review`, or `failed`). Record any written outputs and hashes for resume; retain a prior accepted publication in full. Unresolved identities stay in staging.

Place received-source assets under `<COURSE>/Sources/_assets/<source name>/` and the source note beside the original. For an authored export's conversion, keep new attachments with its authored note, such as `Homework/<assignment>/_assets/<note name>/`, and preserve existing attachment paths. Keep received/source content faithful; supplied errors are attributed to the source, while extraction mistakes are corrected. Source-grounded concept synthesis is included by default through Vault Connect. Fresh worked examples, assignment solutions, study guides, and PDF exports require the corresponding user request.

For a confirmed assignment, find its existing tracker by course/assignment identity even when it is at a legacy path. Link it to the checked handout and preserve the existing work/status. If none exists, create a minimal Homework-template tracker with page-cited requirements and evidenced deadlines, leaving solutions and submission data empty. Conflicting deadlines need resolution.

Course Sources/Homework views derive their rows from properties. Reuse the existing course home and Base. When importing into an explicitly identified new course, create its `<COURSE>/<COURSE>.md` home from the Course Home template, keeping unknown course details empty. Its `subject` must match the imported notes; preserve the exact embedded view names so `this.subject` scopes the rows. The existing views cover new course codes automatically. Edit a Base definition only when the requested view is missing or incorrect, following the Bases skill.

**Done:** intended originals, notes, assets, and manifests agree; previous good content and unrelated course files are intact.

## 5. Connect checked material by default

Invoke [Vault Connect](../vault-connect/SKILL.md) for newly published/resumed checked sources in this intake, and for explicitly selected checked sources without a current concept pass. Pass source-note/manifest paths, original and publication hashes, content-review evidence, selected courses, and native-validation limits. A pending native check alone does not block connecting checked content; metadata-only and unchecked content remain ineligible. An opt-out skips this step.

Vault Connect owns candidate selection, concept updates, `topics` navigation and the independent `concept_pass` receipt. Keep source publication and concept outcomes separate. A no-value source may receive a no-change outcome; a bounded tranche retains its remaining candidates for resume. Refresh publication hashes after `topics` metadata edits before source validation. Resuming pending concepts is not permission to re-extract a checked source or backfill unrelated files.

**Done:** each eligible source has a reused or attempted concept pass, or an explicit opt-out; pending concepts retain their scope and reasons independently of the source job.

## 6. Validate and report

Verify source bytes, original/publication hashes, coverage, required properties and unique IDs/names, asset paths, and page/slide/time citations. Run the existing math checker for notes containing math; compilation complements visual/source review. Probe the CLI through the Obsidian CLI skill, prefer `COPILOT_OBSIDIAN_CLI`, and use a compatible local launcher when PATH is absent. The existing `check-vault.ps1` resolves that launcher. With the live app available, run from the vault root:

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File '00-System/Scripts/check-vault.ps1' -Save '<job>/before.json'
# Run the -Save call before publication, then compare after publication:
powershell.exe -NoProfile -ExecutionPolicy Bypass -File '00-System/Scripts/check-vault.ps1' -Compare '<job>/before.json'
```

On Linux or macOS, run the same script with PowerShell 7: `pwsh -NoProfile -File '00-System/Scripts/check-vault.ps1' ...`. The script uses `COPILOT_OBSIDIAN_CLI`, then the Windows install path, then `obsidian` on PATH.

Check native membership of each new note in its intended Base view, beyond aggregate counts. Use `base:query` with the explicit vault, Base path, exact view name, and `format=json`; verify each note's returned path and parsed properties. Course views using `this.subject` need the embedding course-home context, established through live help or a read-only runtime query. A standalone Base query or a total row count cannot prove course-home membership. For live property edits, supply the agreed `type=` to `property:set`, then refresh the affected output hashes from the files Obsidian wrote.

A failed/empty CLI response is missing evidence. If Obsidian is unavailable, finish filesystem/content checks, record native validation as pending, and resume that stage later; do not report native checks as passed or the job as complete. Use `check-vault.ps1` for routine checks; `verify-obsidian.js` is a mutating diagnostic. Preserve the app and any Copilot-hosted session throughout.

Keep unreviewed extraction candidates outside the indexed vault; pending metadata-only records contain identity/provenance, with unchecked source text left in staging. The approved Copilot `needs-review` exclusion has a separate HW01 review gate; routine intake leaves indexing/settings unchanged and does not assume that a status value quarantines content. Native Base membership is distinct from Copilot index membership/retrieval.

Write the manifest's `complete` state last, after all required checks pass. Return a compact per-input result table containing original path, final original/note links, result (`imported`, `reused`, `resumed`, `new version`, or `pending`), review status, and pending reason, plus concept outcome and created/updated/reused concept links. Report pending concept work separately from pending source validation. A metadata-only import remains `pending`; say which files were placed and which review/validation stage remains. Include total inputs/imports/reuses/pending items, correction counts and image-fallback pages for converted documents, and material validation limits. Never include ignored assets in the imported-source count.

**Done:** every selected candidate has an evidenced final outcome; incomplete work retains a resumable manifest and the last good publication.

## Example requests

- `Use vault-ingest for the new files in CS-101/Sources/Slides.`
- `Use vault-ingest to import ~/Downloads/Week 6 into EE-301.`
- `Ingest these two files into MATH-201: <assignment path>, <supplied solution path>.`
- `Resume the pending import for <source path or manifest>.`

- `Ingest these files without concepts.`
- `Resume the concept pass for <checked source note or manifest>.`

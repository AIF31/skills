---
name: latex-report
description: Build, rebuild or verify the LaTeX/PDF version of an AMCS-215 homework report from its Markdown (`AMCS-215 HWNN Report.md`). Use when asked to turn a report into LaTeX or a PDF, to remake the PDF after the Markdown changed, or to check the PDF against the Markdown.
---

# AMCS-215 LaTeX Report

The report is submitted for grading, so the student must be able to stand behind every upright sentence. The leading word is **verbatim**: assignment text is verbatim from `asstN.pdf`, and the student's text is verbatim from the Markdown.

Use the Maestría vault as the working directory. The report paths below are relative to the vault root. Set `SKILL_DIR` to the absolute path of the folder containing this `SKILL.md`.

For `HMW-N`:

| Role | Path |
|---|---|
| Student's answers (source of truth) | `AMCS-215/Homework/HMW-N/AMCS-215 HWNN Report.md`, or the copy the user attached |
| Assignment | `AMCS-215/Homework/HMW-N/asstN.pdf` |
| Template | `00-System/Templates/AMCS-215 Homework Report Template.tex` |
| Output | `AMCS-215_HWNN_Report.tex` and `.pdf` in the HMW-N folder; aux files go to the scratchpad |
| Checker | [`scripts/verify_report.py`](scripts/verify_report.py) in this skill |

## Steps

1. **Read the inputs.** Read the whole Markdown. Get the assignment text with `pdftotext -layout asstN.pdf -`. Obsidian can hold unsaved edits: if the file on disk lacks a change the user mentions, say so and ask them to save it or attach it. Done when you know every section, image, table and code block in the Markdown.
2. **Fix trivial errors in the Markdown itself**, so the `.tex` can mirror it. Trivial errors are typos, `$1,008$` instead of `$1{,}008$`, an unclosed `**`, broken list indentation and a missing blank line. Back up the Markdown to the scratchpad first, because the user edits it in Obsidian at the same time. Content and math mistakes stay as written; list them for the user.
3. **Start the `.tex`.** If `AMCS-215_HWNN_Report.tex` already exists, edit that file: it holds choices the user approved earlier. Otherwise copy the template and set `\title{AMCS 215 Assignment N}`.
4. **Write the body** by following the rules below. Done when every Markdown line, image, table and code block has its place in the `.tex`.
5. **Compile** from the HMW-N folder, twice, so figure numbers settle:
   `pdflatex -interaction=nonstopmode -halt-on-error -output-directory "<scratchpad>" AMCS-215_HWNN_Report.tex`
   Then copy the PDF into the HMW-N folder and run `grep -nE "^!|Overfull|Undefined|not found" "<scratchpad>/AMCS-215_HWNN_Report.log"`. Done when that grep prints nothing.
6. **Verify** with `python3 -I "$SKILL_DIR/scripts/verify_report.py" "<md>" "<tex>"`.
   - Each counted issue is either fixed in the `.tex` or reported to the user as an open difference.
   - Read the informational lists as well. Paraphrased question text belongs in `prof`. A student sentence that shows up there was filed in the wrong place.
   - The checker ignores whitespace, braces, `$` and `*`. It cannot see text moved into math (`$y$-axis`) or a changed line structure in `aligned`, so check those by eye.
   - Render the pages that hold figures and tables (`pdftoppm -r 50 -png`) and look at their size and placement.

   Done when the checker prints `Issues: 0`, or every remaining issue is one you will report.
7. **Report.** Give the paths and the page count. List the Markdown fixes from step 2, any typos fixed in the professor's text, any text drafted by Claude, and every open difference.

## Rules

**Assignment text**
- It goes inside `\begin{prof}…\end{prof}`, which prints upright in dark gray, verbatim from `asstN.pdf`. Leave the professor's footnotes out of the PDF, with no footnote mark either (user's request, HW06). The PDF has no italic text anywhere: not in `prof`, the author block or code comments (user's request, HW06). The whole document is in Times (`mathptmx`).
- Where the Markdown paraphrases a question, the `.tex` uses the professor's wording instead.
- When the assignment only names a textbook exercise, put the exercise statement from the Markdown inside the same `prof` block, with its equations and numbers.
- Fix only obvious typos in the professor's text, such as a doubled ")", and report them.
- Add no note that explains the gray text.

**Student text**
- It is upright and verbatim from the Markdown: wording, cross-references ("see 5.1"), labels, punctuation and the line structure of `aligned` blocks.
- Text stays text and math stays math. Inline `$…$` is copied unchanged; `$$…$$` becomes `\[…\]` with the same contents.
- `**Answer**` becomes `\textbf{Answer}\\`. A `###` sub-heading becomes a `\textbf{…}` line. `**(a) Zero mean**` becomes `\textbf{(a) Zero mean}`.
- Text between `%%…drafted by Claude%%` and `%%End of text drafted by Claude%%` was not written by the student: tell the user before you include it.
- When the user asks to remove a Markdown sentence from the PDF only, leave it out and record it where it was, so rebuilds keep it out and the checker accepts it:

  ```latex
  % Removed at the user's request (YYYY-MM-DD), keep removed on rebuilds:
  % "<exact Markdown sentence>"
  ```

**Structure**
- Each `## N. Title` becomes `\problem{N}{Title}`, followed by its `prof` block.
- Numbered sub-questions go in `itemize`: `\item \begin{prof}…\end{prof}`, then the answer, as in the template.
- A list labelled `i)`, `ii)` becomes `\begin{enumerate}[label=\roman*)]`.
- The template's title and author block replace the Markdown's H1 and name line. There is no logo.

**Obsidian syntax**
- `%%…%%` comments are dropped.
- `[[target|alias]]` becomes the alias, and `[[target]]` becomes the target.
- `[text](url)` becomes the text.

**Figures**
- One `figure` per `![[image]]` embed, including two embeds on one line. Use `[H]`, `\centering`, `\includegraphics[width=…\textwidth]` and a caption with the title only: `\caption{Neural network loss history.}` prints "Fig. 8. Neural network loss history."
- Obsidian finds embeds by file name anywhere in the vault. Locate each file with `find . -name "<file>" -not -path "*/.stversions/*"`, then add its folder, relative to HMW-N, to `\graphicspath`.

**Tables and code**
- Tables use booktabs `tabular` inside `table` `[H]`, centred. The cells are verbatim, with `_` escaped as `\_`.
- Fenced code becomes `lstlisting`; the template's Python style applies.

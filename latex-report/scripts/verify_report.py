#!/usr/bin/env python3
"""Compare an AMCS-215 report's Markdown with its LaTeX version.

Usage: python3 -I verify_report.py "AMCS-215 HWNN Report.md" AMCS-215_HWNN_Report.tex

Checks that every line of the Markdown appears unchanged in the upright
(non-`prof`) LaTeX text, that the LaTeX adds no upright text of its own, and
that code blocks and images match. Comparison ignores whitespace, `$`
delimiters, braces and emphasis markers, so `-1.7` and `$-1.7$` are equal.
Markdown lines whose words are >=85% assignment words are listed apart as
question text (paraphrased prompts). Exit code 1 if anything is missing or added.
"""
import re
import sys
from pathlib import Path

SEP = "\n"
ACCENTS = {"'a": "á", "'e": "é", "'i": "í", "'o": "ó", "'u": "ú",
           "'A": "Á", "'E": "É", "'I": "Í", "'O": "Ó", "'U": "Ú",
           "~n": "ñ", "~N": "Ñ", '"u': "ü", '"o': "ö"}
SAME = (("\\times", "×"), ("\\cdot", "·"), ("²", "^2"), ("³", "^3"), ("−", "-"),
        ("“", '"'), ("”", '"'), ("‘", "'"), ("’", "'"), ("…", "..."), ("\u00a0", " "),
        ("*", ""), ("{", ""), ("}", ""))
TEXT_ENVS = r"figure|table|itemize|enumerate|center|tabularx?|minipage|quote|flushleft|flushright"


def squash(s):
    for a, b in SAME:
        s = s.replace(a, b)
    return re.sub(r"\s+", "", s)


def cut_math(s, patterns, store):
    """Replace math with numbered placeholders; display math becomes its own line."""
    for pat, display in patterns:
        def repl(m):
            store.append(re.sub(r"\\\\\[[^\]]*\]", r"\\\\", m.group(m.lastindex)))
            tag = f"\x01{len(store) - 1}\x02"
            return f"{SEP}{tag}{SEP}" if display else tag
        s = re.sub(pat, repl, s, flags=re.S)
    return s


def put_math(s, store):
    return re.sub(r"\x01(\d+)\x02", lambda m: " ".join(store[int(m.group(1))].split()), s)


def chunks(stream):
    return [" ".join(c.split()) for c in stream.split(SEP) if re.search(r"\w", c)]


# ---------------------------------------------------------------- Markdown
def parse_md(text):
    r = {"code": [], "images": [], "drafted": []}
    text = re.sub(r"\A---\n.*?\n---\n", "", text, flags=re.S)
    for m in re.finditer(r"%%[^%]*drafted by Claude[^%]*%%(.*?)(%%End of text drafted by Claude%%|\Z)",
                         text, flags=re.S | re.I):
        r["drafted"].append(" ".join(m.group(1).split())[:120])
    text = re.sub(r"%%.*?%%", "", text, flags=re.S)
    text = re.sub(r"```[^\n]*\n(.*?)```",
                  lambda m: r["code"].append(squash(m.group(1))) or SEP, text, flags=re.S)
    text = re.sub(r"!\[\[([^\]|]+)(\|[^\]]*)?\]\]",
                  lambda m: r["images"].append(Path(m.group(1)).stem) or SEP, text)
    text = re.sub(r"!\[[^\]]*\]\(([^)]+)\)",
                  lambda m: r["images"].append(Path(m.group(1)).stem) or SEP, text)
    math = []
    text = cut_math(text, [(r"\$\$(.*?)\$\$", True), (r"(?<!\\)\$(.+?)(?<!\\)\$", False)], math)
    lines = []
    for line in text.split("\n"):
        if re.match(r"\s*#{1,2}\s", line):  # H1/H2 become \title and \problem
            continue
        if re.match(r"\s*\|?\s*:?-{3,}:?\s*(\|\s*:?-{3,}:?\s*)*\|?\s*$", line):
            continue  # table rule
        line = re.sub(r"^\s*#{3,}\s*", "", line)
        line = re.sub(r"^\s*(>\s*)+", "", line)
        line = re.sub(r"^\s*(\d+\.|[-*+])\s+", "", line)
        line = re.sub(r"^\s*([ivx]+|[a-h])\)\s+", "", line)  # i) a) labels come from enumerate
        lines.append(line.replace("|", SEP))
    text = "\n".join(lines)
    text = re.sub(r"\[\[[^\]|]*\|([^\]]*)\]\]", r"\1", text)
    text = re.sub(r"\[\[([^\]]*)\]\]", r"\1", text)
    text = re.sub(r"\[([^\]]*)\]\([^)]*\)", r"\1", text)
    text = re.sub(r"<br\s*/?>", SEP, text)
    text = re.sub(r"(\*\*|__|`)", "", text).replace("\\$", "$")
    r["text"] = put_math(text, math)
    return r


# ------------------------------------------------------------------- LaTeX
def tex_text(s):
    s = re.sub(r"\\problem\{[^}]*\}\{[^}]*\}", SEP, s)
    s = re.sub(rf"\\begin\{{({TEXT_ENVS})\}}(\[[^\]]*\])?(\{{[^}}]*\}})*", SEP, s)
    s = re.sub(rf"\\end\{{({TEXT_ENVS})\}}", SEP, s)
    s = re.sub(r"\\(vspace|hspace|label|setlength)\*?(\{[^}]*\})+", " ", s)
    s = re.sub(r"\\(maketitle|centering|toprule|midrule|bottomrule|hline|item|par|"
               r"noindent|bigskip|medskip|smallskip|newpage|clearpage|small|footnotesize)\b", SEP, s)
    s = re.sub(r"\\(['~\"])\{?([A-Za-z])\}?", lambda m: ACCENTS.get(m.group(1) + m.group(2), m.group(2)), s)
    s = s.replace("\\\\", SEP).replace("\\&", "\x03").replace("&", SEP).replace("\x03", "&")
    for a, b in (("\\%", "%"), ("\\_", "_"), ("\\#", "#"), ("\\$", "$"), ("``", '"'), ("''", '"'),
                 ("---", "—"), ("--", "–"), ("\\ldots", "..."), ("\\dots", "..."), ("~", " "),
                 ("\\ ", " ")):
        s = s.replace(a, b)
    return re.sub(r"\\(textbf|textit|emph|texttt|textrm|textsc|underline|url|mbox)\b", "", s)


def parse_tex(text):
    r = {"code": [], "images": [], "captions": []}
    body = text.split("\\begin{document}", 1)[-1].split("\\end{document}", 1)[0]
    r["removed"] = squash(" ".join(re.findall(  # quoted MD text the user had removed from the PDF
        r'^\s*%\s*"(.*)"\s*$', "\n".join(re.findall(
            r"^\s*% Removed at the user's request.*\n((?:\s*%.*\n)+)", body, flags=re.M)), flags=re.M)).replace("$", ""))
    body = "\n".join(re.sub(r"(?<!\\)%.*", "", l) for l in body.split("\n"))
    body = re.sub(r"\\begin\{lstlisting\}(\[[^\]]*\])?(.*?)\\end\{lstlisting\}",
                  lambda m: r["code"].append(squash(m.group(2))) or SEP, body, flags=re.S)
    body = re.sub(r"\\includegraphics(\[[^\]]*\])?\{([^}]*)\}",
                  lambda m: r["images"].append(Path(m.group(2)).stem) or SEP, body)
    body = re.sub(r"\\caption\{((?:[^{}]|\{[^{}]*\})*)\}",
                  lambda m: r["captions"].append(m.group(1)) or SEP, body)
    body = re.sub(r"\\\\\[[^\]]*\]", r"\\\\", body)
    math = []
    body = cut_math(body, [(r"\\\[(.*?)\\\]", True), (r"\$\$(.*?)\$\$", True),
                           (r"\\begin\{(equation\*?|align\*?|gather\*?)\}(.*?)\\end\{\1\}", True),
                           (r"(?<!\\)\$(.+?)(?<!\\)\$", False)], math)
    prof = []
    body = re.sub(r"\\begin\{prof\}(.*?)\\end\{prof\}",
                  lambda m: prof.append(m.group(1)) or SEP, body, flags=re.S)
    r["text"] = put_math(tex_text(body), math)
    r["prof"] = put_math(tex_text(SEP.join(prof)), math)
    r["preamble"] = tex_text(text.split("\\begin{document}", 1)[0])
    return r


def words(s):
    return set(re.findall(r"\w+", s.lower()))


def main():
    if len(sys.argv) != 3:
        sys.exit(__doc__)
    md = parse_md(Path(sys.argv[1]).read_text(encoding="utf-8"))
    tex = parse_tex(Path(sys.argv[2]).read_text(encoding="utf-8"))
    tex_all, md_all, prof_all = (squash(x.replace(SEP, "")) for x in (tex["text"], md["text"], tex["prof"]))
    prof_words = words(tex["prof"])
    preamble = squash(tex["preamble"])
    problems = 0

    def report(title, items, counts=True):
        nonlocal problems
        if items:
            problems += len(items) if counts else 0
            print(f"\n## {title} ({len(items)})")
            for i in items:
                print(f"  - {i}")

    missing, question, in_prof, removed = [], [], [], []
    for c in chunks(md["text"]):
        q = squash(c)
        if q in tex_all or q in preamble:  # preamble: author name, title
            continue
        if tex["removed"] and q in tex["removed"]:
            removed.append(c)
            continue
        if q in prof_all:
            in_prof.append(c)
            continue
        w = words(c)  # answers share at most ~75% of their words with the assignment
        (question if w and len(w & prof_words) / len(w) >= 0.85 else missing).append(c)
    added = [c for c in chunks(tex["text"]) if squash(c) not in md_all]

    report("MD text missing from the upright LaTeX text", missing)
    report("LaTeX upright text not in the MD", added)
    report("MD code blocks missing from the LaTeX", [c[:80] for c in md["code"] if c not in tex["code"]])
    report("LaTeX listings not in the MD", [c[:80] for c in tex["code"] if c not in md["code"]])
    report("Images in the MD, not in the LaTeX", [i for i in md["images"] if i not in tex["images"]])
    report("Images in the LaTeX, not in the MD", [i for i in tex["images"] if i not in md["images"]])
    a = [i for i in md["images"] if i in tex["images"]]
    b = [i for i in tex["images"] if i in md["images"]]
    if a != b:
        report("Image order differs", ["MD:  " + ", ".join(a), "TeX: " + ", ".join(b)])
    report("Text drafted by Claude in the MD (not the student's writing)", md["drafted"])
    print("\n# Informational (check, but not counted)")
    report("MD text that paraphrases the assignment (question text)", question, counts=False)
    report("MD text found only inside prof blocks", in_prof, counts=False)
    report("MD text removed at the user's request (% Removed at the user's request)", removed, counts=False)
    report("Figure captions", tex["captions"], counts=False)
    print(f"\nImages: MD {len(md['images'])}, LaTeX {len(tex['images'])}. Issues: {problems}.")
    sys.exit(1 if problems else 0)


if __name__ == "__main__":
    main()

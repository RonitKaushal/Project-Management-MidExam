# Project-Management-MidExam

Flippable, spiral-notebook style exam-prep books, written only from the class notes. Open the site, pick a book, and flip through detailed 5-mark answers with diagrams, tables and exam tips.

**Live site:** https://ronitkaushal.github.io/Project-Management-MidExam/

Created by **Ronit Kaushal**.

## Books

### Project Management (Unit I & II)

- 13 main questions: Project, Project Management, Characteristics, Project vs Programme, Types of Projects, Agile velocity, ROI, Payback, NPV, Waterfall, Business Case, Project Appraisal, Types of Projects
- 12 additional questions: Appraisal methods, ROI, Payback (equal / unequal), Cumulative cash inflow, NPV, NPV vs compound interest, IRR
- Formula sheet for last-minute revision, and a source-notes index

### Compiler Design (Unit 1, 2 & 3)

- 23 questions: phases of a compiler, symbol table and error handler, lexical analysis, tokens / lexemes / patterns, CFG, leftmost and rightmost derivations, parse trees, ambiguity, top-down and bottom-up parsing, recursive descent, LL(1), shift-reduce, handle pruning, LR parsing, compiler vs interpreter
- Quick revision sheet and a source-notes index

## Using a book

- Flip: click the page, use the ← → keys, swipe or scroll, or drag a right-hand page corner
- Contents: press `T` or use the Contents button
- Zoom: use the 1× button; when zoomed, ↑ ↓ scroll the page and ← → flip
- Print / save as PDF from the Print button
- Back to the book list: click the logo or "All books"

## Folder structure

```
index.html                book picker (choose an exam book)
project-management.html   Project Management book
compiler-design.html      Compiler Design book
assets/css/               styles (style.css for the books, home.css for the picker)
assets/js/                book.js (pagination + page turn), home.js (picker)
assets/lib/               jQuery and turn.js (page-flip effect)
assets/img/               logo, diagrams from the notes, stickers
notes/                    original class notes (PDF), Compiler Design notes in notes/Compiler Design/
```

## Run locally

```
python3 -m http.server 8765
```

Then open http://localhost:8765.

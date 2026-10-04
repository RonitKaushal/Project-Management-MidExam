# Project-Management-MidExam

A flippable, spiral-notebook style exam-prep book for **Project Management (Unit I & II)**. It covers all 25 exam questions as 5-mark answers, with diagrams, tables, numericals and exam tips, written only from the class notes.

**Live site:** https://ronitkaushal.github.io/Project-Management-MidExam/

Created by **Ronit Kaushal**.

## What's inside

- 13 main questions: Project, Project Management, Characteristics, Project vs Programme, Types of Projects, Agile velocity, ROI, Payback, NPV, Waterfall, Business Case, Project Appraisal, Types of Projects
- 12 additional questions: Appraisal methods, ROI, Payback (equal / unequal), Cumulative cash inflow, NPV, NPV vs compound interest, IRR
- Formula sheet for last-minute revision, and a source-notes index

## Using the book

- Flip: click the page, use the ← → keys, swipe or scroll, or drag a right-hand page corner
- Contents: press `T` or use the Contents button
- Print / save as PDF from the Print button

## Folder structure

```
index.html          the book (all content lives here)
assets/css/         styles
assets/js/          pagination + page-turn logic
assets/lib/         jQuery and turn.js (page-flip effect)
assets/img/         logo and diagrams taken from the notes
notes/              original class notes (PDF)
```

## Run locally

```
python3 -m http.server 8765
```

Then open http://localhost:8765.

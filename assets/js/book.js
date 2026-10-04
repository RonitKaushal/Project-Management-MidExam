(() => {
  const PW = 794;
  const PH = 1123;
  const FLIP_MS = 650;
  const RINGS = 26;
  const BIND = 28; // px of binding sticking out left of the page
  const ZOOMS = [1, 1.6, 2.2];

  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];

  const src = $("#src");
  const measure = $("#measure");
  const book = $("#book");
  const wrap = $("#bookWrap");

  /** @type {{el: HTMLElement, tag: string, title: string}[]} */
  const pages = [];
  /** @type {{tag: string, title: string, group: string, page: number}[]} */
  const toc = [];

  const escapeHtml = (s) =>
    s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

  function makePage(tag, title, extraClass = "") {
    const el = document.createElement("div");
    el.className = "page " + extraClass;
    el.innerHTML =
      `<div class="page-head"><span class="qtag">${escapeHtml(tag)}</span><span>${escapeHtml(title)}</span></div>` +
      `<div class="page-body"></div>` +
      `<div class="page-foot"><span>Project Management · Exam Prep Notes · <span class="brand-sig">by Ronit Kaushal</span></span><span class="pno"></span></div>`;
    measure.appendChild(el);
    pages.push({ el, tag, title });
    return el.querySelector(".page-body");
  }

  /** Bottom edge of the content inside a page body (scrollHeight is never smaller than clientHeight). */
  const contentBottom = (body) => {
    const last = body.lastElementChild;
    if (!last) return 0;
    return last.offsetTop + last.offsetHeight + (parseFloat(getComputedStyle(last).marginBottom) || 0);
  };
  const overflows = (body) => contentBottom(body) > body.clientHeight - 6;
  const isList = (n) =>
    n.tagName === "UL" || n.tagName === "OL" || n.classList.contains("steps") || n.classList.contains("calc");
  const isTable = (n) => n.tagName === "TABLE" && n.querySelectorAll("tr").length > 3;

  /** Split a table across pages, repeating its header row. Returns the leftover table or null. */
  function splitTable(tbl, body) {
    const rows = [...tbl.querySelectorAll("tr")];
    const head = rows[0].querySelector("th") ? rows[0] : null;
    const data = head ? rows.slice(1) : rows;
    const shell = () => {
      const t = tbl.cloneNode(false);
      const tb = document.createElement("tbody");
      t.appendChild(tb);
      if (head) tb.appendChild(head.cloneNode(true));
      return t;
    };
    const first = shell();
    const tb = first.querySelector("tbody");
    body.appendChild(first);
    let i = 0;
    for (; i < data.length; i++) {
      const row = data[i].cloneNode(true);
      tb.appendChild(row);
      if (overflows(body)) {
        tb.removeChild(row);
        break;
      }
    }
    if (i < 2) {
      body.removeChild(first);
      return tbl;
    }
    if (i >= data.length) return null;
    const rest = shell();
    data.slice(i).forEach((r) => rest.querySelector("tbody").appendChild(r.cloneNode(true)));
    return rest;
  }
  const isKeep = (n) => n && (n.tagName === "H3" || n.tagName === "H4" || n.classList.contains("keep"));

  /** Flow a list of block nodes across as many pages as needed. */
  function flow(blocks, tag, title, pageClass = "") {
    let body = makePage(tag, title, pageClass);
    const queue = [...blocks];

    const newPage = () => {
      const prev = body;
      body = makePage(tag, title, pageClass);
      const carry = [];
      while (prev.lastElementChild && isKeep(prev.lastElementChild) && prev.children.length > carry.length + 1) {
        carry.unshift(prev.lastElementChild);
        prev.removeChild(prev.lastElementChild);
      }
      carry.forEach((n) => body.appendChild(n));
    };

    let guard = 0;
    while (queue.length) {
      const blk = queue.shift();
      body.appendChild(blk);
      if (!overflows(body) || ++guard > 4000) continue;
      body.removeChild(blk);

      if (!body.children.length && !isTable(blk) && !isList(blk)) {
        body.appendChild(blk);
        continue;
      }

      if (blk.tagName === "FIGURE" && body.children.length) {
        const svg = blk.querySelector("svg, img");
        body.appendChild(blk);
        let fitted = false;
        const sizes = svg && svg.tagName === "IMG" ? [66, 56, 46] : [90, 82, 74, 66];
        for (const w of svg ? sizes : []) {
          svg.style.width = w + "%";
          if (contentBottom(body) <= body.clientHeight - 12) { fitted = true; break; }
        }
        if (fitted) continue;
        if (svg) svg.style.width = "";
        body.removeChild(blk);
      }

      if (isTable(blk)) {
        const rest = splitTable(blk, body);
        if (rest !== blk) {
          if (rest) {
            newPage();
            queue.unshift(rest);
          }
          continue;
        }
      }

      if (isList(blk) && blk.children.length > 1) {
        const shell = blk.cloneNode(false);
        body.appendChild(shell);
        const items = [...blk.children];
        let i = 0;
        const startedEmpty = body.children.length === 1;
        for (; i < items.length; i++) {
          shell.appendChild(items[i]);
          if (overflows(body) && !(i === 0 && startedEmpty)) {
            shell.removeChild(items[i]);
            break;
          }
        }
        if (!shell.children.length) body.removeChild(shell);
        if (i < items.length) {
          const rest = blk.cloneNode(false);
          if (blk.tagName === "OL") rest.setAttribute("start", String((parseInt(blk.getAttribute("start") || "1", 10)) + i));
          items.slice(i).forEach((it) => rest.appendChild(it));
          newPage();
          queue.unshift(rest);
        }
        continue;
      }

      if (!body.children.length) {
        body.appendChild(blk); // a single block taller than a page: keep it anyway
        continue;
      }
      newPage();
      queue.unshift(blk);
    }
  }

  /** data-src="File A (pp. 1–3); File B" → "From notes:" tag shown under the question title */
  function sourceTag(src, note) {
    const el = document.createElement("div");
    el.className = "source";
    const files = src.split(";").map((s) => `<span class="f">${escapeHtml(s.trim())}</span>`).join(" · ");
    el.innerHTML = `<span class="lbl">From notes:</span>${files}` + (note ? `<span class="note">${escapeHtml(note)}</span>` : "");
    return el;
  }

  function paginate() {
    const sections = $$(":scope > section", src);
    const tocRows = [];

    for (const sec of sections) {
      const kind = sec.dataset.kind || "q";

      if (kind === "raw") {
        const el = sec.firstElementChild.cloneNode(true);
        measure.appendChild(el);
        pages.push({ el, tag: sec.dataset.tag || "", title: sec.dataset.title || "" });
        continue;
      }

      if (kind === "toc") {
        // placeholder rows now, page numbers filled after everything is paginated
        const blocks = [];
        const h = document.createElement("h2");
        h.className = "q-title";
        h.textContent = "Contents";
        blocks.push(h);
        let lastGroup = "";
        for (const s of sections) {
          if (s.dataset.kind && s.dataset.kind !== "q") continue;
          if (s.dataset.group !== lastGroup) {
            lastGroup = s.dataset.group;
            const g = document.createElement("div");
            g.className = "grp keep";
            g.textContent = lastGroup;
            blocks.push(g);
          }
          const row = document.createElement("div");
          row.className = "row";
          row.dataset.key = s.dataset.tag;
          row.innerHTML = `<span class="nn">${escapeHtml(s.dataset.tag)}</span><span class="tt">${escapeHtml(s.dataset.title)}</span><span class="dots"></span><span class="pp">00</span>`;
          blocks.push(row);
          tocRows.push(row);
        }
        flow(blocks, "", "Contents", "toc-page");
        continue;
      }

      const tag = sec.dataset.tag;
      const title = sec.dataset.title;
      if (kind === "flow") {
        flow([...sec.children].map((n) => n.cloneNode(true)), tag, title);
        continue;
      }
      toc.push({ tag, title, group: sec.dataset.group || "", page: pages.length });
      const blocks = [...sec.children].map((n) => n.cloneNode(true));
      if (sec.dataset.src) {
        const meta = blocks.findIndex((b) => b.classList.contains("q-meta"));
        blocks.splice(meta + 1, 0, sourceTag(sec.dataset.src, sec.dataset.srcnote));
      }
      flow(blocks, tag, title);
    }

    pages.forEach((p, i) => {
      const pno = p.el.querySelector(".pno");
      if (pno) pno.textContent = String(i);
    });

    const byTag = Object.fromEntries(toc.map((t) => [t.tag, t.page]));
    $$(".toc-page .row", measure).forEach((row) => {
      const target = byTag[row.dataset.key];
      row.querySelector(".pp").textContent = String(target);
      row.dataset.target = String(target);
    });
  }

  /* ------------------------------------------------------------------ */
  /* Book                                                                */
  /* ------------------------------------------------------------------ */

  let cur = 0; // index of the visible page (turn.js pages are 1-based)
  let total = 0;
  let flip = null;
  let $flip = null;
  let sheet = null;

  function buildBook() {
    const layer = document.createElement("div");
    layer.className = "spiral-layer";
    layer.innerHTML = `<div class="spiral">${"<i></i>".repeat(RINGS)}</div>`;

    flip = document.createElement("div");
    flip.className = "flip";
    const printBook = document.createElement("div");
    printBook.className = "print-book";

    pages.forEach((p) => {
      const holes = document.createElement("div");
      holes.className = "holes";
      holes.innerHTML = "<i></i>".repeat(RINGS);
      p.el.appendChild(holes);
      printBook.appendChild(p.el.cloneNode(true));
      const t = document.createElement("div");
      t.className = "tpage";
      t.appendChild(p.el);
      flip.appendChild(t);
    });

    sheet = document.createElement("div");
    sheet.className = "backsheet";

    book.append(sheet, flip, layer);
    document.body.appendChild(printBook);
    total = pages.length;
    measure.remove();
  }

  /* Page turns are handled by turn.js (turnjs.com): drag or hover a corner to peel,
     click / keys / swipe to turn. */
  function initTurn(start) {
    $flip = window.jQuery(flip);
    $flip.turn({
      display: "single",
      width: Math.round(PW * scale),
      height: Math.round(PH * scale),
      page: start + 1,
      duration: FLIP_MS,
      acceleration: true,
      gradients: true,
      // only the right-hand corners peel; going back is handled by the spiral sheet
      corners: { all: ["tr", "br"], backward: ["tr", "br"] },
    });
    const sync = (page) => {
      cur = page - 1;
      if (zoomIdx > 0) stage.scrollTo({ top: 0, behavior: "smooth" });
      updateUI();
    };
    let forward = false;
    $flip.bind("turning", (_e, page) => {
      forward = page - 1 > cur;
      sync(page);
    });
    $flip.bind("turned", (_e, page) => {
      sync(page);
      if (forward) {
        forward = false;
        sheetBusy = true;
        sheetMove(-180, -360, SHEET_OUT_MS, null).then((anims) => {
          clearSheet(anims);
          sheetBusy = false;
        });
      }
    });
  }

  const isTurning = () => {
    try { return sheetBusy || (!!$flip && $flip.turn("animating")); } catch (_) { return sheetBusy; }
  };

  /* After turn.js lays the sheet flat beside the book, this sheet keeps rotating
     round the spiral and tucks in behind the notebook. It is built from nested
     vertical strips, each hinged on the previous one, so the paper bends as it
     travels instead of moving like a board. Going back, the same sheet comes out
     from behind, curls over the spiral and lands on the book; turn.js then switches
     to that page instantly. */
  const SHEET_OUT_MS = 480;
  const SHEET_IN_MS = 700;
  const STRIPS = 7;
  let sheetBusy = false;

  function buildStrips(content) {
    sheet.innerHTML = "";
    const W = book.offsetWidth;
    const sw = W / STRIPS;
    const sc = W / PW;
    const strips = [];
    let parent = sheet;
    for (let i = 0; i < STRIPS; i++) {
      const st = document.createElement("div");
      st.className = "strip";
      st.style.width = sw + 0.8 + "px";
      st.style.left = i === 0 ? "0px" : sw + "px";
      const front = document.createElement("div");
      front.className = "sf front";
      if (content) {
        const c = content.cloneNode(true);
        c.style.transform = `translateX(${-i * sw}px) scale(${sc})`;
        front.appendChild(c);
      }
      const back = document.createElement("div");
      back.className = "sf back";
      back.style.backgroundPosition = `${-(STRIPS - 1 - i) * sw}px 0`;
      front.insertAdjacentHTML("beforeend", '<div class="ss"></div>');
      back.insertAdjacentHTML("beforeend", '<div class="ss"></div>');
      st.append(front, back);
      parent.appendChild(st);
      strips.push(st);
      parent = st;
    }
    return strips;
  }

  /** Plays the sheet from angle `from` to `to` (degrees round the spine). */
  function sheetMove(from, to, ms, content) {
    const strips = buildStrips(content);
    const P = `perspective(${Math.round(book.offsetWidth * 2.4)}px) `;
    const tf = (ry, rx) => `${P}rotateY(${ry}deg) rotateX(${rx}deg)`;
    const out = to < from;
    const full = Math.abs(to - from) > 200;
    sheet.style.display = "block";
    const opts = { duration: ms, easing: out ? "cubic-bezier(.4,.05,.5,1)" : "cubic-bezier(.35,.08,.3,1)", fill: "forwards" };

    const frames = full
      ? [
          { transform: tf(from, 0), zIndex: 1 },
          { transform: tf(from + (to - from) * 0.25, 2), zIndex: 1, offset: 0.25 },
          { transform: tf(from + (to - from) * 0.5, 1), zIndex: 1, offset: 0.5 },
          { transform: tf(from + (to - from) * 0.5 + 1, 1), zIndex: 3, offset: 0.505 },
          { transform: tf(from + (to - from) * 0.75, 2), zIndex: 3, offset: 0.75 },
          { transform: tf(to, 0), zIndex: 3 },
        ]
      : [
          { transform: tf(from, 0), zIndex: 1 },
          { transform: tf((from + to) / 2, 2), zIndex: 1, offset: 0.5 },
          { transform: tf(to, 0), zIndex: 1 },
        ];
    const anims = [sheet.animate(frames, opts)];

    // the free edge lags behind the spine, so every hinge bends against the motion
    const B = out ? 9 : -9;
    const bendFrames = full
      ? [{ b: 0 }, { b: B, o: 0.25 }, { b: B * 0.35, o: 0.5 }, { b: B * 1.1, o: 0.75 }, { b: 0 }]
      : [{ b: 0 }, { b: B * 0.8, o: 0.3 }, { b: B, o: 0.55 }, { b: 0 }];
    strips.forEach((st, i) => {
      if (i === 0) return;
      const k = 0.7 + (i / STRIPS) * 0.6;
      anims.push(st.animate(
        bendFrames.map((f) => (f.o !== undefined
          ? { transform: `rotateY(${f.b * k}deg)`, offset: f.o }
          : { transform: `rotateY(${f.b * k}deg)` })),
        opts
      ));
      const shade = (v) => bendFrames.map((f) => (f.o !== undefined
        ? { opacity: Math.min(0.6, Math.abs(f.b) * v * k), offset: f.o }
        : { opacity: Math.min(0.6, Math.abs(f.b) * v * k) }));
      st.querySelectorAll(":scope > .sf > .ss").forEach((ss) => anims.push(ss.animate(shade(0.035), opts)));
    });

    return anims[0].finished.then(() => anims, () => anims);
  }

  function clearSheet(anims) {
    anims.forEach((a) => a.cancel());
    sheet.style.display = "none";
    sheet.innerHTML = "";
  }

  /** Switch turn.js to a page with no animation of its own. */
  function jumpTo(n) {
    const d = $flip.data();
    if (!d.pageObjs || !d.pageObjs[n + 1]) {
      // page not loaded by turn.js yet: start its turn and finish it at once
      $flip.turn("page", n + 1);
      $flip.turn("stop");
      return;
    }
    const done = d.done;
    d.done = false;
    $flip.turn("page", n + 1);
    d.done = done;
  }

  function go(n) {
    n = Math.max(0, Math.min(total - 1, n));
    if (n === cur || !$flip || sheetBusy) return;
    if (n < cur) {
      sheetBusy = true;
      sheetMove(-360, 0, SHEET_IN_MS, pages[n].el).then((anims) => {
        jumpTo(n);
        requestAnimationFrame(() => requestAnimationFrame(() => {
          clearSheet(anims);
          sheetBusy = false;
        }));
      });
      return;
    }
    $flip.turn("page", n + 1);
  }

  const next = () => go(cur + 1);
  const prev = () => go(cur - 1);

  /* ------------------------------------------------------------------ */
  /* Layout / scaling                                                    */
  /* ------------------------------------------------------------------ */

  const stage = $(".stage");
  let zoomIdx = 0;
  let scale = 1;

  function layout() {
    const narrow = window.innerWidth <= 760;
    const availW = window.innerWidth - (narrow ? 20 : 130);
    const availH = window.innerHeight - 44 - (narrow ? 84 : 44);
    const fit = Math.min(availW / (PW + BIND + 10), availH / (PH + 14));
    const s = fit * ZOOMS[zoomIdx];
    scale = s;
    const w = Math.round(PW * s);
    const h = Math.round(PH * s);
    book.style.width = w + "px";
    book.style.height = h + "px";
    book.style.setProperty("--s", String(w / PW));
    if ($flip) $flip.turn("size", w, h);
    wrap.style.width = (PW + BIND + 10) * s + "px";
    wrap.style.height = (PH + 14) * s + "px";
    wrap.style.paddingLeft = BIND * s + "px";
    stage.classList.toggle("zoomed", zoomIdx > 0);
    const lbl = $("#zoomLbl");
    if (lbl) lbl.textContent = ZOOMS[zoomIdx] + "×";
  }

  function cycleZoom() {
    zoomIdx = (zoomIdx + 1) % ZOOMS.length;
    layout();
    stage.scrollTo(0, 0);
  }

  /* ------------------------------------------------------------------ */
  /* UI                                                                  */
  /* ------------------------------------------------------------------ */

  const counter = $("#counter");
  const crumb = $("#crumb");
  const progress = $("#progress");
  const prevBtn = $("#prevBtn");
  const nextBtn = $("#nextBtn");

  function currentEntry() {
    let e = null;
    for (const t of toc) if (t.page <= cur) e = t;
    return e;
  }

  function updateUI() {
    const last = total - 1;
    counter.innerHTML = cur === 0
      ? `<b class="cover-lbl">Cover</b>`
      : `<b>${cur}</b><span class="sep">/</span><span class="of">${last}</span>`;
    const p = pages[cur];
    const e = currentEntry();
    crumb.textContent = cur === 0 ? "Cover" : e && p.tag ? `${e.tag} · ${e.title}` : p.title || "Book";
    progress.style.width = `${(cur / last) * 100}%`;
    prevBtn.disabled = cur === 0;
    nextBtn.disabled = cur === last;
    $$(".toc-item").forEach((b) => b.classList.toggle("active", e && b.dataset.tag === e.tag && cur !== 0));
    history.replaceState(null, "", `#p${cur}`);
    try { localStorage.setItem("pm-book-page", String(cur)); } catch (_) {}
  }

  function buildDrawer() {
    const list = $("#toc");
    let group = "";
    const frag = document.createDocumentFragment();
    const addItem = (n, t, p, tag) => {
      const b = document.createElement("button");
      b.className = "toc-item";
      b.dataset.tag = tag || "";
      b.dataset.search = `${n} ${t}`.toLowerCase();
      b.innerHTML = `<span class="n">${escapeHtml(n)}</span><span class="t">${escapeHtml(t)}</span><span class="p">p.${p}</span>`;
      b.addEventListener("click", () => { go(p); closeDrawer(); });
      frag.appendChild(b);
    };
    const g0 = document.createElement("div");
    g0.className = "toc-group";
    g0.textContent = "Start";
    frag.appendChild(g0);
    addItem("—", "Cover", 0);
    const tocPage = pages.findIndex((p) => p.title === "Contents");
    if (tocPage > 0) addItem("—", "Contents", tocPage);
    for (const t of toc) {
      if (t.group !== group) {
        group = t.group;
        const g = document.createElement("div");
        g.className = "toc-group";
        g.textContent = group;
        frag.appendChild(g);
      }
      addItem(t.tag, t.title, t.page, t.tag);
    }
    list.appendChild(frag);

    $("#search").addEventListener("input", (e) => {
      const q = e.target.value.trim().toLowerCase();
      $$(".toc-item", list).forEach((b) => (b.style.display = !q || b.dataset.search.includes(q) ? "" : "none"));
      $$(".toc-group", list).forEach((g) => (g.style.display = q ? "none" : ""));
    });
  }

  const drawer = $("#drawer");
  const scrim = $("#scrim");
  function openDrawer() {
    drawer.classList.add("show");
    scrim.classList.add("show");
    setTimeout(() => $("#search").focus(), 200);
  }
  function closeDrawer() {
    drawer.classList.remove("show");
    scrim.classList.remove("show");
  }

  function bindEvents() {
    prevBtn.addEventListener("click", prev);
    nextBtn.addEventListener("click", next);
    $("#firstBtn").addEventListener("click", () => go(0));
    $("#lastBtn").addEventListener("click", () => go(total - 1));
    $("#tocBtn").addEventListener("click", openDrawer);
    $("#tocBtn2").addEventListener("click", openDrawer);
    $("#closeDrawer").addEventListener("click", closeDrawer);
    scrim.addEventListener("click", closeDrawer);
    $("#printBtn").addEventListener("click", () => window.print());

    window.addEventListener("keydown", (e) => {
      if (e.target.tagName === "INPUT") {
        if (e.key === "Escape") closeDrawer();
        return;
      }
      if (["ArrowRight", "ArrowDown", "PageDown", " "].includes(e.key)) { e.preventDefault(); next(); }
      else if (["ArrowLeft", "ArrowUp", "PageUp"].includes(e.key)) { e.preventDefault(); prev(); }
      else if (e.key === "Home") go(0);
      else if (e.key === "End") go(total - 1);
      else if (e.key.toLowerCase() === "t" || e.key === "/") { e.preventDefault(); openDrawer(); }
      else if (e.key === "Escape") closeDrawer();
    });

    book.addEventListener("click", (e) => {
      const row = e.target.closest(".toc-page .row");
      if (row && row.dataset.target) { go(parseInt(row.dataset.target, 10)); return; }
      if (zoomIdx > 0 || isTurning()) return;
      const leaf = e.target.closest(".tpage");
      if (!leaf) return;
      const r = leaf.getBoundingClientRect();
      (e.clientX - r.left < r.width * 0.25) ? prev() : next();
    });

    let sx = 0, sy = 0;
    book.addEventListener("touchstart", (e) => { sx = e.touches[0].clientX; sy = e.touches[0].clientY; }, { passive: true });
    book.addEventListener("touchend", (e) => {
      if (zoomIdx > 0 || isTurning()) return;
      const dx = e.changedTouches[0].clientX - sx;
      const dy = e.changedTouches[0].clientY - sy;
      if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy)) dx < 0 ? next() : prev();
    });

    $("#zoomBtn").addEventListener("click", cycleZoom);

    let wheelLock = 0;
    window.addEventListener("wheel", (e) => {
      if (drawer.classList.contains("show") || zoomIdx > 0) return;
      const now = Date.now();
      if (now < wheelLock || Math.abs(e.deltaY) + Math.abs(e.deltaX) < 25) return;
      wheelLock = now + 450;
      (e.deltaY + e.deltaX > 0) ? next() : prev();
    }, { passive: true });

    window.addEventListener("resize", layout);
  }

  async function init() {
    try {
      await Promise.race([
        Promise.all([
          document.fonts.load('21px "Patrick Hand"'),
          document.fonts.load('700 30px "Caveat"'),
          document.fonts.load('500 30px "Caveat"'),
          document.fonts.load('13px "Geist Mono"'),
        ]),
        new Promise((r) => setTimeout(r, 4000)),
      ]);
      await document.fonts.ready;
    } catch (_) {}
    await new Promise((r) => setTimeout(r, 120));
    paginate();
    buildBook();
    buildDrawer();
    layout();
    bindEvents();

    const fromHash = parseInt((location.hash.match(/^#p(\d+)/) || [])[1], 10);
    let stored = NaN;
    try { stored = parseInt(localStorage.getItem("pm-book-page"), 10); } catch (_) {}
    const start = Number.isFinite(fromHash) ? fromHash : Number.isFinite(stored) ? stored : 0;
    cur = Math.max(0, Math.min(total - 1, Number.isFinite(start) ? start : 0));
    initTurn(cur);
    updateUI();
    $("#loader").classList.add("hide");
  }

  init();
})();

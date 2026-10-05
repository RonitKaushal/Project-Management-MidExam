(() => {
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];

  // natural [width, height] of assets/img/stickers/sNN.webp (same list as book.js)
  const STICKERS = [[235, 121], [227, 92], [189, 239], [260, 101], [204, 151], [211, 236], [178, 195], [150, 177], [218, 218], [197, 143], [134, 148], [260, 189], [97, 224], [216, 166], [260, 183], [242, 141], [216, 101], [151, 228], [210, 223], [160, 232], [175, 176], [239, 250], [260, 214], [157, 232], [260, 116], [184, 231], [230, 70], [205, 122], [224, 225], [202, 202], [260, 133], [224, 210], [253, 210], [152, 170], [260, 123], [260, 99]];
  const stickerSrc = (i) => `assets/img/stickers/s${String(i + 1).padStart(2, "0")}.webp`;
  const shuffled = () => STICKERS.map((_, i) => i).sort(() => Math.random() - 0.5);

  /* colour stickers on the mini covers, all different */
  const pool = shuffled();
  $$(".msk").forEach((img, k) => { img.src = stickerSrc(pool[k % pool.length]); });

  /* "continue from page N" using the page each book saved last time */
  $$(".book-card").forEach((card) => {
    const out = card.querySelector(".resume");
    let page = NaN;
    try { page = parseInt(localStorage.getItem(card.dataset.store), 10); } catch (_) {}
    out.innerHTML = page > 0 ? `Continue from <b>page ${page}</b>` : "Start from the cover";
  });

  /* black & white stickers on the background, away from the text and cards */
  const layer = document.getElementById("stickers");
  const overlaps = (a, b) => a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;

  function scatter() {
    const sr = layer.getBoundingClientRect();
    const W = sr.width;
    const H = sr.height;
    const rel = (el, pad) => {
      const r = el.getBoundingClientRect();
      return { x: r.left - sr.left - pad, y: r.top - sr.top - pad, w: r.width + pad * 2, h: r.height + pad * 2 };
    };
    const avoid = [rel(document.querySelector(".hero"), 20), ...$$(".book-card").map((c) => rel(c, 20))];
    const base = Math.max(100, Math.min(180, Math.min(W, H) * 0.2));
    const want = 10 + Math.floor(Math.random() * 6);
    const placed = [];
    const frag = document.createDocumentFragment();
    for (const i of shuffled()) {
      if (placed.length >= want) break;
      const [sw, sh] = STICKERS[i];
      const k = (base * (0.8 + Math.random() * 0.45)) / Math.max(sw, sh);
      const w = sw * k;
      const h = sh * k;
      if (w > W || h > H) continue;
      for (let t = 0; t < 50; t++) {
        const x = Math.random() * (W - w);
        const y = Math.random() * (H - h);
        const r = { x: x - 8, y: y - 8, w: w + 16, h: h + 16 };
        if (avoid.some((a) => overlaps(a, r)) || placed.some((p) => overlaps(p, r))) continue;
        placed.push(r);
        const img = document.createElement("img");
        img.src = stickerSrc(i);
        img.alt = "";
        img.decoding = "async";
        img.draggable = false;
        img.style.cssText =
          `left:${x.toFixed(1)}px;top:${y.toFixed(1)}px;width:${w.toFixed(1)}px;height:${h.toFixed(1)}px;` +
          `transform:rotate(${(Math.random() * 36 - 18).toFixed(1)}deg)`;
        frag.appendChild(img);
        break;
      }
    }
    layer.replaceChildren(frag);
  }

  let timer = 0;
  const later = () => { clearTimeout(timer); timer = setTimeout(scatter, 250); };
  window.addEventListener("resize", later);
  (document.fonts ? document.fonts.ready : Promise.resolve()).then(scatter);
})();

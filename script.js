(() => {
  "use strict";
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const EMAIL = "ahoj@matyaskriz.cz"; // sem dej svůj skutečný e-mail
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const store = {
    get(k) { try { return localStorage.getItem(k); } catch { return null; } },
    set(k, v) { try { localStorage.setItem(k, v); } catch { /* ignore */ } },
  };

  /* Toast */
  const toastEl = $("#toast");
  let toastT;
  function toast(msg) {
    toastEl.textContent = msg;
    toastEl.classList.add("show");
    clearTimeout(toastT);
    toastT = setTimeout(() => toastEl.classList.remove("show"), 2200);
  }

  /* Téma a barva značky */
  const root = document.documentElement;
  const themeBtn = $("#themeBtn");
  function setTheme(t) {
    root.dataset.theme = t;
    themeBtn.setAttribute("aria-pressed", String(t === "dark"));
    store.set("theme", t);
  }
  setTheme(store.get("theme") || (matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"));
  const toggleTheme = () => setTheme(root.dataset.theme === "dark" ? "light" : "dark");
  themeBtn.addEventListener("click", toggleTheme);

  const colors = [
    { n: "Modrá", c: "#3b4bff", on: "#fff" },
    { n: "Zelená", c: "#12a566", on: "#fff" },
    { n: "Růžová", c: "#e9267f", on: "#fff" },
    { n: "Oranžová", c: "#ff7a1a", on: "#1a1000" },
    { n: "Fialová", c: "#8a4bff", on: "#fff" },
    { n: "Žlutá", c: "#ffc83d", on: "#1a1400" },
  ];
  const sw = $("#swatches");
  function setAccent(i) {
    const { c, on } = colors[i];
    root.style.setProperty("--accent", c);
    root.style.setProperty("--on-accent", on);
    $$(".swatch", sw).forEach((b, j) => b.setAttribute("aria-checked", String(i === j)));
    $('meta[name="theme-color"]').content = c;
    store.set("accent", i);
  }
  colors.forEach((col, i) => {
    const b = document.createElement("button");
    b.type = "button"; b.className = "swatch"; b.setAttribute("role", "radio");
    b.setAttribute("aria-label", col.n); b.style.background = col.c;
    b.addEventListener("click", () => setAccent(i));
    sw.append(b);
  });
  setAccent(Number(store.get("accent")) || 0);

  /* Hodiny v Praze */
  const clock = $("#clock");
  const tick = () => { clock.textContent = new Date().toLocaleTimeString("cs-CZ", { hour: "2-digit", minute: "2-digit", timeZone: "Europe/Prague" }); };
  tick(); setInterval(tick, 15000);
  $("#year").textContent = new Date().getFullYear();

  /* Jméno reaguje na myš */
  const nameEl = $("#name");
  const chars = [...nameEl.textContent];
  nameEl.textContent = "";
  const spans = chars.map((ch) => { const s = document.createElement("span"); s.className = "ch"; s.textContent = ch; s.setAttribute("aria-hidden", "true"); nameEl.append(s); return s; });
  const REST = { w: 780, d: 78 }, NEAR = { w: 300, d: 100 };
  const apply = (s, t) => { s.style.fontVariationSettings = `"wght" ${Math.round(REST.w + (NEAR.w - REST.w) * t)}, "wdth" ${Math.round(REST.d + (NEAR.d - REST.d) * t)}`; };
  let px = null, py = null, raf = 0, intro = !reduced, t0 = performance.now();
  function frame(now) {
    raf = 0;
    if (intro) {
      const el = (now - t0) / 1400;
      if (el >= 1.6) intro = false;
      spans.forEach((s, i) => { const p = el - i * 0.07; apply(s, p > 0 && p < 1 ? Math.sin(p * Math.PI) : 0); });
      raf = requestAnimationFrame(frame);
      return;
    }
    spans.forEach((s) => {
      if (px === null) return apply(s, 0);
      const r = s.getBoundingClientRect();
      const d = Math.hypot(px - (r.left + r.width / 2), py - (r.top + r.height / 2));
      apply(s, Math.max(0, 1 - d / Math.max(220, r.width * 2.6)) ** 1.5);
    });
  }
  const kick = () => { if (!raf) raf = requestAnimationFrame(frame); };
  nameEl.addEventListener("pointermove", (e) => { px = e.clientX; py = e.clientY; kick(); });
  nameEl.addEventListener("pointerleave", () => { px = null; kick(); });
  nameEl.addEventListener("pointerdown", (e) => { px = e.clientX; py = e.clientY; kick(); });
  spans.forEach((s) => apply(s, 0));
  if (intro) kick();

  /* Ukazatel posunu stránky */
  const prog = $("#progress");
  const onScroll = () => {
    const h = document.documentElement.scrollHeight - innerHeight;
    prog.style.transform = `scaleX(${h > 0 ? scrollY / h : 0})`;
  };
  addEventListener("scroll", onScroll, { passive: true }); onScroll();

  /* Záložky */
  const tabs = $$('[role="tab"]');
  function selectTab(tab, focus) {
    tabs.forEach((t) => {
      const on = t === tab;
      t.setAttribute("aria-selected", String(on));
      t.tabIndex = on ? 0 : -1;
      $("#" + t.getAttribute("aria-controls")).hidden = !on;
    });
    if (focus) tab.focus();
    store.set("tab", tab.id);
  }
  tabs.forEach((t, i) => {
    t.addEventListener("click", () => selectTab(t));
    t.addEventListener("keydown", (e) => {
      const k = { ArrowRight: 1, ArrowLeft: -1 }[e.key];
      if (k) { e.preventDefault(); selectTab(tabs[(i + k + tabs.length) % tabs.length], true); }
      if (e.key === "Home") { e.preventDefault(); selectTab(tabs[0], true); }
      if (e.key === "End") { e.preventDefault(); selectTab(tabs.at(-1), true); }
    });
  });

  /* Ukázka: responzivní web */
  const frameEl = $("#frame"), range = $("#widthRange"), fw = $("#frameWidth"), stage = frameEl.parentElement;
  function setWidth(px) {
    frameEl.style.setProperty("--fw", px + "px");
    fw.textContent = Math.round(px) + " px";
    range.value = px;
  }
  const maxW = () => Math.min(720, stage.clientWidth - 2 * 14);
  $$("#devices button").forEach((b) => b.addEventListener("click", () => {
    $$("#devices button").forEach((x) => x.setAttribute("aria-pressed", String(x === b)));
    const w = Number(b.dataset.w);
    setWidth(w === 100 ? maxW() : Math.min(w, maxW()));
  }));
  range.addEventListener("input", () => {
    $$("#devices button").forEach((x) => x.setAttribute("aria-pressed", "false"));
    setWidth(Math.min(Number(range.value), maxW()));
  });
  new ResizeObserver(() => { if (!$("#p-web").hidden && $('#devices [aria-pressed="true"]')?.dataset.w === "100") setWidth(maxW()); }).observe(stage);
  setWidth(maxW());

  /* Ukázka: zdraví webu */
  const careRing = $("#careRing"), careScore = $("#careScore"), careVerdict = $("#careVerdict");
  function animateNum(el, to, ms = 700) {
    const from = Number(el.textContent) || 0;
    if (reduced) { el.textContent = to; return; }
    const s = performance.now();
    (function step(n) {
      const p = Math.min(1, (n - s) / ms);
      el.textContent = Math.round(from + (to - from) * (1 - (1 - p) ** 3));
      if (p < 1) requestAnimationFrame(step);
    })(s);
  }
  $$("#careChecks input").forEach((i) => i.addEventListener("change", () => {
    const v = $$("#careChecks input:checked").reduce((a, c) => a + Number(c.dataset.w), 0);
    careRing.style.setProperty("--v", v);
    careRing.dataset.good = v >= 80 ? "1" : "";
    animateNum(careScore, v);
    careVerdict.textContent = v === 0 ? "Zatím nic nezaškrtnuto." : v < 60 ? "Web je ohrožený. Tady začneme." : v < 100 ? "Dobrý základ, pár věcí chybí." : "Všechno pod kontrolou.";
  }));

  /* Ukázka: Google profil */
  const gName = $("#gName"), gCat = $("#gCat");
  const stars = $("#stars");
  let rating = 4;
  for (let i = 1; i <= 5; i++) {
    const b = document.createElement("button");
    b.type = "button"; b.textContent = "★"; b.setAttribute("role", "radio"); b.setAttribute("aria-label", i + " z 5 hvězd");
    b.addEventListener("click", () => { rating = i; drawStars(); });
    stars.append(b);
  }
  function drawStars() { $$("button", stars).forEach((b, i) => { b.classList.toggle("on", i < rating); b.setAttribute("aria-checked", String(i === rating - 1)); }); }
  drawStars();
  function drawGoogle() {
    $("#gTitle").textContent = gName.value.trim() || "Název firmy";
    $("#gCatOut").textContent = gCat.value.trim() || "Obor";
    const on = (k) => $(`#gChecks [data-k="${k}"]`).checked;
    $("#gOpen").textContent = on("hours") ? "Otevřeno do 18:00" : "Otevírací doba chybí";
    $("#gPhoto").classList.toggle("has", on("photos"));
    $("#gPhotoTxt").textContent = on("photos") ? "Fotky provozovny" : "Přidej fotky";
    $("#gDescOut").textContent = on("desc") ? "Pražírna a kavárna s denní nabídkou snídaní a domácích dezertů." : "";
    const done = 1 + ["hours", "photos", "desc", "posts"].filter(on).length; // název je vždy
    const pct = Math.round(done / 5 * 100);
    $("#gBar").style.width = pct + "%";
    $("#gPct").textContent = pct + " %";
  }
  [gName, gCat, ...$$("#gChecks input")].forEach((el) => el.addEventListener("input", drawGoogle));
  drawGoogle();

  /* Ukázka: sociální sítě */
  const limits = { ig: [2200, "Instagram"], fb: [63206, "Facebook"], in: [3000, "LinkedIn"] };
  const hints = { ig: "krátce a s fotkou, hashtagy na konec", fb: "dá se psát delší a odkazovat", in: "věcně a odborně, bez fotky" };
  let net = "ig";
  const postText = $("#postText"), post = $("#post");
  function drawPost() {
    $("#postOut").textContent = postText.value || "Napiš text příspěvku.";
    post.dataset.net = net;
    $("#netName").textContent = limits[net][1];
    const n = postText.value.length;
    const c = $("#count");
    c.textContent = `${n} znaků. Na ${limits[net][1]} se hodí ${hints[net]}.`;
    c.classList.toggle("warn", n > 300);
  }
  $$("#nets button").forEach((b) => b.addEventListener("click", () => {
    net = b.dataset.net;
    $$("#nets button").forEach((x) => x.setAttribute("aria-pressed", String(x === b)));
    drawPost();
  }));
  postText.addEventListener("input", drawPost);
  drawPost();

  /* Postup */
  $$("#steps button").forEach((b) => b.addEventListener("click", () => {
    const open = b.getAttribute("aria-expanded") === "true";
    b.setAttribute("aria-expanded", String(!open));
    b.nextElementSibling.hidden = open;
  }));

  /* Kruhy kvality: načtou se, až je vidět */
  const gauges = $$("#gauges .ring"), gNote = $("#gaugeNote");
  const targets = [97, 100, 100, 100];
  function runGauges() {
    gauges.forEach((g, i) => {
      g.style.setProperty("--v", 0); $("b", g).textContent = 0; g.dataset.good = "";
      setTimeout(() => { g.style.setProperty("--v", targets[i]); g.dataset.good = "1"; animateNum($("b", g), targets[i], 900); }, 120 + i * 140);
    });
  }
  new IntersectionObserver((es, o) => { if (es[0].isIntersecting) { runGauges(); o.disconnect(); } }, { threshold: 0.4 }).observe($("#gauges"));
  gauges.forEach((g) => g.addEventListener("click", () => {
    gauges.forEach((x) => x.classList.toggle("active", x === g));
    gNote.textContent = g.dataset.t;
  }));

  /* Formulář */
  const needs = $$("#needs input"), fName = $("#fName"), fWhen = $("#fWhen"), fPages = $("#fPages"), fNote = $("#fNote"), pv = $("#preview"), err = $("#formError");
  function message() {
    const picked = needs.filter((n) => n.checked).map((n) => n.value);
    const list = picked.length ? picked.join(", ").replace(/, ([^,]*)$/, " a $1") : "…(vyber, s čím potřebuješ pomoct)";
    const withPages = needs[0].checked ? ` Web by měl mít zhruba ${fPages.value} ${fPages.value == 1 ? "stránku" : fPages.value < 5 ? "stránky" : "stránek"}.` : "";
    return `Dobrý den,\n\npotřebuju ${list}. Termín: ${fWhen.value}.${withPages}${fNote.value.trim() ? "\n\n" + fNote.value.trim() : ""}\n\n${fName.value.trim() || "(tvoje jméno)"}`;
  }
  const draw = () => { $("#pagesOut").textContent = fPages.value; pv.textContent = message(); };
  [...needs, fName, fWhen, fPages, fNote].forEach((e) => e.addEventListener("input", draw));
  draw();
  const valid = () => {
    const ok = needs.some((n) => n.checked) && fName.value.trim();
    err.hidden = !!ok;
    err.textContent = ok ? "" : "Vyber aspoň jednu službu a napiš své jméno.";
    return !!ok;
  };
  $("#form").addEventListener("submit", (e) => {
    e.preventDefault();
    if (!valid()) return;
    location.href = `mailto:${EMAIL}?subject=${encodeURIComponent("Poptávka z webu")}&body=${encodeURIComponent(message())}`;
  });
  async function copy(text, ok) {
    try { await navigator.clipboard.writeText(text); toast(ok); } catch { toast("Kopírování se nepovedlo. Označ text ručně."); }
  }
  $("#copyBtn").addEventListener("click", () => { if (valid()) copy(message(), "Zpráva zkopírována"); });
  $("[data-copy-mail]").addEventListener("click", (e) => { e.preventDefault(); copy(EMAIL, "E-mail zkopírován"); });
  $("[data-copy-mail]").textContent = EMAIL;

  /* Paleta příkazů */
  const dlg = $("#palette"), palInput = $("#palInput"), palList = $("#palList");
  const go = (id) => () => { $(id).scrollIntoView({ behavior: reduced ? "auto" : "smooth" }); };
  const tab = (id) => () => { selectTab($(id)); go("#sluzby")(); };
  const cmds = [
    ["Přejít na úvod", go("#uvod")],
    ["Přejít na služby", go("#sluzby")],
    ["Služby: tvorba webů", tab("#t-web")],
    ["Služby: správa webů", tab("#t-care")],
    ["Služby: Google profil", tab("#t-google")],
    ["Služby: sociální sítě", tab("#t-social")],
    ["Přejít na postup", go("#postup")],
    ["Přejít na kvalitu", go("#mereni")],
    ["Přejít na poptávku", go("#poptavka")],
    ["Přepnout tmavý a světlý režim", toggleTheme],
    ["Zkopírovat můj e-mail", () => copy(EMAIL, "E-mail zkopírován")],
    ...colors.map((c, i) => ["Barva značky: " + c.n.toLowerCase(), () => setAccent(i)]),
  ];
  let shown = [], sel = 0;
  const norm = (s) => s.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase();
  function drawPal() {
    const q = norm(palInput.value);
    shown = cmds.filter(([n]) => norm(n).includes(q));
    sel = Math.min(sel, Math.max(0, shown.length - 1));
    palList.innerHTML = "";
    if (!shown.length) { palList.innerHTML = '<li aria-selected="false">Nic nenalezeno. Zkus „služby“ nebo „barva“.</li>'; return; }
    shown.forEach(([n], i) => {
      const li = document.createElement("li");
      li.role = "option"; li.textContent = n; li.setAttribute("aria-selected", String(i === sel));
      li.addEventListener("click", () => run(i));
      palList.append(li);
    });
    palList.children[sel]?.scrollIntoView({ block: "nearest" });
  }
  function run(i) { const c = shown[i]; if (!c) return; dlg.close(); c[1](); }
  function openPal() { palInput.value = ""; sel = 0; drawPal(); dlg.showModal(); palInput.focus(); }
  $("#openPalette").addEventListener("click", openPal);
  addEventListener("keydown", (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") { e.preventDefault(); dlg.open ? dlg.close() : openPal(); }
  });
  palInput.addEventListener("input", () => { sel = 0; drawPal(); });
  palInput.addEventListener("keydown", (e) => {
    if (e.key === "ArrowDown") { e.preventDefault(); sel = (sel + 1) % shown.length; drawPal(); }
    if (e.key === "ArrowUp") { e.preventDefault(); sel = (sel - 1 + shown.length) % shown.length; drawPal(); }
    if (e.key === "Enter") { e.preventDefault(); run(sel); }
  });
  dlg.addEventListener("click", (e) => { if (e.target === dlg) dlg.close(); });

  /* Skrytý bonus: Konami kód */
  const code = ["ArrowUp", "ArrowUp", "ArrowDown", "ArrowDown", "ArrowLeft", "ArrowRight", "ArrowLeft", "ArrowRight", "b", "a"];
  let pos = 0;
  addEventListener("keydown", (e) => {
    pos = e.key === code[pos] ? pos + 1 : e.key === code[0] ? 1 : 0;
    if (pos === code.length) { pos = 0; setAccent(Math.floor(Math.random() * colors.length)); toast("Našel jsi skrytou funkci. Barva je náhodná."); }
  });
})();

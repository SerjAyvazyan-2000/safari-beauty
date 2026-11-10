/* ==========================================================================
   Логика лендинга. Контент — в config.js, здесь трогать ничего не нужно.
   ========================================================================== */
(() => {
  const S = window.SITE;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const esc = (t) => String(t).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const money = (n) => n.toLocaleString("ru-RU") + " " + S.currency;
  const dur = (m) => (m >= 60 ? Math.floor(m / 60) + " ч" + (m % 60 ? " " + (m % 60) + " мин" : "") : m + " мин");
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const fine = matchMedia("(hover: hover) and (pointer: fine)").matches;
  const store = {
    get(k) { try { return localStorage.getItem(k); } catch { return null; } },
    set(k, v) { try { localStorage.setItem(k, v); } catch {} },
  };

  /* ---------- Тема ---------- */
  Object.entries(S.theme || {}).forEach(([k, v]) => v && document.documentElement.style.setProperty("--" + k, v));

  /* ---------- Бренд и тексты ---------- */
  document.title = `${S.brand.name} — ${S.brand.tagline}, ${S.brand.city}`;
  $$("[data-brand]").forEach((el) => (el.textContent = S.brand.name));
  $$("[data-tagline]").forEach((el) => (el.textContent = S.brand.tagline));
  $("[data-brand-big]").textContent = S.brand.name;
  $(".loader__word").innerHTML = [...S.brand.name].map((ch, i) => `<span style="animation-delay:${i * 0.05}s">${ch === " " ? "&nbsp;" : esc(ch)}</span>`).join("");
  $$("[data-phone]").forEach((el) => { el.textContent = S.contacts.phone; el.href = "tel:" + S.contacts.phoneRaw; });

  /* ---------- Онлайн-запись ---------- */
  if (S.booking && S.booking.url) $$("[data-book-link]").forEach((a) => { a.href = S.booking.url; a.target = "_blank"; a.rel = "noopener"; });

  const H = S.hero;
  $("[data-hero-eyebrow]").textContent = H.eyebrow;
  $("[data-hero-title]").innerHTML = H.title.map((l, i) => `<span class="line"><span class="${i === H.accentWord ? "is-accent" : ""}">${esc(l)}</span></span>`).join("");
  $("[data-hero-text]").textContent = H.text;
  $("[data-hero-cta]").textContent = H.cta;
  $$(".hero__img").forEach((f, i) => (f.style.backgroundImage = `url("${H.images[i % H.images.length]}")`));
  $("[data-badge]").textContent = H.badge;

  /* ---------- Бегущая строка ---------- */
  const mq = S.marquee.map((t) => `<span>${esc(t)}</span>`).join("");
  $("[data-marquee]").innerHTML = mq + mq;

  /* ---------- Цифры ---------- */
  $("[data-stats]").innerHTML = S.stats.map((s) => `
    <div class="stat"><div class="stat__num"><span data-count="${s.value}" data-dec="${s.decimals || 0}">0</span><small>${esc(s.suffix)}</small></div>
    <div class="stat__label">${esc(s.label)}</div></div>`).join("");

  const countUp = (el) => {
    const end = +el.dataset.count, dec = +el.dataset.dec, t0 = performance.now(), d = 1600;
    const step = (t) => {
      const p = Math.min(1, (t - t0) / d), e = 1 - Math.pow(1 - p, 4);
      el.textContent = (end * e).toLocaleString("ru-RU", { minimumFractionDigits: dec, maximumFractionDigits: dec });
      if (p < 1) requestAnimationFrame(step);
    };
    reduced ? (el.textContent = end.toLocaleString("ru-RU", { minimumFractionDigits: dec })) : requestAnimationFrame(step);
  };

  /* ---------- Услуги ---------- */
  const tabs = $("[data-tabs]"), list = $("[data-price-list]"), cimg = $(".cursor-img");
  tabs.innerHTML = S.services.map((g, i) => `<button class="tab" role="tab" aria-selected="${i === 0}" data-i="${i}">${esc(g.cat)}</button>`).join("");
  const costText = (it) => it.price == null ? (S.priceOnRequest || "по запросу")
    : it.rangeTo ? it.price.toLocaleString("ru-RU") + " – " + money(it.rangeTo) : "от " + money(it.price);
  const renderPrices = (i) => {
    list.innerHTML = S.services[i].items.map((it, n) => `
      <li class="price" data-img="${esc(it.img || "")}" style="animation-delay:${n * 0.06}s">
        <span class="price__idx">${String(n + 1).padStart(2, "0")}</span>
        <span class="price__name">${esc(it.name)}<span class="price__desc">${esc(it.desc)}</span></span>
        <span class="price__time">${it.min ? dur(it.min) : ""}</span>
        <span class="price__cost${it.price == null ? " price__cost--ask" : ""}">${costText(it)}</span>
      </li>`).join("");
  };
  renderPrices(0);
  tabs.addEventListener("click", (e) => {
    const b = e.target.closest(".tab"); if (!b) return;
    $$(".tab", tabs).forEach((t) => t.setAttribute("aria-selected", t === b));
    renderPrices(+b.dataset.i);
  });
  if (fine) {
    let x = 0, y = 0, cx = 0, cy = 0;
    list.addEventListener("mouseover", (e) => {
      const li = e.target.closest(".price");
      if (li && li.dataset.img) { cimg.style.backgroundImage = `url("${li.dataset.img}")`; cimg.classList.add("is-on"); }
    });
    list.addEventListener("mouseleave", () => cimg.classList.remove("is-on"));
    addEventListener("mousemove", (e) => { x = e.clientX; y = e.clientY; });
    const loop = () => { cx += (x - cx) * 0.15; cy += (y - cy) * 0.15; cimg.style.left = cx + 80 + "px"; cimg.style.top = cy + "px"; requestAnimationFrame(loop); };
    loop();
  }

  /* ---------- Конструктор визита ---------- */
  const all = S.services.flatMap((g) => g.items);
  $("[data-chips]").innerHTML = all.map((it, i) => `<label class="chip"><input type="checkbox" value="${i}"><span>${esc(it.name)}</span></label>`).join("");
  const sumP = $("[data-sum-price]");
  const updateSum = () => {
    const sel = $$("[data-chips] input:checked").map((c) => all[+c.value]);
    $("[data-sum-count]").textContent = sel.length;
    const timed = sel.length && sel.every((s) => s.min);
    $("[data-sum-time]").textContent = !sel.length ? "—" : timed ? "≈ " + dur(sel.reduce((a, b) => a + b.min, 0)) : "уточнит мастер";
    const priced = sel.filter((s) => s.price != null), ask = sel.length - priced.length;
    const lo = priced.reduce((a, b) => a + b.price, 0), hi = priced.reduce((a, b) => a + (b.rangeTo || b.price), 0);
    sumP.textContent = !priced.length ? (ask ? (S.priceOnRequest || "по запросу") : money(0))
      : (hi > lo ? lo.toLocaleString("ru-RU") + " – " + money(hi) : money(lo)) + (ask ? " +" : "");
    const note = $("[data-sum-note]"); if (note) note.hidden = !ask;
    sumP.classList.remove("bump"); void sumP.offsetWidth; sumP.classList.add("bump");
    return sel;
  };
  sumP.textContent = money(0);
  $("[data-chips]").addEventListener("change", updateSum);
  $("[data-sum-book]").addEventListener("click", () => {
    const sel = updateSum();
    if (sel.length) $("[data-comment]").value = "Хочу: " + sel.map((s) => s.name).join(", ");
  });

  /* ---------- До / После ---------- */
  const ba = S.beforeAfter, frame = $("[data-ba]");
  if (!ba) $("[data-ba-section]").hidden = true; else {
  if (ba.split === "vertical") frame.classList.add("ba__frame--split");
  $("[data-ba-title]").textContent = ba.title;
  $("[data-ba-text]").textContent = ba.text;
  $("[data-ba-before]").src = ba.before;
  $("[data-ba-after]").src = ba.after;
  $(".ba__range", frame).addEventListener("input", (e) => frame.style.setProperty("--pos", e.target.value + "%"));
  }

  /* ---------- Мастера ---------- */
  if (!S.team && !(S.masters && S.masters.length)) {
    $(".masters").hidden = true;
    $$('a[href="#masters"]').forEach((a) => (a.hidden = true));
  }
  if (S.team) {
    const team = $("[data-team]");
    team.hidden = false;
    $("[data-masters]").hidden = true;
    $(".masters .slider-nav").hidden = true;
    team.innerHTML = `
      <figure class="team__photo reveal"><img src="${esc(S.team.photo)}" alt="Команда студии ${esc(S.brand.name)}" loading="lazy"></figure>
      <div class="team__groups">${S.team.groups.map((g) => `
        <div class="team__group reveal"><p class="team__title">${esc(g.title)}</p>
          <ul>${g.people.map(([n, r]) => `<li><b>${esc(n)}</b><span>${esc(r)}</span></li>`).join("")}</ul></div>`).join("")}
      </div>`;
  }
  const track = $("[data-masters]");
  track.innerHTML = S.masters.map((m) => `
    <article class="master">
      <div class="master__img"><img src="${esc(m.img)}" alt="${esc(m.name)}"><span class="master__exp">Опыт ${esc(m.exp)}</span></div>
      <h3 class="master__name">${esc(m.name)}</h3><p class="master__role">${esc(m.role)}</p>
    </article>`).join("");
  const stepW = () => (track.firstElementChild?.offsetWidth || 300) + 20;
  $("[data-m-next]").onclick = () => track.scrollBy({ left: stepW(), behavior: "smooth" });
  $("[data-m-prev]").onclick = () => track.scrollBy({ left: -stepW(), behavior: "smooth" });
  if (fine) {
    let down = false, sx = 0, sl = 0;
    track.addEventListener("pointerdown", (e) => { down = true; sx = e.clientX; sl = track.scrollLeft; track.classList.add("is-drag"); });
    addEventListener("pointerup", () => { down = false; track.classList.remove("is-drag"); });
    track.addEventListener("pointermove", (e) => { if (down) track.scrollLeft = sl - (e.clientX - sx); });
    $$(".master__img", track).forEach((card) => {
      card.addEventListener("mousemove", (e) => {
        const r = card.getBoundingClientRect(), px = (e.clientX - r.left) / r.width - 0.5, py = (e.clientY - r.top) / r.height - 0.5;
        card.style.transform = `perspective(800px) rotateY(${px * 8}deg) rotateX(${-py * 8}deg)`;
      });
      card.addEventListener("mouseleave", () => (card.style.transform = ""));
    });
  }

  /* ---------- Галерея + лайтбокс ---------- */
  const lb = $(".lightbox");
  const gal = S.gallery.map((g) => (typeof g === "string" ? { src: g, cat: "" } : g));
  $("[data-gallery]").innerHTML = gal.map((g, i) => `<button class="reveal" data-cat="${esc(g.cat)}" aria-label="Открыть фото ${i + 1}"><img src="${esc(g.src)}" alt="Работа студии: ${esc(g.cat.toLowerCase() || "фото")} ${i + 1}" loading="lazy"></button>`).join("");
  const gcats = [...new Set(gal.map((g) => g.cat).filter(Boolean))];
  const gtabs = $("[data-gallery-tabs]");
  if (gcats.length > 1) {
    gtabs.innerHTML = ["Все", ...gcats].map((c, i) => `<button class="tab" role="tab" aria-selected="${i === 0}" data-cat="${esc(i ? c : "")}">${esc(c)}</button>`).join("");
    gtabs.addEventListener("click", (e) => {
      const b = e.target.closest(".tab"); if (!b) return;
      $$(".tab", gtabs).forEach((t) => t.setAttribute("aria-selected", t === b));
      $$("[data-gallery] button").forEach((el) => (el.hidden = !!b.dataset.cat && el.dataset.cat !== b.dataset.cat));
    });
  } else gtabs.hidden = true;
  $("[data-gallery]").addEventListener("click", (e) => {
    const b = e.target.closest("button"); if (!b) return;
    $("img", lb).src = $("img", b).src; lb.hidden = false;
  });
  const closeLb = () => (lb.hidden = true);
  lb.addEventListener("click", (e) => { if (e.target !== $("img", lb)) closeLb(); });

  /* ---------- Отзывы (стопка карточек) ---------- */
  const stack = $("[data-reviews]");
  if (!S.reviews || !S.reviews.length) $("[data-reviews-section]").hidden = true;
  stack.innerHTML = S.reviews.map((r) => `
    <article class="review">
      <p class="review__text">«${esc(r.text)}»</p>
      <div class="review__who"><div><div class="review__name">${esc(r.name)}</div><div class="review__svc">${esc(r.service)}</div></div>
      <div class="review__stars" aria-label="Оценка ${r.rating} из 5">${"★".repeat(r.rating)}</div></div>
    </article>`).join("");
  const cards = $$(".review", stack);
  let cur = 0, auto;
  const layout = () => cards.forEach((c, i) => {
    const d = (i - cur + cards.length) % cards.length;
    c.style.zIndex = cards.length - d;
    c.style.opacity = d > 2 ? 0 : 1;
    c.style.transform = `translateY(${-d * 18}px) scale(${1 - d * 0.05}) rotate(${d === 0 ? 0 : (d % 2 ? 2 : -2)}deg)`;
  });
  const go = (n) => { cur = (cur + n + cards.length) % cards.length; layout(); };
  const restart = () => { clearInterval(auto); if (!reduced) auto = setInterval(() => go(1), 6000); };
  $("[data-r-next]").onclick = () => { go(1); restart(); };
  $("[data-r-prev]").onclick = () => { go(-1); restart(); };
  let tsx = 0;
  stack.addEventListener("touchstart", (e) => (tsx = e.touches[0].clientX), { passive: true });
  stack.addEventListener("touchend", (e) => { const dx = e.changedTouches[0].clientX - tsx; if (Math.abs(dx) > 40) { go(dx < 0 ? 1 : -1); restart(); } });
  if (cards.length) { layout(); restart(); }

  /* ---------- FAQ ---------- */
  $("[data-faq]").innerHTML = S.faq.map(([q, a], i) => `
    <div class="acc${i === 0 ? " is-open" : ""}">
      <button class="acc__q" aria-expanded="${i === 0}">${esc(q)}<span class="acc__icon"></span></button>
      <div class="acc__a"><div><p>${esc(a)}</p></div></div>
    </div>`).join("");
  $("[data-faq]").addEventListener("click", (e) => {
    const q = e.target.closest(".acc__q"); if (!q) return;
    const acc = q.parentElement, open = !acc.classList.contains("is-open");
    $$(".acc", acc.parentElement).forEach((a) => { a.classList.remove("is-open"); $(".acc__q", a).setAttribute("aria-expanded", false); });
    if (open) { acc.classList.add("is-open"); q.setAttribute("aria-expanded", true); }
  });

  /* ---------- Форма ---------- */
  const C = S.contacts;
  $("[data-service-select]").innerHTML += all.map((it) => `<option>${esc(it.name)}</option>`).join("");
  $("[data-socials]").innerHTML = [
    S.booking && S.booking.url && !/wa\.me/.test(S.booking.url) && `<a href="${esc(S.booking.url)}" target="_blank" rel="noopener">${esc(S.booking.label || "Онлайн-запись")}</a>`,
    C.whatsapp && `<a href="https://wa.me/${C.whatsapp}" target="_blank" rel="noopener">WhatsApp</a>`,
    C.telegram && `<a href="https://t.me/${C.telegram}" target="_blank" rel="noopener">Telegram</a>`,
    C.max && `<a href="${esc(C.max)}" target="_blank" rel="noopener">MAX</a>`,
    C.telegramChannel && `<a href="https://t.me/${C.telegramChannel}" target="_blank" rel="noopener">Канал косметолога</a>`,
    C.vk && `<a href="https://vk.com/${C.vk}" target="_blank" rel="noopener">ВКонтакте</a>`,
    C.instagram && `<a href="https://instagram.com/${C.instagram}" target="_blank" rel="noopener">Instagram</a>`,
  ].filter(Boolean).join("");

  const form = $("[data-form]"), phone = form.phone, status = $(".form__status", form);
  phone.addEventListener("input", () => {
    let d = phone.value.replace(/\D/g, "");
    if (d.startsWith("8")) d = "7" + d.slice(1);
    if (!d.startsWith("7")) d = "7" + d;
    d = d.slice(0, 11);
    const p = [d.slice(1, 4), d.slice(4, 7), d.slice(7, 9), d.slice(9, 11)];
    phone.value = "+7" + (p[0] ? ` (${p[0]}` : "") + (p[0].length === 3 ? ")" : "") + (p[1] ? ` ${p[1]}` : "") + (p[2] ? `-${p[2]}` : "") + (p[3] ? `-${p[3]}` : "");
  });
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const okName = form.name.value.trim().length > 1, okPhone = phone.value.replace(/\D/g, "").length === 11;
    form.name.parentElement.classList.toggle("is-error", !okName);
    phone.parentElement.classList.toggle("is-error", !okPhone);
    if (!okName || !okPhone) { status.className = "form__status"; status.textContent = "Проверьте имя и телефон"; return; }
    if (!form.agree.checked) { status.className = "form__status"; status.textContent = "Нужно согласие на обработку данных"; return; }
    const data = Object.fromEntries(new FormData(form));
    if (S.form.endpoint) {
      try {
        const r = await fetch(S.form.endpoint, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
        if (!r.ok) throw 0;
      } catch { status.className = "form__status"; status.textContent = "Не удалось отправить. Позвоните нам: " + C.phone; return; }
    } else {
      const msg = `Здравствуйте! Хочу записаться.\nИмя: ${data.name}\nТелефон: ${data.phone}\nУслуга: ${data.service || "любая"}\n${data.comment || ""}`;
      window.open(`https://wa.me/${C.whatsapp}?text=${encodeURIComponent(msg)}`, "_blank", "noopener");
    }
    status.className = "form__status is-ok"; status.textContent = S.form.successText;
    form.reset(); form.agree.checked = true;
  });

  /* ---------- Контакты ---------- */
  $("[data-address]").textContent = C.address;
  $("[data-address-note]").textContent = C.addressNote || "";
  const em = $("[data-email]");
  if (C.email) { em.textContent = C.email; em.href = "mailto:" + C.email; } else em.hidden = true;
  $("[data-hours]").innerHTML = C.hours.map(([d, t]) => `<dt>${esc(d)}</dt><dd>${esc(t)}</dd>`).join("");
  $("[data-map-link]").href = C.mapLink;
  $("[data-map]").innerHTML = C.mapEmbed
    ? `<iframe src="${esc(C.mapEmbed)}" loading="lazy" title="Карта"></iframe>`
    : `<div class="map__ph"><div><div class="map__pin"></div><strong>${esc(S.brand.city)}</strong><br>${esc(C.address)}</div></div>`;

  /* ---------- Подвал ---------- */
  $("[data-legal]").textContent = S.footer.legal;
  $("[data-year]").textContent = new Date().getFullYear();
  const cr = S.footer.credit;
  $("[data-credit]").innerHTML = cr && cr.text ? (cr.url ? `<a href="${esc(cr.url)}" target="_blank" rel="noopener" class="link-under">${esc(cr.text)}</a>` : esc(cr.text)) : "";

  /* ---------- Cookie ---------- */
  const cookie = $(".cookie");
  if (!store.get("cookie-consent")) setTimeout(() => (cookie.hidden = false), 1800);
  $$("[data-cookie]").forEach((b) => b.addEventListener("click", () => {
    store.set("cookie-consent", b.dataset.cookie);
    cookie.hidden = true;
    // if (b.dataset.cookie === "all") { /* сюда подключите Яндекс.Метрику / аналитику */ }
  }));
  $$("[data-open-cookies]").forEach((b) => b.addEventListener("click", () => (cookie.hidden = false)));

  /* ---------- Политика ---------- */
  const policy = $(".policy");
  $$("[data-open-policy]").forEach((b) => b.addEventListener("click", () => policy.showModal?.()));
  $(".policy__close").onclick = () => policy.close();
  policy.addEventListener("click", (e) => { if (e.target === policy) policy.close(); });
  addEventListener("keydown", (e) => { if (e.key === "Escape") closeLb(); });

  /* ---------- Меню ---------- */
  const burger = $(".burger");
  const toggleMenu = (on) => { document.body.classList.toggle("menu-open", on); burger.setAttribute("aria-expanded", on); };
  burger.onclick = () => toggleMenu(!document.body.classList.contains("menu-open"));
  $$(".nav a").forEach((a) => (a.onclick = () => toggleMenu(false)));

  /* ---------- Скролл: шапка, прогресс, параллакс, fab ---------- */
  const header = $(".header"), bar = $(".progress"), fab = $(".fab"), hero = $(".hero");
  const par = $$("[data-speed]");
  let lastY = 0, ticking = false;
  const onScroll = () => {
    const y = scrollY, max = document.documentElement.scrollHeight - innerHeight;
    header.classList.toggle("is-scrolled", y > 30);
    header.classList.toggle("is-hidden", y > lastY && y > 400 && !document.body.classList.contains("menu-open"));
    bar.style.transform = `scaleX(${max > 0 ? y / max : 0})`;
    fab.classList.toggle("is-on", y > hero.offsetHeight * 0.8 && y < max - 900);
    if (!reduced && y < innerHeight * 1.2) par.forEach((el) => (el.style.transform = `translateY(${y * el.dataset.speed}px)`));
    lastY = y; ticking = false;
  };
  addEventListener("scroll", () => { if (!ticking) { requestAnimationFrame(onScroll); ticking = true; } }, { passive: true });

  /* ---------- Активный пункт меню ---------- */
  const navLinks = $$(".nav a");
  const secIO = new IntersectionObserver((ents) => ents.forEach((en) => {
    if (en.isIntersecting) navLinks.forEach((a) => a.classList.toggle("is-active", a.getAttribute("href") === "#" + en.target.id));
  }), { rootMargin: "-45% 0px -50% 0px" });
  navLinks.forEach((a) => { const s = $(a.getAttribute("href")); s && secIO.observe(s); });

  /* ---------- Появление при скролле ---------- */
  const io = new IntersectionObserver((ents) => ents.forEach((en) => {
    if (!en.isIntersecting) return;
    en.target.classList.add("is-in");
    const n = en.target.querySelector?.("[data-count]"); if (n) countUp(n);
    io.unobserve(en.target);
  }), { threshold: 0.15 });
  $$(".reveal, .stat").forEach((el) => io.observe(el));

  /* ---------- Старт ---------- */
  const start = () => setTimeout(() => document.body.classList.add("is-loaded"), reduced ? 0 : 900);
  document.readyState === "complete" ? start() : addEventListener("load", start);
  setTimeout(() => document.body.classList.add("is-loaded"), 3000); // страховка
  onScroll();
})();

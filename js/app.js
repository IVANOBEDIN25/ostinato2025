// OSTINATO PWA — UI logic (wheels + start/stop) + SW register
console.log("Метроном: приложение загружено");

// ====== WHEEL: iOS-like snapping ======
function initWheel(listEl, { defaultText } = {}) {
  if (!listEl) return null;

  const items = Array.from(listEl.querySelectorAll(".wheel-item"));
  if (!items.length) return null;

  let debounceTimer = null;
  let isSnapping = false;

  function setActive(item) {
    items.forEach((x) => x.classList.remove("wheel-item--active"));
    if (item) item.classList.add("wheel-item--active");
  }

  function getNearestItem() {
    const center = listEl.scrollTop + listEl.clientHeight / 2;

    let best = null;
    let bestDist = Infinity;

    for (const it of items) {
      const itCenter = it.offsetTop + it.offsetHeight / 2;
      const dist = Math.abs(itCenter - center);
      if (dist < bestDist) {
        bestDist = dist;
        best = it;
      }
    }
    return best;
  }

  function targetTopForItem(item) {
    return item.offsetTop + item.offsetHeight / 2 - listEl.clientHeight / 2;
  }

  function snap({ behavior = "smooth", item = null } = {}) {
  if (listEl.classList.contains("wheel-list--locked")) return;
  if (isSnapping) return;

  const chosen = item || getNearestItem();
  if (!chosen) return;

  const target = targetTopForItem(chosen);

  // Подсветим сразу выбранное
  setActive(chosen);

  isSnapping = true;

  // 1) Плавно тянем к цели
  listEl.scrollTo({ top: target, behavior });

  // 2) Ждём фактической остановки скролла
  let lastTop = listEl.scrollTop;
  let stableFrames = 0;
  const start = performance.now();

  function check() {
    const nowTop = listEl.scrollTop;

    if (Math.abs(nowTop - lastTop) < 0.5) stableFrames++;
    else stableFrames = 0;

    lastTop = nowTop;

    if (stableFrames >= 2 || performance.now() - start > 600) {
      // 3) Дожимаем ТОЧНО в центр
      listEl.scrollTo({ top: target, behavior: "auto" });
      setActive(getNearestItem());
      isSnapping = false;
      return;
    }

    requestAnimationFrame(check);
  }

  requestAnimationFrame(check);
}


  function scheduleSnap() {
    if (listEl.classList.contains("wheel-list--locked")) return;
    if (isSnapping) return;

    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => snap({ behavior: "smooth" }), 120);
  }

  listEl.addEventListener("scroll", scheduleSnap, { passive: true });

    // Тап по значению -> прокрутить и примагнитить именно к нему
  listEl.addEventListener("click", (e) => {
    if (listEl.classList.contains("wheel-list--locked")) return;

    const item = e.target.closest(".wheel-item");
    if (!item) return;

    e.preventDefault();
    snap({ behavior: "smooth", item });
  });

  function setByText(text, behavior = "auto") {
    const t = (text ?? "").trim().toLowerCase();
    if (!t) return;

    const found = items.find(
      (x) => (x.textContent || "").trim().toLowerCase() === t
    );

    if (found) {
      setActive(found);
      listEl.scrollTo({ top: targetTopForItem(found), behavior: "auto" });
      setActive(getNearestItem());
    } else {
      snap({ behavior: "auto" });
    }
  }

  function getValue() {
    const active = listEl.querySelector(".wheel-item--active");
    return (active?.textContent || "").trim();
  }

  setTimeout(() => {
    if (defaultText) setByText(defaultText, "auto");
    else snap({ behavior: "auto" });
  }, 0);

  return { setByText, getValue, snap };
}

// ====== START / STOP + BPM + wheels + SOUND ======
document.addEventListener("DOMContentLoaded", () => {
  const startStopBtn = document.getElementById("start-stop-btn");
  const modeList = document.getElementById("mode-list");
  const subdivisionList = document.getElementById("subdivision-list");
  const beatsDotsEl = document.getElementById("beats-dots");

  const bpmInput = document.getElementById("bpm-input");
  const bpmSlider = document.getElementById("bpm-slider");

  const btnMinus5 = document.getElementById("bpm-minus5");
  const btnMinus1 = document.getElementById("bpm-minus1");
  const btnPlus1 = document.getElementById("bpm-plus1");
  const btnPlus5 = document.getElementById("bpm-plus5");

  // ====== TIMER (MM:SS) ======
  const timerDisplay = document.getElementById("timer-display");

  let timerStartMs = 0;
  let timerIntervalId = null;
  let elapsedMs = 0;

  function formatMMSS(ms) {
    const totalSec = Math.floor(ms / 1000);
    const mm = String(Math.floor(totalSec / 60)).padStart(2, "0");
    const ss = String(totalSec % 60).padStart(2, "0");
    return `${mm}:${ss}`;
  }

  function renderTimer() {
    if (!timerDisplay) return;
    timerDisplay.textContent = formatMMSS(elapsedMs);
  }

  function startTimer(reset = true) {
    if (!timerDisplay) return;

    if (reset) {
      elapsedMs = 0;
      renderTimer();
    }

    timerStartMs = performance.now();

    if (timerIntervalId) clearInterval(timerIntervalId);
    timerIntervalId = setInterval(() => {
      const now = performance.now();
      elapsedMs += now - timerStartMs;
      timerStartMs = now;
      renderTimer();
    }, 250);
  }

  function stopTimer() {
    if (timerIntervalId) clearInterval(timerIntervalId);
    timerIntervalId = null;
    renderTimer(); // оставим финальное значение
  }

  // начальное значение
  renderTimer();

  if (!startStopBtn) {
    console.warn("Не найдена кнопка start-stop-btn");
    return;
  }

  let isRunning = false;
  let currentBpm = 120;

  // Wheels (по умолчанию: 4/4 и –)
  const modeWheel = initWheel(modeList, { defaultText: "4/4" });
  const subWheel = initWheel(subdivisionList, { defaultText: "–" });

  // --- Fix: Chrome/PWA иногда восстанавливает scrollTop, поэтому "дожимаем" дефолты ещё раз
  requestAnimationFrame(() => modeWheel?.setByText?.("4/4", "auto"));
  requestAnimationFrame(() => subWheel?.setByText?.("–", "auto"));

  setTimeout(() => modeWheel?.setByText?.("4/4", "auto"), 80);
  setTimeout(() => subWheel?.setByText?.("–", "auto"), 80);

  // ---------- helpers ----------
  const BPM_MIN = 15;
  const BPM_MAX = 300;

  function clampBpm(v) {
    if (!Number.isFinite(v)) return 120;
    return Math.min(BPM_MAX, Math.max(BPM_MIN, Math.round(v)));
  }

  function setBpm(value, source) {
    const bpm = clampBpm(Number(value));
    currentBpm = bpm;

    if (bpmInput && document.activeElement !== bpmInput) {
      bpmInput.value = String(bpm);
    } else if (bpmInput && source === "slider") {
      bpmInput.value = String(bpm);
    }
    if (bpmSlider) bpmSlider.value = String(bpm);
  }

  function adjustBpm(delta) {
    const current = Number(bpmSlider?.value ?? bpmInput?.value ?? 120);
    setBpm(current + delta, "buttons");
  }

  btnMinus5?.addEventListener("click", () => adjustBpm(-5));
  btnMinus1?.addEventListener("click", () => adjustBpm(-1));
  btnPlus1?.addEventListener("click", () => adjustBpm(+1));
  btnPlus5?.addEventListener("click", () => adjustBpm(+5));

  bpmSlider?.addEventListener("input", (e) => setBpm(e.target.value, "slider"));
  bpmInput?.addEventListener("input", (e) => setBpm(e.target.value, "input"));
  bpmInput?.addEventListener("change", (e) => setBpm(e.target.value, "input"));
  bpmInput?.addEventListener("blur", (e) => setBpm(e.target.value, "input"));

  setBpm(bpmSlider?.value ?? bpmInput?.value ?? 120, "init");

  function setWheelsLocked(locked) {
    [modeList, subdivisionList].forEach((list) => {
      if (!list) return;
      list.classList.toggle("wheel-list--locked", locked);
    });

    if (!locked) {
      modeWheel?.snap?.();
      subWheel?.snap?.();
      window.setTimeout(() => renderDots(getBeatsInBar()), 0);
    }
  }

  function updateButton() {
    if (isRunning) {
      startStopBtn.textContent = "Stop";
      startStopBtn.classList.add("control-btn--danger");
    } else {
      startStopBtn.textContent = "Start";
      startStopBtn.classList.remove("control-btn--danger");
    }
  }

  // ---------- time signature parsing ----------
  function getTimeSignature() {
    const txt = (modeWheel?.getValue?.() || "4/4").trim();
    const m = txt.match(/^(\d+)\s*\/\s*(\d+)$/);
    if (!m) return { num: 4, denom: 4 };

    const num = parseInt(m[1], 10);
    const denom = parseInt(m[2], 10);

    return {
      num: Number.isFinite(num) && num > 0 ? num : 4,
      denom: Number.isFinite(denom) && denom > 0 ? denom : 4,
    };
  }

  // ---------- dots ----------
  function getBeatsInBar() {
    return getTimeSignature().num;
  }

  function renderDots(count) {
    if (!beatsDotsEl) return;
    beatsDotsEl.innerHTML = "";
    for (let i = 0; i < count; i++) {
      const d = document.createElement("div");
      d.className = "beat-dot" + (i === 0 ? " beat-dot--accent" : "");
      beatsDotsEl.appendChild(d);
    }
  }

  function setActiveDot(index) {
    if (!beatsDotsEl) return;
    const dots = Array.from(beatsDotsEl.querySelectorAll(".beat-dot"));
    dots.forEach((d) => d.classList.remove("beat-dot--active"));
    const d = dots[index];
    if (d) d.classList.add("beat-dot--active");
  }

  window.setTimeout(() => renderDots(getBeatsInBar()), 0);

    // ---------- SOUND (Web Audio) ----------
  let audioCtx = null;
  let schedulerId = null;

  // тайминг планировщика
  const lookaheadMs = 20;       // как часто проверяем
  const scheduleAhead = 0.200;  // на сколько вперёд планируем

  // состояние такта/долей
  let beatsInBar = 4;
  let beatDenom = 4; // 4 или 8 и т.д.
  let beatIndex = 0; // 0..beatsInBar-1

  // состояние субдолей внутри одной доли
  let subFractions = [0]; // моменты внутри доли (0..1)
  let subIndex = 0;       // индекс текущей субдоли

  // абсолютные времена
  let beatStartTime = 0;  // время начала текущей основной доли (сек)
  let beatDuration = 0;   // длительность основной доли (сек)
  let nextNoteTime = 0;   // время следующего клика (сек)

  function ensureAudioContext() {
    if (!audioCtx) {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    return audioCtx;
  }

  // BPM считаем как четверти.
  // Основная доля зависит от знаменателя размера (/4, /8 ...)
  function secondsPerBeat() {
    const quarter = 60 / Math.max(1, currentBpm);
    return quarter * (4 / Math.max(1, beatDenom)); // /8 => в 2 раза быстрее
  }

  // --- subdivision parsing ---
  function getSubdivisionKind() {
    const raw = (subWheel?.getValue?.() || "–").trim().toLowerCase();

    if (raw === "–" || raw === "-" || raw.startsWith("–")) return "none";
    if (raw.startsWith("1/8 swing")) return "swing8";
    if (raw.startsWith("1/16 swing")) return "swing16";
    if (raw.startsWith("1/8 triplets")) return "triplet8";   // 3 на долю
    if (raw.startsWith("1/16 triplets")) return "triplet16";  // 6 на долю
    if (raw.startsWith("1/16")) return "sixteenth";  // 4 на долю
    if (raw.startsWith("1/8")) return "eighth";      // 2 на долю

    return "none";
  }

  // возвращает массив моментов внутри основной доли (0..1)
  function getSubdivisionFractions(kind, denom, beatIdx) {
  // ВАЖНО: массив всегда начинается с 0
  // (0 — это основная доля; остальные — субдоли внутри неё)
  const isDenom8 = denom === 8;
  const even = (beatIdx % 2) === 0;

  switch (kind) {
    case "none":
      return [0];

    // 1/8: в /4 это 2 части, в /8 это уже основная доля (без субдолей)
    case "eighth":
      return isDenom8 ? [0] : [0, 0.5];

    // 1/16: в /4 это 4 части, в /8 это 2 части
    case "sixteenth":
      return isDenom8 ? [0, 0.5] : [0, 0.25, 0.5, 0.75];

    // 1/24 (1/16 triplets): в /4 это 6 частей, в /8 это 3 части
    case "triplet16":
      return isDenom8
        ? [0, 1 / 3, 2 / 3]
        : [0, 1 / 6, 2 / 6, 3 / 6, 4 / 6, 5 / 6];

    // 1/12 (1/8 triplets):
    // в /4: 3 части на долю
    // в /8: получается 3 триоли на четверть (т.е. на 2 восьмых доли),
    // поэтому распределяем по двум долям: [0, 2/3] и [0, 1/3]
    case "triplet8":
      return isDenom8
        ? (even ? [0, 2 / 3] : [0, 1 / 3])
        : [0, 1 / 3, 2 / 3];

    // 1/8 swing:
    // в /4: [0, 2/3]
    // в /8: свинг “на четверть” (на 2 восьмых доли):
    // первая доля: только 0, вторая доля: добавляем 1/3
    case "swing8":
      return isDenom8
        ? (even ? [0] : [0, 1 / 3])
        : [0, 2.04 / 3];

    // 1/16 swing:
    // в /4 как раньше; в /8 пусть будет “половинная” версия (2 события на долю)
    case "swing16":
      return isDenom8
        ? [0, 2 / 3]
        : [0, 1.02 / 3, 1 / 2, 5.02 / 6];

    default:
      return [0];
  }
}


  // тип клика: downbeat (1-я доля такта), beat (остальные основные), sub (субдоли)
  function playClick(time, type) {
    const ctx = ensureAudioContext();

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    // можете оставить square / поменять обратно на triangle/sine для чище
    osc.type = "square";

    let freq = 1200;
    let peak = 0.25;

    if (type === "downbeat") {
      freq = 2400;
      peak = 0.9;
    } else if (type === "beat") {
      freq = 1500;
      peak = 0.55;
    } else {
      // sub
      freq = 1100;
      peak = 0.22;
    }

    osc.frequency.setValueAtTime(freq, time);

    gain.gain.setValueAtTime(0.0001, time);
    gain.gain.exponentialRampToValueAtTime(peak, time + 0.002);
    gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.03);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(time);
    osc.stop(time + 0.05);
  }

  function advanceNote() {
    // следующая субдоля внутри той же основной доли
    subIndex++;

    if (subIndex < subFractions.length) {
      nextNoteTime = beatStartTime + subFractions[subIndex] * beatDuration;
      return;
    }

    // переходим на следующую основную долю
    subIndex = 0;
    beatIndex = (beatIndex + 1) % beatsInBar;

    beatStartTime += beatDuration;
    beatDuration = secondsPerBeat();

    // ВОТ ЭТО ДОБАВИТЬ:
    subFractions = getSubdivisionFractions(getSubdivisionKind(), beatDenom, beatIndex);

    nextNoteTime = beatStartTime + subFractions[0] * beatDuration; // обычно просто beatStartTime

  }

  function scheduler() {
    const ctx = ensureAudioContext();

    while (nextNoteTime < ctx.currentTime + scheduleAhead) {
      const isMainBeat = subIndex === 0;

      if (isMainBeat) {
        const type = beatIndex === 0 ? "downbeat" : "beat";
        playClick(nextNoteTime, type);

        // визуал — только на основные доли
        setActiveDot(beatIndex);
      } else {
        playClick(nextNoteTime, "sub");
      }

      advanceNote();
    }
  }

  async function startMetronome() {
    // 1) размер
    const sig = getTimeSignature();
    beatsInBar = sig.num;
    beatDenom = sig.denom;

    renderDots(beatsInBar);

    // 2) subdivision
    subFractions = getSubdivisionFractions(getSubdivisionKind(), beatDenom, beatIndex);
    subIndex = 0;

    // 3) стартовое состояние
    beatIndex = 0;

    const ctx = ensureAudioContext();
    if (ctx.state === "suspended") {
      await ctx.resume();
    }

    beatDuration = secondsPerBeat();
    beatStartTime = ctx.currentTime + 0.05;
    nextNoteTime = beatStartTime; // первая субдоля всегда 0

    if (schedulerId) clearInterval(schedulerId);
    schedulerId = setInterval(scheduler, lookaheadMs);
    scheduler();
  }

  function stopMetronome() {
    if (schedulerId) clearInterval(schedulerId);
    schedulerId = null;

    setActiveDot(-1);

    beatIndex = 0;
    subIndex = 0;
  }


  // ---------- start/stop ----------
  startStopBtn.addEventListener("click", async () => {
  isRunning = !isRunning;
  updateButton();
  setWheelsLocked(isRunning);

  if (isRunning) {
    try {
      await startMetronome();
      startTimer(true);   // <-- ВОТ ЭТО ДОБАВИТЬ
    } catch (e) {
      console.error("Не удалось запустить звук:", e);
      isRunning = false;
      updateButton();
      setWheelsLocked(false);
      stopTimer();        // <-- на всякий случай
    }
  } else {
    stopMetronome();
    stopTimer();          // <-- И ВОТ ЭТО ДОБАВИТЬ
  }
});
  updateButton();
  setWheelsLocked(false);

  // iPad/iOS: запрет "резинки" страницы, но разрешить скролл в колесах
document.addEventListener(
  "touchmove",
  (e) => {
    const inWheel = e.target.closest(".wheel-list");
    if (!inWheel) e.preventDefault();
  },
  { passive: false }
);

});

// ====== SERVICE WORKER REGISTRATION ======
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("./sw.js")
      .then((registration) => {
        console.log("Service Worker зарегистрирован:", registration.scope);
      })
      .catch((error) => {
        console.error("Ошибка регистрации Service Worker:", error);
      });
  });
} else {
  console.log("Service Worker не поддерживается в этом браузере");
}

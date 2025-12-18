(() => {
  "use strict";

  const clamp = (v, min, max) => Math.min(max, Math.max(min, v));
  const roundInt = (v) => Math.round(Number(v));
  const nowMs = () => performance.now();

  //Колесо выбора режима* { box-sizing: border-box; }

:root {
  --bg: #020617;
  --card: #020617;
  --accent: #22c55e;
  --danger: #ef4444;

  --text-main: #e5e7eb;
  --text-muted: #9ca3af;

  --dot-neutral: #111827;
  --dot-accent: #22c55e;

  --safe-top: env(safe-area-inset-top, 0px);
  --safe-bottom: env(safe-area-inset-bottom, 0px);

  --wheel-h: 120px;
  --item-h: 32px;
}

html,
body {
  height: 100%;
  width: 100%;
  overflow: hidden;
  background: var(--bg);
}

body {
  margin: 0;
  position: fixed;
  inset: 0;
  min-height: 100vh;
  display: flex;
  flex-direction: column;

  font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  color: var(--text-main);

  background: radial-gradient(circle at top, #020617 0, #020617 40%, #000 100%);
  overscroll-behavior: none;
  -webkit-overflow-scrolling: auto;
}

/* Шапка */
.app-header {
  text-align: center;
  padding: calc(var(--safe-top) + 12px) 16px 12px;
  background: var(--bg);
}

.app-header h1 {
  margin: 0;
  font-size: 1.5rem;
  letter-spacing: 0.18em;
  text-transform: uppercase;
}

/* Карточка */
.app-main {
  flex: 1;
  display: flex;
  justify-content: center;
  padding: 16px;
  padding-bottom: calc(16px + var(--safe-bottom));
  overflow: hidden;
}

.metronome-card {
  width: 100%;
  max-width: 420px;
  display: flex;
  flex-direction: column;
  gap: 18px;

  padding: 18px 16px 20px;
  border-radius: 24px;
  background: var(--card);
  border: 1px solid rgba(148, 163, 184, 0.18);
}

/* Темп */
.tempo-section {
  padding: 16px 14px 14px;
  border-radius: 18px;
  background: var(--card);
  border: 1px solid rgba(148, 163, 184, 0.5);
}

.tempo-main {
  display: flex;
  align-items: baseline;
  justify-content: center;
  gap: 8px;
  margin-bottom: 12px;
}

.tempo-input {
  width: 170px;
  border: none;
  outline: none;
  background: transparent;
  color: var(--text-main);
  font-size: 3rem;
  font-weight: 700;
  text-align: right;
}

.tempo-input::-webkit-outer-spin-button,
.tempo-input::-webkit-inner-spin-button {
  -webkit-appearance: none;
  margin: 0;
}

.tempo-unit {
  align-self: flex-end;
  margin-bottom: 6px;
  font-size: 0.9rem;
  color: var(--text-muted);
}

.tempo-stepper {
  display: flex;
  justify-content: center;
  gap: 10px;
  margin: 6px 0 10px;
}

.tempo-slider {
  width: 100%;
  margin: 0;
  accent-color: var(--accent);
  touch-action: pan-x; /* ключевой фикс для телефона */
}

/* Колёса */
.pickers-row { display: flex; gap: 12px; }
.picker-wrapper { flex: 1; }

.picker-label {
  margin-bottom: 4px;
  font-size: 0.8rem;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.12em;
}

.wheel {
  position: relative;
  height: var(--wheel-h);
  overflow: hidden;
  border-radius: 14px;
}

.wheel-list {
  list-style: none;
  margin: 0;
  height: 100%;
  overflow-y: auto;
  overflow-x: hidden;
  scrollbar-width: none;

  overscroll-behavior: contain;
  touch-action: pan-y;
  -webkit-overflow-scrolling: touch;

  padding: calc((var(--wheel-h) / 2) - (var(--item-h) / 2)) 0;
}

.wheel-list::-webkit-scrollbar { display: none; }

.wheel-item {
  height: var(--item-h);
  line-height: var(--item-h);
  text-align: center;

  font-size: 1.2rem;
  color: var(--text-muted);

  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;

  cursor: pointer;
  user-select: none;
  -webkit-tap-highlight-color: transparent;
  transition: transform 0.12s ease, color 0.12s ease;
}

.wheel-item--active {
  color: var(--text-main);
  font-weight: 600;
  transform: scale(1.06);
}

.wheel-gradient {
  position: absolute;
  left: 0;
  width: 100%;
  height: 34px;
  z-index: 2;
  pointer-events: none;
}

.wheel-gradient-top { top: 0; background: linear-gradient(to bottom, #020617, transparent); }
.wheel-gradient-bottom { bottom: 0; background: linear-gradient(to top, #020617, transparent); }

.wheel-center-highlight {
  position: absolute;
  top: 50%;
  left: 0;
  width: 100%;
  height: 28px;
  transform: translateY(-50%);
  border-top: 1px solid rgba(148, 163, 184, 0.35);
  border-bottom: 1px solid rgba(148, 163, 184, 0.35);
  pointer-events: none;
}

.wheel-list--locked { pointer-events: none; }

/* Индикатор */
.beats-dots {
  display: flex;
  justify-content: center;
  gap: 12px;
  padding-bottom: 12px;
}

.beat-dot {
  width: 12px;
  height: 12px;
  border-radius: 999px;
  background: var(--dot-neutral);
  transition: background 0.01s ease, transform 0.12s ease;
}

.beat-dot--accent { width: 16px; height: 16px; }
.beat-dot--active { background: var(--dot-accent); transform: scale(1.6); }

/* Управление */
.control-section { display: flex; align-items: center; gap: 12px; }

.control-btn {
  flex: 1.1;
  padding: 11px 0;
  border: none;
  border-radius: 999px;
  cursor: pointer;

  font-size: 1.2rem;
  font-weight: 600;

  background: var(--accent);
  color: #052e16;
  box-shadow: 0 8px 16px rgba(15, 23, 42, 0.8);
  transition: transform 0.08s ease, box-shadow 0.08s ease, background 0.12s ease, color 0.12s ease;
}

.control-btn:active {
  transform: translateY(1px);
  box-shadow: 0 4px 10px rgba(15, 23, 42, 0.9);
}

.control-btn--danger { background: var(--danger); color: #fef2f2; }

.timer-block {
  flex: 0.7;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
}

.timer-label {
  font-size: 0.7rem;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.16em;
}

.timer-value {
  font-variant-numeric: tabular-nums;
  font-size: 1.2rem;
  font-weight: 600;
}

/* Кнопки: удобная тач-зона */
button, .step-btn, .control-btn {
  min-height: 44px;
  min-width: 44px;
  touch-action: manipulation;
  -webkit-tap-highlight-color: transparent;
}

.step-btn {
  border: 1px solid rgba(148, 163, 184, 0.35);
  background: transparent;
  color: var(--text-main);
  border-radius: 999px;
  padding: 10px 14px;
  font-size: 1.2rem;
  cursor: pointer;
  user-select: none;
}

.step-btn:active { transform: translateY(1px); }
.step-btn:focus { outline: none; border-color: rgba(34, 197, 94, 0.6); }

@media (max-width: 480px) {
  .metronome-card { border-radius: 20px; padding: 14px 12px 16px; }
  .control-section { flex-direction: column; align-items: stretch; }
  .timer-block { width: 100%; flex: none; }
}

  function initWheel(listEl, { defaultText } = {}) {
    if (!listEl) return null;

    const items = Array.from(listEl.querySelectorAll(".wheel-item"));
    if (!items.length) return null;

    let debounceTimer = null;
    let isSnapping = false;

    const isLocked = () => listEl.classList.contains("wheel-list--locked");

    const setActive = (item) => {
      items.forEach((x) => x.classList.remove("wheel-item--active"));
      item?.classList.add("wheel-item--active");
    };

    const getNearestItem = () => {
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
    };

    const targetTopForItem = (item) =>
      item.offsetTop + item.offsetHeight / 2 - listEl.clientHeight / 2;

    const snap = ({ behavior = "smooth", item = null } = {}) => {
      if (isLocked() || isSnapping) return;

      const chosen = item || getNearestItem();
      if (!chosen) return;

      const target = targetTopForItem(chosen);
      setActive(chosen);

      isSnapping = true;
      listEl.scrollTo({ top: target, behavior });

      //Дожимаем в центр после остановки скролла
      let lastTop = listEl.scrollTop;
      let stableFrames = 0;
      const start = performance.now();

      const check = () => {
        const top = listEl.scrollTop;
        stableFrames = Math.abs(top - lastTop) < 0.5 ? stableFrames + 1 : 0;
        lastTop = top;

        if (stableFrames >= 2 || performance.now() - start > 600) {
          listEl.scrollTo({ top: target, behavior: "auto" });
          setActive(getNearestItem());
          isSnapping = false;
          return;
        }
        requestAnimationFrame(check);
      };

      requestAnimationFrame(check);
    };

    const scheduleSnap = () => {
      if (isLocked() || isSnapping) return;
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => snap({ behavior: "smooth" }), 120);
    };

    const setByText = (text, behavior = "auto") => {
      const t = (text ?? "").trim().toLowerCase();
      if (!t) return;

      const found = items.find(
        (x) => (x.textContent || "").trim().toLowerCase() === t
      );

      if (!found) {
        snap({ behavior: "auto" });
        return;
      }

      setActive(found);
      listEl.scrollTo({ top: targetTopForItem(found), behavior });
      setActive(getNearestItem());
    };

    const getValue = () =>
      (listEl.querySelector(".wheel-item--active")?.textContent || "").trim();

    listEl.addEventListener("scroll", scheduleSnap, { passive: true });

    //Прокрутка по нажатию
    listEl.addEventListener("click", (e) => {
      if (isLocked()) return;

      const item = e.target.closest(".wheel-item");
      if (!item) return;

      e.preventDefault();
      snap({ behavior: "smooth", item });
    });

    setTimeout(() => {
      if (defaultText) setByText(defaultText, "auto");
      else snap({ behavior: "auto" });
    }, 0);

    return { setByText, getValue, snap };
  }

  //DOM
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

    const timerDisplay = document.getElementById("timer-display");

    if (!startStopBtn) return;

    const BPM_MIN = 15;
    const BPM_MAX = 300;

    let isRunning = false;
    let currentBpm = 120;

    // Колёса (по умолчанию: 4/4 и «–»)
    const modeWheel = initWheel(modeList, { defaultText: "4/4" });
    const subWheel = initWheel(subdivisionList, { defaultText: "–" });

    const applyWheelDefaults = () => {
      modeWheel?.setByText?.("4/4", "auto");
      subWheel?.setByText?.("–", "auto");
    };
    requestAnimationFrame(applyWheelDefaults);
    setTimeout(applyWheelDefaults, 80);

    //Таймер 
    let timerStartMs = 0;
    let timerIntervalId = null;
    let elapsedMs = 0;

    const formatMMSS = (ms) => {
      const totalSec = Math.floor(ms / 1000);
      const mm = String(Math.floor(totalSec / 60)).padStart(2, "0");
      const ss = String(totalSec % 60).padStart(2, "0");
      return `${mm}:${ss}`;
    };

    const renderTimer = () => {
      if (!timerDisplay) return;
      timerDisplay.textContent = formatMMSS(elapsedMs);
    };

    const startTimer = (reset = true) => {
      if (!timerDisplay) return;

      if (reset) {
        elapsedMs = 0;
        renderTimer();
      }

      timerStartMs = nowMs();

      clearInterval(timerIntervalId);
      timerIntervalId = setInterval(() => {
        const t = nowMs();
        elapsedMs += t - timerStartMs;
        timerStartMs = t;
        renderTimer();
      }, 250);
    };

    const stopTimer = () => {
      clearInterval(timerIntervalId);
      timerIntervalId = null;
      renderTimer();
    };

    renderTimer();

    // Темп
    const sanitizeBpm = (v) => {
      if (!Number.isFinite(Number(v))) return 120;
      return clamp(roundInt(v), BPM_MIN, BPM_MAX);
    };

    const setBpm = (value, source) => {
      const bpm = sanitizeBpm(value);
      currentBpm = bpm;
      
      const isTypingInInput = document.activeElement === bpmInput;
      if (bpmInput && (!isTypingInInput || source === "slider")) {
        bpmInput.value = String(bpm);
      }
      if (bpmSlider) bpmSlider.value = String(bpm);
    };

    const adjustBpm = (delta) => {
      const base = Number(bpmSlider?.value ?? bpmInput?.value ?? 120);
      setBpm(base + delta, "buttons");
    };

    btnMinus5?.addEventListener("click", () => adjustBpm(-5));
    btnMinus1?.addEventListener("click", () => adjustBpm(-1));
    btnPlus1?.addEventListener("click", () => adjustBpm(+1));
    btnPlus5?.addEventListener("click", () => adjustBpm(+5));

    bpmSlider?.addEventListener("input", (e) => setBpm(e.target.value, "slider"));
    bpmInput?.addEventListener("input", (e) => setBpm(e.target.value, "input"));
    bpmInput?.addEventListener("change", (e) => setBpm(e.target.value, "input"));
    bpmInput?.addEventListener("blur", (e) => setBpm(e.target.value, "input"));

    setBpm(bpmSlider?.value ?? bpmInput?.value ?? 120, "init");

    //Кнопка Start/Stop
    const updateButton = () => {
      startStopBtn.textContent = isRunning ? "Stop" : "Start";
      startStopBtn.classList.toggle("control-btn--danger", isRunning);
    };

    const setWheelsLocked = (locked) => {
      [modeList, subdivisionList].forEach((list) => {
        if (!list) return;
        list.classList.toggle("wheel-list--locked", locked);
      });

      if (!locked) {
        modeWheel?.snap?.();
        subWheel?.snap?.();
        setTimeout(() => renderDots(getBeatsInBar()), 0);
      }
    };

    //Определение размера и точки
    const getTimeSignature = () => {
      const txt = (modeWheel?.getValue?.() || "4/4").trim();
      const m = txt.match(/^(\d+)\s*\/\s*(\d+)$/);
      if (!m) return { num: 4, denom: 4 };

      const num = parseInt(m[1], 10);
      const denom = parseInt(m[2], 10);

      return {
        num: Number.isFinite(num) && num > 0 ? num : 4,
        denom: Number.isFinite(denom) && denom > 0 ? denom : 4,
      };
    };

    const getBeatsInBar = () => getTimeSignature().num;

    const renderDots = (count) => {
      if (!beatsDotsEl) return;
      beatsDotsEl.innerHTML = "";

      for (let i = 0; i < count; i++) {
        const d = document.createElement("div");
        d.className = "beat-dot" + (i === 0 ? " beat-dot--accent" : "");
        beatsDotsEl.appendChild(d);
      }
    };

    const setActiveDot = (index) => {
      if (!beatsDotsEl) return;
      const dots = Array.from(beatsDotsEl.querySelectorAll(".beat-dot"));
      dots.forEach((d) => d.classList.remove("beat-dot--active"));
      dots[index]?.classList.add("beat-dot--active");
    };

    setTimeout(() => renderDots(getBeatsInBar()), 0);

    //Звук Web Audio
    let audioCtx = null;
    let schedulerId = null;

    const lookaheadMs = 20;
    const scheduleAhead = 0.2;

    let beatsInBar = 4;
    let beatDenom = 4;

    let beatIndex = 0;
    let subFractions = [0];
    let subIndex = 0;

    let beatStartTime = 0;
    let beatDuration = 0;
    let nextNoteTime = 0;

    const ensureAudioContext = () => {
      if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      }
      return audioCtx;
    };

    //Рачсет длительности доли
    const secondsPerBeat = () => {
      const quarter = 60 / Math.max(1, currentBpm);
      return quarter * (4 / Math.max(1, beatDenom));
    };

    const getSubdivisionKind = () => {
      const raw = (subWheel?.getValue?.() || "–").trim().toLowerCase();

      if (raw === "–" || raw === "-" || raw.startsWith("–")) return "none";
      if (raw.startsWith("1/8 swing")) return "swing8";
      if (raw.startsWith("1/16 swing")) return "swing16";
      if (raw.startsWith("1/8 triplets")) return "triplet8";
      if (raw.startsWith("1/16 triplets")) return "triplet16";
      if (raw.startsWith("1/16")) return "sixteenth";
      if (raw.startsWith("1/8")) return "eighth";
      return "none";
    };

    //Рассчет деления доли
    const getSubdivisionFractions = (kind, denom, beatIdx) => {
      const isDenom8 = denom === 8;
      const even = beatIdx % 2 === 0;

      switch (kind) {
        case "none":
          return [0];
        case "eighth":
          return isDenom8 ? [0] : [0, 0.5];
        case "sixteenth":
          return isDenom8 ? [0, 0.5] : [0, 0.25, 0.5, 0.75];
        case "triplet16":
          return isDenom8
            ? [0, 1 / 3, 2 / 3]
            : [0, 1 / 6, 2 / 6, 3 / 6, 4 / 6, 5 / 6];
        case "triplet8":
          return isDenom8 ? (even ? [0, 2 / 3] : [0, 1 / 3]) : [0, 1 / 3, 2 / 3];
        case "swing8":
          return isDenom8 ? (even ? [0] : [0, 1 / 3]) : [0, 2.04 / 3];
        case "swing16":
          return isDenom8 ? [0, 2 / 3] : [0, 1.02 / 3, 1 / 2, 5.02 / 6];
        default:
          return [0];
      }
    };

    //Генерация кликов
    const playClick = (time, type) => {
      const ctx = ensureAudioContext();

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

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
    };

    const advanceNote = () => {
      subIndex += 1;

      if (subIndex < subFractions.length) {
        nextNoteTime = beatStartTime + subFractions[subIndex] * beatDuration;
        return;
      }
      
      subIndex = 0;
      beatIndex = (beatIndex + 1) % beatsInBar;

      beatStartTime += beatDuration;
      beatDuration = secondsPerBeat();

      subFractions = getSubdivisionFractions(getSubdivisionKind(), beatDenom, beatIndex);
      nextNoteTime = beatStartTime;
    };

    const scheduler = () => {
      const ctx = ensureAudioContext();

      while (nextNoteTime < ctx.currentTime + scheduleAhead) {
        const isMainBeat = subIndex === 0;

        if (isMainBeat) {
          playClick(nextNoteTime, beatIndex === 0 ? "downbeat" : "beat");
          setActiveDot(beatIndex);
        } else {
          playClick(nextNoteTime, "sub");
        }

        advanceNote();
      }
    };

    const startMetronome = async () => {
      const sig = getTimeSignature();
      beatsInBar = sig.num;
      beatDenom = sig.denom;

      beatIndex = 0;
      subIndex = 0;
      subFractions = getSubdivisionFractions(getSubdivisionKind(), beatDenom, beatIndex);

      renderDots(beatsInBar);

      const ctx = ensureAudioContext();
      if (ctx.state === "suspended") await ctx.resume();

      beatDuration = secondsPerBeat();
      beatStartTime = ctx.currentTime + 0.05;
      nextNoteTime = beatStartTime;

      clearInterval(schedulerId);
      schedulerId = setInterval(scheduler, lookaheadMs);
      scheduler();
    };

    const stopMetronome = () => {
      clearInterval(schedulerId);
      schedulerId = null;

      setActiveDot(-1);
      beatIndex = 0;
      subIndex = 0;
    };

    //Обработка Start/Stop
    startStopBtn.addEventListener("click", async () => {
      isRunning = !isRunning;
      updateButton();
      setWheelsLocked(isRunning);

      if (isRunning) {
        try {
          await startMetronome();
          startTimer(true);
        } catch (e) {
          console.error("Не удалось запустить звук:", e);
          isRunning = false;
          updateButton();
          setWheelsLocked(false);
          stopTimer();
        }
        return;
      }

      stopMetronome();
      stopTimer();
    });

    updateButton();
    setWheelsLocked(false);
    
    document.addEventListener(
      "touchmove",
      (e) => {
        const inWheel = e.target.closest(".wheel-list");
        const inRange = e.target.closest('input[type="range"], .tempo-slider');
        if (!inWheel && !inRange) e.preventDefault();
      },
      { passive: false }
    );
  });

  //Service Worker
  if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
      navigator.serviceWorker
        .register("./sw.js", { scope: "./", updateViaCache: "none" })
        .catch((err) => console.error("SW: ошибка регистрации:", err));
    });
  }
})();

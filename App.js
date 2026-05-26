'use strict';
 
const STORAGE_KEY   = 'pomodoro_history_v2';
const SETTINGS_KEY  = 'pomodoro_settings_v1';
const CIRCUMFERENCE = 816.81; 
const TICK_COUNT    = 60;
 
let focusMins   = 25;
let breakMins   = 5;
let mode        = 'focus';   
let status      = 'idle';    
let totalSecs   = focusMins * 60;
let remaining   = totalSecs;
let tickId      = null;
 
const app             = document.getElementById('app');
const timeDisplay     = document.getElementById('timeDisplay');
const sessionNum      = document.getElementById('sessionNum');
const ringProgress    = document.getElementById('ringProgress');
const tickMarks       = document.getElementById('tickMarks');
const modeBadge       = document.getElementById('modeBadge');
const startBtn        = document.getElementById('startBtn');
const resetBtn        = document.getElementById('resetBtn');
const skipBtn         = document.getElementById('skipBtn');
const settingsToggle  = document.getElementById('settingsToggle');
const settingsPanel   = document.getElementById('settingsPanel');
const focusInput      = document.getElementById('focusInput');
const breakInput      = document.getElementById('breakInput');
const applyBtn        = document.getElementById('applySettings');
const historyList     = document.getElementById('historyList');
const historyEmpty    = document.getElementById('historyEmpty');
const historyDate     = document.getElementById('historyDate');
const completeOverlay = document.getElementById('completeOverlay');
const completeText    = document.getElementById('completeText');
const iconPlay        = startBtn.querySelector('.icon-play');
const iconPause       = startBtn.querySelector('.icon-pause');
 
let audioCtx = null;
 
function getAudioCtx() {
  if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  return audioCtx;
}
 
function playDone(isFocus) {
  try {
    const ctx  = getAudioCtx();
    const now  = ctx.currentTime;
    const gain = ctx.createGain();
    gain.connect(ctx.destination);
 
    const notes = isFocus
      ? [523.25, 659.25, 783.99]  
      : [392.00, 329.63, 261.63];  
 
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + i * 0.18);
 
      const g = ctx.createGain();
      g.gain.setValueAtTime(0, now + i * 0.18);
      g.gain.linearRampToValueAtTime(0.22, now + i * 0.18 + 0.04);
      g.gain.exponentialRampToValueAtTime(0.001, now + i * 0.18 + 0.55);
 
      osc.connect(g);
      g.connect(ctx.destination);
      osc.start(now + i * 0.18);
      osc.stop(now + i * 0.18 + 0.6);
    });
  } catch (e) { /* silently ignore audio errors */ }
}
 
function playTick() {
  try {
    const ctx = getAudioCtx();
    const osc = ctx.createOscillator();
    const g   = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.value = 800;
    g.gain.setValueAtTime(0.06, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.06);
    osc.connect(g);
    g.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.07);
  } catch (e) { /* silent */ }
}
 
function updateRing() {
  const pct    = remaining / totalSecs;
  const offset = CIRCUMFERENCE * (1 - pct);
  ringProgress.style.strokeDashoffset = offset;
 
  const activeTicks = Math.round(pct * TICK_COUNT);
  const lines = tickMarks.querySelectorAll('line');
  lines.forEach((line, i) => {
    const fromEnd = TICK_COUNT - 1 - i;
    line.classList.toggle('active', fromEnd < activeTicks);
  });
}
 
function buildTicks() {
  const r = 130, cx = 150, cy = 150;
  for (let i = 0; i < TICK_COUNT; i++) {
    const angle = (i / TICK_COUNT) * 2 * Math.PI - Math.PI / 2;
    const inner = r - 8;
    const outer = r + 8;
    const x1 = cx + inner * Math.cos(angle);
    const y1 = cy + inner * Math.sin(angle);
    const x2 = cx + outer * Math.cos(angle);
    const y2 = cy + outer * Math.sin(angle);
    const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    line.setAttribute('x1', x1); line.setAttribute('y1', y1);
    line.setAttribute('x2', x2); line.setAttribute('y2', y2);
    tickMarks.appendChild(line);
  }
}
 
function formatTime(secs) {
  const m = Math.floor(secs / 60).toString().padStart(2, '0');
  const s = (secs % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}
 
function updateDisplay() {
  timeDisplay.textContent   = formatTime(remaining);
  timeDisplay.setAttribute('aria-label', `${formatTime(remaining)} remaining`);
  updateRing();
}
 
function setMode(newMode) {
  mode      = newMode;
  totalSecs = (mode === 'focus' ? focusMins : breakMins) * 60;
  remaining = totalSecs;
 
  app.classList.toggle('break-mode', mode === 'break');
  modeBadge.textContent = mode === 'focus' ? 'FOCUS' : 'BREAK';
  updateDisplay();
}
 

function loadSettings() {
  try {
    const s = JSON.parse(localStorage.getItem(SETTINGS_KEY));
    if (s) {
      focusMins = s.focusMins || 25;
      breakMins = s.breakMins || 5;
      focusInput.value = focusMins;
      breakInput.value = breakMins;
    }
  } catch (e) {}
}
 
function saveSettings() {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify({ focusMins, breakMins }));
}
 
function startTimer() {
  status = 'running';
  app.classList.remove('paused');
  startBtn.setAttribute('aria-label', 'Pause timer');
  startBtn.classList.add('running');
  iconPlay.style.display  = 'none';
  iconPause.style.display = 'block';
 
  getAudioCtx();
 
  tickId = setInterval(() => {
    if (remaining <= 0) {
      clearInterval(tickId);
      handleCycleEnd();
      return;
    }
    remaining--;
    if (remaining === 0) {
      clearInterval(tickId);
      handleCycleEnd();
    } else {
      updateDisplay();
      if (remaining <= 10) playTick();
    }
  }, 1000);
}
 
function pauseTimer() {
  clearInterval(tickId);
  status = 'paused';
  app.classList.add('paused');
  startBtn.setAttribute('aria-label', 'Resume timer');
  startBtn.classList.remove('running');
  iconPlay.style.display  = 'block';
  iconPause.style.display = 'none';
}
 
function resetTimer() {
  clearInterval(tickId);
  status    = 'idle';
  remaining = totalSecs;
  app.classList.remove('paused');
  startBtn.classList.remove('running');
  startBtn.setAttribute('aria-label', 'Start timer');
  iconPlay.style.display  = 'block';
  iconPause.style.display = 'none';
  updateDisplay();
}
 
function handleCycleEnd() {
  const wasFocus = mode === 'focus';
  playDone(wasFocus);
 
  if (wasFocus) {
    addHistoryEntry(focusMins);
    showCompletionFlash('Focus session complete — take a break');
  } else {
    showCompletionFlash('Break over — back to focus');
  }
 
  status    = 'idle';
  startBtn.classList.remove('running');
  iconPlay.style.display  = 'block';
  iconPause.style.display = 'none';
  app.classList.remove('paused');
  startBtn.setAttribute('aria-label', 'Start timer');
 
  setTimeout(() => {
    setMode(wasFocus ? 'break' : 'focus');
    startTimer(); 
  }, 2200);
}
 
function skipSession() {
  clearInterval(tickId);
  const wasFocus = mode === 'focus';
  status    = 'idle';
  setMode(wasFocus ? 'break' : 'focus');
  startBtn.classList.remove('running');
  iconPlay.style.display  = 'block';
  iconPause.style.display = 'none';
  app.classList.remove('paused');
  startBtn.setAttribute('aria-label', 'Start timer');
}

function showCompletionFlash(msg) {
  completeText.textContent = msg;
  completeOverlay.setAttribute('aria-hidden', 'false');
  completeOverlay.classList.add('show');
 
  setTimeout(() => {
    completeOverlay.classList.replace('show', 'hide');
    setTimeout(() => {
      completeOverlay.classList.remove('hide');
      completeOverlay.setAttribute('aria-hidden', 'true');
    }, 350);
  }, 1800);
}
 
function todayKey() {
  const d = new Date();
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}
 
function loadHistory() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const data = JSON.parse(raw);
    if (data.date !== todayKey()) return [];
    return data.entries || [];
  } catch (e) { return []; }
}
 
function saveHistory(entries) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ date: todayKey(), entries }));
}
 
function addHistoryEntry(mins) {
  const entries = loadHistory();
  const now     = new Date();
  const timeStr = now.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  entries.push({ mins, timeStr, ts: Date.now() });
  saveHistory(entries);
  renderHistory(entries);
}
 
function renderHistory(entries) {
  historyEmpty.style.display = entries.length ? 'none' : 'block';
 
  historyList.querySelectorAll('.history-item').forEach(el => el.remove());
 
  entries.slice().reverse().forEach(entry => {
    const item = document.createElement('div');
    item.className = 'history-item';
    item.setAttribute('role', 'listitem');
    item.innerHTML = `
      <span class="history-check" aria-hidden="true">✓</span>
      <div class="history-info">
        <div>
          <span class="history-duration">${entry.mins < 10 ? '0' : ''}${entry.mins}:00</span>
          <span class="history-label"> focus</span>
        </div>
        <span class="history-time">${entry.timeStr}</span>
      </div>
    `;
    historyList.appendChild(item);
  });
 
  sessionNum.textContent = entries.length;
}
 
function setDateLabel() {
  const d    = new Date();
  const opts = { weekday: 'short', month: 'short', day: 'numeric' };
  historyDate.textContent = d.toLocaleDateString(undefined, opts);
}
 
startBtn.addEventListener('click', () => {
  if (status === 'idle' || status === 'paused') startTimer();
  else pauseTimer();
});
 
resetBtn.addEventListener('click', () => resetTimer());
skipBtn.addEventListener('click', () => skipSession());
 
settingsToggle.addEventListener('click', () => {
  const isHidden = settingsPanel.hasAttribute('hidden');
  if (isHidden) {
    settingsPanel.removeAttribute('hidden');
    settingsToggle.setAttribute('aria-expanded', 'true');
    focusInput.focus();
  } else {
    settingsPanel.setAttribute('hidden', '');
    settingsToggle.setAttribute('aria-expanded', 'false');
  }
});
 
applyBtn.addEventListener('click', () => {
  const newFocus = parseInt(focusInput.value, 10);
  const newBreak = parseInt(breakInput.value, 10);
  if (!newFocus || !newBreak || newFocus < 1 || newBreak < 1) return;
 
  focusMins = newFocus;
  breakMins = newBreak;
  saveSettings();
 
  clearInterval(tickId);
  status = 'idle';
  setMode('focus');
  startBtn.classList.remove('running');
  iconPlay.style.display  = 'block';
  iconPause.style.display = 'none';
  app.classList.remove('paused');
  startBtn.setAttribute('aria-label', 'Start timer');
 
  settingsPanel.setAttribute('hidden', '');
  settingsToggle.setAttribute('aria-expanded', 'false');
});
 
document.addEventListener('keydown', (e) => {
  if (['INPUT', 'BUTTON'].includes(e.target.tagName)) return;
  if (e.code === 'Space' || e.code === 'Enter') {
    e.preventDefault();
    startBtn.click();
  } else if (e.code === 'KeyR') {
    resetBtn.click();
  } else if (e.code === 'KeyS') {
    skipBtn.click();
  }
});
 
function init() {
  buildTicks();
  loadSettings();
  setMode('focus');
  setDateLabel();
  renderHistory(loadHistory());
}
init();
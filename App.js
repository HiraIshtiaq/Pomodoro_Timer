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
 

document.addEventListener('DOMContentLoaded', () => {
  // --- STATE MANAGEMENT ---
  const state = {
    currentView: 'view-dashboard',
    todos: JSON.parse(localStorage.getItem('eink_todos')) || [],
    quickNote: localStorage.getItem('eink_quick_note') || '',
    readerText: localStorage.getItem('eink_reader_text') || '',
    readerFontSerif: true,
    readerFontSize: 18,
    settings: {
      pureBW: localStorage.getItem('eink_setting_pure_bw') !== 'false',
      serif: localStorage.getItem('eink_setting_serif') === 'true',
      fontSize: localStorage.getItem('eink_setting_font_size') || 'medium'
    }
  };

  // --- DOM ELEMENTS ---
  const views = document.querySelectorAll('.view');
  const appCards = document.querySelectorAll('.app-card');
  const backButtons = document.querySelectorAll('.btn-back');
  const flashOverlay = document.getElementById('flash-overlay');

  // --- ROUTING / VIEW SWITCHING ---
  function navigateTo(viewId) {
    // Quick flash to simulate e-ink refresh and clear ghosting
    triggerEinkFlash(100);

    views.forEach(view => {
      if (view.id === viewId) {
        view.classList.add('active');
      } else {
        view.classList.remove('active');
      }
    });
    state.currentView = viewId;
    window.scrollTo(0, 0);
  }

  appCards.forEach(card => {
    card.addEventListener('click', () => {
      const target = card.getAttribute('data-target');
      navigateTo(target);
    });
  });

  backButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      navigateTo('view-dashboard');
    });
  });

  // --- ANTI-GHOSTING FLASH FUNCTION ---
  // Flashes screen Black -> White to reset physical e-ink particles
  function triggerEinkFlash(duration = 200, heavy = false) {
    flashOverlay.style.display = 'block';
    flashOverlay.style.backgroundColor = '#000000';
    
    setTimeout(() => {
      if (heavy) {
        // Heavy flash: Black -> White -> Black -> White
        flashOverlay.style.backgroundColor = '#ffffff';
        setTimeout(() => {
          flashOverlay.style.backgroundColor = '#000000';
          setTimeout(() => {
            flashOverlay.style.display = 'none';
          }, duration);
        }, duration);
      } else {
        flashOverlay.style.display = 'none';
      }
    }, duration);
  }

  document.getElementById('btn-refresh-screen').addEventListener('click', () => {
    triggerEinkFlash(250, true);
  });

  // --- CLOCK & DATE ---
  function updateClock() {
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const year = now.getFullYear();

    document.getElementById('current-time').textContent = `${hours}:${minutes}`;
    document.getElementById('current-date').textContent = `${day}/${month}/${year}`;
  }
  setInterval(updateClock, 60000); // Update every minute to save battery/refresh
  updateClock();

  // --- QUICK NOTE WIDGET ---
  const quickNoteInput = document.getElementById('quick-note-input');
  quickNoteInput.value = state.quickNote;
  quickNoteInput.addEventListener('input', (e) => {
    state.quickNote = e.target.value;
    localStorage.setItem('eink_quick_note', state.quickNote);
  });

  // --- APP 1: TODO LIST ---
  const todoInput = document.getElementById('todo-input');
  const todoAddBtn = document.getElementById('todo-add-btn');
  const todoList = document.getElementById('todo-list');
  const todoClearBtn = document.getElementById('todo-clear-completed');

  function renderTodos() {
    todoList.innerHTML = '';
    state.todos.forEach((todo, index) => {
      const li = document.createElement('li');
      li.textContent = todo.text;
      if (todo.completed) {
        li.classList.add('completed');
      }
      li.addEventListener('click', () => {
        state.todos[index].completed = !state.todos[index].completed;
        saveTodos();
        renderTodos();
      });
      todoList.appendChild(li);
    });
  }

  function saveTodos() {
    localStorage.setItem('eink_todos', JSON.stringify(state.todos));
  }

  todoAddBtn.addEventListener('click', () => {
    const text = todoInput.value.trim();
    if (text) {
      state.todos.push({ text, completed: false });
      todoInput.value = '';
      saveTodos();
      renderTodos();
    }
  });

  todoClearBtn.addEventListener('click', () => {
    state.todos = state.todos.filter(t => !t.completed);
    saveTodos();
    renderTodos();
  });

  renderTodos();

  // --- APP 2: READER (TEXT SAVER) ---
  const readerTextInput = document.getElementById('reader-text-input');
  const readerLoadBtn = document.getElementById('reader-load-btn');
  const readerEditBtn = document.getElementById('reader-edit-btn');
  const readerInputView = document.getElementById('reader-input-view');
  const readerContentView = document.getElementById('reader-content-view');
  const readerTextDisplay = document.getElementById('reader-text-display');
  const readerFontToggle = document.getElementById('reader-font-toggle');
  const readerSizeDec = document.getElementById('reader-size-dec');
  const readerSizeInc = document.getElementById('reader-size-inc');

  // Load initial text if exists
  if (state.readerText) {
    readerTextInput.value = state.readerText;
    showReaderContent();
  }

  function showReaderContent() {
    const text = readerTextInput.value.trim();
    if (text) {
      state.readerText = text;
      localStorage.setItem('eink_reader_text', text);
      readerTextDisplay.textContent = text;
      readerInputView.classList.add('hidden');
      readerContentView.classList.remove('hidden');
    }
  }

  readerLoadBtn.addEventListener('click', showReaderContent);

  readerEditBtn.addEventListener('click', () => {
    readerContentView.classList.add('hidden');
    readerInputView.classList.remove('hidden');
  });

  readerFontToggle.addEventListener('click', () => {
    state.readerFontSerif = !state.readerFontSerif;
    if (state.readerFontSerif) {
      readerTextDisplay.className = 'serif-font';
    } else {
      readerTextDisplay.className = 'sans-font';
    }
  });

  function updateReaderFontSize() {
    readerTextDisplay.style.fontSize = `${state.readerFontSize}px`;
  }

  readerSizeDec.addEventListener('click', () => {
    if (state.readerFontSize > 12) {
      state.readerFontSize -= 2;
      updateReaderFontSize();
    }
  });

  readerSizeInc.addEventListener('click', () => {
    if (state.readerFontSize < 36) {
      state.readerFontSize += 2;
      updateReaderFontSize();
    }
  });

  updateReaderFontSize();

  // --- APP 3: FOCUS TIMER (POMODORO) ---
  let timerInterval = null;
  let timerSecondsLeft = 25 * 60;
  let timerIsRunning = false;
  const timerDisplay = document.getElementById('timer-display');
  const timerLabel = document.getElementById('timer-label');
  const timerStartBtn = document.getElementById('timer-start-btn');
  const timerPauseBtn = document.getElementById('timer-pause-btn');
  const timerResetBtn = document.getElementById('timer-reset-btn');
  const presetButtons = document.querySelectorAll('.preset-btn');

  function updateTimerDisplay() {
    const mins = String(Math.floor(timerSecondsLeft / 60)).padStart(2, '0');
    const secs = String(timerSecondsLeft % 60).padStart(2, '0');
    timerDisplay.textContent = `${mins}:${secs}`;
  }

  function startTimer() {
    if (timerIsRunning) return;
    timerIsRunning = true;
    timerStartBtn.classList.add('hidden');
    timerPauseBtn.classList.remove('hidden');
    
    timerInterval = setInterval(() => {
      if (timerSecondsLeft > 0) {
        timerSecondsLeft--;
        // Only update UI every 1 second. E-ink handles this fine, 
        // but we keep layout static to avoid full page flashes.
        updateTimerDisplay();
      } else {
        clearInterval(timerInterval);
        timerIsRunning = false;
        timerStartBtn.classList.remove('hidden');
        timerPauseBtn.classList.add('hidden');
        alert('Temps écoulé !');
        triggerEinkFlash(300, true);
      }
    }, 1000);
  }

  function pauseTimer() {
    clearInterval(timerInterval);
    timerIsRunning = false;
    timerStartBtn.classList.remove('hidden');
    timerPauseBtn.classList.add('hidden');
  }

  function resetTimer() {
    pauseTimer();
    timerSecondsLeft = 25 * 60;
    timerLabel.textContent = 'Travail';
    updateTimerDisplay();
  }

  timerStartBtn.addEventListener('click', startTimer);
  timerPauseBtn.addEventListener('click', pauseTimer);
  timerResetBtn.addEventListener('click', resetTimer);

  presetButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      pauseTimer();
      const mins = parseInt(btn.getAttribute('data-minutes'));
      timerSecondsLeft = mins * 60;
      timerLabel.textContent = btn.textContent.split(' ')[0];
      updateTimerDisplay();
    });
  });

  updateTimerDisplay();

  // --- APP 4: CALCULATOR ---
  const calcDisplay = document.getElementById('calc-display');
  const calcButtons = document.querySelectorAll('.calc-btn');
  let calcExpression = '';

  calcButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const val = btn.getAttribute('data-val');
      
      if (val === 'C') {
        calcExpression = '';
        calcDisplay.textContent = '0';
      } else if (val === 'back') {
        calcExpression = calcExpression.slice(0, -1);
        calcDisplay.textContent = calcExpression || '0';
      } else if (val === '=') {
        try {
          if (calcExpression) {
            // Safe evaluation of simple math expressions
            const result = Function(`"use strict"; return (${calcExpression})`)();
            calcExpression = String(result);
            calcDisplay.textContent = calcExpression;
          }
        } catch (err) {
          calcDisplay.textContent = 'Erreur';
          calcExpression = '';
        }
      } else {
        if (calcDisplay.textContent === '0' && !isNaN(val)) {
          calcExpression = val;
        } else {
          calcExpression += val;
        }
        calcDisplay.textContent = calcExpression;
      }
    });
  });

  // --- APP 5: SETTINGS & CUSTOMIZATION ---
  const settingPureBW = document.getElementById('setting-pure-bw');
  const settingSerif = document.getElementById('setting-serif');
  const settingFontSize = document.getElementById('setting-font-size');
  const btnFlashHeavy = document.getElementById('btn-flash-heavy');

  function applySettings() {
    // Pure Black & White
    if (state.settings.pureBW) {
      document.body.classList.add('pure-bw');
    } else {
      document.body.classList.remove('pure-bw');
    }

    // Global Serif Font
    if (state.settings.serif) {
      document.body.classList.add('global-serif');
      document.body.classList.remove('global-sans');
    } else {
      document.body.classList.add('global-sans');
      document.body.classList.remove('global-serif');
    }

    // Global Font Size
    document.body.classList.remove('font-small', 'font-medium', 'font-large', 'font-xlarge');
    document.body.classList.add(`font-${state.settings.fontSize}`);

    // Sync UI controls
    settingPureBW.checked = state.settings.pureBW;
    settingSerif.checked = state.settings.serif;
    settingFontSize.value = state.settings.fontSize;
  }

  settingPureBW.addEventListener('change', (e) => {
    state.settings.pureBW = e.target.checked;
    localStorage.setItem('eink_setting_pure_bw', state.settings.pureBW);
    applySettings();
  });

  settingSerif.addEventListener('change', (e) => {
    state.settings.serif = e.target.checked;
    localStorage.setItem('eink_setting_serif', state.settings.serif);
    applySettings();
  });

  settingFontSize.addEventListener('change', (e) => {
    state.settings.fontSize = e.target.value;
    localStorage.setItem('eink_setting_font_size', state.settings.fontSize);
    applySettings();
  });

  btnFlashHeavy.addEventListener('click', () => {
    triggerEinkFlash(400, true);
  });

  // Initialize settings
  applySettings();
});

// --- REGISTER SERVICE WORKER ---
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('sw.js')
      .then(reg => console.log('Service Worker enregistré !', reg))
      .catch(err => console.err('Erreur d\'enregistrement du SW', err));
  });
}
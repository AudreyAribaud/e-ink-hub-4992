document.addEventListener('DOMContentLoaded', () => {
  // --- STATE MANAGEMENT ---
  const state = {
    currentSection: 'games-section',
    currentGame: 'binairo',
    fontSize: 16,
    binairoGrid: [],
    roguePlayer: { x: 0, y: 0 },
    rogueKey: { x: 0, y: 0 },
    rogueDoor: { x: 0, y: 0 },
    rogueTraps: [],
    rogueSteps: 0,
    rogueGameOver: false,
    pomoTime: 1500, // 25 mins
    pomoInterval: null,
    pomoRunning: false
  };

  // --- DOM ELEMENTS ---
  const navButtons = document.querySelectorAll('.nav-btn');
  const sections = document.querySelectorAll('.app-section');
  const gameTabs = document.querySelectorAll('.game-tab');
  const gameContainers = document.querySelectorAll('.game-container');
  const refreshBtn = document.getElementById('refresh-btn');
  const flashOverlay = document.getElementById('eink-flash');
  const timeDisplay = document.getElementById('current-time');

  // --- E-INK REFRESH SIMULATION ---
  function triggerEinkRefresh() {
    flashOverlay.classList.add('flash-active');
    setTimeout(() => {
      flashOverlay.classList.remove('flash-active');
    }, 400);
  }

  refreshBtn.addEventListener('click', triggerEinkRefresh);

  // --- CLOCK ---
  function updateClock() {
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    timeDisplay.textContent = `${hours}:${minutes}`;
  }
  setInterval(updateClock, 10000);
  updateClock();

  // --- NAVIGATION ---
  navButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const target = btn.getAttribute('data-target');
      navButtons.forEach(b => b.classList.remove('active'));
      sections.forEach(s => s.classList.remove('active'));

      btn.classList.add('active');
      document.getElementById(target).classList.add('active');
      
      // Simulate e-ink refresh on page change
      triggerEinkRefresh();
    });
  });

  // --- GAME SELECTOR ---
  gameTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const targetGame = tab.getAttribute('data-game');
      gameTabs.forEach(t => t.classList.remove('active'));
      gameContainers.forEach(c => c.classList.remove('active'));

      tab.classList.add('active');
      document.getElementById(`game-${targetGame}`).classList.add('active');
      
      triggerEinkRefresh();
      if (targetGame === 'binairo') initBinairo();
      if (targetGame === 'rogue') initRogue();
    });
  });

  // ==========================================
  // GAME 1: BINAIRO (BINARY PUZZLE)
  // ==========================================
  const binairoBoard = document.getElementById('binairo-board');
  const checkBinairoBtn = document.getElementById('check-binairo');
  const resetBinairoBtn = document.getElementById('reset-binairo');
  const binairoFeedback = document.getElementById('binairo-feedback');

  // Simple 6x6 puzzle template (0 = White, 1 = Black, null = Empty)
  const binairoSolution = [
    [1, 0, 1, 0, 0, 1],
    [0, 1, 0, 1, 1, 0],
    [1, 1, 0, 0, 1, 0],
    [0, 0, 1, 1, 0, 1],
    [1, 0, 1, 0, 1, 0],
    [0, 1, 0, 1, 0, 1]
  ];

  const binairoInitial = [
    [1, null, null, 0, null, 1],
    [null, 1, null, null, 1, null],
    [1, null, 0, null, null, 0],
    [null, 0, null, 1, null, null],
    [null, null, 1, null, 1, null],
    [0, null, null, 1, null, 1]
  ];

  function initBinairo() {
    binairoBoard.innerHTML = '';
    state.binairoGrid = JSON.parse(JSON.stringify(binairoInitial));
    binairoFeedback.textContent = '';

    for (let r = 0; r < 6; r++) {
      for (let c = 0; c < 6; c++) {
        const cell = document.createElement('div');
        cell.classList.add('binairo-cell');
        
        const val = state.binairoGrid[r][c];
        if (val !== null) {
          cell.textContent = val === 1 ? '⬛' : '⬜';
          cell.classList.add('locked');
        } else {
          cell.textContent = '';
          cell.addEventListener('click', () => toggleBinairoCell(r, c, cell));
        }
        binairoBoard.appendChild(cell);
      }
    }
  }

  function toggleBinairoCell(r, c, cellElement) {
    let currentVal = state.binairoGrid[r][c];
    if (currentVal === null) {
      state.binairoGrid[r][c] = 0; // White
      cellElement.textContent = '⬜';
    } else if (currentVal === 0) {
      state.binairoGrid[r][c] = 1; // Black
      cellElement.textContent = '⬛';
    } else {
      state.binairoGrid[r][c] = null; // Empty
      cellElement.textContent = '';
    }
  }

  checkBinairoBtn.addEventListener('click', () => {
    let correct = true;
    let complete = true;

    for (let r = 0; r < 6; r++) {
      for (let c = 0; c < 6; c++) {
        if (state.binairoGrid[r][c] === null) {
          complete = false;
        } else if (state.binairoGrid[r][c] !== binairoSolution[r][c]) {
          correct = false;
        }
      }
    }

    if (!complete) {
      binairoFeedback.textContent = 'Grille incomplète !';
    } else if (correct) {
      binairoFeedback.textContent = 'Félicitations ! Grille correcte.';
    } else {
      binairoFeedback.textContent = 'Il y a des erreurs dans la grille.';
    }
  });

  resetBinairoBtn.addEventListener('click', initBinairo);

  // ==========================================
  // GAME 2: E-INK QUEST (MICRO-ROGUE)
  // ==========================================
  const rogueBoard = document.getElementById('rogue-board');
  const rogueStepsDisp = document.getElementById('rogue-steps');
  const rogueStatusDisp = document.getElementById('rogue-status');
  const resetRogueBtn = document.getElementById('reset-rogue');
  const GRID_SIZE = 8;

  function initRogue() {
    state.roguePlayer = { x: 0, y: 7 };
    state.rogueKey = { x: 4, y: 2 };
    state.rogueDoor = { x: 7, y: 0 };
    state.rogueTraps = [
      { x: 2, y: 5 }, { x: 5, y: 5 }, { x: 3, y: 3 }, { x: 6, y: 2 }
    ];
    state.rogueSteps = 0;
    state.rogueGameOver = false;
    state.hasKey = false;
    
    rogueStepsDisp.textContent = '0';
    rogueStatusDisp.textContent = 'En exploration...';
    renderRogueBoard();
  }

  function renderRogueBoard() {
    rogueBoard.innerHTML = '';
    for (let y = 0; y < GRID_SIZE; y++) {
      for (let x = 0; x < GRID_SIZE; x++) {
        const cell = document.createElement('div');
        cell.classList.add('rogue-cell');

        if (state.roguePlayer.x === x && state.roguePlayer.y === y) {
          cell.textContent = '▲'; // Player
        } else if (state.rogueDoor.x === x && state.rogueDoor.y === y) {
          cell.textContent = state.hasKey ? '🔓' : '🚪';
        } else if (state.rogueKey.x === x && state.rogueKey.y === y && !state.hasKey) {
          cell.textContent = '🔑';
        } else if (state.rogueTraps.some(t => t.x === x && t.y === y)) {
          cell.textContent = '☠️';
        } else {
          cell.textContent = '·';
        }
        rogueBoard.appendChild(cell);
      }
    }
  }

  function movePlayer(dx, dy) {
    if (state.rogueGameOver) return;

    const newX = state.roguePlayer.x + dx;
    const newY = state.roguePlayer.y + dy;

    // Boundary check
    if (newX >= 0 && newX < GRID_SIZE && newY >= 0 && newY < GRID_SIZE) {
      state.roguePlayer.x = newX;
      state.roguePlayer.y = newY;
      state.rogueSteps++;
      rogueStepsDisp.textContent = state.rogueSteps;

      // Check Key
      if (state.roguePlayer.x === state.rogueKey.x && state.roguePlayer.y === state.rogueKey.y && !state.hasKey) {
        state.hasKey = true;
        rogueStatusDisp.textContent = 'Clé trouvée ! Allez à la porte.';
      }

      // Check Trap
      if (state.rogueTraps.some(t => t.x === state.roguePlayer.x && t.y === state.roguePlayer.y)) {
        state.rogueGameOver = true;
        rogueStatusDisp.textContent = 'Perdu ! Vous avez touché un piège.';
      }

      // Check Door
      if (state.roguePlayer.x === state.rogueDoor.x && state.roguePlayer.y === state.rogueDoor.y) {
        if (state.hasKey) {
          state.rogueGameOver = true;
          rogueStatusDisp.textContent = `Gagné en ${state.rogueSteps} pas !`;
        } else {
          rogueStatusDisp.textContent = 'La porte est fermée. Trouvez la clé !';
        }
      }

      renderRogueBoard();
    }
  }

  // D-Pad Event Listeners
  document.getElementById('btn-up').addEventListener('click', () => movePlayer(0, -1));
  document.getElementById('btn-down').addEventListener('click', () => movePlayer(0, 1));
  document.getElementById('btn-left').addEventListener('click', () => movePlayer(-1, 0));
  document.getElementById('btn-right').addEventListener('click', () => movePlayer(1, 0));
  resetRogueBtn.addEventListener('click', initRogue);

  // Keyboard support for Rogue
  document.addEventListener('keydown', (e) => {
    if (document.getElementById('games-section').classList.contains('active') && 
        document.getElementById('game-rogue').classList.contains('active')) {
      if (e.key === 'ArrowUp') movePlayer(0, -1);
      if (e.key === 'ArrowDown') movePlayer(0, 1);
      if (e.key === 'ArrowLeft') movePlayer(-1, 0);
      if (e.key === 'ArrowRight') movePlayer(1, 0);
    }
  });

  // ==========================================
  // GAME 3: HAIKU CREATOR
  // ==========================================
  const haikuWords = document.getElementById('haiku-words');
  const newInspirationBtn = document.getElementById('new-inspiration-btn');
  const saveHaikuBtn = document.getElementById('save-haiku-btn');
  const clearHaikuBtn = document.getElementById('clear-haiku-btn');
  const haikuFeedback = document.getElementById('haiku-feedback');

  const inspirations = [
    ['Silence', 'Vent', 'Ombre'],
    ['Lune', 'Rivière', 'Brume'],
    ['Neige', 'Corbeau', 'Froid'],
    ['Fleur', 'Rosée', 'Matin'],
    ['Automne', 'Feuille', 'Chemin']
  ];

  function generateInspiration() {
    const rand = inspirations[Math.floor(Math.random() * inspirations.length)];
    haikuWords.textContent = rand.join(', ');
  }

  newInspirationBtn.addEventListener('click', generateInspiration);
  
  saveHaikuBtn.addEventListener('click', () => {
    const l1 = document.getElementById('haiku-line1').value.trim();
    const l2 = document.getElementById('haiku-line2').value.trim();
    const l3 = document.getElementById('haiku-line3').value.trim();

    if (!l1 || !l2 || !l3) {
      haikuFeedback.textContent = 'Veuillez remplir les 3 vers.';
      return;
    }

    const fullHaiku = `Haiku :
${l1}
${l2}
${l3}`;
    saveNoteToStorage(fullHaiku);
    haikuFeedback.textContent = 'Haiku enregistré dans votre Journal !';
    
    // Clear inputs
    document.getElementById('haiku-line1').value = '';
    document.getElementById('haiku-line2').value = '';
    document.getElementById('haiku-line3').value = '';
  });

  clearHaikuBtn.addEventListener('click', () => {
    document.getElementById('haiku-line1').value = '';
    document.getElementById('haiku-line2').value = '';
    document.getElementById('haiku-line3').value = '';
    haikuFeedback.textContent = '';
  });

  // ==========================================
  // READER UTILITY
  // ==========================================
  const textSelector = document.getElementById('text-selector');
  const readerContent = document.getElementById('reader-content');
  const increaseFontBtn = document.getElementById('increase-font');
  const decreaseFontBtn = document.getElementById('decrease-font');

  const texts = {
    pensee: `"Tout ce qui arrive arrive de manière juste. Tu le trouveras si tu observes avec attention. Je ne dis pas seulement selon la suite des choses, mais selon la justice, et comme si quelqu'un distribuait à chacun selon son mérite."

"Ne te laisse pas distraire par les événements extérieurs ! Prends le temps d'apprendre quelque chose de bon et cesse de papillonner."

- Marc Aurèle, Pensées pour moi-même`,
    corbeau: `Une fois, sur le minuit lugubre, tandis que je méditais, faible et fatigué, sur maint précieux et curieux volume d’une doctrine oubliée, tandis que je balançais la tête, presque endormi, soudain il se fit un tapotement, comme de quelqu’un frappant doucement, frappant à la porte de ma chambre.

« C’est quelque visiteur », murmurai-je, « qui frappe à la porte de ma chambre, — cela seul, et rien de plus. »

- Edgar Allan Poe, Le Corbeau`,
    "art-guerre": `"L'art de la guerre, c'est de soumettre l'ennemi sans combat."

"Connais ton ennemi et connais-toi toi-même ; eusses-tu cent combats à soutenir, cent fois tu serais victorieux."

"Au milieu du chaos, il y a aussi une opportunité."

- Sun Tzu, L'Art de la Guerre`
  };

  function loadText() {
    const selected = textSelector.value;
    readerContent.textContent = texts[selected] || '';
  }

  textSelector.addEventListener('change', loadText);
  
  increaseFontBtn.addEventListener('click', () => {
    state.fontSize += 2;
    readerContent.style.fontSize = `${state.fontSize}px`;
  });

  decreaseFontBtn.addEventListener('click', () => {
    if (state.fontSize > 12) {
      state.fontSize -= 2;
      readerContent.style.fontSize = `${state.fontSize}px`;
    }
  });

  // ==========================================
  // JOURNAL UTILITY
  // ==========================================
  const journalInput = document.getElementById('journal-input');
  const saveNoteBtn = document.getElementById('save-note-btn');
  const clearNotesBtn = document.getElementById('clear-notes-btn');
  const savedNotesList = document.getElementById('saved-notes-list');

  function saveNoteToStorage(text) {
    const notes = JSON.parse(localStorage.getItem('eink_notes') || '[]');
    notes.unshift({
      id: Date.now(),
      date: new Date().toLocaleString('fr-FR'),
      content: text
    });
    localStorage.setItem('eink_notes', JSON.stringify(notes));
    renderNotes();
  }

  saveNoteBtn.addEventListener('click', () => {
    const text = journalInput.value.trim();
    if (text) {
      saveNoteToStorage(text);
      journalInput.value = '';
    }
  });

  clearNotesBtn.addEventListener('click', () => {
    if (confirm('Voulez-vous vraiment supprimer toutes vos notes ?')) {
      localStorage.removeItem('eink_notes');
      renderNotes();
    }
  });

  function renderNotes() {
    savedNotesList.innerHTML = '';
    const notes = JSON.parse(localStorage.getItem('eink_notes') || '[]');
    notes.forEach(note => {
      const noteEl = document.createElement('div');
      noteEl.classList.add('note-item');
      noteEl.innerHTML = `
        <div class="note-date">${note.date}</div>
        <div style="white-space: pre-line;">${note.content}</div>
        <button class="delete-note" data-id="${note.id}">✕</button>
      `;
      savedNotesList.appendChild(noteEl);
    });

    // Add delete listeners
    document.querySelectorAll('.delete-note').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = parseInt(e.target.getAttribute('data-id'));
        let notes = JSON.parse(localStorage.getItem('eink_notes') || '[]');
        notes = notes.filter(n => n.id !== id);
        localStorage.setItem('eink_notes', JSON.stringify(notes));
        renderNotes();
      });
    });
  }

  // ==========================================
  // TOOLS: POMODORO & THEMES
  // ==========================================
  const pomoDisplay = document.getElementById('pomo-display');
  const pomoStart = document.getElementById('pomo-start');
  const pomoPause = document.getElementById('pomo-pause');
  const pomoReset = document.getElementById('pomo-reset');

  function updatePomoDisplay() {
    const mins = String(Math.floor(state.pomoTime / 60)).padStart(2, '0');
    const secs = String(state.pomoTime % 60).padStart(2, '0');
    pomoDisplay.textContent = `${mins}:${secs}`;
  }

  pomoStart.addEventListener('click', () => {
    if (state.pomoRunning) return;
    state.pomoRunning = true;
    state.pomoInterval = setInterval(() => {
      if (state.pomoTime > 0) {
        state.pomoTime--;
        updatePomoDisplay();
      } else {
        clearInterval(state.pomoInterval);
        state.pomoRunning = false;
        alert('Session de concentration terminée ! Prenez une pause.');
        state.pomoTime = 1500;
        updatePomoDisplay();
      }
    }, 1000);
  });

  pomoPause.addEventListener('click', () => {
    clearInterval(state.pomoInterval);
    state.pomoRunning = false;
  });

  pomoReset.addEventListener('click', () => {
    clearInterval(state.pomoInterval);
    state.pomoRunning = false;
    state.pomoTime = 1500;
    updatePomoDisplay();
  });

  // Theme Switcher
  const themeRadios = document.querySelectorAll('input[name="theme-select"]');
  themeRadios.forEach(radio => {
    radio.addEventListener('change', (e) => {
      const theme = e.target.value;
      document.body.className = ''; // Reset
      if (theme !== 'classic-eink') {
        document.body.classList.add(`theme-${theme}`);
      }
      triggerEinkRefresh();
    });
  });

  // --- INITIALIZATION ---
  initBinairo();
  initRogue();
  generateInspiration();
  loadText();
  renderNotes();
  updatePomoDisplay();
});

// --- SERVICE WORKER REGISTRATION ---
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('sw.js')
      .then(reg => console.log('Service Worker enregistré !', reg))
      .catch(err => console.log('Erreur d\'enregistrement du Service Worker :', err));
  });
}
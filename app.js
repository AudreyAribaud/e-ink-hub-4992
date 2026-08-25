document.addEventListener('DOMContentLoaded', () => {
  // --- STATE MANAGEMENT ---
  const state = {
    currentView: 'home',
    theme: 'light',
    hitori: {
      level: 0,
      grid: [],
      userStates: [] // 0: normal, 1: shaded, 2: circled
    },
    binary: {
      level: 0,
      grid: [],
      userGrid: [] // null, 0, 1
    },
    cryptogram: {
      level: 0,
      cipherMap: {},
      userDecryption: {}, // cipherChar -> plainChar
      selectedCipherChar: null
    }
  };

  // --- DATASETS (Offline levels) ---
  const HITORI_LEVELS = [
    {
      size: 5,
      grid: [
        [2, 2, 1, 5, 3],
        [2, 3, 1, 4, 5],
        [1, 1, 3, 2, 4],
        [5, 4, 2, 3, 1],
        [3, 5, 4, 1, 2]
      ]
    },
    {
      size: 5,
      grid: [
        [1, 2, 4, 1, 3],
        [3, 4, 2, 5, 1],
        [2, 5, 1, 3, 4],
        [2, 1, 3, 4, 5],
        [4, 3, 5, 2, 2]
      ]
    },
    {
      size: 5,
      grid: [
        [4, 1, 2, 3, 2],
        [1, 3, 3, 2, 5],
        [2, 2, 4, 1, 3],
        [5, 4, 1, 3, 2],
        [3, 2, 5, 4, 1]
      ]
    }
  ];

  const BINARY_LEVELS = [
    {
      size: 6,
      // null represents empty cells, numbers are pre-filled
      grid: [
        [1, null, null, null, 0, null],
        [null, 0, 0, null, null, 1],
        [null, null, null, 1, null, null],
        [0, null, 1, null, null, 0],
        [null, 1, null, null, 0, null],
        [null, null, 0, 0, null, null]
      ]
    },
    {
      size: 6,
      grid: [
        [null, 1, null, null, 1, null],
        [null, null, 0, 0, null, null],
        [1, null, null, null, null, 0],
        [null, 0, null, null, 1, null],
        [null, null, 1, 1, null, null],
        [0, null, null, null, 0, null]
      ]
    },
    {
      size: 6,
      grid: [
        [0, null, null, 0, null, null],
        [null, null, 1, null, null, 1],
        [null, 0, null, null, 0, null],
        [1, null, null, 1, null, null],
        [null, null, 0, null, null, 0],
        [0, null, null, 0, null, null]
      ]
    }
  ];

  const CRYPTO_LEVELS = [
    {
      quote: "LE SAVOIR EST LA SEULE RICHESSE QUE L'ON PEUT PARTAGER SANS L'AMOINDRIR.",
      author: "PROVERBE"
    },
    {
      quote: "RIEN NE SE PERD, RIEN NE SE CREE, TOUT SE TRANSFORME.",
      author: "LAVOISIER"
    },
    {
      quote: "LA LOGIQUE VOUS MENERA DE A A B. L'IMAGINATION VOUS EMMENERA PARTOUT.",
      author: "EINSTEIN"
    }
  ];

  // --- DOM ELEMENTS ---
  const views = {
    home: document.getElementById('view-home'),
    hitori: document.getElementById('view-hitori'),
    binary: document.getElementById('view-binary'),
    cryptogram: document.getElementById('view-cryptogram'),
    help: document.getElementById('view-help')
  };

  const themeToggle = document.getElementById('theme-toggle');
  const btnHome = document.getElementById('btn-home');
  const btnHelp = document.getElementById('btn-help');
  const btnRulesBack = document.getElementById('btn-rules-back');

  // --- ROUTER / VIEW NAVIGATION ---
  function switchView(viewName) {
    state.currentView = viewName;
    Object.keys(views).forEach(key => {
      if (key === viewName) {
        views[key].classList.add('active');
      } else {
        views[key].classList.remove('active');
      }
    });

    // Update nav buttons state
    if (viewName === 'home') {
      btnHome.classList.add('active');
      btnHelp.classList.remove('active');
    } else if (viewName === 'help') {
      btnHome.classList.remove('active');
      btnHelp.classList.add('active');
    } else {
      btnHome.classList.remove('active');
      btnHelp.classList.remove('active');
    }

    // Initialize game if switched to a game view
    if (viewName === 'hitori') initHitori();
    if (viewName === 'binary') initBinary();
    if (viewName === 'cryptogram') initCryptogram();
  }

  // --- THEME MANAGEMENT (E-INK FRIENDLY) ---
  function toggleTheme() {
    state.theme = state.theme === 'light' ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', state.theme);
    localStorage.setItem('eink-theme', state.theme);
  }

  // Load saved theme
  const savedTheme = localStorage.getItem('eink-theme');
  if (savedTheme) {
    state.theme = savedTheme;
    document.documentElement.setAttribute('data-theme', savedTheme);
  }

  // --- EVENT LISTENERS (NAV) ---
  themeToggle.addEventListener('click', toggleTheme);
  btnHome.addEventListener('click', () => switchView('home'));
  btnHelp.addEventListener('click', () => switchView('help'));
  btnRulesBack.addEventListener('click', () => switchView('home'));

  document.querySelectorAll('.game-card').forEach(card => {
    card.addEventListener('click', () => {
      const game = card.getAttribute('data-game');
      switchView(game);
    });
  });

  document.querySelectorAll('.btn-back').forEach(btn => {
    btn.addEventListener('click', () => switchView('home'));
  });

  // --- GAME 1: HITORI ---
  const hitoriGridEl = document.getElementById('hitori-grid');
  const hitoriStatusEl = document.getElementById('hitori-status');
  const hitoriLevelIndicator = document.getElementById('hitori-level-indicator');

  function initHitori() {
    const levelData = HITORI_LEVELS[state.hitori.level];
    hitoriLevelIndicator.textContent = `Niveau ${state.hitori.level + 1}`;
    hitoriStatusEl.textContent = "";
    hitoriGridEl.innerHTML = "";
    hitoriGridEl.style.gridTemplateColumns = `repeat(${levelData.size}, 1fr)`;

    state.hitori.grid = levelData.grid;
    state.hitori.userStates = Array(levelData.size).fill(null).map(() => Array(levelData.size).fill(0));

    for (let r = 0; r < levelData.size; r++) {
      for (let c = 0; c < levelData.size; c++) {
        const cell = document.createElement('div');
        cell.classList.add('grid-cell');
        cell.textContent = levelData.grid[r][c];
        cell.dataset.row = r;
        cell.dataset.col = c;

        cell.addEventListener('click', () => {
          let currentState = state.hitori.userStates[r][c];
          let nextState = (currentState + 1) % 3; // 0 -> 1 -> 2 -> 0
          state.hitori.userStates[r][c] = nextState;

          cell.classList.remove('hitori-shaded', 'hitori-circled');
          if (nextState === 1) {
            cell.classList.add('hitori-shaded');
          } else if (nextState === 2) {
            cell.classList.add('hitori-circled');
          }
        });

        hitoriGridEl.appendChild(cell);
      }
    }
  }

  document.getElementById('hitori-prev').addEventListener('click', () => {
    if (state.hitori.level > 0) {
      state.hitori.level--;
      initHitori();
    }
  });

  document.getElementById('hitori-next').addEventListener('click', () => {
    if (state.hitori.level < HITORI_LEVELS.length - 1) {
      state.hitori.level++;
      initHitori();
    }
  });

  document.getElementById('hitori-reset').addEventListener('click', initHitori);

  document.getElementById('hitori-verify').addEventListener('click', () => {
    const size = HITORI_LEVELS[state.hitori.level].size;
    const grid = state.hitori.grid;
    const states = state.hitori.userStates;

    // Rule 1: No duplicate numbers in any row/col among unshaded cells
    for (let r = 0; r < size; r++) {
      let rowVals = {};
      for (let c = 0; c < size; c++) {
        if (states[r][c] !== 1) { // not shaded
          let val = grid[r][c];
          if (rowVals[val]) {
            hitoriStatusEl.textContent = "Erreur : Doublon détecté sur une ligne.";
            return;
          }
          rowVals[val] = true;
        }
      }
    }

    for (let c = 0; c < size; c++) {
      let colVals = {};
      for (let r = 0; r < size; r++) {
        if (states[r][c] !== 1) { // not shaded
          let val = grid[r][c];
          if (colVals[val]) {
            hitoriStatusEl.textContent = "Erreur : Doublon détecté sur une colonne.";
            return;
          }
          colVals[val] = true;
        }
      }
    }

    // Rule 2: Shaded cells cannot be adjacent horizontally or vertically
    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        if (states[r][c] === 1) {
          if (r > 0 && states[r-1][c] === 1) {
            hitoriStatusEl.textContent = "Erreur : Deux cases noires se touchent.";
            return;
          }
          if (c > 0 && states[r][c-1] === 1) {
            hitoriStatusEl.textContent = "Erreur : Deux cases noires se touchent.";
            return;
          }
        }
      }
    }

    // Rule 3: All unshaded cells must be connected
    let unshadedCount = 0;
    let startR = -1, startC = -1;
    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        if (states[r][c] !== 1) {
          unshadedCount++;
          if (startR === -1) {
            startR = r;
            startC = c;
          }
        }
      }
    }

    // Flood fill to check connectivity
    let visited = Array(size).fill(null).map(() => Array(size).fill(false));
    let queue = [[startR, startC]];
    visited[startR][startC] = true;
    let visitedCount = 0;

    while (queue.length > 0) {
      let [currR, currC] = queue.shift();
      visitedCount++;

      const dirs = [[-1,0], [1,0], [0,-1], [0,1]];
      for (let [dr, dc] of dirs) {
        let nr = currR + dr;
        let nc = currC + dc;
        if (nr >= 0 && nr < size && nc >= 0 && nc < size) {
          if (!visited[nr][nc] && states[nr][nc] !== 1) {
            visited[nr][nc] = true;
            queue.push([nr, nc]);
          }
        }
      }
    }

    if (visitedCount !== unshadedCount) {
      hitoriStatusEl.textContent = "Erreur : Des cases blanches sont isolées.";
      return;
    }

    hitoriStatusEl.textContent = "Félicitations ! Grille résolue avec succès.";
  });


  // --- GAME 2: BINARY GRID ---
  const binaryGridEl = document.getElementById('binary-grid');
  const binaryStatusEl = document.getElementById('binary-status');
  const binaryLevelIndicator = document.getElementById('binary-level-indicator');

  function initBinary() {
    const levelData = BINARY_LEVELS[state.binary.level];
    binaryLevelIndicator.textContent = `Niveau ${state.binary.level + 1}`;
    binaryStatusEl.textContent = "";
    binaryGridEl.innerHTML = "";
    binaryGridEl.style.gridTemplateColumns = `repeat(${levelData.size}, 1fr)`;

    state.binary.grid = levelData.grid;
    state.binary.userGrid = levelData.grid.map(row => row.map(val => val));

    for (let r = 0; r < levelData.size; r++) {
      for (let c = 0; c < levelData.size; c++) {
        const cell = document.createElement('div');
        cell.classList.add('grid-cell');
        
        const initialVal = levelData.grid[r][c];
        if (initialVal !== null) {
          cell.classList.add('binary-fixed');
          if (initialVal === 0) cell.classList.add('binary-zero');
          if (initialVal === 1) cell.classList.add('binary-one');
        } else {
          cell.classList.add('binary-empty');
          cell.addEventListener('click', () => {
            let curr = state.binary.userGrid[r][c];
            let next = null;
            if (curr === null) next = 0;
            else if (curr === 0) next = 1;
            else if (curr === 1) next = null;

            state.binary.userGrid[r][c] = next;
            cell.classList.remove('binary-empty', 'binary-zero', 'binary-one');
            if (next === null) cell.classList.add('binary-empty');
            else if (next === 0) cell.classList.add('binary-zero');
            else if (next === 1) cell.classList.add('binary-one');
          });
        }

        binaryGridEl.appendChild(cell);
      }
    }
  }

  document.getElementById('binary-prev').addEventListener('click', () => {
    if (state.binary.level > 0) {
      state.binary.level--;
      initBinary();
    }
  });

  document.getElementById('binary-next').addEventListener('click', () => {
    if (state.binary.level < BINARY_LEVELS.length - 1) {
      state.binary.level++;
      initBinary();
    }
  });

  document.getElementById('binary-reset').addEventListener('click', initBinary);

  document.getElementById('binary-verify').addEventListener('click', () => {
    const size = BINARY_LEVELS[state.binary.level].size;
    const grid = state.binary.userGrid;

    // Check if full
    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        if (grid[r][c] === null) {
          binaryStatusEl.textContent = "La grille n'est pas complète.";
          return;
        }
      }
    }

    // Rule 1: Equal number of 0s and 1s in each row and col
    for (let r = 0; r < size; r++) {
      let count0 = 0, count1 = 0;
      for (let c = 0; c < size; c++) {
        if (grid[r][c] === 0) count0++;
        if (grid[r][c] === 1) count1++;
      }
      if (count0 !== size / 2 || count1 !== size / 2) {
        binaryStatusEl.textContent = `Erreur : Déséquilibre de 0 et 1 à la ligne ${r + 1}.`;
        return;
      }
    }

    for (let c = 0; c < size; c++) {
      let count0 = 0, count1 = 0;
      for (let r = 0; r < size; r++) {
        if (grid[r][c] === 0) count0++;
        if (grid[r][c] === 1) count1++;
      }
      if (count0 !== size / 2 || count1 !== size / 2) {
        binaryStatusEl.textContent = `Erreur : Déséquilibre de 0 et 1 à la colonne ${c + 1}.`;
        return;
      }
    }

    // Rule 2: No more than two adjacent identical numbers
    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size - 2; c++) {
        if (grid[r][c] !== null && grid[r][c] === grid[r][c+1] && grid[r][c] === grid[r][c+2]) {
          binaryStatusEl.textContent = "Erreur : Plus de deux chiffres identiques alignés horizontalement.";
          return;
        }
      }
    }

    for (let c = 0; c < size; c++) {
      for (let r = 0; r < size - 2; r++) {
        if (grid[r][c] !== null && grid[r][c] === grid[r+1][c] && grid[r][c] === grid[r+2][c]) {
          binaryStatusEl.textContent = "Erreur : Plus de deux chiffres identiques alignés verticalement.";
          return;
        }
      }
    }

    // Rule 3: Unique rows and columns
    let rowsStr = [];
    for (let r = 0; r < size; r++) {
      let rStr = grid[r].join('');
      if (rowsStr.includes(rStr)) {
        binaryStatusEl.textContent = "Erreur : Deux lignes sont identiques.";
        return;
      }
      rowsStr.push(rStr);
    }

    let colsStr = [];
    for (let c = 0; c < size; c++) {
      let cStr = '';
      for (let r = 0; r < size; r++) {
        cStr += grid[r][c];
      }
      if (colsStr.includes(cStr)) {
        binaryStatusEl.textContent = "Erreur : Deux colonnes sont identiques.";
        return;
      }
      colsStr.push(cStr);
    }

    binaryStatusEl.textContent = "Félicitations ! Grille résolue avec succès.";
  });


  // --- GAME 3: CRYPTOGRAM ---
  const cryptoBoardEl = document.getElementById('crypto-board');
  const cryptoKeyboardEl = document.getElementById('crypto-keyboard');
  const cryptoStatusEl = document.getElementById('crypto-status');
  const cryptoLevelIndicator = document.getElementById('crypto-level-indicator');

  function generateSubstitutionCipher() {
    const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
    let shuffled = [...alphabet];
    // Simple Fisher-Yates shuffle
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    
    // Ensure no letter maps to itself to keep it fun
    for (let i = 0; i < alphabet.length; i++) {
      if (alphabet[i] === shuffled[i]) {
        const swapIndex = (i + 1) % alphabet.length;
        [shuffled[i], shuffled[swapIndex]] = [shuffled[swapIndex], shuffled[i]];
      }
    }

    let map = {};
    alphabet.forEach((char, idx) => {
      map[char] = shuffled[idx];
    });
    return map;
  }

  function initCryptogram() {
    const levelData = CRYPTO_LEVELS[state.cryptogram.level];
    cryptoLevelIndicator.textContent = `Défi ${state.cryptogram.level + 1}`;
    cryptoStatusEl.textContent = "";
    cryptoBoardEl.innerHTML = "";
    state.cryptogram.selectedCipherChar = null;
    state.cryptogram.userDecryption = {};

    // Generate a stable cipher mapping for this level session
    state.cryptogram.cipherMap = generateSubstitutionCipher();

    // Render Board
    const words = levelData.quote.split(" ");
    words.forEach(word => {
      const wordDiv = document.createElement('div');
      wordDiv.classList.add('crypto-word');

      for (let char of word) {
        const box = document.createElement('div');
        box.classList.add('crypto-letter-box');

        if (/[A-Z]/.test(char)) {
          const cipherChar = state.cryptogram.cipherMap[char];
          
          const inputChar = document.createElement('div');
          inputChar.classList.add('crypto-input-char');
          inputChar.textContent = "";
          inputChar.dataset.cipher = cipherChar;

          const cipherLabel = document.createElement('span');
          cipherLabel.classList.add('crypto-cipher-char');
          cipherLabel.textContent = cipherChar;

          box.appendChild(inputChar);
          box.appendChild(cipherLabel);
          box.dataset.cipher = cipherChar;

          box.addEventListener('click', () => {
            selectCipherLetter(cipherChar);
          });
        } else {
          // Punctuation
          const punct = document.createElement('span');
          punct.classList.add('crypto-punctuation');
          punct.textContent = char;
          box.appendChild(punct);
        }
        wordDiv.appendChild(box);
      }
      cryptoBoardEl.appendChild(wordDiv);
    });

    renderKeyboard();
  }

  function selectCipherLetter(cipherChar) {
    state.cryptogram.selectedCipherChar = cipherChar;
    
    // Highlight all instances of this cipher letter
    document.querySelectorAll('.crypto-letter-box').forEach(box => {
      if (box.dataset.cipher === cipherChar) {
        box.classList.add('selected');
      } else {
        box.classList.remove('selected');
      }
    });

    // Highlight key on virtual keyboard
    document.querySelectorAll('.key-btn').forEach(btn => {
      if (btn.textContent === state.cryptogram.userDecryption[cipherChar]) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });
  }

  function renderKeyboard() {
    cryptoKeyboardEl.innerHTML = "";
    const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
    
    alphabet.forEach(char => {
      const btn = document.createElement('button');
      btn.classList.add('key-btn');
      btn.textContent = char;
      btn.addEventListener('click', () => {
        if (state.cryptogram.selectedCipherChar) {
          const cipher = state.cryptogram.selectedCipherChar;
          state.cryptogram.userDecryption[cipher] = char;
          
          // Update all matching inputs on board
          document.querySelectorAll(`.crypto-input-char[data-cipher="${cipher}"]`).forEach(el => {
            el.textContent = char;
          });
          
          selectCipherLetter(cipher); // refresh highlight
        }
      });
      cryptoKeyboardEl.appendChild(btn);
    });

    // Clear Key
    const clearBtn = document.createElement('button');
    clearBtn.classList.add('key-btn', 'clear-key');
    clearBtn.textContent = "Effacer";
    clearBtn.addEventListener('click', () => {
      if (state.cryptogram.selectedCipherChar) {
        const cipher = state.cryptogram.selectedCipherChar;
        delete state.cryptogram.userDecryption[cipher];
        document.querySelectorAll(`.crypto-input-char[data-cipher="${cipher}"]`).forEach(el => {
          el.textContent = "";
        });
        selectCipherLetter(cipher);
      }
    });
    cryptoKeyboardEl.appendChild(clearBtn);
  }

  document.getElementById('crypto-prev').addEventListener('click', () => {
    if (state.cryptogram.level > 0) {
      state.cryptogram.level--;
      initCryptogram();
    }
  });

  document.getElementById('crypto-next').addEventListener('click', () => {
    if (state.cryptogram.level < CRYPTO_LEVELS.length - 1) {
      state.cryptogram.level++;
      initCryptogram();
    }
  });

  document.getElementById('crypto-reset').addEventListener('click', initCryptogram);

  document.getElementById('crypto-verify').addEventListener('click', () => {
    const levelData = CRYPTO_LEVELS[state.cryptogram.level];
    let isCorrect = true;

    // Check if every letter matches the original quote
    document.querySelectorAll('.crypto-letter-box').forEach(box => {
      const cipher = box.dataset.cipher;
      if (cipher) {
        const userChar = state.cryptogram.userDecryption[cipher];
        // Find original char from cipherMap
        const originalChar = Object.keys(state.cryptogram.cipherMap).find(key => state.cryptogram.cipherMap[key] === cipher);
        
        if (!userChar || userChar !== originalChar) {
          isCorrect = false;
        }
      }
    });

    if (isCorrect) {
      cryptoStatusEl.textContent = `Bravo ! Citation décryptée ! - ${levelData.author}`;
    } else {
      cryptoStatusEl.textContent = "Certaines lettres sont incorrectes ou manquantes.";
    }
  });

  // Support physical keyboard for Cryptogram
  window.addEventListener('keydown', (e) => {
    if (state.currentView === 'cryptogram' && state.cryptogram.selectedCipherChar) {
      const key = e.key.toUpperCase();
      if (/[A-Z]/.test(key) && key.length === 1) {
        const cipher = state.cryptogram.selectedCipherChar;
        state.cryptogram.userDecryption[cipher] = key;
        document.querySelectorAll(`.crypto-input-char[data-cipher="${cipher}"]`).forEach(el => {
          el.textContent = key;
        });
        selectCipherLetter(cipher);
      } else if (e.key === 'Backspace' || e.key === 'Delete') {
        const cipher = state.cryptogram.selectedCipherChar;
        delete state.cryptogram.userDecryption[cipher];
        document.querySelectorAll(`.crypto-input-char[data-cipher="${cipher}"]`).forEach(el => {
          el.textContent = "";
        });
        selectCipherLetter(cipher);
      }
    }
  });

});
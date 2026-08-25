document.addEventListener('DOMContentLoaded', () => {
  // --- THEME TOGGLE ---
  const themeToggle = document.getElementById('theme-toggle');
  themeToggle.addEventListener('click', () => {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    if (currentTheme === 'dark') {
      document.documentElement.removeAttribute('data-theme');
    } else {
      document.documentElement.setAttribute('data-theme', 'dark');
    }
  });

  // --- NAVIGATION ---
  const navButtons = document.querySelectorAll('.nav-btn');
  const gameSections = document.querySelectorAll('.game-section');

  navButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      navButtons.forEach(b => b.classList.remove('active'));
      gameSections.forEach(s => s.classList.remove('active'));

      btn.classList.add('active');
      const gameId = btn.getAttribute('data-game');
      document.getElementById(`game-${gameId}`).classList.add('active');

      // Initialize game if needed
      if (gameId === 'sudoku') initSudoku();
      if (gameId === 'mines') initMines();
      if (gameId === 'wordle') initWordle();
      if (gameId === 'tictactoe') initTTT();
    });
  });

  // --- GAME 1: SUDOKU ---
  let sudokuSelectedCell = null;
  const sudokuGrid = document.getElementById('sudoku-grid');
  const sudokuStatus = document.getElementById('sudoku-status');

  // Simple static boards for E-Ink simplicity
  const sudokuBoards = [
    {
      start: [
        5,3,0,0,7,0,0,0,0,
        6,0,0,1,9,5,0,0,0,
        0,9,8,0,0,0,0,6,0,
        8,0,0,0,6,0,0,0,3,
        4,0,0,8,0,3,0,0,1,
        7,0,0,0,2,0,0,0,6,
        0,6,0,0,0,0,2,8,0,
        0,0,0,4,1,9,0,0,5,
        0,0,0,0,8,0,0,7,9
      ],
      solution: [
        5,3,4,6,7,8,9,1,2,
        6,7,2,1,9,5,3,4,8,
        1,9,8,3,4,2,5,6,7,
        8,5,9,7,6,1,4,2,3,
        4,2,6,8,5,3,7,9,1,
        7,1,3,9,2,4,8,5,6,
        9,6,5,2,3,7,1,8,4,
        2,8,7,4,1,9,6,3,5,
        3,4,1,5,8,6,2,7,9
      ]
    },
    {
      start: [
        0,0,0,2,6,0,7,0,1,
        6,8,0,0,7,0,0,9,0,
        1,9,0,0,0,4,5,0,0,
        8,2,0,1,0,0,0,4,0,
        0,0,4,6,0,2,9,0,0,
        0,5,0,0,0,3,0,2,8,
        0,0,9,3,0,0,0,7,4,
        0,4,0,0,5,0,0,3,6,
        7,0,3,0,1,8,0,0,0
      ],
      solution: [
        4,3,5,2,6,9,7,8,1,
        6,8,2,5,7,1,4,9,3,
        1,9,7,8,3,4,5,6,2,
        8,2,6,1,9,5,3,4,7,
        3,7,4,6,8,2,9,1,5,
        9,5,1,7,4,3,6,2,8,
        5,1,9,3,2,6,8,7,4,
        2,4,8,9,5,7,1,3,6,
        7,6,3,4,1,8,2,5,9
      ]
    }
  ];

  let currentSudoku = null;
  let userSudoku = [];

  function initSudoku() {
    sudokuGrid.innerHTML = '';
    sudokuSelectedCell = null;
    sudokuStatus.textContent = 'Remplissez la grille';
    
    // Pick random board
    currentSudoku = sudokuBoards[Math.floor(Math.random() * sudokuBoards.length)];
    userSudoku = [...currentSudoku.start];

    for (let i = 0; i < 81; i++) {
      const cell = document.createElement('div');
      cell.classList.add('sudoku-cell');
      cell.dataset.index = i;

      if (currentSudoku.start[i] !== 0) {
        cell.textContent = currentSudoku.start[i];
        cell.classList.add('fixed');
      } else {
        cell.textContent = '';
        cell.addEventListener('click', () => selectSudokuCell(cell));
      }
      sudokuGrid.appendChild(cell);
    }
  }

  function selectSudokuCell(cell) {
    const cells = document.querySelectorAll('.sudoku-cell');
    cells.forEach(c => c.classList.remove('selected'));
    
    sudokuSelectedCell = cell;
    cell.classList.add('selected');
  }

  // Keypad controls
  document.querySelectorAll('.keypad-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      if (!sudokuSelectedCell) return;
      const val = btn.getAttribute('data-val');
      const idx = parseInt(sudokuSelectedCell.dataset.index);

      if (val === 'clear') {
        sudokuSelectedCell.textContent = '';
        userSudoku[idx] = 0;
      } else {
        sudokuSelectedCell.textContent = val;
        userSudoku[idx] = parseInt(val);
      }
    });
  });

  document.getElementById('sudoku-new').addEventListener('click', initSudoku);
  document.getElementById('sudoku-check').addEventListener('click', () => {
    let correct = true;
    for (let i = 0; i < 81; i++) {
      if (userSudoku[i] !== currentSudoku.solution[i]) {
        correct = false;
        break;
      }
    }
    if (correct) {
      sudokuStatus.textContent = 'Félicitations ! Grille correcte.';
    } else {
      sudokuStatus.textContent = 'Il y a des erreurs...';
    }
  });


  // --- GAME 2: MINESWEEPER ---
  const minesGrid = document.getElementById('mines-grid');
  const minesStatus = document.getElementById('mines-status');
  const minesModeToggle = document.getElementById('mines-mode-toggle');
  
  let minesWidth = 9;
  let minesCount = 10;
  let minesBoard = [];
  let minesRevealed = [];
  let minesFlagged = [];
  let minesGameOver = false;
  let flagMode = false; // Toggle for mobile/touch friendly flagging

  minesModeToggle.addEventListener('click', () => {
    flagMode = !flagMode;
    minesModeToggle.textContent = flagMode ? 'Mode: Drapeau' : 'Mode: Découvrir';
    minesModeToggle.classList.toggle('active', flagMode);
  });

  function initMines() {
    minesGrid.innerHTML = '';
    minesBoard = Array(minesWidth * minesWidth).fill(0);
    minesRevealed = Array(minesWidth * minesWidth).fill(false);
    minesFlagged = Array(minesWidth * minesWidth).fill(false);
    minesGameOver = false;
    minesStatus.textContent = `Mines: ${minesCount}`;

    // Place mines
    let placedMines = 0;
    while (placedMines < minesCount) {
      let idx = Math.floor(Math.random() * (minesWidth * minesWidth));
      if (minesBoard[idx] !== 'M') {
        minesBoard[idx] = 'M';
        placedMines++;
      }
    }

    // Calculate numbers
    for (let i = 0; i < minesWidth * minesWidth; i++) {
      if (minesBoard[i] === 'M') continue;
      let count = 0;
      let neighbors = getNeighbors(i);
      neighbors.forEach(n => {
        if (minesBoard[n] === 'M') count++;
      });
      minesBoard[i] = count;
    }

    // Render grid
    for (let i = 0; i < minesWidth * minesWidth; i++) {
      const cell = document.createElement('div');
      cell.classList.add('mines-cell');
      cell.dataset.index = i;
      
      cell.addEventListener('click', () => handleMinesClick(i));
      // Support right click for flagging on desktop
      cell.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        toggleFlag(i);
      });

      minesGrid.appendChild(cell);
    }
  }

  function getNeighbors(idx) {
    let neighbors = [];
    let row = Math.floor(idx / minesWidth);
    let col = idx % minesWidth;

    for (let r = -1; r <= 1; r++) {
      for (let c = -1; c <= 1; c++) {
        if (r === 0 && c === 0) continue;
        let newRow = row + r;
        let newCol = col + c;
        if (newRow >= 0 && newRow < minesWidth && newCol >= 0 && newCol < minesWidth) {
          neighbors.push(newRow * minesWidth + newCol);
        }
      }
    }
    return neighbors;
  }

  function handleMinesClick(idx) {
    if (minesGameOver || minesRevealed[idx]) return;

    if (flagMode) {
      toggleFlag(idx);
      return;
    }

    if (minesFlagged[idx]) return;

    if (minesBoard[idx] === 'M') {
      // Game Over
      revealAllMines();
      minesStatus.textContent = 'Perdu !';
      minesGameOver = true;
    } else {
      revealCell(idx);
      checkMinesWin();
    }
  }

  function toggleFlag(idx) {
    if (minesGameOver || minesRevealed[idx]) return;
    minesFlagged[idx] = !minesFlagged[idx];
    const cell = minesGrid.children[idx];
    if (minesFlagged[idx]) {
      cell.classList.add('flagged');
      cell.textContent = 'F';
    } else {
      cell.classList.remove('flagged');
      cell.textContent = '';
    }
  }

  function revealCell(idx) {
    if (minesRevealed[idx] || minesFlagged[idx]) return;
    minesRevealed[idx] = true;
    const cell = minesGrid.children[idx];
    cell.classList.add('revealed');
    
    if (minesBoard[idx] > 0) {
      cell.textContent = minesBoard[idx];
    } else {
      cell.textContent = '';
      // Cascade reveal
      let neighbors = getNeighbors(idx);
      neighbors.forEach(n => revealCell(n));
    }
  }

  function revealAllMines() {
    for (let i = 0; i < minesWidth * minesWidth; i++) {
      if (minesBoard[i] === 'M') {
        const cell = minesGrid.children[i];
        cell.classList.add('mine');
        cell.textContent = '💣';
      }
    }
  }

  function checkMinesWin() {
    let win = true;
    for (let i = 0; i < minesWidth * minesWidth; i++) {
      if (minesBoard[i] !== 'M' && !minesRevealed[i]) {
        win = false;
        break;
      }
    }
    if (win) {
      minesStatus.textContent = 'Gagné !';
      minesGameOver = true;
    }
  }

  document.getElementById('mines-reset').addEventListener('click', initMines);


  // --- GAME 3: WORDLE (LE MOT) ---
  const wordleGrid = document.getElementById('wordle-grid');
  const wordleKeyboard = document.getElementById('wordle-keyboard');
  const wordleStatus = document.getElementById('wordle-status');

  const wordList = ['LIVRE', 'TARTE', 'TABLE', 'CHAMP', 'PORTE', 'IMAGE', 'TEMPS', 'GRAND', 'PETIT', 'ROUGE', 'BLEUX', 'JAUNE', 'VERTE', 'PLAGE', 'ARBRE', 'SOLEI', 'PLUIE', 'NEIGE', 'ROUTE', 'FORGE'];
  let targetWord = '';
  let currentGuess = '';
  let wordleRowIndex = 0;
  let wordleGameOver = false;

  function initWordle() {
    wordleGrid.innerHTML = '';
    wordleKeyboard.innerHTML = '';
    wordleGameOver = false;
    currentGuess = '';
    wordleRowIndex = 0;
    targetWord = wordList[Math.floor(Math.random() * wordList.length)];
    wordleStatus.textContent = 'Devinez le mot en 6 essais';

    // Create grid rows
    for (let r = 0; r < 6; r++) {
      const row = document.createElement('div');
      row.classList.add('wordle-row');
      for (let c = 0; c < 5; c++) {
        const cell = document.createElement('div');
        cell.classList.add('wordle-cell');
        row.appendChild(cell);
      }
      wordleGrid.appendChild(row);
    }

    // Create keyboard
    const keys = [
      ['A', 'Z', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
      ['Q', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L', 'M'],
      ['ENTRER', 'W', 'X', 'C', 'V', 'B', 'N', 'EFFACER']
    ];

    keys.forEach(rowKeys => {
      const row = document.createElement('div');
      row.classList.add('keyboard-row');
      rowKeys.forEach(key => {
        const keyBtn = document.createElement('button');
        keyBtn.textContent = key;
        keyBtn.classList.add('key');
        if (key === 'ENTRER' || key === 'EFFACER') {
          keyBtn.classList.add('wide');
        }
        keyBtn.addEventListener('click', () => handleWordleInput(key));
        row.appendChild(keyBtn);
      });
      wordleKeyboard.appendChild(row);
    });
  }

  function handleWordleInput(key) {
    if (wordleGameOver) return;

    const currentRow = wordleGrid.children[wordleRowIndex];

    if (key === 'EFFACER') {
      if (currentGuess.length > 0) {
        currentGuess = currentGuess.slice(0, -1);
        updateWordleRow(currentRow);
      }
    } else if (key === 'ENTRER') {
      if (currentGuess.length === 5) {
        submitWordleGuess(currentRow);
      } else {
        wordleStatus.textContent = 'Pas assez de lettres';
      }
    } else {
      if (currentGuess.length < 5) {
        currentGuess += key;
        updateWordleRow(currentRow);
      }
    }
  }

  function updateWordleRow(row) {
    for (let i = 0; i < 5; i++) {
      const cell = row.children[i];
      cell.textContent = currentGuess[i] || '';
    }
  }

  function submitWordleGuess(row) {
    let tempTarget = targetWord;
    let guess = currentGuess;

    // First pass: mark correct letters
    for (let i = 0; i < 5; i++) {
      const cell = row.children[i];
      const letter = guess[i];
      if (letter === targetWord[i]) {
        cell.classList.add('correct');
        tempTarget = tempTarget.replace(letter, '_');
      }
    }

    // Second pass: mark present/absent
    for (let i = 0; i < 5; i++) {
      const cell = row.children[i];
      if (cell.classList.contains('correct')) continue;

      const letter = guess[i];
      if (tempTarget.includes(letter)) {
        cell.classList.add('present');
        tempTarget = tempTarget.replace(letter, '_');
      } else {
        cell.classList.add('absent');
      }
    }

    if (guess === targetWord) {
      wordleStatus.textContent = 'Gagné ! Bravo !';
      wordleGameOver = true;
    } else {
      wordleRowIndex++;
      currentGuess = '';
      if (wordleRowIndex === 6) {
        wordleStatus.textContent = `Perdu ! Le mot était : ${targetWord}`;
        wordleGameOver = true;
      } else {
        wordleStatus.textContent = 'Essayez encore...';
      }
    }
  }

  document.getElementById('wordle-reset').addEventListener('click', initWordle);


  // --- GAME 4: TIC TAC TOE (MORPION) ---
  const tttGrid = document.getElementById('ttt-grid');
  const tttStatus = document.getElementById('ttt-status');
  let tttBoard = Array(9).fill('');
  let tttGameOver = false;

  function initTTT() {
    tttGrid.innerHTML = '';
    tttBoard = Array(9).fill('');
    tttGameOver = false;
    tttStatus.textContent = 'À vous de jouer (X)';

    for (let i = 0; i < 9; i++) {
      const cell = document.createElement('div');
      cell.classList.add('ttt-cell');
      cell.dataset.index = i;
      cell.addEventListener('click', () => handleTTTClick(i));
      tttGrid.appendChild(cell);
    }
  }

  function handleTTTClick(idx) {
    if (tttGameOver || tttBoard[idx] !== '') return;

    // Player Move
    makeTTTMove(idx, 'X');
    if (checkTTTWin('X')) {
      tttStatus.textContent = 'Vous avez gagné !';
      tttGameOver = true;
      return;
    }
    if (tttBoard.every(cell => cell !== '')) {
      tttStatus.textContent = 'Match nul !';
      tttGameOver = true;
      return;
    }

    // AI Move
    tttStatus.textContent = 'L\'ordinateur réfléchit...';
    setTimeout(() => {
      makeAIMove();
    }, 200);
  }

  function makeTTTMove(idx, player) {
    tttBoard[idx] = player;
    tttGrid.children[idx].textContent = player;
  }

  function makeAIMove() {
    if (tttGameOver) return;

    // Simple AI: Try to win, block player, or pick random
    let bestMove = findWinningMove('O') || findWinningMove('X') || pickRandomMove();

    if (bestMove !== null) {
      makeTTTMove(bestMove, 'O');
      if (checkTTTWin('O')) {
        tttStatus.textContent = 'L\'ordinateur a gagné !';
        tttGameOver = true;
        return;
      }
      if (tttBoard.every(cell => cell !== '')) {
        tttStatus.textContent = 'Match nul !';
        tttGameOver = true;
        return;
      }
      tttStatus.textContent = 'À vous de jouer (X)';
    }
  }

  function findWinningMove(player) {
    const winPatterns = [
      [0, 1, 2], [3, 4, 5], [6, 7, 8],
      [0, 3, 6], [1, 4, 7], [2, 5, 8],
      [0, 4, 8], [2, 4, 6]
    ];

    for (let pattern of winPatterns) {
      let count = 0;
      let emptyIdx = null;
      pattern.forEach(idx => {
        if (tttBoard[idx] === player) count++;
        else if (tttBoard[idx] === '') emptyIdx = idx;
      });
      if (count === 2 && emptyIdx !== null) {
        return emptyIdx;
      }
    }
    return null;
  }

  function pickRandomMove() {
    let available = [];
    tttBoard.forEach((cell, idx) => {
      if (cell === '') available.push(idx);
    });
    if (available.length === 0) return null;
    return available[Math.floor(Math.random() * available.length)];
  }

  function checkTTTWin(player) {
    const winPatterns = [
      [0, 1, 2], [3, 4, 5], [6, 7, 8],
      [0, 3, 6], [1, 4, 7], [2, 5, 8],
      [0, 4, 8], [2, 4, 6]
    ];
    return winPatterns.some(pattern => {
      return pattern.every(idx => tttBoard[idx] === player);
    });
  }

  document.getElementById('ttt-reset').addEventListener('click', initTTT);


  // --- INITIAL LAUNCH ---
  initSudoku();
});

// --- SERVICE WORKER REGISTRATION ---
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('sw.js')
      .then(reg => console.log('Service Worker enregistré !', reg))
      .catch(err => console.warn('Erreur d\'enregistrement du Service Worker', err));
  });
}

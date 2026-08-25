document.addEventListener('DOMContentLoaded', () => {
    // --- Core State & Navigation ---
    const state = {
        currentView: 'dashboard',
        sudoku: {
            grid: Array(81).fill(0),
            solution: Array(81).fill(0),
            initial: Array(81).fill(0),
            selectedCell: null
        },
        wordle: {
            secret: '',
            guesses: [],
            currentGuess: '',
            maxGuesses: 6,
            gameOver: false
        },
        mines: {
            size: 9,
            mineCount: 10,
            grid: [],
            revealed: [],
            flagged: [],
            gameOver: false,
            mode: 'reveal' // 'reveal' or 'flag'
        },
        tictactoe: {
            board: Array(9).fill(''),
            gameOver: false,
            turn: 'X'
        },
        chess: {
            board: [],
            selectedSquare: null,
            turn: 'white',
            validMoves: []
        },
        game2048: {
            board: Array(16).fill(0),
            score: 0,
            gameOver: false
        },
        hangman: {
            word: '',
            guessedLetters: new Set(),
            lives: 6,
            gameOver: false
        }
    };

    const views = ['dashboard', 'sudoku', 'wordle', 'mines', 'tictactoe', 'chess', 'game2048', 'hangman', 'notes'];
    const quotes = [
        "\"Simplicity is the ultimate sophistication.\"",
        "\"Read much, but not many books.\"",
        "\"Focus is a matter of deciding what things you're not going to do.\"",
        "\"The art of being wise is the art of knowing what to overlook.\"",
        "\"In character, in manner, in style, in all things, the supreme excellence is simplicity.\""
    ];

    // --- UI Elements ---
    const btnHome = document.getElementById('btn-home');
    const btnRefresh = document.getElementById('btn-refresh');
    const hubTitle = document.getElementById('hub-title');
    const currentTimeEl = document.getElementById('current-time');
    const currentDateEl = document.getElementById('current-date');
    const dailyQuoteEl = document.getElementById('daily-quote');

    // --- Initialize Hub ---
    function initHub() {
        updateTime();
        setInterval(updateTime, 1000);
        
        // Set random quote
        dailyQuoteEl.textContent = quotes[Math.floor(Math.random() * quotes.length)];

        // Setup navigation
        document.querySelectorAll('.app-card').forEach(card => {
            card.addEventListener('click', () => {
                const target = card.getAttribute('data-target');
                showView(target);
            });
        });

        btnHome.addEventListener('click', () => showView('dashboard'));
        hubTitle.addEventListener('click', () => showView('dashboard'));
        btnRefresh.addEventListener('click', triggerScreenRefresh);

        // Setup Game Initializations
        initSudoku();
        initWordle();
        initMines();
        initTicTacToe();
        initChess();
        init2048();
        initHangman();
        initNotes();
    }

    function updateTime() {
        const now = new Date();
        currentTimeEl.textContent = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        currentDateEl.textContent = now.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' });
    }

    function triggerScreenRefresh() {
        document.body.classList.add('flash-active');
        setTimeout(() => {
            document.body.classList.remove('flash-active');
        }, 400);
    }

    function showView(viewName) {
        triggerScreenRefresh();
        views.forEach(v => {
            const el = document.getElementById(`view-${v}`);
            if (el) el.classList.add('hidden');
        });
        document.getElementById(`view-${viewName}`).classList.remove('hidden');
        
        if (viewName === 'dashboard') {
            btnHome.classList.add('hidden');
        } else {
            btnHome.classList.remove('hidden');
        }
        state.currentView = viewName;
    }

    // =========================================================================
    // SUDOKU GAME
    // =========================================================================
    const sudokuGridEl = document.getElementById('sudoku-grid');
    
    // Simple static puzzles for demonstration (Easy, Medium, Hard)
    const sudokuPuzzles = {
        easy: {
            start: "530070000600195000098000060800060003400803001700020006060000280000419005000080079",
            solution: "534678912672195348198342567859761423426853791713924856961537284287419635345286179"
        },
        medium: {
            start: "000260701680070090190004500820100040004602900050003028009300074040050036703018000",
            solution: "435269781682571394197834562826195437374682915951743628219356874847952136763418259"
        },
        hard: {
            start: "000600400700003600000091080000000000050180003000306045040200060903000000020000100",
            solution: "581627439792453618364891582217549368659182743831376945148235769973518246425968137"
        }
    };

    function initSudoku() {
        document.getElementById('sudoku-easy').addEventListener('click', () => loadSudoku('easy'));
        document.getElementById('sudoku-medium').addEventListener('click', () => loadSudoku('medium'));
        document.getElementById('sudoku-hard').addEventListener('click', () => loadSudoku('hard'));
        document.getElementById('sudoku-check').addEventListener('click', checkSudoku);

        document.querySelectorAll('.num-key').forEach(key => {
            key.addEventListener('click', () => {
                if (state.sudoku.selectedCell !== null) {
                    const idx = state.sudoku.selectedCell;
                    if (state.sudoku.initial[idx] === 0) {
                        const val = key.id === 'sudoku-clear' ? 0 : parseInt(key.textContent);
                        state.sudoku.grid[idx] = val;
                        renderSudoku();
                    }
                }
            });
        });

        loadSudoku('easy');
    }

    function loadSudoku(difficulty) {
        const p = sudokuPuzzles[difficulty];
        state.sudoku.initial = p.start.split('').map(Number);
        state.sudoku.grid = [...state.sudoku.initial];
        state.sudoku.solution = p.solution.split('').map(Number);
        state.sudoku.selectedCell = null;
        renderSudoku();
    }

    function renderSudoku() {
        sudokuGridEl.innerHTML = '';
        for (let i = 0; i < 81; i++) {
            const cell = document.createElement('div');
            cell.classList.add('sudoku-cell');
            if (state.sudoku.initial[i] !== 0) {
                cell.classList.add('fixed');
                cell.textContent = state.sudoku.initial[i];
            } else if (state.sudoku.grid[i] !== 0) {
                cell.textContent = state.sudoku.grid[i];
            }

            if (state.sudoku.selectedCell === i) {
                cell.classList.add('selected');
            }

            cell.addEventListener('click', () => {
                state.sudoku.selectedCell = i;
                renderSudoku();
            });
            sudokuGridEl.appendChild(cell);
        }
    }

    function checkSudoku() {
        let correct = true;
        for (let i = 0; i < 81; i++) {
            if (state.sudoku.grid[i] !== state.sudoku.solution[i]) {
                correct = false;
                break;
            }
        }
        alert(correct ? "Perfect! You solved it!" : "There are errors or incomplete cells.");
    }

    // =========================================================================
    // WORDLE GAME (E-WORD)
    // =========================================================================
    const wordleGridEl = document.getElementById('wordle-grid');
    const wordleKeyboardEl = document.getElementById('wordle-keyboard');
    const wordleWords = ["PAPER", "WRITE", "BOOKS", "INDEX", "LIGHT", "SMART", "CLEAN", "SHARP", "BOARD", "STONE"];

    function initWordle() {
        document.getElementById('wordle-reset').addEventListener('click', resetWordle);
        resetWordle();
    }

    function resetWordle() {
        state.wordle.secret = wordleWords[Math.floor(Math.random() * wordleWords.length)];
        state.wordle.guesses = [];
        state.wordle.currentGuess = '';
        state.wordle.gameOver = false;
        renderWordle();
        renderWordleKeyboard();
    }

    function renderWordle() {
        wordleGridEl.innerHTML = '';
        for (let r = 0; r < state.wordle.maxGuesses; r++) {
            const row = document.createElement('div');
            row.classList.add('wordle-row');
            const guess = state.wordle.guesses[r] || '';
            
            for (let c = 0; c < 5; c++) {
                const cell = document.createElement('div');
                cell.classList.add('wordle-cell');
                
                if (r < state.wordle.guesses.length) {
                    const char = guess[c];
                    cell.textContent = char;
                    if (state.wordle.secret[c] === char) {
                        cell.classList.add('correct');
                    } else if (state.wordle.secret.includes(char)) {
                        cell.classList.add('present');
                    } else {
                        cell.classList.add('absent');
                    }
                } else if (r === state.wordle.guesses.length) {
                    cell.textContent = state.wordle.currentGuess[c] || '';
                }
                row.appendChild(cell);
            }
            wordleGridEl.appendChild(row);
        }
    }

    function renderWordleKeyboard() {
        wordleKeyboardEl.innerHTML = '';
        const layout = [
            ["Q", "W", "E", "R", "T", "Y", "U", "I", "O", "P"],
            ["A", "S", "D", "F", "G", "H", "J", "K", "L"],
            ["ENTER", "Z", "X", "C", "V", "B", "N", "M", "BACK"]
        ];

        layout.forEach(rowKeys => {
            const row = document.createElement('div');
            row.classList.add('keyboard-row');
            rowKeys.forEach(key => {
                const btn = document.createElement('button');
                btn.textContent = key;
                btn.classList.add('key');
                if (key === 'ENTER' || key === 'BACK') btn.classList.add('wide');
                
                btn.addEventListener('click', () => handleWordleInput(key));
                row.appendChild(btn);
            });
            wordleKeyboardEl.appendChild(row);
        });
    }

    function handleWordleInput(key) {
        if (state.wordle.gameOver) return;

        if (key === 'BACK') {
            state.wordle.currentGuess = state.wordle.currentGuess.slice(0, -1);
        } else if (key === 'ENTER') {
            if (state.wordle.currentGuess.length === 5) {
                state.wordle.guesses.push(state.wordle.currentGuess);
                if (state.wordle.currentGuess === state.wordle.secret) {
                    state.wordle.gameOver = true;
                    renderWordle();
                    alert("Correct! You found the word!");
                    return;
                }
                state.wordle.currentGuess = '';
                if (state.wordle.guesses.length >= state.wordle.maxGuesses) {
                    state.wordle.gameOver = true;
                    alert(`Game Over! The word was: ${state.wordle.secret}`);
                }
            }
        } else {
            if (state.wordle.currentGuess.length < 5) {
                state.wordle.currentGuess += key;
            }
        }
        renderWordle();
    }

    // =========================================================================
    // MINESWEEPER GAME
    // =========================================================================
    const minesGridEl = document.getElementById('mines-grid');
    const minesModeBtn = document.getElementById('mines-mode-btn');
    const mineCountEl = document.getElementById('mine-count');

    function initMines() {
        document.getElementById('mines-reset').addEventListener('click', resetMines);
        minesModeBtn.addEventListener('click', () => {
            state.mines.mode = state.mines.mode === 'reveal' ? 'flag' : 'reveal';
            minesModeBtn.textContent = `Mode: ${state.mines.mode.toUpperCase()}`;
        });
        resetMines();
    }

    function resetMines() {
        state.mines.gameOver = false;
        state.mines.grid = Array(81).fill(0); // 0 = empty, 9 = mine
        state.mines.revealed = Array(81).fill(false);
        state.mines.flagged = Array(81).fill(false);
        
        // Place mines
        let placed = 0;
        while (placed < state.mines.mineCount) {
            const idx = Math.floor(Math.random() * 81);
            if (state.mines.grid[idx] !== 9) {
                state.mines.grid[idx] = 9;
                placed++;
            }
        }

        // Calculate neighbors
        for (let i = 0; i < 81; i++) {
            if (state.mines.grid[i] === 9) continue;
            let count = 0;
            const neighbors = getMineNeighbors(i);
            neighbors.forEach(n => {
                if (state.mines.grid[n] === 9) count++;
            });
            state.mines.grid[i] = count;
        }

        renderMines();
    }

    function getMineNeighbors(idx) {
        const neighbors = [];
        const r = Math.floor(idx / 9);
        const c = idx % 9;
        for (let dr = -1; dr <= 1; dr++) {
            for (let dc = -1; dc <= 1; dc++) {
                if (dr === 0 && dc === 0) continue;
                const nr = r + dr;
                const nc = c + dc;
                if (nr >= 0 && nr < 9 && nc >= 0 && nc < 9) {
                    neighbors.push(nr * 9 + nc);
                }
            }
        }
        return neighbors;
    }

    function renderMines() {
        minesGridEl.innerHTML = '';
        mineCountEl.textContent = `Mines: ${state.mines.mineCount - state.mines.flagged.filter(Boolean).length}`;

        for (let i = 0; i < 81; i++) {
            const cell = document.createElement('div');
            cell.classList.add('mines-cell');
            
            if (state.mines.revealed[i]) {
                cell.classList.add('revealed');
                if (state.mines.grid[i] === 9) {
                    cell.classList.add('mine');
                    cell.textContent = '✹';
                } else if (state.mines.grid[i] > 0) {
                    cell.textContent = state.mines.grid[i];
                }
            } else if (state.mines.flagged[i]) {
                cell.textContent = '⚑';
            }

            cell.addEventListener('click', () => handleMineClick(i));
            minesGridEl.appendChild(cell);
        }
    }

    function handleMineClick(idx) {
        if (state.mines.gameOver) return;

        if (state.mines.mode === 'flag') {
            if (!state.mines.revealed[idx]) {
                state.mines.flagged[idx] = !state.mines.flagged[idx];
            }
        } else {
            if (state.mines.flagged[idx]) return;
            if (state.mines.grid[idx] === 9) {
                // Hit mine
                state.mines.gameOver = true;
                state.mines.revealed = Array(81).fill(true);
                alert("Game Over! You hit a mine.");
            } else {
                revealMineCell(idx);
            }
        }
        renderMines();
    }

    function revealMineCell(idx) {
        if (state.mines.revealed[idx]) return;
        state.mines.revealed[idx] = true;
        if (state.mines.grid[idx] === 0) {
            const neighbors = getMineNeighbors(idx);
            neighbors.forEach(n => revealMineCell(n));
        }
    }

    // =========================================================================
    // TIC-TAC-TOE GAME
    // =========================================================================
    const tttCells = document.querySelectorAll('.ttt-cell');
    const tttStatus = document.getElementById('ttt-status');

    function initTicTacToe() {
        document.getElementById('ttt-reset').addEventListener('click', resetTicTacToe);
        tttCells.forEach(cell => {
            cell.addEventListener('click', () => {
                const idx = parseInt(cell.getAttribute('data-index'));
                if (state.tictactoe.board[idx] === '' && !state.tictactoe.gameOver && state.tictactoe.turn === 'X') {
                    makeTTTMove(idx, 'X');
                    if (!state.tictactoe.gameOver) {
                        setTimeout(makeTTTAIMove, 300);
                    }
                }
            });
        });
        resetTicTacToe();
    }

    function resetTicTacToe() {
        state.tictactoe.board = Array(9).fill('');
        state.tictactoe.gameOver = false;
        state.tictactoe.turn = 'X';
        tttStatus.textContent = "Your turn (X)";
        renderTicTacToe();
    }

    function renderTicTacToe() {
        tttCells.forEach((cell, idx) => {
            cell.textContent = state.tictactoe.board[idx];
        });
    }

    function makeTTTMove(idx, player) {
        state.tictactoe.board[idx] = player;
        renderTicTacToe();
        if (checkTTTWin(player)) {
            state.tictactoe.gameOver = true;
            tttStatus.textContent = `${player} Wins!`;
            alert(`${player} Wins!`);
        } else if (state.tictactoe.board.every(cell => cell !== '')) {
            state.tictactoe.gameOver = true;
            tttStatus.textContent = "It's a Draw!";
            alert("It's a Draw!");
        } else {
            state.tictactoe.turn = player === 'X' ? 'O' : 'X';
            tttStatus.textContent = state.tictactoe.turn === 'X' ? "Your turn (X)" : "AI thinking...";
        }
    }

    function makeTTTAIMove() {
        if (state.tictactoe.gameOver) return;
        // Simple AI: Win if possible, block if possible, otherwise random
        const emptyIndices = state.tictactoe.board.map((val, idx) => val === '' ? idx : null).filter(val => val !== null);
        if (emptyIndices.length === 0) return;

        // 1. Can AI win?
        for (let idx of emptyIndices) {
            state.tictactoe.board[idx] = 'O';
            if (checkTTTWin('O')) {
                state.tictactoe.board[idx] = '';
                makeTTTMove(idx, 'O');
                return;
            }
            state.tictactoe.board[idx] = '';
        }

        // 2. Can AI block?
        for (let idx of emptyIndices) {
            state.tictactoe.board[idx] = 'X';
            if (checkTTTWin('X')) {
                state.tictactoe.board[idx] = '';
                makeTTTMove(idx, 'O');
                return;
            }
            state.tictactoe.board[idx] = '';
        }

        // 3. Random move
        const randomIdx = emptyIndices[Math.floor(Math.random() * emptyIndices.length)];
        makeTTTMove(randomIdx, 'O');
    }

    function checkTTTWin(player) {
        const wins = [
            [0, 1, 2], [3, 4, 5], [6, 7, 8],
            [0, 3, 6], [1, 4, 7], [2, 5, 8],
            [0, 4, 8], [2, 4, 6]
        ];
        return wins.some(combo => combo.every(idx => state.tictactoe.board[idx] === player));
    }

    // =========================================================================
    // CHESS GAME (NEW)
    // =========================================================================
    const chessBoardEl = document.getElementById('chess-board');
    const chessTurnEl = document.getElementById('chess-turn');

    const initialChessBoard = [
        ['♜', '♞', '♝', '♛', '♚', '♝', '♞', '♜'],
        ['♟', '♟', '♟', '♟', '♟', '♟', '♟', '♟'],
        ['', '', '', '', '', '', '', ''],
        ['', '', '', '', '', '', '', ''],
        ['', '', '', '', '', '', '', ''],
        ['', '', '', '', '', '', '', ''],
        ['♙', '♙', '♙', '♙', '♙', '♙', '♙', '♙'],
        ['♖', '♘', '♗', '♕', '♔', '♗', '♘', '♖']
    ];

    function initChess() {
        document.getElementById('chess-reset').addEventListener('click', resetChess);
        resetChess();
    }

    function resetChess() {
        state.chess.board = JSON.parse(JSON.stringify(initialChessBoard));
        state.chess.selectedSquare = null;
        state.chess.turn = 'white';
        state.chess.validMoves = [];
        chessTurnEl.textContent = "Turn: White";
        renderChess();
    }

    function renderChess() {
        chessBoardEl.innerHTML = '';
        for (let r = 0; r < 8; r++) {
            for (let c = 0; c < 8; c++) {
                const sq = document.createElement('div');
                sq.classList.add('chess-square');
                sq.classList.add((r + c) % 2 === 0 ? 'light' : 'dark');
                sq.textContent = state.chess.board[r][c];
                sq.dataset.row = r;
                sq.dataset.col = c;

                if (state.chess.selectedSquare && state.chess.selectedSquare.r === r && state.chess.selectedSquare.c === c) {
                    sq.classList.add('selected');
                }

                sq.addEventListener('click', () => handleChessClick(r, c));
                chessBoardEl.appendChild(sq);
            }
        }
    }

    function handleChessClick(r, c) {
        const piece = state.chess.board[r][c];
        const isWhitePiece = '♙♖♘♗♕♔'.includes(piece);
        const isBlackPiece = '♟♜♞♝♛♚'.includes(piece);

        if (state.chess.selectedSquare) {
            const sr = state.chess.selectedSquare.r;
            const sc = state.chess.selectedSquare.c;

            // Move piece
            if (sr !== r || sc !== c) {
                state.chess.board[r][c] = state.chess.board[sr][sc];
                state.chess.board[sr][sc] = '';
                state.chess.turn = state.chess.turn === 'white' ? 'black' : 'white';
                chessTurnEl.textContent = `Turn: ${state.chess.turn.charAt(0).toUpperCase() + state.chess.turn.slice(1)}`;
            }
            state.chess.selectedSquare = null;
        } else {
            // Select piece
            if (piece !== '') {
                if ((state.chess.turn === 'white' && isWhitePiece) || (state.chess.turn === 'black' && isBlackPiece)) {
                    state.chess.selectedSquare = { r, c };
                }
            }
        }
        renderChess();
    }

    // =========================================================================
    // 2048 GAME (NEW)
    // =========================================================================
    const grid2048El = document.getElementById('grid-2048');
    const score2048El = document.getElementById('score-2048');

    function init2048() {
        document.getElementById('reset-2048').addEventListener('click', reset2048);
        document.getElementById('btn-2048-up').addEventListener('click', () => move2048('up'));
        document.getElementById('btn-2048-down').addEventListener('click', () => move2048('down'));
        document.getElementById('btn-2048-left').addEventListener('click', () => move2048('left'));
        document.getElementById('btn-2048-right').addEventListener('click', () => move2048('right'));
        
        // Keyboard support
        window.addEventListener('keydown', (e) => {
            if (state.currentView !== 'game2048') return;
            if (e.key === 'ArrowUp') move2048('up');
            if (e.key === 'ArrowDown') move2048('down');
            if (e.key === 'ArrowLeft') move2048('left');
            if (e.key === 'ArrowRight') move2048('right');
        });

        reset2048();
    }

    function reset2048() {
        state.game2048.board = Array(16).fill(0);
        state.game2048.score = 0;
        state.game2048.gameOver = false;
        add2048Tile();
        add2048Tile();
        render2048();
    }

    function add2048Tile() {
        const emptyIndices = state.game2048.board.map((val, idx) => val === 0 ? idx : null).filter(val => val !== null);
        if (emptyIndices.length > 0) {
            const randomIdx = emptyIndices[Math.floor(Math.random() * emptyIndices.length)];
            state.game2048.board[randomIdx] = Math.random() < 0.9 ? 2 : 4;
        }
    }

    function render2048() {
        grid2048El.innerHTML = '';
        score2048El.textContent = `Score: ${state.game2048.score}`;
        for (let i = 0; i < 16; i++) {
            const cell = document.createElement('div');
            cell.classList.add('cell-2048');
            const val = state.game2048.board[i];
            if (val > 0) {
                cell.textContent = val;
                cell.setAttribute('data-value', val);
            }
            grid2048El.appendChild(cell);
        }
    }

    function move2048(direction) {
        if (state.game2048.gameOver) return;
        let board = state.game2048.board;
        let moved = false;

        const rotate = (b) => {
            let next = Array(16).fill(0);
            for (let r = 0; r < 4; r++) {
                for (let c = 0; c < 4; c++) {
                    next[c * 4 + (3 - r)] = b[r * 4 + c];
                }
            }
            return next;
        };

        // Rotate board so we always slide left
        let rotations = 0;
        if (direction === 'up') rotations = 1;
        if (direction === 'right') rotations = 2;
        if (direction === 'down') rotations = 3;

        for (let i = 0; i < rotations; i++) board = rotate(board);

        // Slide left & merge
        for (let r = 0; r < 4; r++) {
            let row = [board[r*4], board[r*4+1], board[r*4+2], board[r*4+3]].filter(v => v !== 0);
            let nextRow = [];
            for (let i = 0; i < row.length; i++) {
                if (row[i] === row[i+1]) {
                    nextRow.push(row[i] * 2);
                    state.game2048.score += row[i] * 2;
                    i++;
                    moved = true;
                } else {
                    nextRow.push(row[i]);
                }
            }
            while (nextRow.length < 4) nextRow.push(0);
            
            for (let c = 0; c < 4; c++) {
                if (board[r*4+c] !== nextRow[c]) moved = true;
                board[r*4+c] = nextRow[c];
            }
        }

        // Rotate back
        const backRotations = (4 - rotations) % 4;
        for (let i = 0; i < backRotations; i++) board = rotate(board);

        state.game2048.board = board;

        if (moved) {
            add2048Tile();
            render2048();
            // Check game over
            if (!state.game2048.board.includes(0)) {
                // Simple check if any moves left
                state.game2048.gameOver = true;
                alert("Game Over!");
            }
        }
    }

    // =========================================================================
    // HANGMAN GAME (NEW)
    // =========================================================================
    const hangmanGallowsEl = document.getElementById('hangman-gallows');
    const hangmanWordDisplayEl = document.getElementById('hangman-word-display');
    const hangmanKeyboardEl = document.getElementById('hangman-keyboard');
    const hangmanLivesEl = document.getElementById('hangman-lives');

    const hangmanWords = ["EINK", "PAPER", "SCREEN", "CONTRAST", "MINIMAL", "READER", "BATTERY", "DISPLAY"];
    const gallowsStages = [
`  +---+
  |   |
      |
      |
      |
      |
=========`,
`  +---+
  |   |
  O   |
      |
      |
      |
=========`,
`  +---+
  |   |
  O   |
  |   |
      |
      |
=========`,
`  +---+
  |   |
  O   |
 /|   |
      |
      |
=========`,
`  +---+
  |   |
  O   |
 /|\\  |
      |
      |
=========`,
`  +---+
  |   |
  O   |
 /|\\  |
 /    |
      |
=========`,
`  +---+
  |   |
  O   |
 /|\\  |
 / \\  |
      |
=========`
    ];

    function initHangman() {
        document.getElementById('hangman-reset').addEventListener('click', resetHangman);
        resetHangman();
    }

    function resetHangman() {
        state.hangman.word = hangmanWords[Math.floor(Math.random() * hangmanWords.length)];
        state.hangman.guessedLetters = new Set();
        state.hangman.lives = 6;
        state.hangman.gameOver = false;
        renderHangman();
        renderHangmanKeyboard();
    }

    function renderHangman() {
        hangmanLivesEl.textContent = `Lives: ${state.hangman.lives}`;
        hangmanGallowsEl.textContent = gallowsStages[6 - state.hangman.lives];

        // Word display
        const display = state.hangman.word.split('').map(char => 
            state.hangman.guessedLetters.has(char) ? char : '_'
        ).join(' ');
        hangmanWordDisplayEl.textContent = display;

        if (!display.includes('_')) {
            state.hangman.gameOver = true;
            alert("You Win!");
        } else if (state.hangman.lives <= 0) {
            state.hangman.gameOver = true;
            alert(`Game Over! The word was: ${state.hangman.word}`);
        }
    }

    function renderHangmanKeyboard() {
        hangmanKeyboardEl.innerHTML = '';
        const row1 = "QWERTYUIOP".split('');
        const row2 = "ASDFGHJKL".split('');
        const row3 = "ZXCVBNM".split('');

        [row1, row2, row3].forEach(rowKeys => {
            const row = document.createElement('div');
            row.classList.add('keyboard-row');
            rowKeys.forEach(key => {
                const btn = document.createElement('button');
                btn.textContent = key;
                btn.classList.add('key');
                if (state.hangman.guessedLetters.has(key)) {
                    btn.disabled = true;
                    btn.style.opacity = '0.3';
                }
                btn.addEventListener('click', () => {
                    if (state.hangman.gameOver) return;
                    state.hangman.guessedLetters.add(key);
                    if (!state.hangman.word.includes(key)) {
                        state.hangman.lives--;
                    }
                    renderHangman();
                    renderHangmanKeyboard();
                });
                row.appendChild(btn);
            });
            hangmanKeyboardEl.appendChild(row);
        });
    }

    // =========================================================================
    // E-NOTES APP (NEW)
    // =========================================================================
    const notesTextarea = document.getElementById('notes-textarea');

    function initNotes() {
        // Load saved notes
        const savedNotes = localStorage.getItem('eink_hub_notes');
        if (savedNotes) {
            notesTextarea.value = savedNotes;
        }

        // Auto-save on input
        notesTextarea.addEventListener('input', () => {
            localStorage.setItem('eink_hub_notes', notesTextarea.value);
        });

        document.getElementById('notes-clear').addEventListener('click', () => {
            if (confirm("Are you sure you want to clear your notes?")) {
                notesTextarea.value = '';
                localStorage.removeItem('eink_hub_notes');
            }
        });
    }

    // Start everything
    initHub();
});
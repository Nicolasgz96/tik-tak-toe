// Constants for player symbols
const X_CLASS = 'X';
const O_CLASS = 'O';
const CELL_SIZE = 100;
const LINE_WIDTH = 4;
const DELAY_TIME = 500;

// Canvas setup
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Game state
let gameState = {
    currentPlayer: X_CLASS,
    board: Array(9).fill(''),
    gameMode: null,
    gameOver: false,
    currentPlayers: { X: null, O: null },
    selectedPlayer: null,
    difficulty: 'easy',
    machineThinking: false
};

// DOM Elements
const elements = {
    winningMessage: document.getElementById('winningMessage'),
    winningMessageText: document.querySelector('[data-winning-message-text]'),
    inputName: document.getElementById('inputName'),
    saveBtn: document.getElementById('nameBtn'),
    gameModeInfo: document.getElementById('gameModeInfo'),
    errorMessage: document.getElementById('errorMessage'),
    difficultySelect: document.getElementById('difficultySelect'),
    difficulty: document.getElementById('difficulty'),
    gameModeOverlay: document.getElementById('gameModeOverlay'),
    tableBody: document.getElementById('tableBody')
};

// Winning combinations
const WINNING_COMBINATIONS = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8], // Rows
    [0, 3, 6], [1, 4, 7], [2, 5, 8], // Columns
    [0, 4, 8], [2, 4, 6] // Diagonals
];

// Player management
let players = loadPlayers();

function loadPlayers() {
    const savedPlayers = localStorage.getItem('players');
    return savedPlayers ? JSON.parse(savedPlayers) : [];
}

function savePlayers() {
    localStorage.setItem('players', JSON.stringify(players));
}

// UI Updates
function updateGameStatus() {
    const { gameMode, currentPlayers } = gameState;
    let message = '';

    if (gameMode === 'twoPlayers') {
        if (!currentPlayers.X && !currentPlayers.O) {
            message = 'Select or add players to start';
        } else if (!currentPlayers.X || !currentPlayers.O) {
            message = 'Select second player to start';
        } else {
            message = `${currentPlayers[gameState.currentPlayer].name}'s turn`;
        }
    } else if (gameMode === 'vsMachine') {
        if (!currentPlayers.X) {
            message = 'Select or add a player to start';
        } else {
            message = gameState.currentPlayer === X_CLASS ? 
                `${currentPlayers.X.name}'s turn` : 'Computer is thinking...';
        }
    } else if (gameMode === 'machineVsMachine') {
        message = 'Computer vs Computer';
    }

    elements.gameModeInfo.textContent = message;
}

function updateTable() {
    elements.tableBody.innerHTML = '';
    players.forEach(player => {
        const row = document.createElement('tr');
        const isSelected = (gameState.currentPlayers.X?.name === player.name || 
                          gameState.currentPlayers.O?.name === player.name);
        
        row.classList.toggle('selected-player', isSelected);
        row.innerHTML = `
            <td>${player.name}</td>
            <td>${player.won}</td>
            <td>${player.lost}</td>
            <td>${player.draw}</td>
            <td>
                <div class="action-buttons">
                    <button onclick="selectPlayer('${player.name}')" 
                        class="select-btn ${isSelected ? 'selected' : ''}">
                        ${isSelected ? 'Selected' : 'Select'}
                    </button>
                    <button onclick="deletePlayer('${player.name}')" 
                        class="delete-btn">
                        Delete
                    </button>
                </div>
            </td>
        `;
        elements.tableBody.appendChild(row);
    });
    updateGameStatus();
}

function deletePlayer(name) {
    // Check if player is currently in game
    if (gameState.currentPlayers.X?.name === name || gameState.currentPlayers.O?.name === name) {
        displayErrorMessage("Can't delete player while they're in a game");
        return;
    }

    players = players.filter(p => p.name !== name);
    savePlayers();
    updateTable();
}

// Game Logic
function startGame() {
    gameState = {
        ...gameState,
        currentPlayer: X_CLASS,
        board: Array(9).fill(''),
        gameOver: false,
        machineThinking: false
    };
    drawBoard();
    updateGameStatus();
}

function makeMove(index) {
    if (gameState.gameOver || gameState.board[index] || gameState.machineThinking) return false;
    if (!canMakeMove()) return false;

    gameState.board[index] = gameState.currentPlayer;
    drawBoard();

    if (checkWin(gameState.currentPlayer)) {
        endGame(false);
        return true;
    }

    if (checkDraw()) {
        endGame(true);
        return true;
    }

    switchPlayer();
    updateGameStatus();

    // If it's computer's turn
    if (!gameState.gameOver && 
        ((gameState.gameMode === 'vsMachine' && gameState.currentPlayer === O_CLASS) ||
         gameState.gameMode === 'machineVsMachine')) {
        gameState.machineThinking = true;
        setTimeout(machineMove, 500); // Add a small delay for better UX
    }

    return true;
}

function canMakeMove() {
    const { gameMode, currentPlayers, currentPlayer } = gameState;

    if (gameMode === 'twoPlayers') {
        if (!currentPlayers.X || !currentPlayers.O) {
            displayErrorMessage('Select both players to start');
            return false;
        }
    } else if (gameMode === 'vsMachine') {
        if (!currentPlayers.X) {
            displayErrorMessage('Select a player to start');
            return false;
        }
        if (currentPlayer === O_CLASS) return false;
    } else if (gameMode === 'machineVsMachine') {
        return false;
    }

    return true;
}

function switchPlayer() {
    gameState.currentPlayer = gameState.currentPlayer === X_CLASS ? O_CLASS : X_CLASS;
}

// Drawing functions
function drawBoard() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw grid
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = LINE_WIDTH;
    
    // Vertical lines
    for (let i = 1; i < 3; i++) {
        ctx.beginPath();
        ctx.moveTo(i * CELL_SIZE, 0);
        ctx.lineTo(i * CELL_SIZE, canvas.height);
        ctx.stroke();
    }
    
    // Horizontal lines
    for (let i = 1; i < 3; i++) {
        ctx.beginPath();
        ctx.moveTo(0, i * CELL_SIZE);
        ctx.lineTo(canvas.width, i * CELL_SIZE);
        ctx.stroke();
    }

    // Draw X's and O's
    gameState.board.forEach((cell, index) => {
        if (cell) {
            const col = index % 3;
            const row = Math.floor(index / 3);
            drawSymbol(cell, col, row);
        }
    });
}

function drawSymbol(symbol, col, row) {
    const x = col * CELL_SIZE + CELL_SIZE / 2;
    const y = row * CELL_SIZE + CELL_SIZE / 2;
    const offset = 30;

    ctx.strokeStyle = symbol === X_CLASS ? '#FF5252' : '#4CAF50';
    ctx.lineWidth = LINE_WIDTH;

    if (symbol === X_CLASS) {
        ctx.beginPath();
        ctx.moveTo(x - offset, y - offset);
        ctx.lineTo(x + offset, y + offset);
        ctx.moveTo(x + offset, y - offset);
        ctx.lineTo(x - offset, y + offset);
        ctx.stroke();
    } else {
        ctx.beginPath();
        ctx.arc(x, y, offset, 0, Math.PI * 2);
        ctx.stroke();
    }
}

// Game state checks
function checkWin(player) {
    return WINNING_COMBINATIONS.some(combination => {
        return combination.every(index => gameState.board[index] === player);
    });
}

function checkDraw() {
    return gameState.board.every(cell => cell !== '');
}

function endGame(draw) {
    gameState.gameOver = true;
    
    if (draw) {
        elements.winningMessageText.textContent = "It's a Draw!";
        if (gameState.currentPlayers.X && gameState.currentPlayers.O) {
            gameState.currentPlayers.X.draw++;
            gameState.currentPlayers.O.draw++;
        }
    } else {
        const winner = gameState.currentPlayers[gameState.currentPlayer];
        const loser = gameState.currentPlayers[gameState.currentPlayer === X_CLASS ? O_CLASS : X_CLASS];
        
        if (winner && loser) {
            winner.won++;
            loser.lost++;
        }
        
        elements.winningMessageText.textContent = winner ? 
            `${winner.name} Wins!` : 
            `${gameState.currentPlayer} Wins!`;
    }
    
    savePlayers();
    updateTable();
    elements.winningMessage.style.display = 'flex';
}

// AI Logic
function machineMove() {
    if (gameState.gameOver) {
        gameState.machineThinking = false;
        return;
    }

    let move;
    switch(gameState.difficulty) {
        case 'hard':
            move = getBestMove();
            break;
        case 'medium':
            move = getMediumMove();
            break;
        case 'easy':
        default:
            move = getRandomMove();
    }

    if (move !== null) {
        gameState.board[move] = gameState.currentPlayer;
        drawBoard();

        if (checkWin(gameState.currentPlayer)) {
            endGame(false);
            gameState.machineThinking = false;
            return;
        }

        if (checkDraw()) {
            endGame(true);
            gameState.machineThinking = false;
            return;
        }

        switchPlayer();
        gameState.machineThinking = false;
        updateGameStatus();

        if (gameState.gameMode === 'machineVsMachine' && !gameState.gameOver) {
            gameState.machineThinking = true;
            setTimeout(machineMove, 500);
        }
    }
}

function getRandomMove() {
    const availableMoves = [];
    for (let i = 0; i < 9; i++) {
        if (gameState.board[i] === '') {
            availableMoves.push(i);
        }
    }
    return availableMoves.length > 0 ? availableMoves[Math.floor(Math.random() * availableMoves.length)] : null;
}

function getMediumMove() {
    // Try to win
    for (let i = 0; i < 9; i++) {
        if (gameState.board[i] === '') {
            gameState.board[i] = gameState.currentPlayer;
            if (checkWin(gameState.currentPlayer)) {
                gameState.board[i] = '';
                return i;
            }
            gameState.board[i] = '';
        }
    }

    // Block opponent
    const opponent = gameState.currentPlayer === X_CLASS ? O_CLASS : X_CLASS;
    for (let i = 0; i < 9; i++) {
        if (gameState.board[i] === '') {
            gameState.board[i] = opponent;
            if (checkWin(opponent)) {
                gameState.board[i] = '';
                return i;
            }
            gameState.board[i] = '';
        }
    }

    // Take center
    if (gameState.board[4] === '') return 4;

    // Take corners
    const corners = [0, 2, 6, 8];
    const availableCorners = corners.filter(i => gameState.board[i] === '');
    if (availableCorners.length > 0) {
        return availableCorners[Math.floor(Math.random() * availableCorners.length)];
    }

    // Take any available space
    return getRandomMove();
}

function getBestMove() {
    let bestScore = -Infinity;
    let bestMove = null;

    for (let i = 0; i < 9; i++) {
        if (gameState.board[i] === '') {
            gameState.board[i] = gameState.currentPlayer;
            let score = minimax(gameState.board, 0, false);
            gameState.board[i] = '';
            
            if (score > bestScore) {
                bestScore = score;
                bestMove = i;
            }
        }
    }

    return bestMove;
}

function minimax(board, depth, isMaximizing) {
    const result = checkGameState();
    if (result !== null) return result;

    if (isMaximizing) {
        let bestScore = -Infinity;
        for (let i = 0; i < 9; i++) {
            if (board[i] === '') {
                board[i] = gameState.currentPlayer;
                let score = minimax(board, depth + 1, false);
                board[i] = '';
                bestScore = Math.max(score, bestScore);
            }
        }
        return bestScore;
    } else {
        let bestScore = Infinity;
        for (let i = 0; i < 9; i++) {
            if (board[i] === '') {
                board[i] = (gameState.currentPlayer === X_CLASS ? O_CLASS : X_CLASS);
                let score = minimax(board, depth + 1, true);
                board[i] = '';
                bestScore = Math.min(score, bestScore);
            }
        }
        return bestScore;
    }
}

function checkGameState() {
    if (checkWin(gameState.currentPlayer)) return 1;
    if (checkWin(gameState.currentPlayer === X_CLASS ? O_CLASS : X_CLASS)) return -1;
    if (checkDraw()) return 0;
    return null;
}

// Event Handlers
function handleCanvasClick(e) {
    if (gameState.gameOver || gameState.machineThinking) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const col = Math.floor(x / CELL_SIZE);
    const row = Math.floor(y / CELL_SIZE);
    const index = row * 3 + col;

    makeMove(index);
}

function selectPlayer(name) {
    const player = players.find(p => p.name === name);
    if (!player) return;

    if (!gameState.currentPlayers.X) {
        gameState.currentPlayers.X = player;
    } else if (!gameState.currentPlayers.O && gameState.gameMode === 'twoPlayers') {
        if (gameState.currentPlayers.X.name !== player.name) {
            gameState.currentPlayers.O = player;
        }
    }

    updateTable();
    startGame();
}

// Event Listeners
canvas.addEventListener('click', handleCanvasClick);

elements.saveBtn.addEventListener('click', (e) => {
    e.preventDefault();
    const name = elements.inputName.value.trim();
    
    if (!name) {
        displayErrorMessage('Please enter a name');
        return;
    }
    
    if (players.some(p => p.name === name)) {
        displayErrorMessage('Player already exists');
        return;
    }
    
    const newPlayer = { name, won: 0, lost: 0, draw: 0 };
    players.push(newPlayer);
    savePlayers();
    elements.inputName.value = '';
    hideErrorMessage();
    
    if (!gameState.currentPlayers.X) {
        selectPlayer(name);
    }
    
    updateTable();
});

// Game mode buttons
document.getElementById('twoPlayersButton').addEventListener('click', () => {
    setGameMode('twoPlayers');
});

document.getElementById('vsMachineButton').addEventListener('click', () => {
    setGameMode('vsMachine');
});

document.getElementById('machineVsMachineButton').addEventListener('click', () => {
    setGameMode('machineVsMachine');
});

// Initial game mode buttons
document.getElementById('initialTwoPlayersBtn').addEventListener('click', () => {
    setGameMode('twoPlayers');
    elements.gameModeOverlay.style.display = 'none';
});

document.getElementById('initialVsMachineBtn').addEventListener('click', () => {
    setGameMode('vsMachine');
    elements.gameModeOverlay.style.display = 'none';
});

document.getElementById('initialMachineVsMachineBtn').addEventListener('click', () => {
    setGameMode('machineVsMachine');
    elements.gameModeOverlay.style.display = 'none';
});

// Restart button
document.getElementById('restartButton').addEventListener('click', () => {
    elements.winningMessage.style.display = 'none';
    gameState.currentPlayer = X_CLASS;
    gameState.board = Array(9).fill('');
    gameState.gameOver = false;
    gameState.machineThinking = false;
    drawBoard();
    updateGameStatus();
    
    if (gameState.gameMode === 'machineVsMachine') {
        setTimeout(machineMove, DELAY_TIME);
    }
});

// Difficulty change handler
elements.difficulty.addEventListener('change', (e) => {
    gameState.difficulty = e.target.value;
    if (gameState.gameMode === 'machineVsMachine') {
        startGame();
    }
});

// Helper functions
function displayErrorMessage(message) {
    elements.errorMessage.textContent = message;
    elements.errorMessage.style.display = 'block';
}

function hideErrorMessage() {
    elements.errorMessage.style.display = 'none';
}

function setGameMode(mode) {
    gameState.gameMode = mode;
    gameState.currentPlayers = { X: null, O: null };
    gameState.selectedPlayer = null;
    elements.difficultySelect.style.display = 
        (mode === 'vsMachine' || mode === 'machineVsMachine') ? 'block' : 'none';

    if (mode === 'vsMachine') {
        gameState.currentPlayers.O = { name: 'Computer', won: 0, lost: 0, draw: 0 };
    } else if (mode === 'machineVsMachine') {
        gameState.currentPlayers = {
            X: { name: 'Computer 1', won: 0, lost: 0, draw: 0 },
            O: { name: 'Computer 2', won: 0, lost: 0, draw: 0 }
        };
        setTimeout(machineMove, DELAY_TIME);
    }

    startGame();
    updateTable();
}
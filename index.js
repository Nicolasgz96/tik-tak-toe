// Constants for player symbols
const X_CLASS = 'x';
const O_CLASS = 'o';

// All possible winning combinations
const WINNING_COMBINATIONS = [
    [0, 1, 2],
    [3, 4, 5],
    [6, 7, 8],
    [0, 3, 6],
    [1, 4, 7],
    [2, 5, 8],
    [0, 4, 8],
    [2, 4, 6]
];

// Canvas setup
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const cellSize = 100;
const boardSize = 3;
const cellPadding = 10;

// Game state variables
let currentPlayer = 'X';
let boardState = ['', '', '', '', '', '', '', '', ''];
let gameMode = 'twoPlayers';
let difficulty = 'easy';
let gameOver = false;

// Scoreboard
let players = JSON.parse(localStorage.getItem("players")) || [];
let inputNameField = document.getElementById('inputName');

// Convert old player format to new format if necessary
players = players.map(player => {
    if (typeof player === 'string') {
        return { name: player, won: 0, lost: 0, draw: 0 };
    } else {
        return player;
    }
});

// Ensure players is an array
if (!Array.isArray(players)) {
    players = [];
}

let saveBtn = document.getElementById('nameBtn');
let vsField = document.getElementById("gameModeInfo");

// Event listener for saving player names
saveBtn.addEventListener("click", (e) => {
    e.preventDefault();

    let inputName = inputNameField.value.trim(); // Get input value and remove whitespace

    if (inputName === "") {
        displayErrorMessage(`Please enter a name`);
    }
    if (players.length < 2) {
        players.push({ name: inputName, won: 0, lost: 0, draw: 0 });
        localStorage.setItem("players", JSON.stringify(players));
        inputNameField.value = '';
    } else {
        // Reset players and start adding new names
        localStorage.removeItem("players");
        players = [];
        players = [{ name: inputName, won: 0, lost: 0, draw: 0 }];
        localStorage.setItem("players", JSON.stringify(players));
        inputNameField.value = '';
    }

    checkStorage();
});

// Check and update storage
function checkStorage () {
    if (players.length === 2) {
      vsField.innerHTML = players.map(player => player.name).join(' vs ');
    }
}

// Function to update the player table
function updateTable() {
    const tableBody = document.getElementById("tableBody");
    tableBody.innerHTML = '';

    const playersArray = players.map(player => ({
        name: player.name,
        won: player.won,
        lost: player.lost,
        draw: player.draw
    }));

    playersArray.sort((a, b) => b.won - a.won || a.lost - b.lost || a.draw - b.draw);

    playersArray.forEach(player => {
        const row = document.createElement("tr");
        row.innerHTML = `
            <td class="player-name">${player.name}</td>
            <td class="player-data">${player.won}</td>
            <td class="player-data">${player.lost}</td>
            <td class="player-data">${player.draw}</td>
            <td>
                <button onclick="selectPlayer('${player.name}')" class="action btns"><i class="fas fa-check-circle"></i>Select</button>
                <button onclick="deletePlayer('${player.name}')" class="action btne"><i class="fas fa-times-circle"></i>Delete</button>
            </td>
        `;

        tableBody.appendChild(row);
    });
}

// Function to display error messages
function displayErrorMessage(message) {
    const errorMessage = document.getElementById("errorMesage");
    errorMessage.textContent = message;
    errorMessage.style.display = "block";
    errorMessage.style.color = "red";
    errorMessage.style.marginTop = "20px";
}

// Function to hide error messages
function hideErrorMessage() {
    const errorMessage = document.getElementById("errorMesage");
    errorMessage.textContent = "";
    errorMessage.style.display = "none";
}

// Function to get a player by name
function getPlayerByName(name) {
    return players.find(players => players === name);
}

// Function to reset a player's wins
function resetPlayerWins(name) {
    const player = getPlayerByName(name);
    if (player) {
        player.resetWins();
        updateTable();
    }
}

// Function to get cursor position on canvas
function getCursorPosition(event) {
    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    return { x, y };
}

// Handle canvas click
canvas.addEventListener('click', handleCanvasClick);

function handleCanvasClick(event) {
    if (gameOver) return;

    const { x, y } = getCursorPosition(event);
    const col = Math.floor(x / cellSize);
    const row = Math.floor(y / cellSize);
    const index = row * 3 + col;

    if (boardState[index] === '') {
        boardState[index] = currentPlayer;

        drawSymbol(currentPlayer, col, row);

        if (checkWin(currentPlayer)) {
            endGame(false);
        } else if (isDraw()) {
            endGame(true);
        } else {
            currentPlayer = currentPlayer === 'X' ? 'O' : 'X';

            // Make machine move if necessary
            if (gameMode === 'vsMachine' && currentPlayer === 'O') {
                setTimeout(machineMove, 500);
            } else if (gameMode === 'machineVsMachine') {
                setTimeout(machineMove, 500);
            }
        }
    }
}

// Function to draw X or O on the canvas
function drawSymbol(symbol, col, row) {
    const padding = cellPadding;
    const centerX = col * cellSize + cellSize / 2;
    const centerY = row * cellSize + cellSize / 2;
    const radius = (cellSize - 2 * padding) / 2;

    ctx.lineWidth = 5;
    ctx.strokeStyle = symbol === 'X' ? '#f00' : '#00f'; // Red for X, blue for O

    ctx.beginPath();
    if (symbol === 'X') {
        ctx.moveTo(centerX - radius, centerY - radius);
        ctx.lineTo(centerX + radius, centerY + radius);
        ctx.moveTo(centerX + radius, centerY - radius);
        ctx.lineTo(centerX - radius, centerY + radius);
    } else {
        ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
    }
    ctx.stroke();
}

// Function to get a player by name
function getPlayerByName(name) {
    return players.find(player => player.name === name);
}

// Function to check if there's a winner
function checkWin(currentClass) {
    return WINNING_COMBINATIONS.some(combination => {
        return combination.every(index => {
            return boardState[index] === currentClass;
        });
    });
}

// Function to check if it's a draw
function isDraw() {
    return boardState.every(cell => cell !== '');
}

// Function to end the game
function endGame(draw) {
    const winningMessageElement = document.getElementById('winningMessage');
    const winningMessageTextElement = document.querySelector('[data-winning-message-text]');

    // Get the winning combination
    let winningCombination = null;
    WINNING_COMBINATIONS.forEach(combination => {
        if (combination.every(index => boardState[index] === currentPlayer)) {
            winningCombination = combination;
        }
    });   

    if (draw) {
        winningMessageTextElement.innerText = 'Draw!';
    } else {
        if (currentPlayer == 'X') {
           // Print the winning name if it's X
           winningMessageTextElement.innerText = `${players[0].name} Wins!`;  
           // Draw the winning line
           drawWinningLine(winningCombination);
            
        } else if (currentPlayer !== 'X') {
            winningMessageTextElement.innerText = `${players[1].name} Wins!`   
            drawWinningLine(winningCombination);
        }
        // Increase the wins of the current player
        const player = getPlayerByName(currentPlayer);
        if (player) {
            player.increaseWins();
        }
    }

    winningMessageElement.style.display = 'block';
    gameOver = true; // Mark the game as finished
}

// Function for machine move
function machineMove() {
    if (gameOver) return; // If the game has already ended, exit

    const availableCells = getAvailableCells();
    if (availableCells.length === 0) return; // If there are no available cells, exit

    let move;
    switch (difficulty) {
        case 'medium':
            move = mediumMove();
            break;
        case 'hard':
            move = minimaxMove();
            break;
        default:
            move = easyMove();
            break;
    }

    boardState[move] = currentPlayer;
    drawSymbol(currentPlayer, move % 3, Math.floor(move / 3));

    if (checkWin(currentPlayer)) {
        endGame(false);
    } else if (isDraw()) {
        endGame(true);
    } else {
        currentPlayer = currentPlayer === 'X' ? 'O' : 'X';

        // If it's "machine vs machine", we call machineMove after a delay
        if (gameMode === 'machineVsMachine') {
            setTimeout(machineMove, 500);
        }
    }
}

// Machine difficulty functions
function easyMove() {
    const availableCells = getAvailableCells();
    return availableCells[Math.floor(Math.random() * availableCells.length)];
}

function mediumMove() {
    // Intermediate logic (can be improved)
    // Here the logic can be improved for the machine to make smarter moves
    const availableCells = getAvailableCells();
    // Basic example of improved movement: prevent the player from winning in the next move
    for (let cell of availableCells) {
        boardState[cell] = currentPlayer;
        if (checkWin(currentPlayer)) {
            boardState[cell] = '';
            return cell;
        }
        boardState[cell] = '';
    }
    return easyMove();
}

function minimaxMove() {
    // Advanced logic with minimax algorithm
    return minimax(boardState, currentPlayer).index;
}

function minimax(newBoard, player) {
    const availSpots = getAvailableCells();

    if (checkWin('X')) {
        return { score: -10 };
    } else if (checkWin('O')) {
        return { score: 10 };
    } else if (availSpots.length === 0) {
        return { score: 0 };
    }

    const moves = [];
    for (let i = 0; i < availSpots.length; i++) {
        const move = {};
        move.index = availSpots[i];
        newBoard[availSpots[i]] = player;

        if (player === 'O') {
            const result = minimax(newBoard, 'X');
            move.score = result.score;
        } else {
            const result = minimax(newBoard, 'O');
            move.score = result.score;
        }

        newBoard[availSpots[i]] = '';
        moves.push(move);
    }

    let bestMove;
    if (player === 'O') {
        let bestScore = -10000;
        for (let i = 0; i < moves.length; i++) {
            if (moves[i].score > bestScore) {
                bestScore = moves[i].score;
                bestMove = i;
            }
        }
    } else {
        let bestScore = 10000;
        for (let i = 0; i < moves.length; i++) {
            if (moves[i].score < bestScore) {
                bestScore = moves[i].score;
                bestMove = i;
            }
        }
    }
    return moves[bestMove];
}

// Function to get available cells
function getAvailableCells() {
    return boardState.map((cell, index) => cell === '' ? index : -1).filter(index => index !== -1);
}

// Event listener to restart the game
document.getElementById('restartButton').addEventListener('click', () => {
    startGame();
    // Show game mode and difficulty information
    let gameModeInfo = '';
    if (gameMode === 'twoPlayers' && players.length === 2) {
        gameModeInfo = players.map(player => player.name).join(' vs ');
    } else if (gameMode === 'vsMachine') {
        gameModeInfo = `Playing vs Machine (${difficulty})`;
    } else if (gameMode === 'machineVsMachine') {
        gameModeInfo = 'Machine vs Machine';
    }
    document.getElementById('gameModeInfo').textContent = gameModeInfo;
});

// Event listeners for game mode buttons
document.getElementById('twoPlayersButton').addEventListener('click', () => {
    gameMode = 'twoPlayers';
    startGame();
});

document.getElementById('vsMachineButton').addEventListener('click', () => {
    gameMode = 'vsMachine';
    selectDifficulty();
});

document.getElementById('machineVsMachineButton').addEventListener('click', () => {
    gameMode = 'machineVsMachine';
    selectDifficulty();
});

// Function to select difficulty
function selectDifficulty() {
    let validDifficulties = ['easy', 'medium', 'hard'];
    let selectedDifficulty = prompt('Select difficulty: easy, medium, hard').toLowerCase();

    while (!validDifficulties.includes(selectedDifficulty)) {
        alert('That difficulty does not exist. Try again.');
        selectedDifficulty = prompt('Select difficulty: easy, medium, hard').toLowerCase();
    }

    difficulty = selectedDifficulty;
    startGame();
}

// Function to start the game
function startGame() {
    currentPlayer = 'X';
    boardState = ['', '', '', '', '', '', '', '', ''];
    drawBoard();
    document.getElementById('winningMessage').style.display = 'none';
    gameOver = false; // Reset the game over control variable

    // Show game mode and difficulty information
    let gameModeInfo = '';
    if (gameMode === 'twoPlayers') {
        gameModeInfo = 'Playing Two Players';
    } else if (gameMode === 'vsMachine' || players.length === 2) {
        gameModeInfo = `Playing vs Machine (${difficulty})`;
    } else if (gameMode === 'machineVsMachine' || players.length === 2) {
        gameModeInfo = 'Machine vs Machine';
    }
    document.getElementById('gameModeInfo').textContent = gameModeInfo;

    // Start machine move if necessary
    if (gameMode === 'vsMachine' && currentPlayer === 'O') {
        setTimeout(machineMove, 500); // Delay to simulate machine movement
    } else if (gameMode === 'machineVsMachine') {
        setTimeout(machineMove, 500);
    }
}

// Function to draw the board
function drawBoard() {
    // Clear the canvas before redrawing
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw the board lines
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 5;
    ctx.beginPath();
    for (let i = 1; i < boardSize; i++) {
        // Vertical lines
        ctx.moveTo(i * cellSize, 0);
        ctx.lineTo(i * cellSize, canvas.height);

        // Horizontal lines
        ctx.moveTo(0, i * cellSize);
        ctx.lineTo(canvas.width, i * cellSize);
    }
    ctx.stroke();
}

// Function to draw a line over the winning cells
function drawWinningLine(winningCombination) {
    const startCell = winningCombination[0];
    const endCell = winningCombination[2];

    // Calculate start and end coordinates based on winning cells
    const startX = (startCell % 3) * cellSize + cellPadding;
    const startY = Math.floor(startCell / 3) * cellSize + cellPadding;
    const endX = (endCell % 3) * cellSize + cellSize - cellPadding;
    const endY = Math.floor(endCell / 3) * cellSize + cellSize - cellPadding;

    // Draw the line with progressive drawing effect
    ctx.strokeStyle = '#000'; // Black color for the stroke
    ctx.lineWidth = 7; // Line width

    ctx.beginPath();
    ctx.moveTo(startX, startY);
    ctx.lineTo(startX, startY); // Start at the tip of the initial cell
    ctx.stroke();

    let currentX = startX;
    let currentY = startY;

    const deltaX = (endX - startX) / 30;
    const deltaY = (endY - startY) / 30;

    // Function to draw the line progressively
    function drawStep() {
        if (Math.abs(currentX - endX) < Math.abs(deltaX) && Math.abs(currentY - endY) < Math.abs(deltaY)) {
            // Finish drawing when we reach the end point
            ctx.lineTo(endX, endY);
            ctx.stroke();
            return;
        }

        // Draw the next step of the line
        currentX += deltaX;
        currentY += deltaY;
        ctx.lineTo(currentX, currentY);
        ctx.stroke();

        // Call recursively for the next step
        requestAnimationFrame(drawStep);
    }

    // Start the progressive drawing
    drawStep();
}

function deletePlayer(name) {
    players = players.filter(player => player.name !== name);
    localStorage.setItem("players", JSON.stringify(players));
    updateTable();
}

function selectPlayer(name) {
    console.log(`Selected player: ${name}`);
    const player = getPlayerByName(name);
    if (player) {
        player.playing = true;
    }
    updateTable();
}

// Start the game by default
updateTable();
checkStorage();
startGame();
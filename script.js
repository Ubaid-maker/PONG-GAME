// Canvas setup
const canvas = document.getElementById('pongCanvas');
const ctx = canvas.getContext('2d');

// Game state
let gameRunning = false;
let gameOver = false;
let winningPlayer = null;

const WINNING_SCORE = 5;

// Paddle properties
const paddleHeight = 100;
const paddleWidth = 12;
const paddleSpeed = 6;

// Player paddle (left)
const player = {
    x: 30,
    y: canvas.height / 2 - paddleHeight / 2,
    width: paddleWidth,
    height: paddleHeight,
    dy: 0,
    score: 0
};

// Computer paddle (right)
const computer = {
    x: canvas.width - 30 - paddleWidth,
    y: canvas.height / 2 - paddleHeight / 2,
    width: paddleWidth,
    height: paddleHeight,
    dy: 0,
    score: 0
};

// Ball properties
const ball = {
    x: canvas.width / 2,
    y: canvas.height / 2,
    radius: 10,
    dx: 5,
    dy: 5,
    speed: 5,
    maxSpeed: 10
};

// Event listeners
document.addEventListener('keydown', handleKeyDown);
document.addEventListener('keyup', handleKeyUp);

document.getElementById('reset-btn').addEventListener('click', resetGame);

function handleKeyDown(e) {
    if (e.key === 'ArrowUp') {
        player.dy = -paddleSpeed;
    } else if (e.key === 'ArrowDown') {
        player.dy = paddleSpeed;
    } else if (e.key === ' ') {
        e.preventDefault();
        if (!gameOver) {
            gameRunning = !gameRunning;
            updateStatusMessage();
        }
    }
}

function handleKeyUp(e) {
    if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
        player.dy = 0;
    }
}

function updateStatusMessage() {
    const statusEl = document.getElementById('status-message');
    if (gameOver) {
        statusEl.innerHTML = `<span style="color: #00ff88; text-shadow: 0 0 10px rgba(0, 255, 136, 0.5);">${winningPlayer} Wins! Press New Game to restart</span>`;
    } else if (gameRunning) {
        statusEl.innerHTML = 'Press <span class="key">SPACE</span> to Pause';
    } else {
        statusEl.innerHTML = 'Press <span class="key">SPACE</span> to Start';
    }
}

function updatePlayerPaddle() {
    player.y += player.dy;

    // Boundary check
    if (player.y < 0) player.y = 0;
    if (player.y + player.height > canvas.height) {
        player.y = canvas.height - player.height;
    }
}

function updateComputerPaddle() {
    const computerSpeed = 4.5;
    const computerCenter = computer.y + computer.height / 2;

    // Smarter AI with prediction
    if (computerCenter < ball.y - 40) {
        computer.y += computerSpeed;
    } else if (computerCenter > ball.y + 40) {
        computer.y -= computerSpeed;
    }

    // Boundary check
    if (computer.y < 0) computer.y = 0;
    if (computer.y + computer.height > canvas.height) {
        computer.y = canvas.height - computer.height;
    }
}

function updateBall() {
    ball.x += ball.dx;
    ball.y += ball.dy;

    // Top and bottom collision
    if (ball.y - ball.radius < 0 || ball.y + ball.radius > canvas.height) {
        ball.dy = -ball.dy;
        ball.y = Math.max(ball.radius, Math.min(canvas.height - ball.radius, ball.y));
    }

    // Left and right collision (scoring)
    if (ball.x - ball.radius < 0) {
        computer.score++;
        updateScore();
        resetBall();
        checkWin();
    } else if (ball.x + ball.radius > canvas.width) {
        player.score++;
        updateScore();
        resetBall();
        checkWin();
    }

    // Paddle collision
    checkPaddleCollision(player);
    checkPaddleCollision(computer);
}

function checkPaddleCollision(paddle) {
    if (
        ball.x - ball.radius < paddle.x + paddle.width &&
        ball.x + ball.radius > paddle.x &&
        ball.y < paddle.y + paddle.height &&
        ball.y > paddle.y
    ) {
        ball.dx = -ball.dx * 1.02; // Slight speed increase on paddle hit
        
        // Add spin based on where ball hits paddle
        const collidePoint = ball.y - (paddle.y + paddle.height / 2);
        const spinFactor = collidePoint / (paddle.height / 2);
        ball.dy += spinFactor * 4;
        
        // Limit ball speed
        const speed = Math.sqrt(ball.dx * ball.dx + ball.dy * ball.dy);
        if (speed > ball.maxSpeed) {
            ball.dx = (ball.dx / speed) * ball.maxSpeed;
            ball.dy = (ball.dy / speed) * ball.maxSpeed;
        }
        
        // Move ball away from paddle
        ball.x = paddle.x > canvas.width / 2 
            ? paddle.x - ball.radius - 1
            : paddle.x + paddle.width + ball.radius + 1;
    }
}

function resetBall() {
    ball.x = canvas.width / 2;
    ball.y = canvas.height / 2;
    ball.dx = (Math.random() > 0.5 ? 1 : -1) * ball.speed;
    ball.dy = (Math.random() - 0.5) * ball.speed;
    
    // Add slight delay for visual effect
    gameRunning = false;
    setTimeout(() => {
        updateStatusMessage();
    }, 100);
}

function updateScore() {
    document.getElementById('player1-score').textContent = player.score;
    document.getElementById('player2-score').textContent = computer.score;
}

function checkWin() {
    if (player.score >= WINNING_SCORE) {
        gameRunning = false;
        gameOver = true;
        winningPlayer = 'Player 1';
        updateStatusMessage();
    } else if (computer.score >= WINNING_SCORE) {
        gameRunning = false;
        gameOver = true;
        winningPlayer = 'AI';
        updateStatusMessage();
    }
}

function resetGame() {
    player.score = 0;
    computer.score = 0;
    gameRunning = false;
    gameOver = false;
    winningPlayer = null;
    
    player.y = canvas.height / 2 - paddleHeight / 2;
    computer.y = canvas.height / 2 - paddleHeight / 2;
    
    ball.x = canvas.width / 2;
    ball.y = canvas.height / 2;
    ball.dx = (Math.random() > 0.5 ? 1 : -1) * ball.speed;
    ball.dy = (Math.random() - 0.5) * ball.speed;
    
    updateScore();
    updateStatusMessage();
}

// Drawing functions
function drawPaddle(paddle, color) {
    ctx.fillStyle = color;
    ctx.shadowColor = color;
    ctx.shadowBlur = 15;
    ctx.fillRect(paddle.x, paddle.y, paddle.width, paddle.height);
    ctx.shadowBlur = 0;
}

function drawBall() {
    const gradient = ctx.createRadialGradient(ball.x, ball.y, 0, ball.x, ball.y, ball.radius);
    gradient.addColorStop(0, '#00d4ff');
    gradient.addColorStop(1, '#00a8cc');
    
    ctx.fillStyle = gradient;
    ctx.shadowColor = '#00d4ff';
    ctx.shadowBlur = 20;
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
}

function drawCenterLine() {
    ctx.strokeStyle = 'rgba(0, 212, 255, 0.2)';
    ctx.setLineDash([15, 15]);
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(canvas.width / 2, 0);
    ctx.lineTo(canvas.width / 2, canvas.height);
    ctx.stroke();
    ctx.setLineDash([]);
}

function drawGame() {
    // Clear canvas with dark background
    ctx.fillStyle = '#0a0e27';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw elements
    drawCenterLine();
    drawPaddle(player, '#00d4ff');
    drawPaddle(computer, '#ff006e');
    drawBall();
}

// Game loop
function gameLoop() {
    if (gameRunning) {
        updatePlayerPaddle();
        updateComputerPaddle();
        updateBall();
    }

    drawGame();
    requestAnimationFrame(gameLoop);
}

// Initialize
updateStatusMessage();
updateScore();
gameLoop();

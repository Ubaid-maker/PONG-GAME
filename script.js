// Canvas setup
const canvas = document.getElementById('pong');
const ctx = canvas.getContext('2d');

// Game variables
let gameRunning = false;

// Paddle properties
const paddleHeight = 100;
const paddleWidth = 10;
const paddleSpeed = 6;

// Player paddle (left)
const player = {
    x: 20,
    y: canvas.height / 2 - paddleHeight / 2,
    width: paddleWidth,
    height: paddleHeight,
    dy: 0,
    score: 0
};

// Computer paddle (right)
const computer = {
    x: canvas.width - 20 - paddleWidth,
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
    radius: 8,
    dx: 5,
    dy: 5,
    speed: 5
};

// Mouse position tracking
let mouseY = canvas.height / 2;

// Event listeners
canvas.addEventListener('mousemove', (e) => {
    const rect = canvas.getBoundingClientRect();
    mouseY = e.clientY - rect.top;
});

document.addEventListener('keydown', handleKeyDown);
document.addEventListener('keyup', handleKeyUp);

function handleKeyDown(e) {
    if (e.key === 'ArrowUp') {
        player.dy = -paddleSpeed;
    } else if (e.key === 'ArrowDown') {
        player.dy = paddleSpeed;
    } else if (e.key === ' ') {
        e.preventDefault();
        gameRunning = !gameRunning;
    }
}

function handleKeyUp(e) {
    if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
        player.dy = 0;
    }
}

// Update player paddle position with mouse
function updatePlayerPaddle() {
    // Mouse control
    const mouseSpeed = 4;
    if (mouseY < player.y + player.height / 2) {
        player.y -= mouseSpeed;
    } else if (mouseY > player.y + player.height / 2) {
        player.y += mouseSpeed;
    }

    // Keyboard control
    player.y += player.dy;

    // Boundary check
    if (player.y < 0) player.y = 0;
    if (player.y + player.height > canvas.height) {
        player.y = canvas.height - player.height;
    }
}

// Update computer paddle (AI)
function updateComputerPaddle() {
    const computerSpeed = 4;
    const computerCenter = computer.y + computer.height / 2;

    if (computerCenter < ball.y - 35) {
        computer.y += computerSpeed;
    } else if (computerCenter > ball.y + 35) {
        computer.y -= computerSpeed;
    }

    // Boundary check
    if (computer.y < 0) computer.y = 0;
    if (computer.y + computer.height > canvas.height) {
        computer.y = canvas.height - computer.height;
    }
}

// Update ball position
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
        resetBall();
    } else if (ball.x + ball.radius > canvas.width) {
        player.score++;
        resetBall();
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
        ball.dx = -ball.dx;
        
        // Add spin based on where ball hits paddle
        const collidePoint = ball.y - (paddle.y + paddle.height / 2);
        collidePoint > 0 ? (ball.dy += 2) : (ball.dy -= 2);
        
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
    ball.dy = (Math.random() > 0.5 ? 1 : -1) * ball.speed;
}

// Draw functions
function drawPaddle(paddle) {
    ctx.fillStyle = '#00ff88';
    ctx.fillRect(paddle.x, paddle.y, paddle.width, paddle.height);
}

function drawBall() {
    ctx.fillStyle = '#ff6b6b';
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
    ctx.fill();
}

function drawCenterLine() {
    ctx.strokeStyle = 'rgba(0, 255, 136, 0.3)';
    ctx.setLineDash([10, 10]);
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(canvas.width / 2, 0);
    ctx.lineTo(canvas.width / 2, canvas.height);
    ctx.stroke();
    ctx.setLineDash([]);
}

function drawGame() {
    // Clear canvas
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw elements
    drawCenterLine();
    drawPaddle(player);
    drawPaddle(computer);
    drawBall();

    // Draw start message
    if (!gameRunning) {
        ctx.fillStyle = 'rgba(0, 255, 136, 0.8)';
        ctx.font = '24px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('Press SPACE to Start', canvas.width / 2, canvas.height / 2 - 40);
    }
}

// Update score display
function updateScoreDisplay() {
    document.getElementById('playerScore').textContent = player.score;
    document.getElementById('computerScore').textContent = computer.score;
}

// Game loop
function gameLoop() {
    if (gameRunning) {
        updatePlayerPaddle();
        updateComputerPaddle();
        updateBall();
        updateScoreDisplay();
    }

    drawGame();
    requestAnimationFrame(gameLoop);
}

// Start the game
gameLoop();

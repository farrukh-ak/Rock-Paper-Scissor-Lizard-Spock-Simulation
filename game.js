const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const startBtn = document.getElementById("startBtn");
const resetBtn = document.getElementById("resetBtn");
const speedSlider = document.getElementById("speed");
const statsDiv = document.getElementById("stats");

const COLLISION_COOLDOWN = 250;
const RADIUS = 12;

let entities = [];
let animationId = null;
let gameOver = false;
let winner = null;
let frameCount = 0;

// ---------- RULE ENGINE ----------
const RULES = {
    rock: ["scissors", "lizard"],
    paper: ["rock", "spock"],
    scissors: ["paper", "lizard"],
    lizard: ["spock", "paper"],
    spock: ["scissors", "rock"]
};

const EMOJI = {
    rock: "🪨",
    paper: "📄",
    scissors: "✂️",
    lizard: "🦎",
    spock: "🖖"
};

// ---------- Chart ----------
const chartCtx = document.getElementById("chartCanvas").getContext("2d");
const chart = new Chart(chartCtx, {
    type: "line",
    data: {
        labels: [],
        datasets: Object.keys(RULES).map(type => ({
            label: EMOJI[type] + " " + type,
            data: [],
            fill: false
        }))
    },
    options: { responsive: false, animation: false }
});

// ---------- Entity ----------
function createEntity(type) {
    const speed = Number(speedSlider.value);
    const angle = Math.random() * Math.PI * 2;

    return {
        type,
        x: Math.random() * (canvas.width - 40) + 20,
        y: Math.random() * (canvas.height - 40) + 20,
        dx: Math.cos(angle) * speed,
        dy: Math.sin(angle) * speed,
        lastCollision: 0
    };
}

// ---------- Init ----------
function initGame() {
    entities = [];
    gameOver = false;
    winner = null;
    frameCount = 0;

    chart.data.labels = [];
    chart.data.datasets.forEach(d => d.data = []);
    chart.update();

    Object.keys(RULES).forEach(type => {
        const count = +document.getElementById(type).value;
        for (let i = 0; i < count; i++) {
            entities.push(createEntity(type));
        }
    });
}

// ---------- Movement ----------
function move(e) {
    e.x += e.dx;
    e.y += e.dy;

    if (e.x <= 10 || e.x >= canvas.width - 10) e.dx *= -1;
    if (e.y <= 10 || e.y >= canvas.height - 10) e.dy *= -1;
}

// ---------- Collision ----------
function isColliding(a, b) {
    return Math.hypot(a.x - b.x, a.y - b.y) < RADIUS * 2;
}

function resolveCollision(a, b) {
    const now = Date.now();
    if (now - a.lastCollision < COLLISION_COOLDOWN) return;

    a.lastCollision = b.lastCollision = now;

    if (a.type === b.type) return;

    if (RULES[a.type].includes(b.type)) {
        b.type = a.type;
    } else if (RULES[b.type].includes(a.type)) {
        a.type = b.type;
    }
}

// ---------- Draw ----------
function draw(e) {
    ctx.font = "20px Arial";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(EMOJI[e.type], e.x, e.y);
}

// ---------- Stats & Winner ----------
function updateStats() {
    const counts = {};
    Object.keys(RULES).forEach(t => counts[t] = 0);

    entities.forEach(e => counts[e.type]++);

    statsDiv.innerHTML = Object.keys(counts)
        .map(t => `${EMOJI[t]} ${counts[t]}`)
        .join(" | ");

    if (frameCount % 20 === 0) {
        chart.data.labels.push(frameCount);
        chart.data.datasets.forEach(d => {
            const type = d.label.split(" ")[1];
            d.data.push(counts[type]);
        });
        chart.update();
    }

    const alive = Object.values(counts).filter(v => v > 0);
    if (alive.length === 1 && !gameOver) {
        winner = Object.keys(counts).find(k => counts[k] > 0);
        gameOver = true;
    }
}

// ---------- Winner Overlay ----------
function drawWinner() {
    ctx.fillStyle = "rgba(0,0,0,0.75)";
    ctx.fillRect(0, canvas.height / 2 - 40, canvas.width, 80);

    ctx.fillStyle = "white";
    ctx.font = "28px Arial";
    ctx.textAlign = "center";
    ctx.fillText(
        `${EMOJI[winner]} ${winner.toUpperCase()} WINS!`,
        canvas.width / 2,
        canvas.height / 2
    );
}

// ---------- Loop ----------
function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    frameCount++;

    for (let i = 0; i < entities.length; i++) {
        move(entities[i]);

        for (let j = i + 1; j < entities.length; j++) {
            if (isColliding(entities[i], entities[j])) {
                resolveCollision(entities[i], entities[j]);
            }
        }

        draw(entities[i]);
    }

    updateStats();

    if (gameOver) {
        drawWinner();
        return;
    }

    animationId = requestAnimationFrame(animate);
}

// ---------- Buttons ----------
startBtn.onclick = () => {
    cancelAnimationFrame(animationId);
    initGame();
    animate();
};

resetBtn.onclick = () => {
    cancelAnimationFrame(animationId);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    statsDiv.innerHTML = "";
};

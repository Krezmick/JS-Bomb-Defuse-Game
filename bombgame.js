const COLORS = ["red", "blue", "green", "yellow", "orange", "black", "white"];
const timerEl = document.getElementById('timer');
const customTimeInput = document.getElementById('customTime');
const wiresSVG = document.getElementById('wires');
const messageEl = document.getElementById('message');
const startBtn = document.getElementById('startBtn');
const hintBtn = document.getElementById('hintBtn');

let hintsUsed = 0;
let correctWire = null;
let timeLeft = 0;
let intervalId = null;

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function shuffle(arr) {
  return arr.map(v => [Math.random(), v]).sort((a,b) => a[0]-b[0]).map(p => p[1]);
}

function drawWires() {
  wiresSVG.innerHTML = '';

  const numWires = randomInt(2, 4);
  const shuffled = shuffle([...COLORS]).slice(0, numWires);
  correctWire = shuffled[randomInt(0, shuffled.length - 1)];

  // Get timer block position relative to SVG
  const bombRect = document.getElementById('bomb').getBoundingClientRect();
  const timerRect = document.querySelector('.timer-block').getBoundingClientRect();
  const svgRect = wiresSVG.getBoundingClientRect();

  const timerCenterY = (timerRect.top + timerRect.bottom) / 2 - svgRect.top;
  const timerLeftX = timerRect.left - svgRect.left;
  const timerRightX = timerRect.right - svgRect.left;

  shuffled.forEach((color, i) => {
    const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    path.classList.add('wire');
    path.setAttribute('stroke', color);

    // Randomly choose left or right side of timer
    const side = Math.random() < 0.5 ? 'left' : 'right';
    const startX = side === 'left' ? timerLeftX : timerRightX;
    const startY = timerCenterY + (i - (numWires - 1) / 2) * 15;

    // End point: left or right dynamite stick
    const endX = side === 'left' ? 40 : svgRect.width + 20; //40 -40 adjust wire length for each side
    const endY = 10 + randomInt(0, 40);

    // Control points for curve
    const cp1X = side === 'left' ? startX - 50 : startX + 50;
    const cp1Y = startY - 20;
    const cp2X = side === 'left' ? endX + 50 : endX - 50;
    const cp2Y = endY + 10;

    const d = `M${startX},${startY} C${cp1X},${cp1Y} ${cp2X},${cp2Y} ${endX},${endY}`;
    path.setAttribute('d', d);

    path.dataset.color = color;
    path.addEventListener('click', () => cutWire(color, path));
    wiresSVG.appendChild(path);
  });
}

  function triggerExplosion() {
    const bombEl = document.getElementById('bomb');

    // Shake bomb
    bombEl.classList.add('shake');
    setTimeout(() => bombEl.classList.remove('shake'), 500);

    // Flash screen
    const flash = document.createElement('div');
    flash.className = 'flash';
    document.body.appendChild(flash);
    setTimeout(() => flash.remove(), 300);

    // Blast circle
    const explosion = document.createElement('div');
    explosion.className = 'explosion';
    const blast = document.createElement('div');
    blast.className = 'blast';
    explosion.appendChild(blast);
    bombEl.appendChild(explosion);
    setTimeout(() => explosion.remove(), 600);

    // Debris particles
    for (let i = 0; i < 12; i++) {
      const p = document.createElement('div');
      p.className = 'particle';
      const angle = Math.random() * Math.PI * 2;
      const dist = 80 + Math.random() * 40;
      p.style.setProperty('--dx', `${Math.cos(angle) * dist}px`);
      p.style.setProperty('--dy', `${Math.sin(angle) * dist}px`);
      p.style.left = '50%';
      p.style.top = '50%';
      bombEl.appendChild(p);
      setTimeout(() => p.remove(), 800);
    }
  }
  
function formatTime(ms) {
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const milliseconds = ms % 1000;

  let parts = [];

  if (hours > 0) {
    parts.push(String(hours).padStart(2, '0'));
    parts.push(String(minutes).padStart(2, '0'));
    parts.push(String(seconds).padStart(2, '0'));
  } else if (minutes > 0) {
    parts.push(String(minutes).padStart(2, '0'));
    parts.push(String(seconds).padStart(2, '0'));
  } else {
    parts.push(String(seconds).padStart(2, '0'));
	parts.push(String(milliseconds).padStart(3, '0'));
  }

  return parts.join(':');
}

function startGame() {
  clearInterval(intervalId);
  drawWires();
  timeLeft = randomInt(8, 20);
  hintsUsed = 0;

  const customVal = parseInt(customTimeInput.value, 10);  // Check for custom time in seconds
  let seconds;
  if (!isNaN(customVal) && customVal > 0) {
    seconds = customVal;
  } else {
    seconds = randomInt(8, 31); //Fallback to random val
  }

  timeLeft = seconds * 1000; // Convert to millisecondse

  timerEl.textContent = formatTime(timeLeft);
  timerEl.style.color = '#0f0';
  messageEl.textContent = 'Bomb armed! Cut the right wire!';
  hintBtn.disabled = false;

  const tickRate = 10; // update every 10ms
  intervalId = setInterval(() => {
    timeLeft -= tickRate;
    if (timeLeft <= 0) {
      timeLeft = 0;
      timerEl.textContent = formatTime(timeLeft);
      clearInterval(intervalId);
      explode();
    } else {
      timerEl.textContent = formatTime(timeLeft);
    }
  }, tickRate);
}

function cutWire(color, pathEl) {
  if (timeLeft <= 0) return;
  clearInterval(intervalId);
  hintBtn.disabled = true;
  if (color === correctWire) {
    messageEl.textContent = `You cut the ${color} wire. Bomb defused!`;
    timerEl.style.color = '#0f0';
  } else {
    explode(`Wrong wire! It was ${correctWire}.`);
  }
}

function explode(reason) {
  messageEl.textContent = reason || 'Boom! Time ran out!';
  timerEl.style.color = '#f00';
  timeLeft = 0;
  triggerExplosion(); // explosion visuals
}

function giveHint() {
  if (timeLeft <= 1) return;
  const wires = Array.from(wiresSVG.querySelectorAll('.wire'));
  const wrongWires = wires.filter(w => w.dataset.color !== correctWire);
  if (wires.length === 2) {
    messageEl.textContent = `Good luck.`;
	hintBtn.disabled = true;
	return;
  }
  if (wrongWires.length > 0) {
    const choice = wrongWires[randomInt(0, wrongWires.length - 1)];
    choice.remove(); // remove one wrong wire
    hintsUsed++;
    timeLeft -= 1000; // 1000 = 1 sec
    timerEl.textContent = timeLeft.toString().padStart(2, '0');
    messageEl.textContent = `Hint used: Removed a wrong wire. (${hintsUsed} used)`;
  }
}

hintBtn.addEventListener('click', giveHint);
startBtn.addEventListener('click', startGame);
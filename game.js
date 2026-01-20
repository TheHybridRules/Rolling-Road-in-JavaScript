// Screen
const screenWidth = 1024;
const screenHeight = 768;

// Road settings
const roadWidth = 3000;
const segmentLength = 200;
const cameraDepth = 0.84;

async function main() {
  // Pixi app (v8)
  const app = new PIXI.Application();
  await app.init({
    width: screenWidth,
    height: screenHeight,
    backgroundColor: 0x69cd04
  });
  document.body.appendChild(app.canvas);

// Keyboard
const keys = {};
window.addEventListener("keydown", e => keys[e.code] = true);
window.addEventListener("keyup", e => keys[e.code] = false);

// Draw quad
function drawQuad(g, color, x1, y1, w1, x2, y2, w2) {
  g.beginFill(color);
  g.moveTo(x1 - w1, y1);
  g.lineTo(x2 - w2, y2);
  g.lineTo(x2 + w2, y2);
  g.lineTo(x1 + w1, y1);
  g.closePath();
  g.endFill();
}

// Line class
class Line {
  constructor() {
    this.x = this.y = this.z = 0;
    this.X = this.Y = this.W = 0;
    this.curve = 0;
    this.scale = 0;
    this.clip = 0;
  }

  project(camX, camY, camZ, z) {
    this.scale = cameraDepth / (z - camZ);
    this.X = (1 + this.scale * (this.x - camX)) * screenWidth / 2;
    this.Y = (1 - this.scale * (this.y - camY)) * screenHeight / 2;
    this.W = this.scale * roadWidth * screenWidth / 2;
  }
}

// Track
const lines = [];
let H = 1800;

for (let i = 0; i < 1600; i++) {
  const l = new Line();
  l.z = i * segmentLength;
  if (i > 100 && i < 700) l.curve = 0.5;
  if (i > 750) l.y = Math.sin(i / 30) * H + Math.sin(i / 8) * (H * 0.15);
  if (i > 1100) l.curve = -0.7;
  if (i > 1400) l.curve = 2.0;
  lines.push(l);
}

const N = lines.length;

// Player
let playerX = 0;
let pos = 0;

  // Graphics layer
  const roadGfx = new PIXI.Graphics();
  app.stage.addChild(roadGfx);
  const hudText = new PIXI.Text("pos: 0 | segment: 0", {
    fontFamily: "Arial",
    fontSize: 16,
    fill: 0x000000
  });
  hudText.position.set(10, 10);
  app.stage.addChild(hudText);

// Game loop
  app.ticker.add(() => {
  let speed = 0;
  const baseSpeed = 120;

  if (keys["ArrowRight"]) playerX += 0.2;
  if (keys["ArrowLeft"]) playerX -= 0.2;
  if (keys["ArrowUp"]) speed = baseSpeed;
  if (keys["ArrowDown"]) speed = -baseSpeed;
  if (keys["Space"]) speed *= 3;

  pos += speed;
  while (pos >= N * segmentLength) pos -= N * segmentLength;
  while (pos < 0) pos += N * segmentLength;

  roadGfx.clear();

  const startPos = Math.floor(pos / segmentLength);
  hudText.text = `pos: ${pos.toFixed(1)} | segment: ${startPos}`;
  const camH = lines[startPos].y + H;
  const centrifugal = 0.0008;
  playerX -= (speed / segmentLength) * lines[startPos].curve * centrifugal;

  let maxy = screenHeight;
  let x = 0, dx = 0;

  const trackLength = N * segmentLength;
  for (let n = startPos + 1; n < startPos + 301; n++) {
    const l = lines[n % N];
    const z = l.z + (n >= N ? trackLength : 0);
    l.x = x;
    l.project(
      playerX * roadWidth,
      camH,
      pos,
      z
    );

    x += dx;
    dx += l.curve;

    if (l.Y >= maxy) continue;
    maxy = l.Y;

    const grass = ((n / 3) | 0) % 2 ? 0x10c810 : 0x009a00;
    const rumble = ((n / 3) | 0) % 2 ? 0xffffff : 0xff0000;
    const road = ((n / 3) | 0) % 2 ? 0x6e6e6e : 0x696969;

    const p = lines[(n - 1 + N) % N];

    drawQuad(roadGfx, grass, 0, p.Y, screenWidth, 0, l.Y, screenWidth);
    drawQuad(roadGfx, rumble, p.X, p.Y, p.W * 1.2, l.X, l.Y, l.W * 1.2);
    drawQuad(roadGfx, road, p.X, p.Y, p.W, l.X, l.Y, l.W);
  }
  });
}

main();

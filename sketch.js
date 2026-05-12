let score = 0;
let timeLeft = 15;
let gameActive = true;
let ships = [];
let currentLevel = 1;
let goalPoints = 3; 
let imgRegistration;
let imgEndCard;

// --- CONFIGURACIÓN GOOGLE SHEETS ---
let googleSheetURL = "https://script.google.com/macros/s/AKfycbx1u28maAaFSD0JOBl15iJP-s0SP3OHKUrOjWBrb67psO-nwCfiw7XptzCu4anOSlLwgA/exec";

// --- VARIABLES DE NIVEL Y ESTADO ---
let gameState = "MENU"; 
let imgPortada, imgBtnStart, imgInstructions, imgBtnMission, imgBtnSubmit; 
let showValidationError = false; 

let shipsSpawned = 0;
let bombsSpawned = 0;
let safeSpawned = 0;
let shipsPassedSafe = 0; 
let safeDestroyed = 0;   
let bombsEscaped = 0;
let totalLevelShips = 10;     
let maxBombsAllowed = 3;
let winState = false;
let showingLevelCard = false; 

let nivelMazo = []; 
let zigzagCount = 0; 

let imgPlayer, imgEnemy1, imgEnemy2, imgEnemy3, imgBackground, imgWoodPlate;
let clickedShipId = null; 

let iconBomb, iconTrash, iconFish, iconOil;
let allIcons = []; 

// --- TOUCH ---
let touchX = -1;
let touchY = -1;

const SHIPS_TYPES = [
  { name: "MT Sovereign",    flag: "Liberia",       isSmuggler: false, img: () => imgEnemy1 },
  { name: "IRGC Al-Badr",   flag: "IRGC Tactical", isSmuggler: true,  img: () => imgEnemy2 },
  { name: "Sea Gazelle",     flag: "Panama",        isSmuggler: false, img: () => imgEnemy3 },
  { name: "Dhow Fast-Craft", flag: "IRGC Naval",    isSmuggler: true,  img: () => imgEnemy1 },
];

// ── Helpers ───────────────────────────────────────────────────────────────────
function getPointerX() { return touches.length > 0 ? touches[0].x : mouseX; }
function getPointerY() { return touches.length > 0 ? touches[0].y : mouseY; }

// ── p5 lifecycle ──────────────────────────────────────────────────────────────
function preload() {
  imgPortada      = loadImage('Assets/screen.png');
  imgBtnStart     = loadImage('Assets/start.png'); 
  imgInstructions = loadImage('Assets/instructions.png'); 
  imgBtnMission   = loadImage('Assets/start mission.png'); 
  imgRegistration = loadImage('Assets/registration.png');
  imgBtnSubmit    = loadImage('Assets/submit.png');
  imgWoodPlate    = loadImage('Assets/WoodPlate.png');
  imgEndCard      = loadImage('Assets/end card.png');
  imgPlayer       = loadImage('Assets/AMERICAN.png');
  imgEnemy1       = loadImage('Assets/Enemy 1.png'); 
  imgEnemy2       = loadImage('Assets/Enemy 2.png');
  imgEnemy3       = loadImage('Assets/Enemy 3.png');
  imgBackground   = loadImage('Assets/background.png'); 
  iconBomb        = loadImage('Assets/IconBomb.png');
  iconTrash       = loadImage('Assets/IconTrash.png');
  iconFish        = loadImage('Assets/IconFish.png');
  iconOil         = loadImage('Assets/IconOil.png');
}

function setup() {
  createCanvas(800, 600);
  allIcons = [iconBomb, iconTrash, iconFish, iconOil];
  prepararMazo();

  // Prevent scroll/zoom on canvas touches, but allow touches on HTML inputs
  let cnv = document.querySelector('canvas');
  cnv.addEventListener('touchstart', e => {
    if (e.target.tagName !== 'INPUT') e.preventDefault();
  }, { passive: false });
  cnv.addEventListener('touchmove', e => e.preventDefault(), { passive: false });
  cnv.addEventListener('touchend', e => {
    if (e.target.tagName !== 'INPUT') e.preventDefault();
  }, { passive: false });
}

// ── Draw loop ─────────────────────────────────────────────────────────────────
function draw() {
  if      (gameState === "MENU")     drawMenu();
  else if (gameState === "REGISTRO") drawRegistro();
  else if (gameState === "REGLAS")   drawReglas();
  else if (gameState === "PLAYING")  ejecutarJuego();
}

function drawMenu() {
  image(imgPortada, 0, 0, width, height);
  push();
  imageMode(CENTER);
  let btnX = width / 2, btnY = height - 90; 
  let btnW = 250, btnH = 260;
  let px = getPointerX(), py = getPointerY();
  if (px > btnX - btnW/2 && px < btnX + btnW/2 && py > btnY - btnH/2 && py < btnY + btnH/2) {
    cursor(HAND); tint(255, 220, 150); btnW += 10; btnH += 5;
  } else { cursor(ARROW); noTint(); }
  image(imgBtnStart, btnX, btnY, btnW, btnH);
  pop();
}

function drawRegistro() {
  // Draw the registration background image
  image(imgPortada, 0, 0, width, height); 
  push();
  imageMode(CENTER);
  image(imgRegistration, width / 2, height / 2, 900, 450);

  let px = getPointerX(), py = getPointerY();
  let sX = width / 2, sY = height / 2 + 210; 
  let sW = 336, sH = 166; 

  if (px > sX - sW/2 && px < sX + sW/2 && py > sY - sH/2 && py < sY + sH/2) {
    cursor(HAND); tint(200, 255, 200); sW += 5;
  } else { noTint(); cursor(ARROW); }
  image(imgBtnSubmit, sX, sY, sW, sH);
  pop();

  // Show native HTML inputs on top of canvas (works on iOS)
  if (!showValidationError) {
    if (window.showLeadInputs) window.showLeadInputs();
  } else {
    // Hide inputs and show error overlay on canvas
    if (window.hideLeadInputs) window.hideLeadInputs();
    push();
    fill(0, 191); rect(0, 0, width, height);
    textAlign(CENTER, CENTER);
    textFont('Arial Black');
    fill(255, 0, 0); textSize(30);
    text("OBLIGATORY FIELDS", width / 2, height / 2 - 40);
    fill(255); textSize(20);
    text("YOU MUST ENTER NAME AND EMAIL", width / 2, height / 2 + 10);
    let okX = width / 2, okY = height / 2 + 80, okW = 100, okH = 50;
    rectMode(CENTER);
    if (px > okX - okW/2 && px < okX + okW/2 && py > okY - okH/2 && py < okY + okH/2) {
      fill(100, 255, 100); cursor(HAND);
    } else { fill(200); cursor(ARROW); }
    rect(okX, okY, okW, okH, 10);
    fill(0); textSize(22);
    text("OK", okX, okY);
    pop();
  }
}

function drawReglas() {
  image(imgPortada, 0, 0, width, height);
  push();
  imageMode(CENTER);
  image(imgInstructions, width / 2, height / 2, 900, 500);
  let bX = width / 2, bY = height / 2 + 210; 
  let bW = 403, bH = 230;
  let px = getPointerX(), py = getPointerY();
  if (px > bX - bW/2 && px < bX + bW/2 && py > bY - bH/2 && py < bY + bH/2) {
    cursor(HAND); tint(200, 255, 200); bW += 10; 
  } else { noTint(); }
  image(imgBtnMission, bX, bY, bW, bH);
  pop();
}

// ── Tap handler ───────────────────────────────────────────────────────────────
function handleTap(tx, ty) {
  if (showValidationError) {
    let okX = width / 2, okY = height / 2 + 80;
    if (tx > okX - 50 && tx < okX + 50 && ty > okY - 25 && ty < okY + 25) {
      showValidationError = false;
    }
    return;
  }

  if (gameState === "MENU") {
    let btnX = width / 2, btnY = height - 85;
    if (tx > btnX - 125 && tx < btnX + 125 && ty > btnY - 110 && ty < btnY + 110) {
      gameState = "REGISTRO";
    }
  } 
  else if (gameState === "REGISTRO") {
    // Hitbox matches the submit button drawn at sY = height/2 + 230
    let sX = width / 2, sY = height / 2 + 230; 
    let sW = 336, sH = 166;
    if (tx > sX - sW/2 && tx < sX + sW/2 && ty > sY - sH/2 && ty < sY + sH/2) {
      let nom = window.getLeadNombre ? window.getLeadNombre() : '';
      let em  = window.getLeadEmail  ? window.getLeadEmail()  : '';
      if (nom !== "" && em !== "") {
        const url = googleSheetURL + '?action=submit&name=' + encodeURIComponent(nom) + '&email=' + encodeURIComponent(em);
        fetch(url).catch(() => {});
        if (window.hideLeadInputs) window.hideLeadInputs();
        gameState = "REGLAS"; 
      } else {
        showValidationError = true;
      }
    }
  }
  else if (gameState === "REGLAS") {
    let bX = width / 2, bY = height / 2 + 210, bW = 403, bH = 230;
    if (tx > bX - bW/2 && tx < bX + bW/2 && ty > bY - bH/2 && ty < bY + bH/2) {
      gameState = "PLAYING"; cursor(ARROW); spawnProgressive(); 
    }
  }
  else if (gameState === "PLAYING") {
    if (!gameActive) {
      if (!winState) {
        let btnX = width / 2, btnY = height / 2 + 60;
        if (tx > btnX - 110 && tx < btnX + 110 && ty > btnY - 30 && ty < btnY + 30) resetLevel();
      }
      return;
    }
    if (showingLevelCard) return;
    for (let i = ships.length - 1; i >= 0; i--) {
      let s = ships[i];
      if (dist(tx, ty, s.x, s.y) < 70) {
        clickedShipId = s.instanceId;
        s.clicks++;
        if (s.clicks >= 3) { destroyShip(s, i); clickedShipId = null; }
        break;
      }
    }
  }
}

function mousePressed() {
  touchX = -1; touchY = -1;
  handleTap(mouseX, mouseY);
}

function touchStarted() {
  if (touches.length > 0) {
    touchX = touches[0].x;
    touchY = touches[0].y;
    if (gameState === "PLAYING" && gameActive && !showingLevelCard) {
      for (let i = ships.length - 1; i >= 0; i--) {
        let s = ships[i];
        if (dist(touchX, touchY, s.x, s.y) < 70) {
          clickedShipId = s.instanceId;
          s.clicks++;
          if (s.clicks >= 3) { destroyShip(s, i); clickedShipId = null; }
          break;
        }
      }
    }
  }
  return false;
}

function touchEnded() {
  if (touches.length === 0 && touchX >= 0) {
    if (gameState !== "PLAYING") handleTap(touchX, touchY);
    if (gameState === "PLAYING" && !gameActive && !winState) handleTap(touchX, touchY);
    touchX = -1; touchY = -1;
  }
  return false;
}

function mouseReleased() { clickedShipId = null; }
function touchMoved()    { return false; }

// ── Game ──────────────────────────────────────────────────────────────────────
function ejecutarJuego() {
  if (imgBackground) image(imgBackground, 0, 0, width, height);
  else background(2, 6, 23);
  if (gameActive) {
    if (showingLevelCard) drawLevelCard();
    else {
      drawPatrolShip(); drawShips(); drawAllPlates(); drawUI();
      if (frameCount % 60 === 0 && timeLeft > 0) timeLeft--;
    }
  } else drawDebrief();
}

function drawPatrolShip() {
  let px = getPointerX(), py = getPointerY();
  push();
  translate(width / 2, height - 100);
  rotate(atan2(py - (height - 100), px - (width / 2)) + HALF_PI); 
  imageMode(CENTER);
  if (imgPlayer) image(imgPlayer, 0, 0, 250, 0);
  pop();
}

function drawShips() {
  for (let i = ships.length - 1; i >= 0; i--) { 
    let s = ships[i];
    let bloqueado = false;
    for (let j = 0; j < ships.length; j++) {
      let otro = ships[j];
      if (s !== otro) {
        let d = dist(s.x, s.y, otro.x, otro.y);
        if (d < 160 && otro.y > s.y && abs(s.x - otro.x) < 60) { bloqueado = true; break; }
      }
    }
    if (!bloqueado) {
      s.y += s.speed;
      if (s.isZigzag) s.x += sin((frameCount + s.offset) * s.zigzagFreq) * s.zigzagAmp;
    }
    push(); imageMode(CENTER);
    if (s.img && s.img()) {
      if ((mouseIsPressed || touches.length > 0) && s.instanceId === clickedShipId) {
        tint(255, 0, 0); image(s.img(), s.x + random(-5, 5), s.y, 160, 0);
      } else {
        noTint(); let shake = s.clicks > 0 ? random(-2, 2) : 0;
        image(s.img(), s.x + shake, s.y, 160, 0);
      }
    }
    pop();
    s.x = constrain(s.x, 100, width - 100);
    if (s.y > height + 100) {
      if (!s.hasBomb) {
        shipsPassedSafe++; score += 250;
        if (shipsPassedSafe >= goalPoints) {
          if      (currentLevel === 1) iniciarNivel2();
          else if (currentLevel === 2) iniciarNivel3();
          else { winState = true; gameActive = false; }
        }
      } else {
        bombsEscaped++; score -= 150;
        if (bombsEscaped >= maxBombsAllowed) { winState = false; gameActive = false; }
      }
      ships.splice(i, 1);
    }
  }
}

function prepararMazo() {
  if      (currentLevel === 1) nivelMazo = [true,true,true,true,true,true,false,false,false,false];
  else if (currentLevel === 2) nivelMazo = [true,true,true,true,true,true,true,true,true,true,true,true,false,false,false];
  else if (currentLevel === 3) nivelMazo = Array(22).fill(true).concat(Array(3).fill(false));
  nivelMazo.sort(() => random() - 0.5);
}

function spawnProgressive() {
  if (gameActive && shipsSpawned < totalLevelShips && !showingLevelCard) {
    generarBarco();
    let delay = map(shipsSpawned, 0, totalLevelShips, 1600, 700);
    setTimeout(spawnProgressive, delay);
  }
}

function generarBarco() {
  if (shipsSpawned >= totalLevelShips) return;
  let nuevaX = random(150, width - 150);
  for (let s of ships) { if (dist(nuevaX, -50, s.x, s.y) < 160) nuevaX = random(150, width - 150); }
  const type = random(SHIPS_TYPES);
  let shipIcons = [];
  let hasBomb = nivelMazo[shipsSpawned]; 
  let shipSpeed, esZigzag = false, freq = 0, amp = 0;
  if      (currentLevel === 1) shipSpeed = random(1.5, 2.0);
  else if (currentLevel === 2) { shipSpeed = random(2.2, 3.2); if (random() < 0.3) shipSpeed += random(0.8, 1.5); }
  else if (currentLevel === 3) {
    shipSpeed = random(3.0, 5.0);
    if (zigzagCount < 16 && (random() < 0.7 || (totalLevelShips - shipsSpawned) <= (16 - zigzagCount))) {
      esZigzag = true; zigzagCount++; freq = random(0.03, 0.07); amp = random(4, 8);
    }
  }
  let cantidadIconos = (currentLevel === 1) ? 3 : random([3, 4]);
  if (hasBomb) {
    bombsSpawned++; shipIcons.push(iconBomb);
    for (let i = 0; i < cantidadIconos - 1; i++) shipIcons.push(random([iconTrash, iconFish, iconOil]));
    shipIcons.sort(() => random() - 0.5);
  } else {
    safeSpawned++;
    for (let i = 0; i < cantidadIconos; i++) shipIcons.push(random([iconTrash, iconFish, iconOil]));
  }
  ships.push({
    ...type, instanceId: Date.now() + random(1000), x: nuevaX, y: -50, speed: shipSpeed,
    cargoIcons: shipIcons, clicks: 0, hasBomb, isZigzag: esZigzag, zigzagFreq: freq, zigzagAmp: amp, offset: random(1000)
  });
  shipsSpawned++;
}

function drawAllPlates() {
  let px = getPointerX(), py = getPointerY();
  for (let s of ships) if (dist(px, py, s.x, s.y) < 70) drawInfoPlate(s);
}

function iniciarNivel2() {
  showingLevelCard = true; ships = [];
  setTimeout(() => {
    currentLevel = 2; shipsPassedSafe = 0; shipsSpawned = 0;
    bombsEscaped = 0; safeDestroyed = 0; totalLevelShips = 15;
    goalPoints = 3; timeLeft = 30; prepararMazo();
    showingLevelCard = false; spawnProgressive();
  }, 2000);
}

function iniciarNivel3() {
  showingLevelCard = true; ships = [];
  setTimeout(() => {
    currentLevel = 3; shipsPassedSafe = 0; shipsSpawned = 0; zigzagCount = 0;
    bombsEscaped = 0; safeDestroyed = 0; totalLevelShips = 25;
    goalPoints = 3; timeLeft = 60; prepararMazo();
    showingLevelCard = false; spawnProgressive();
  }, 2000);
}

function resetLevel() {
  score           = 0;
  ships           = [];
  shipsSpawned    = 0;
  bombsSpawned    = 0;
  safeSpawned     = 0;
  shipsPassedSafe = 0;
  safeDestroyed   = 0;
  bombsEscaped    = 0;
  zigzagCount     = 0;
  winState        = false;
  showingLevelCard= false;
  clickedShipId   = null;
  if      (currentLevel === 1) { totalLevelShips = 10; goalPoints = 3; timeLeft = 15; }
  else if (currentLevel === 2) { totalLevelShips = 15; goalPoints = 3; timeLeft = 30; }
  else if (currentLevel === 3) { totalLevelShips = 25; goalPoints = 3; timeLeft = 60; }
  prepararMazo();
  gameActive = true;
  spawnProgressive();
}

function destroyShip(ship, index) { 
  if (ship.hasBomb) score += 100; 
  else { 
    safeDestroyed++; score -= 300; 
    if (currentLevel >= 2 || safeDestroyed >= 1) { winState = false; gameActive = false; } 
  } 
  ships.splice(index, 1); 
}

function drawLevelCard() {
  push();
  fill(0, 150); rect(0, 0, width, height);
  textAlign(CENTER, CENTER); textFont('Courier New'); textStyle(BOLD);
  fill(255, 200, 0); textSize(50);
  text("LEVEL CLEARED", width/2, height/2 - 20);
  fill(255); textSize(20);
  text("PREPARE FOR LEVEL " + (currentLevel + 1), width/2, height/2 + 40);
  pop();
}

function drawInfoPlate(s) {
  if (!s.cargoIcons) return;
  push();
  translate(s.x, max(s.y + 40, 150)); scale(0.5); imageMode(CENTER);
  if (imgWoodPlate) image(imgWoodPlate, 0, 50, 420, 960);
  textAlign(CENTER, CENTER); fill(255); textFont('Courier New'); textSize(30); textStyle(BOLD);
  text("CARGO CONTENT:", 0, -40);
  let posiciones = [{x:-60,y:30},{x:60,y:30},{x:-60,y:120},{x:60,y:120}];
  for (let i = 0; i < s.cargoIcons.length; i++)
    if (posiciones[i]) image(s.cargoIcons[i], posiciones[i].x, posiciones[i].y, 115, 115);
  fill(255, 200, 0); textSize(32);
  text("HITS: " + s.clicks + " / 3", 0, 240);
  pop();
}

function drawUI() {
  push();
  image(imgWoodPlate, -8, -78, 325, 265); 
  fill(255); textFont('Arial Black'); textSize(22);
  stroke(0); strokeWeight(3); textAlign(LEFT);
  text("LEVEL: " + currentLevel, 35, 45);
  fill(100, 255, 100);
  text("SAFE ARRIVED: " + shipsPassedSafe + " / " + goalPoints, 35, 80);
  textAlign(RIGHT); fill(234, 179, 8);
  text("SCORE: " + score, width - 20, 45);
  pop();
}

function drawDebrief() {
  push();
  if (winState) {
    image(imgEndCard, 0, 0, width, height); 
    textAlign(CENTER, CENTER); textFont('Arial Black');
    fill(255, 204, 0); stroke(0); strokeWeight(4); textSize(32);
    text("Final Score: " + score, width / 2, height / 2 + 20);
  } else {
    background(0, 200);
    textAlign(CENTER, CENTER); textFont('Arial Black');
    fill(255, 100, 100); noStroke(); textSize(48);
    text("MISSION FAILED", width / 2, height / 2 - 70);
    fill(255, 204, 0); stroke(0); strokeWeight(3); textSize(28);
    text("Score: " + score, width / 2, height / 2 - 15);

    let btnX = width / 2, btnY = height / 2 + 60;
    let btnW = 220, btnH = 58;
    let px = getPointerX(), py = getPointerY();
    let hovering = px > btnX - btnW/2 && px < btnX + btnW/2 && py > btnY - btnH/2 && py < btnY + btnH/2;
    noStroke();
    fill(hovering ? color(255, 220, 50) : color(200, 160, 20));
    rectMode(CENTER);
    rect(btnX, btnY, btnW, btnH, 12);
    fill(0); noStroke(); textSize(22);
    text("TRY AGAIN", btnX, btnY);
    if (hovering) cursor(HAND); else cursor(ARROW);
  }
  pop();
}

function keyPressed() {
  if (!gameActive && !winState && (key === 'r' || key === 'R')) resetLevel();
}

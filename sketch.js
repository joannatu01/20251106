let table;
let questions = [];
let currentQuestionIndex = 0;
let score = 0;
let gameState = 'start'; // 'start', 'quiz', 'result'

let optionButtons = [];
let feedback = '';
let feedbackColor;
let feedbackTimer = 0;

let particles = [];
let selectionParticles = [];

let praiseParticles = [];
let encouragementDrops = [];
let fireworks = [];

function preload() {
  table = loadTable('questions.csv', 'csv', 'header');
}

function setup() {
  createCanvas(windowWidth * 0.9, windowHeight * 0.8);
  
  for (let i = 0; i < table.getRowCount(); i++) {
    questions.push(table.getRow(i).obj);
  }

  // Shuffle questions
  questions = shuffle(questions);

  for (let i = 0; i < 4; i++) {
    optionButtons.push({
      x: width * 0.15,
      y: height * 0.4 + i * (height * 0.12),
      w: 300,
      h: 40,
      label: String.fromCharCode(65 + i) // A, B, C, D
    });
  }
}

function draw() {
  background('#F8EDEB');
  drawCursorEffect();

  if (gameState === 'start') {
    drawStartScreen();
  } else if (gameState === 'quiz') {
    drawQuizScreen();
    drawFeedback();
  } else if (gameState === 'result') {
    drawResultScreen();
  }

  updateAndDrawParticles(selectionParticles);
}

function drawStartScreen() {
  textAlign(CENTER, CENTER);
  textSize(32);
  fill('#8D5B4C');
  text('p5.js 測驗系統', width / 2, height / 2 - 40);
  textSize(18);
  text('點擊開始作答', width / 2, height / 2 + 20);
}

function drawQuizScreen() {
  if (currentQuestionIndex >= questions.length) {
    gameState = 'result';
    setupResultAnimation();
    return;
  }

  let q = questions[currentQuestionIndex];

  // 顯示題目
  let questionSize = constrain(width / 35, 14, 32);
  textAlign(LEFT, TOP);
  textSize(questionSize);
  fill('#8D5B4C');
  text(`第 ${currentQuestionIndex + 1} 題: ${q.question}`, width * 0.05, height * 0.1, width * 0.9);

  // 顯示選項
  for (let i = 0; i < 4; i++) {
    let btn = optionButtons[i];
    let optionText = q['option' + btn.label];
    btn.x = width * 0.15;
    btn.y = height * 0.4 + i * (height * 0.12);
    btn.w = width * 0.7;
    btn.h = height * 0.1;
    
    // Hover effect
    if (mouseX > btn.x && mouseX < btn.x + btn.w && mouseY > btn.y && mouseY < btn.y + btn.h) {
      fill('#FEC89A');
    } else {
      fill(255);
    }
    stroke(50);
    rect(btn.x, btn.y, btn.w, btn.h, 10);

    fill(0);
    noStroke();    
    textAlign(LEFT, CENTER);
    textSize(questionSize * 0.8);
    text(`${btn.label}. ${optionText}`, btn.x + 20, btn.y + btn.h / 2);
  }
}

function drawFeedback() {
  if (feedbackTimer > 0) {
    push();
    textAlign(CENTER, CENTER);
    textSize(48);
    fill(feedbackColor);
    text(feedback, width / 2, height / 2);
    pop();
    feedbackTimer--;
  }
}

function drawResultScreen() {
  let percentage = (score / questions.length) * 100;
  
  if (percentage === 100) {
    drawFireworksAnimation();
  } else if (percentage >= 60) {
    drawPraiseAnimation();
  } else {
    drawEncouragementAnimation();
  }

  textAlign(CENTER, CENTER);
  fill(0, 0, 0, 180);
  rect(width/2 - 150, height/2 - 80, 300, 160, 20);

  fill('#F8EDEB');
  textSize(32);
  text('測驗結束！', width / 2, height / 2 - 40);
  textSize(24);
  text(`你的分數: ${score} / ${questions.length}`, width / 2, height / 2);

  // Restart button
  let btn = { x: width / 2 - 50, y: height / 2 + 40, w: 100, h: 30 };
  if (mouseX > btn.x && mouseX < btn.x + btn.w && mouseY > btn.y && mouseY < btn.y + btn.h) {
    fill(100, 100, 250);
  } else {
    fill(80, 80, 200);
  }
  noStroke();
  rect(btn.x, btn.y, btn.w, btn.h, 10);
  fill('#F8EDEB');
  textSize(16);
  text('重新開始', width / 2, height / 2 + 55);
}

function mousePressed() {
  if (gameState === 'start') {
    gameState = 'quiz';
  } else if (gameState === 'quiz' && feedbackTimer === 0) {
    for (let i = 0; i < optionButtons.length; i++) {
      let btn = optionButtons[i];
      if (mouseX > btn.x && mouseX < btn.x + btn.w && mouseY > btn.y && mouseY < btn.y + btn.h) {
        checkAnswer(btn.label, btn.x + btn.w / 2, btn.y + btn.h / 2);
        break;
      }
    }
  } else if (gameState === 'result') {
    let btn = { x: width / 2 - 50, y: height / 2 + 40, w: 100, h: 30 };
    if (mouseX > btn.x && mouseX < btn.x + btn.w && mouseY > btn.y && mouseY < btn.y + btn.h) {
      restartQuiz();
    }
  }
}

function checkAnswer(selectedOption, x, y) {
  let correct = selectedOption === questions[currentQuestionIndex].answer;
  if (correct) {
    score++;
    feedback = '正確！';
    feedbackColor = color(0, 150, 0, 200);
    createSelectionParticles(x, y, color(0, 255, 0));
  } else {
    feedback = '錯誤！';
    feedbackColor = color(150, 0, 0, 200);
    createSelectionParticles(x, y, color(255, 0, 0));
  }
  feedbackTimer = 60;
  setTimeout(() => {
    currentQuestionIndex++;
    feedback = '';
  }, 1000);
}

function restartQuiz() {
  score = 0;
  currentQuestionIndex = 0;
  questions = shuffle(questions);
  gameState = 'start';
  praiseParticles = [];
  encouragementDrops = [];
  fireworks = [];
}

function windowResized() {
  resizeCanvas(windowWidth * 0.9, windowHeight * 0.8);
}


// --- Effects and Animations ---

class Particle {
  constructor(x, y, c, isSelection) {
    this.pos = createVector(x, y);
    this.isSelection = isSelection;
    if (this.isSelection) {
      this.vel = p5.Vector.random2D().mult(random(1, 5));
      this.acc = createVector(0, 0.05); // 為爆炸粒子加上重力
      this.lifespan = 100;
    } else {
      this.vel = createVector(0, 0);
      this.acc = createVector(0, 0);
      this.lifespan = 50;
    }
    this.c = c;
  }

  update() {
    this.vel.add(this.acc);
    if (this.isSelection) {
      this.pos.add(this.vel);
      this.vel.mult(0.95);
    }
    this.lifespan -= 2;
  }

  show() {
    noStroke();
    fill(red(this.c), green(this.c), blue(this.c), this.lifespan);
    ellipse(this.pos.x, this.pos.y, this.isSelection ? 4 : 8);
  }
}

class Firework {
  constructor() {
    // 煙火從底部隨機位置向上發射
    this.firework = new Particle(random(width), height, color(random(100, 255), random(100, 255), random(100, 255)), true);
    this.firework.vel = createVector(0, random(-12, -8));
    this.exploded = false;
    this.explosionParticles = [];
  }

  update() {
    if (!this.exploded) {
      this.firework.update();
      // 當煙火上升到最高點（速度變為正）時爆炸
      if (this.firework.vel.y >= 0) {
        this.exploded = true;
        this.explode();
      }
    }

    for (let i = this.explosionParticles.length - 1; i >= 0; i--) {
      this.explosionParticles[i].update();
      if (this.explosionParticles[i].lifespan < 0) {
        this.explosionParticles.splice(i, 1);
      }
    }
  }

  explode() {
    // 產生爆炸粒子
    for (let i = 0; i < 100; i++) {
      this.explosionParticles.push(new Particle(this.firework.pos.x, this.firework.pos.y, this.firework.c, true));
    }
  }

  show() {
    if (!this.exploded) {
      this.firework.show();
    }
    for (let p of this.explosionParticles) {
      p.show();
    }
  }
}

function drawCursorEffect() {
  particles.push(new Particle(mouseX, mouseY, color(255, 150, 0, 100)));
  updateAndDrawParticles(particles);
}

function createSelectionParticles(x, y, c) {
  for (let i = 0; i < 30; i++) {
    selectionParticles.push(new Particle(x, y, c, true));
  }
}

function updateAndDrawParticles(particleArray) {
  for (let i = particleArray.length - 1; i >= 0; i--) {
    particleArray[i].update();
    particleArray[i].show();
    if (particleArray[i].lifespan < 0) {
      particleArray.splice(i, 1);
    }
  }
}

function setupResultAnimation() {
  let percentage = (score / questions.length) * 100;
  if (percentage === 100) {
    // 滿分時，創建第一個煙火
    fireworks.push(new Firework());
  } else if (percentage >= 60) {
    for (let i = 0; i < 100; i++) {
      praiseParticles.push(new Particle(random(width), random(height), color(random(255), random(255), random(255)), true));
    }
  } else {
    for (let i = 0; i < 100; i++) {
      encouragementDrops.push({x: random(width), y: random(-height, 0), len: random(10, 20)});
    }
  }
}

function drawPraiseAnimation() {
  updateAndDrawParticles(praiseParticles);
  if (random(1) < 0.1 && praiseParticles.length < 200) {
    praiseParticles.push(new Particle(random(width), random(height), color(random(255), random(255), random(255)), true));
  }
}

function drawFireworksAnimation() {
  // 更新並繪製所有煙火
  for (let i = fireworks.length - 1; i >= 0; i--) {
    fireworks[i].update();
    fireworks[i].show();
    if (fireworks[i].exploded && fireworks[i].explosionParticles.length === 0) {
      fireworks.splice(i, 1);
    }
  }

  // 隨機產生新的煙火
  if (random(1) < 0.05 && fireworks.length < 5) {
    fireworks.push(new Firework());
  }
}

function drawEncouragementAnimation() {
  stroke(100, 100, 200, 150);
  strokeWeight(2);
  for (let drop of encouragementDrops) {
    line(drop.x, drop.y, drop.x, drop.y + drop.len);
    drop.y += 5;
    if (drop.y > height) {
      drop.y = random(-20, 0);
      drop.x = random(width);
    }
  }
}

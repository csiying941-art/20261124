let bgImage; // 背景圖片 bg/3.png
let bgOffsetX = 0; // 背景水平捲動偏移量

let characterSprite; // 角色一待機精靈圖（10張，全寬1395，高196）
let walkSprite; // 角色一走路精靈圖（9張，全寬1246，高198）
let magicSprite; // 角色一施法精靈圖（4張，全寬1039，高146）
let magicEffectSprite; // 角色一魔法特效精靈圖（5張，全寬740，高19）

let char2StopSprite; // 角色二待機精靈圖（8張，全寬699，高190）
let char2ActionSprite; // 角色二動作精靈圖（12張）
let char2ActionReady = false; // 標記 2/action/action.png 是否載入完成且有效

let characterX; // 角色一水平中心位置
let isWalking = false; // 角色一是否正在走路
let facingDirection = 1; // 角色一朝向（1: 右, -1: 左）
let isCasting = false; // 角色一是否正在施法
let magicStartFrame = 0; // 施法開始的 frameCount
let magicDirection = 1; // 施法時鎖定的方向
let spaceIsDown = false; // 空白鍵防連發狀態
let activeEffects = []; // 飛行中的魔法特效陣列

// 答對煙火與答錯閃電特效陣列
let fireworks = [];
let lightningBolts = [];

// 角色一精靈圖尺寸設定
const frameCountInSprite = 10;
const frameWidth = 1395 / frameCountInSprite;
const frameHeight = 196;

const walkFrameCount = 9;
const walkFrameWidth = 1246 / walkFrameCount;
const walkFrameHeight = 198;

const magicFrameCount = 4;
const magicFrameWidth = 1039 / magicFrameCount;
const magicFrameHeight = 146;

const effectFrameCount = 5;
const effectFrameWidth = 740 / effectFrameCount;
const effectFrameHeight = 19;

// 角色二精靈圖尺寸設定
const char2StopFrameCount = 8;
const char2StopFrameWidth = 699 / char2StopFrameCount;
const char2StopFrameHeight = 190;
const char2ActionFrameCount = 12;

const framesPerStep = 8; // 每幾個畫面更新一格動畫

// 國字與注音選擇題題庫
const zhuyinBank = [
  { text: "「勉」強 的正確注音是？", options: ["ㄇㄧㄢˇ", "ㄇㄧㄢˋ", "ㄇㄢˇ", "ㄇㄧㄣˇ"], answer: "ㄇㄧㄢˇ" },
  { text: "「載」歌載舞 的正確注音是？", options: ["ㄗㄞˋ", "ㄗㄞˇ", "ㄗㄞ", "ㄘㄞˋ"], answer: "ㄗㄞˋ" },
  { text: "「供」不應求 的正確注音是？", options: ["ㄍㄨㄥ", "ㄍㄨㄥˋ", "ㄍㄨㄥˇ", "ㄏㄨㄥ"], answer: "ㄍㄨㄥ" },
  { text: "「角」色 的正確注音是？", options: ["ㄐㄩㄝˊ", "ㄐㄧㄠˇ", "ㄐㄧㄠˋ", "ㄑㄩㄝˋ"], answer: "ㄐㄩㄝˊ" },
  { text: "一「蹴」可幾 的正確注音是？", options: ["ㄘㄨˋ", "ㄐㄧㄡˋ", "ㄑㄩˋ", "ㄗㄨˊ"], answer: "ㄘㄨˋ" },
  { text: "「ㄉㄧˇ」礪前行 的國字是？", options: ["砥", "抵", "底", "邸"], answer: "砥" },
  { text: "再接再「ㄌㄧˋ」 的國字是？", options: ["厲", "勵", "歷", "利"], answer: "厲" },
  { text: "按「ㄅㄨˋ」就班 的國字是？", options: ["部", "步", "布", "簿"], answer: "部" },
  { text: "迫不「ㄐㄧˊ」待 的國字是？", options: ["及", "急", "極", "集"], answer: "及" },
  { text: "川流不「ㄒㄧˊ」 的國字是？", options: ["息", "熄", "惜", "悉"], answer: "息" }
];

let prevNearState = false;
let selectedOption = null;
let optionRects = [];
let lastQuestionIdx = -1;
let quizData = {
  text: zhuyinBank[0].text,
  options: [...zhuyinBank[0].options],
  answer: zhuyinBank[0].answer
};

function shuffleOptions(arr) {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function pickNextQuestion() {
  let idx = Math.floor(Math.random() * zhuyinBank.length);
  if (zhuyinBank.length > 1 && idx === lastQuestionIdx) {
    idx = (idx + 1) % zhuyinBank.length;
  }
  lastQuestionIdx = idx;
  const item = zhuyinBank[idx];
  return {
    text: item.text,
    options: shuffleOptions(item.options),
    answer: item.answer
  };
}

// 產生答對煙火粒子
function spawnFireworkEffect(originX, originY) {
  const palette = [
    [255, 80, 80],
    [255, 215, 50],
    [80, 235, 130],
    [70, 185, 255],
    [255, 120, 220]
  ];
  const bursts = [
    { cx: originX, cy: originY, count: 36 },
    { cx: originX - width * 0.14, cy: originY - height * 0.08, count: 24 },
    { cx: originX + width * 0.14, cy: originY - height * 0.08, count: 24 }
  ];

  for (const b of bursts) {
    for (let i = 0; i < b.count; i++) {
      const angle = (TWO_PI * i) / b.count + random(-0.12, 0.12);
      const speed = random(2.5, 7.5);
      const col = palette[floor(random(palette.length))];
      fireworks.push({
        x: b.cx,
        y: b.cy,
        vx: cos(angle) * speed,
        vy: sin(angle) * speed - random(0.5, 2),
        gravity: 0.11,
        drag: 0.985,
        size: random(4, 8),
        alpha: 255,
        fade: random(4, 7),
        r: col[0],
        g: col[1],
        b: col[2]
      });
    }
  }
}

// 產生答錯閃電特效
function spawnLightningEffect(targetX, targetY) {
  for (let b = 0; b < 2; b++) {
    const startX = targetX + random(-60, 60);
    const startY = 0;
    const endX = targetX + random(-25, 25);
    const endY = max(targetY, height * 0.72);
    const segments = 9;
    const points = [{ x: startX, y: startY }];

    for (let i = 1; i < segments; i++) {
      const t = i / segments;
      const baseX = lerp(startX, endX, t);
      const baseY = lerp(startY, endY, t);
      const jitter = sin(t * PI) * random(24, 52) * (random() < 0.5 ? -1 : 1);
      points.push({ x: baseX + jitter, y: baseY });
    }
    points.push({ x: endX, y: endY });

    lightningBolts.push({
      points,
      life: 18,
      maxLife: 18
    });
  }
}

function updateAndDrawFireworks() {
  for (let i = fireworks.length - 1; i >= 0; i--) {
    const p = fireworks[i];
    p.x += p.vx;
    p.y += p.vy;
    p.vx *= p.drag;
    p.vy = p.vy * p.drag + p.gravity;
    p.alpha -= p.fade;

    if (p.alpha <= 0) {
      fireworks.splice(i, 1);
      continue;
    }

    push();
    noStroke();
    fill(p.r, p.g, p.b, p.alpha);
    ellipse(p.x, p.y, p.size, p.size);
    pop();
  }
}

function updateAndDrawLightning() {
  for (let i = lightningBolts.length - 1; i >= 0; i--) {
    const bolt = lightningBolts[i];
    const ratio = bolt.life / bolt.maxLife;
    const alpha = 255 * ratio;

    push();
    noFill();
    stroke(120, 190, 255, alpha * 0.65);
    strokeWeight(8 * ratio + 2);
    beginShape();
    for (const pt of bolt.points) vertex(pt.x, pt.y);
    endShape();

    stroke(255, 255, 140, alpha);
    strokeWeight(3 * ratio + 1);
    beginShape();
    for (const pt of bolt.points) vertex(pt.x, pt.y);
    endShape();
    pop();

    bolt.life -= 1;
    if (bolt.life <= 0) {
      lightningBolts.splice(i, 1);
    }
  }
}

function preload() {
  bgImage = loadImage("bg/3.png");
  characterSprite = loadImage("1/stop/stop.png");
  walkSprite = loadImage("1/walk/walk.png");
  magicSprite = loadImage("1/magic/magic.png");
  magicEffectSprite = loadImage("1/magic_effect/magic_effect.png");
  char2StopSprite = loadImage("2/stop/stop.png");
  char2ActionSprite = loadImage(
    "2/action/action.png",
    (img) => {
      char2ActionReady = Boolean(img && img.width > 0 && img.height > 0);
    },
    () => {
      char2ActionReady = false;
    }
  );
}

function setup() {
  createCanvas(windowWidth, windowHeight);
  imageMode(CENTER);
  characterX = (width * 2) / 3;
  quizData = pickNextQuestion();
  frameRate(60);
}

function draw() {
  background("#87CEEB");
  imageMode(CENTER);

  // 1. 計算背景大小與捲動邊界
  const bgAspect = bgImage && bgImage.height > 0 ? bgImage.width / bgImage.height : 16 / 9;
  const singleBgWidth = max(width, height * bgAspect);
  const singleBgHeight = height;
  const minBgOffset = width - singleBgWidth * 2;
  const maxBgOffset = singleBgWidth;
  const anchorX = (width * 2) / 3;

  // 2. 處理角色一左右移動與背景捲動
  const movingRight = keyIsDown(RIGHT_ARROW);
  const movingLeft = keyIsDown(LEFT_ARROW);
  isWalking = movingRight || movingLeft;
  const movementStep = constrain(width * 0.004, 2, 8);

  // 統一以待機圖高度 frameHeight 作為角色一基準縮放比例，避免施法圖較矮時被過度放大
  const char1BaseScale = (height / 3) / frameHeight;
  const char1BaseWidth = frameWidth * char1BaseScale;
  const char1BaseHeight = frameHeight * char1BaseScale;

  if (movingRight) {
    isWalking = true;
    facingDirection = 1;
    if (characterX < anchorX) {
      characterX = min(anchorX, characterX + movementStep);
    } else if (bgOffsetX > minBgOffset) {
      bgOffsetX = max(minBgOffset, bgOffsetX - movementStep);
    } else {
      characterX += movementStep;
    }
  } else if (movingLeft) {
    isWalking = true;
    facingDirection = -1;
    if (characterX > anchorX) {
      characterX = max(anchorX, characterX - movementStep);
    } else if (bgOffsetX < maxBgOffset) {
      bgOffsetX = min(maxBgOffset, bgOffsetX + movementStep);
    } else {
      characterX -= movementStep;
    }
  }

  characterX = constrain(characterX, char1BaseWidth / 2, width - char1BaseWidth / 2);

  // 3. 繪製三張左右串接的背景圖片（左 i=-1、中 i=0、右 i=1）
  if (bgImage && bgImage.width > 0 && bgImage.height > 0) {
    push();
    imageMode(CORNER);
    for (let i = -1; i <= 1; i++) {
      image(bgImage, bgOffsetX + i * singleBgWidth, 0, singleBgWidth, singleBgHeight);
    }
    pop();
  }

  // 4. 計算角色二位置（最左邊背景圖 i=-1 的正中央）與接近判定
  const leftBgX = bgOffsetX - singleBgWidth;
  const char2X = leftBgX + singleBgWidth / 2;
  const nearThreshold = max(char1BaseWidth * 2.2, width * 0.2);
  const isNear = abs(characterX - char2X) <= nearThreshold;

  if (isNear && !prevNearState) {
    selectedOption = null;
    quizData = pickNextQuestion();
  } else if (!isNear && prevNearState) {
    selectedOption = null;
  }
  prevNearState = isNear;

  // 角色一在角色二左方時轉向（-1），否則朝右（1）
  const char2Dir = characterX < char2X ? -1 : 1;

  // 5. 繪製角色二（僅在 action 圖確實載入完成且接近時切換，否則一律顯示 stop 圖）
  const useAction = isNear && char2ActionReady;
  const c2Img = useAction ? char2ActionSprite : char2StopSprite;
  const c2Frames = useAction ? char2ActionFrameCount : char2StopFrameCount;

  if (c2Img && c2Img.width > 0 && c2Img.height > 0) {
    const c2FrameW = c2Img.width / c2Frames;
    const c2FrameH = c2Img.height;
    const c2Scale = (height / 3) / char2StopFrameHeight;
    const c2DisplayW = c2FrameW * c2Scale;
    const c2DisplayH = c2FrameH * c2Scale;
    const c2Y = height - c2DisplayH / 2;

    const c2Idx = floor(frameCount / framesPerStep) % c2Frames;
    const c2Sx = floor(c2Idx * c2FrameW);
    const c2Sw = max(1, min(floor(c2FrameW), c2Img.width - c2Sx));

    push();
    imageMode(CENTER);
    translate(char2X, c2Y);
    scale(char2Dir, 1);
    image(c2Img, 0, 0, c2DisplayW, c2DisplayH, c2Sx, 0, c2Sw, c2FrameH);
    pop();
  }

  // 6. 施法完成判定與繪製角色一
  if (isCasting && frameCount - magicStartFrame >= magicFrameCount * framesPerStep) {
    isCasting = false;
    activeEffects.push({
      x: characterX + magicDirection * (char1BaseWidth / 2),
      y: height - char1BaseHeight * 0.58,
      direction: magicDirection
    });
  }

  const c1Img = isCasting ? magicSprite : isWalking ? walkSprite : characterSprite;
  const c1Frames = isCasting ? magicFrameCount : isWalking ? walkFrameCount : frameCountInSprite;

  if (c1Img && c1Img.width > 0 && c1Img.height > 0) {
    const c1FrameW = c1Img.width / c1Frames;
    const c1FrameH = c1Img.height;
    const c1DisplayW = c1FrameW * char1BaseScale;
    const c1DisplayH = c1FrameH * char1BaseScale;
    const c1Y = height - c1DisplayH / 2;

    const c1Idx = isCasting
      ? floor((frameCount - magicStartFrame) / framesPerStep)
      : floor(frameCount / framesPerStep) % c1Frames;
    const c1Sx = floor(c1Idx * c1FrameW);
    const c1Sw = max(1, min(floor(c1FrameW), c1Img.width - c1Sx));
    const c1Dir = isCasting ? magicDirection : facingDirection;

    push();
    imageMode(CENTER);
    translate(characterX, c1Y);
    scale(c1Dir, 1);
    image(c1Img, 0, 0, c1DisplayW, c1DisplayH, c1Sx, 0, c1Sw, c1FrameH);
    pop();
  }

  // 7. 繪製飛行中的魔法特效
  if (magicEffectSprite && magicEffectSprite.width > 0 && magicEffectSprite.height > 0) {
    const effDisplayW = effectFrameWidth * char1BaseScale;
    const effDisplayH = effectFrameHeight * char1BaseScale;
    const effSpeed = max(6, width * 0.008);
    const effIdx = floor(frameCount / framesPerStep) % effectFrameCount;
    const effSx = floor(effIdx * effectFrameWidth);
    const effSw = max(1, min(floor(effectFrameWidth), magicEffectSprite.width - effSx));

    for (let i = activeEffects.length - 1; i >= 0; i--) {
      const fx = activeEffects[i];
      fx.x += fx.direction * effSpeed;
      if (fx.x < 0 || fx.x > width) {
        activeEffects.splice(i, 1);
        continue;
      }
      push();
      imageMode(CENTER);
      translate(fx.x, fx.y);
      scale(fx.direction, 1);
      image(magicEffectSprite, 0, 0, effDisplayW, effDisplayH, effSx, 0, effSw, magicEffectSprite.height);
      pop();
    }
  }

  // 8. 角色一接近角色二時，在畫面上方中央顯示透明度 90 的黃色國字與注音選擇題方框
  optionRects = [];
  if (isNear) {
    drawQuizBox();
  }

  // 9. 更新與繪製答對煙火與答錯閃電特效
  updateAndDrawFireworks();
  updateAndDrawLightning();
}

function drawQuizBox() {
  const boxW = width / 3;
  const boxH = height / 2;
  const boxX = width / 2 - boxW / 2;
  const boxY = height * 0.06;
  const centerX = width / 2;

  push();
  rectMode(CORNER);

  fill(255, 225, 40, 90);
  stroke(170, 120, 0, 220);
  strokeWeight(2);
  rect(boxX, boxY, boxW, boxH, 14);

  noStroke();
  fill(25, 25, 25);
  textAlign(CENTER, CENTER);
  textStyle(BOLD);
  textSize(constrain(min(boxW * 0.068, boxH * 0.1), 15, 26));
  text(quizData.text, centerX, boxY + boxH * 0.21);

  const padX = boxW * 0.08;
  const gapX = boxW * 0.05;
  const gapY = boxH * 0.05;
  const gridTop = boxY + boxH * 0.35;
  const gridH = boxH * 0.43;
  const btnW = (boxW - padX * 2 - gapX) / 2;
  const btnH = (gridH - gapY) / 2;
  const optSize = constrain(min(btnW * 0.2, btnH * 0.42), 14, 22);

  for (let i = 0; i < quizData.options.length; i++) {
    const col = i % 2;
    const row = floor(i / 2);
    const btnX = boxX + padX + col * (btnW + gapX);
    const btnY = gridTop + row * (btnH + gapY);
    const optVal = quizData.options[i];
    const isHover = mouseX >= btnX && mouseX <= btnX + btnW && mouseY >= btnY && mouseY <= btnY + btnH;

    optionRects.push({ index: i, value: optVal, x: btnX, y: btnY, w: btnW, h: btnH });

    if (selectedOption === i) {
      if (optVal === quizData.answer) {
        fill(90, 210, 110, 225);
        stroke(30, 130, 50);
      } else {
        fill(245, 100, 100, 225);
        stroke(160, 30, 30);
      }
    } else if (isHover) {
      fill(255, 255, 255, 235);
      stroke(80, 80, 80);
    } else {
      fill(255, 255, 255, 195);
      stroke(120, 120, 120);
    }

    strokeWeight(1.5);
    rect(btnX, btnY, btnW, btnH, 8);

    noStroke();
    fill(20, 20, 20);
    textStyle(NORMAL);
    textSize(optSize);
    text(optVal, btnX + btnW / 2, btnY + btnH / 2);
  }

  if (selectedOption !== null) {
    const chosen = quizData.options[selectedOption];
    const ok = chosen === quizData.answer;
    fill(ok ? color(15, 120, 40) : color(170, 25, 25));
    textStyle(BOLD);
    textSize(constrain(min(boxW * 0.055, boxH * 0.08), 13, 19));
    text(
      ok ? "答對了！再接再厲" : `再試一次（正確答案：${quizData.answer}）`,
      centerX,
      boxY + boxH * 0.88
    );
  }

  pop();
}

function mousePressed() {
  if (!prevNearState || optionRects.length === 0) return;

  for (const r of optionRects) {
    if (mouseX >= r.x && mouseX <= r.x + r.w && mouseY >= r.y && mouseY <= r.y + r.h) {
      selectedOption = r.index;
      const fxX = r.x + r.w / 2;
      const fxY = r.y + r.h / 2;
      if (r.value === quizData.answer) {
        spawnFireworkEffect(fxX, fxY);
      } else {
        spawnLightningEffect(characterX, height * 0.72);
      }
      break;
    }
  }
}

function keyPressed() {
  if (keyCode === RIGHT_ARROW) {
    isWalking = true;
    facingDirection = 1;
    return false;
  }
  if (keyCode === LEFT_ARROW) {
    isWalking = true;
    facingDirection = -1;
    return false;
  }
  if (keyCode === 32) {
    if (!spaceIsDown && !isCasting) {
      isCasting = true;
      magicStartFrame = frameCount;
      magicDirection = facingDirection;
    }
    spaceIsDown = true;
    return false;
  }
}

function keyReleased() {
  if (keyCode === 32) {
    spaceIsDown = false;
  }
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  characterX = constrain(characterX, 1, width - 1);
}
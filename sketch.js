
let questions = [
  {
    question: "在 p5.js 中，要繪製橢圓形應該使用哪一個函式？",
    options: ["rect()", "ellipse()", "line()", "triangle()"],
    answer: 1
  },
  {
    question: "哪一個函式可以設定圖形的填滿顏色？",
    options: ["stroke()", "noFill()", "fill()", "background()"],
    answer: 2
  },
  {
    question: "background(0) 會產生什麼效果？",
    options: ["白色背景", "黑色背景", "紅色背景", "透明背景"],
    answer: 1
  },
  {
    question: "哪一個函式可以在畫布上繪製直線？",
    options: ["circle()", "point()", "line()", "text()"],
    answer: 2
  },
  {
    question: "p5.js 中的 setup() 函式通常會執行幾次？",
    options: ["每一幀一次", "只執行一次", "滑鼠點擊時執行", "鍵盤按下時執行"],
    answer: 1
  }
];

const CJK_FONT = "Cactus Classical Serif";
const LATIN_FONT = "Edu QLD Hand";

let currentQuestion = 0;
let selectedAnswer = -1;
let hasAnswered = false;
let score = 0;

let answerFeedback = "";
let lastAnswerCorrect = false;

// 答錯時的彈跳動畫
let animationStartFrame = 0;
let bouncingOption = -1;

let lastTouchTime = -1000;

// ------------------------------
// 初始化畫布
// ------------------------------

function setup() {
  const canvas = createCanvas(windowWidth, windowHeight);

  canvas.elt.style.display = "block";
  canvas.elt.style.touchAction = "none";

  textAlign(CENTER, CENTER);
  rectMode(CORNER);
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}

// ------------------------------
// 中英文字體處理
// ------------------------------

function isCjkCharacter(character) {
  return /[\u3400-\u4DBF\u4E00-\u9FFF\uF900-\uFAFF]/.test(character);
}

function getFontForCharacter(character) {
  return isCjkCharacter(character) ? CJK_FONT : LATIN_FONT;
}

function getFontRuns(content) {
  const characters = Array.from(String(content));
  const runs = [];

  for (const character of characters) {
    const font = getFontForCharacter(character);
    const lastRun = runs[runs.length - 1];

    if (lastRun && lastRun.font === font) {
      lastRun.text += character;
    } else {
      runs.push({ text: character, font: font });
    }
  }

  return runs;
}

function measureMixedText(content) {
  let totalWidth = 0;

  for (const run of getFontRuns(content)) {
    textFont(run.font);
    totalWidth += textWidth(run.text);
  }

  return totalWidth;
}

function drawMixedText(content, x, y) {
  const runs = getFontRuns(content);
  const totalWidth = measureMixedText(content);

  let currentX = x - totalWidth / 2;

  textAlign(LEFT, CENTER);

  for (const run of runs) {
    textFont(run.font);
    text(run.text, currentX, y);
    currentX += textWidth(run.text);
  }

  textAlign(CENTER, CENTER);
}

function wrapText(content, maxWidth) {
  const characters = Array.from(String(content));
  const lines = [];
  let currentLine = "";

  for (const character of characters) {
    if (character === "\n") {
      lines.push(currentLine);
      currentLine = "";
      continue;
    }

    const testLine = currentLine + character;

    if (
      currentLine !== "" &&
      measureMixedText(testLine) > maxWidth
    ) {
      lines.push(currentLine);
      currentLine = character;
    } else {
      currentLine = testLine;
    }
  }

  if (currentLine !== "" || lines.length === 0) {
    lines.push(currentLine);
  }

  return lines;
}

function drawWrappedMixedText(
  content,
  x,
  y,
  maxWidth,
  lineHeight
) {
  const lines = wrapText(content, maxWidth);
  const totalHeight = lines.length * lineHeight;
  const startY = y - totalHeight / 2 + lineHeight / 2;

  for (let i = 0; i < lines.length; i++) {
    drawMixedText(
      lines[i],
      x,
      startY + i * lineHeight
    );
  }
}

// ------------------------------
// 版面配置
// ------------------------------

function getLayout() {
  const w = width;
  const h = height;

  const compact = h < 600;
  const margin = min(24, w * 0.05);

  const titleSize = constrain(w * 0.055, 24, 40);
  const progressSize = constrain(w * 0.035, 15, 22);
  const questionSize = constrain(w * 0.043, 19, 29);
  const optionSize = constrain(w * 0.038, 17, 25);

  const questionWidth = min(w - margin * 2, 760);
  const questionHeight = compact
    ? h * 0.17
    : constrain(h * 0.18, 110, 145);

  const titleY = compact ? 30 : 43;
  const progressY = titleY + titleSize * 0.95 + 10;
  const questionY = progressY + 25;

  const optionsY =
    questionY + questionHeight + (compact ? 12 : 20);

  const optionHeight = compact
    ? 42
    : constrain(h * 0.075, 48, 58);

  const optionGap = compact ? 8 : 12;

  const optionsHeight =
    questions[currentQuestion].options.length *
      (optionHeight + optionGap) -
    optionGap;

  const optionsBottom = optionsY + optionsHeight;

  const feedbackY =
    optionsBottom + (compact ? 18 : 24);

  const buttonWidth = min(w * 0.58, 260);
  const buttonHeight = compact ? 42 : 50;

  const buttonY = min(
    feedbackY + (compact ? 22 : 30),
    h - buttonHeight - 12
  );

  return {
    w,
    h,
    margin,
    titleSize,
    progressSize,
    questionSize,
    optionSize,
    questionWidth,
    questionHeight,
    titleY,
    progressY,
    questionY,
    optionsY,
    optionHeight,
    optionGap,
    optionsHeight,
    optionsBottom,
    feedbackY,
    buttonWidth,
    buttonHeight,
    buttonY
  };
}

// ------------------------------
// 主畫面
// ------------------------------

function draw() {
  background("#dff3ff");

  if (currentQuestion >= questions.length) {
    drawResult();
    return;
  }

  const layout = getLayout();
  const question = questions[currentQuestion];

  // 標題
  noStroke();
  fill("#244b70");
  textSize(layout.titleSize);

  drawMixedText(
    "p5.js 小測驗",
    width / 2,
    layout.titleY
  );

  // 題目進度
  fill("#54718b");
  textSize(layout.progressSize);

  drawMixedText(
    "第 " +
      (currentQuestion + 1) +
      " 題 / 共 " +
      questions.length +
      " 題",
    width / 2,
    layout.progressY
  );

  // 題目卡片
  fill("#ffffff");
  stroke("#b4d6ec");
  strokeWeight(2);

  rect(
    (width - layout.questionWidth) / 2,
    layout.questionY,
    layout.questionWidth,
    layout.questionHeight,
    18
  );

  // 題目文字
  noStroke();
  fill("#263f56");
  textSize(layout.questionSize);

  drawWrappedMixedText(
    question.question,
    width / 2,
    layout.questionY + layout.questionHeight / 2,
    layout.questionWidth - 36,
    layout.questionSize * 1.45
  );

  // ------------------------------
  // 選項、紅綠提示、彈跳動畫
  // ------------------------------

  for (let i = 0; i < question.options.length; i++) {
    const baseY =
      layout.optionsY +
      i * (layout.optionHeight + layout.optionGap);

    const optionX = layout.margin;
    const optionWidth = width - layout.margin * 2;

    let bounceOffset = 0;

    // 答錯的選項彈跳 24 幀
    if (
      i === bouncingOption &&
      frameCount - animationStartFrame < 24
    ) {
      const elapsed = frameCount - animationStartFrame;

      bounceOffset =
        -Math.abs(Math.sin(elapsed * 0.65)) * 9;
    }

    const optionY = baseY + bounceOffset;

    let optionColor = "#ffffff";
    let borderColor = "#b4d6ec";

    // 顯示答題結果後，正確答案變綠色
    if (answerFeedback !== "" && i === question.answer) {
      optionColor = "#c9f2d0";
      borderColor = "#68b77a";
    }

    // 答錯時，選錯的選項變紅色
    if (
      i === selectedAnswer &&
      answerFeedback !== "" &&
      !lastAnswerCorrect
    ) {
      optionColor = "#ffd9df";
      borderColor = "#e05265";
    }

    // 答對後，正確選項維持綠色
    if (hasAnswered && i === question.answer) {
      optionColor = "#c9f2d0";
      borderColor = "#68b77a";
    }

    fill(optionColor);
    stroke(borderColor);
    strokeWeight(2);

    rect(
      optionX,
      optionY,
      optionWidth,
      layout.optionHeight,
      13
    );

    noStroke();
    fill("#30485d");
    textSize(layout.optionSize);

    drawMixedText(
      String.fromCharCode(65 + i) +
        ". " +
        question.options[i],
      width / 2,
      optionY + layout.optionHeight / 2
    );
  }

  // ------------------------------
  // 答對／答錯文字提示
  // ------------------------------

  if (answerFeedback !== "") {
    textSize(constrain(width * 0.038, 17, 23));

    if (lastAnswerCorrect) {
      fill("#238347");
    } else {
      fill("#d7475b");
    }

    drawMixedText(
      answerFeedback,
      width / 2,
      layout.feedbackY
    );
  }

  // 答對後才顯示按鈕
  if (hasAnswered) {
    drawButton(
      currentQuestion === questions.length - 1
        ? "查看結果"
        : "下一題",
      width / 2,
      layout.buttonY,
      layout.buttonWidth,
      layout.buttonHeight
    );
  }
}

// ------------------------------
// 按鈕繪製
// ------------------------------

function drawButton(
  label,
  centerX,
  y,
  buttonWidth,
  buttonHeight
) {
  noStroke();
  fill("#477da8");

  rect(
    centerX - buttonWidth / 2,
    y,
    buttonWidth,
    buttonHeight,
    14
  );

  fill("#ffffff");
  textSize(constrain(width * 0.04, 18, 24));

  drawMixedText(
    label,
    centerX,
    y + buttonHeight / 2
  );
}

// ------------------------------
// 測驗結果畫面
// ------------------------------

function drawResult() {
  const titleSize = constrain(width * 0.065, 28, 44);
  const scoreSize = constrain(width * 0.05, 23, 34);

  const buttonWidth = min(width * 0.6, 270);
  const buttonHeight = 50;
  const centerY = height / 2;

  noStroke();

  fill("#244b70");
  textSize(titleSize);

  drawMixedText(
    "測驗完成！",
    width / 2,
    centerY - 95
  );

  fill("#477da8");
  textSize(scoreSize);

  drawMixedText(
    "你的成績：" + score + " / " + questions.length,
    width / 2,
    centerY - 25
  );

  fill("#54718b");
  textSize(constrain(width * 0.035, 16, 22));

  let message = "繼續保持，做得很好！";

  if (score === questions.length) {
    message = "太棒了！全部答對！";
  } else if (score <= 2) {
    message = "再練習一次，你會更熟悉！";
  }

  drawMixedText(
    message,
    width / 2,
    centerY + 30
  );

  drawButton(
    "重新測驗",
    width / 2,
    centerY + 80,
    buttonWidth,
    buttonHeight
  );
}

// ------------------------------
// 點擊範圍判斷
// ------------------------------

function insideRect(px, py, x, y, w, h) {
  return (
    px >= x &&
    px <= x + w &&
    py >= y &&
    py <= y + h
  );
}

// ------------------------------
// 滑鼠與觸控輸入
// ------------------------------

function mousePressed() {
  // 避免觸控後重複觸發滑鼠事件
  if (millis() - lastTouchTime < 500) {
    return false;
  }

  handleInput(mouseX, mouseY);
  return false;
}

function touchStarted() {
  lastTouchTime = millis();

  handleInput(mouseX, mouseY);
  return false;
}

// ------------------------------
// 測驗操作邏輯
// ------------------------------

function handleInput(px, py) {
  // 結果畫面：重新測驗
  if (currentQuestion >= questions.length) {
    const buttonWidth = min(width * 0.6, 270);
    const buttonHeight = 50;
    const buttonY = height / 2 + 80;

    if (
      insideRect(
        px,
        py,
        width / 2 - buttonWidth / 2,
        buttonY,
        buttonWidth,
        buttonHeight
      )
    ) {
      currentQuestion = 0;
      selectedAnswer = -1;
      hasAnswered = false;
      score = 0;

      answerFeedback = "";
      lastAnswerCorrect = false;

      animationStartFrame = 0;
      bouncingOption = -1;
    }

    return;
  }

  const layout = getLayout();
  const question = questions[currentQuestion];

  // 答對後，點擊按鈕進入下一題
  if (hasAnswered) {
    if (
      insideRect(
        px,
        py,
        width / 2 - layout.buttonWidth / 2,
        layout.buttonY,
        layout.buttonWidth,
        layout.buttonHeight
      )
    ) {
      currentQuestion++;

      selectedAnswer = -1;
      hasAnswered = false;

      answerFeedback = "";
      lastAnswerCorrect = false;

      animationStartFrame = 0;
      bouncingOption = -1;
    }

    return;
  }

  // 尚未答對時，可以繼續選擇答案
  for (let i = 0; i < question.options.length; i++) {
    const optionY =
      layout.optionsY +
      i * (layout.optionHeight + layout.optionGap);

    const optionX = layout.margin;
    const optionWidth = width - layout.margin * 2;

    if (
      insideRect(
        px,
        py,
        optionX,
        optionY,
        optionWidth,
        layout.optionHeight
      )
    ) {
      selectedAnswer = i;
      animationStartFrame = frameCount;

      if (i === question.answer) {
        // 答對：加分並鎖定本題
        hasAnswered = true;
        lastAnswerCorrect = true;
        answerFeedback = "答對了！🎉";

        bouncingOption = -1;
        score++;
      } else {
        // 答錯：變紅、彈跳，允許重新選擇
        hasAnswered = false;
        lastAnswerCorrect = false;
        answerFeedback = "答錯了！再試一次！";

        bouncingOption = i;
      }

      return;
    }
  }
}

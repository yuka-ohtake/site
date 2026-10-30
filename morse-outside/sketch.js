// ==========================================
// 1つ目のスケッチ：自動モールス信号
// ==========================================
const s1 = (p) => {
  let morse = [];
  let index = 0;
  let x, y, startX, startY;
  let vx, vy;
  let wait = 0;
  let jitterY;
  let steps = 0;
  let maxSteps = 1200;

  p.setup = () => {
    p.createCanvas(800, 300);
    p.background(0);
    p.blendMode(p.ADD);
    p.stroke(120, 220, 180, 120);
    p.strokeWeight(2);
    p.noFill();

    startX = p.width / 2;
    startY = p.height / 2;
    x = startX;
    y = startY;

    vx = p.random(-1, 1);
    vy = p.random(-0.5, 0.5);

    for (let i = 0; i < 180; i++) {
      morse[i] = p.random(1) < 0.6 ? 0 : 1;
    }
    jitterY = p.random(-10, 10);
  };

  p.draw = () => {
    p.noStroke();
    p.fill(0, 2);
    p.rect(0, 0, p.width, p.height);

    p.stroke(120, 220, 180, 120);

    if (wait > 0) {
      wait--;
      return;
    }

    let drawY = y + jitterY;

    if (morse[index] === 0) {
      p.ellipse(x, drawY, 5, 5);
      wait = 7;
      x += vx * 6;
      y += vy * 6;
    } else {
      let len = 30;
      let nx = x + vx * len;
      let ny = y + vy * len;
      p.line(x, drawY, nx, ny);
      wait = 16;
      x = nx;
      y = ny;
    }

    let margin = 60;
    if (x < margin) vx += 0.05;
    if (x > p.width - margin) vx -= 0.05;
    if (y < margin) vy += 0.04;
    if (y > p.height - margin) vy -= 0.04;

    vx += p.random(-0.05, 0.05);
    vy += p.random(-0.03, 0.03);
    vx = p.constrain(vx, -1.5, 1.5);
    vy = p.constrain(vy, -1.0, 1.0);

    index++;
    steps++;

    if (index >= morse.length) index = 0;
    if (steps > maxSteps) {
      steps = 0;
      shuffleMorse();
    }
  };

  function shuffleMorse() {
    for (let i = 0; i < morse.length; i++) {
      morse[i] = p.random(1) < 0.6 ? 0 : 1;
    }
  }
};

// ==========================================
// 2つ目のスケッチ：キー入力UI付き日本語モールス（入力フォーム連動版）
// ==========================================
const s2 = (p) => {
  let jpMorseMap = {};
  let morseQueue = [];
  let x, y;
  let vx, vy;
  let wait = 0;
  let textList = [];
  let inputElem = null;
  let processedLength = 0; // 追加：どこまで処理したかを記憶

  p.setup = () => {
    p.createCanvas(800, 600);
    p.background(0);
    p.textFont("Hiragino Sans, Meiryo, sans-serif");
    p.strokeWeight(2);
    p.noFill();

    x = p.width / 2;
    y = p.height / 2;
    vx = p.random(-1.2, 1.2);
    vy = p.random(-0.8, 0.8);

    initJpMorseMap();

    // HTML側の入力ボックスを取得し、文字が入力されたら自動で処理するイベントを設定
    inputElem = document.getElementById('morse-input');
    if (inputElem) {
      inputElem.addEventListener('input', () => {
        let currentText = inputElem.value;
        
        // バックスペースなどで文字が減った場合のリセット処理
        if (currentText.length < processedLength) {
          processedLength = currentText.length;
        }

        // まだ変換していない新しく入力された部分だけを取り出す
        let unprocessedText = currentText.substring(processedLength);
        let kana = romajiToKana(unprocessedText);

        if (kana !== "") {
          processInputString(kana);
          // 変換できたら、処理済みの長さを更新する
          processedLength = currentText.length; 
        }
      });
    }
  };

  p.draw = () => {
    p.blendMode(p.ADD);
    p.noStroke();
    p.fill(0, 15);
    p.rect(0, 0, p.width, p.height);

    for (let i = textList.length - 1; i >= 0; i--) {
      let ft = textList[i];
      ft.update();
      ft.display();
      if (ft.isDead()) {
        textList.splice(i, 1);
      }
    }

    if (wait > 0) {
      wait--;
    } else if (morseQueue.length > 0) {
      p.stroke(100, 255, 200, 160);
      p.strokeWeight(1.5);

      let symbol = morseQueue.shift();

      if (symbol === 0) {
        p.fill(100, 255, 200, 200);
        p.ellipse(x, y, 4, 4);
        p.noFill();
        wait = 8;
        x += vx * 8;
        y += vy * 8;
      } else if (symbol === 1) {
        let len = 22;
        let nx = x + vx * len;
        let ny = y + vy * len;
        p.line(x, y, nx, ny);
        wait = 16;
        x = nx;
        y = ny;
      }

      let margin = 300;
      if (x < margin) vx += 0.05;
      if (x > p.width - margin) vx -= 0.05;
      if (y < margin) vy += 0.05;
      if (y > p.height - margin) vy -= 0.05;

      vx += p.random(-0.03, 0.03);
      vy += p.random(-0.03, 0.03);
      vx = p.constrain(vx, -1.5, 1.5);
      vy = p.constrain(vy, -1.0, 1.0);
    }

    drawInputUI();
  };

  function drawInputUI() {
    p.blendMode(p.BLEND);
    p.noStroke();
    p.fill(0);
    p.rect(0, p.height - 40, p.width, 40);

    p.fill(100, 255, 200);
    p.textSize(14);
    p.textAlign(p.LEFT, p.BOTTOM);
    // 画面左下の文字レイアウト。入力ボックスの背後に隠れるように位置固定
    p.text("KEY INPUT (Roma-ji): ", 20, p.height - 12);
  }

  function processInputString(kanaStr) {
    for (let i = 0; i < kanaStr.length; i++) {
      let ch = kanaStr.charAt(i);
      if (jpMorseMap[ch]) {
        let code = jpMorseMap[ch];
        for (let j = 0; j < code.length; j++) {
          if (code.charAt(j) === '.') morseQueue.push(0);
          else if (code.charAt(j) === '-') morseQueue.push(1);
        }
        textList.push(new FloatingText(ch, x, y));
      }
    }
  }

  function romajiToKana(r) {
    if (r.endsWith("a")) {
      if (r.endsWith("ka")) return "カ"; if (r.endsWith("sa")) return "サ"; if (r.endsWith("ta")) return "タ";
      if (r.endsWith("na")) return "ナ"; if (r.endsWith("ha")) return "ハ"; if (r.endsWith("ma")) return "マ";
      if (r.endsWith("ya")) return "ヤ"; if (r.endsWith("ra")) return "ラ"; if (r.endsWith("wa")) return "ワ";
      return "ア";
    }
    if (r.endsWith("i")) {
      if (r.endsWith("ki")) return "キ"; if (r.endsWith("si")) return "シ"; if (r.endsWith("shi")) return "シ";
      if (r.endsWith("ti")) return "チ"; if (r.endsWith("chi")) return "チ"; if (r.endsWith("ni")) return "ニ";
      if (r.endsWith("hi")) return "ヒ"; if (r.endsWith("mi")) return "ミ"; if (r.endsWith("ri")) return "リ";
      return "イ";
    }
    if (r.endsWith("u")) {
      if (r.endsWith("ku")) return "ク"; if (r.endsWith("su")) return "ス"; if (r.endsWith("tsu")) return "ツ";
      if (r.endsWith("nu")) return "ヌ"; if (r.endsWith("fu")) return "フ"; if (r.endsWith("mu")) return "ム";
      if (r.endsWith("yu")) return "ユ"; if (r.endsWith("ru")) return "ル";
      return "ウ";
    }
    if (r.endsWith("e")) {
      if (r.endsWith("ke")) return "ケ"; if (r.endsWith("se")) return "セ"; if (r.endsWith("te")) return "テ";
      if (r.endsWith("ne")) return "ネ"; if (r.endsWith("he")) return "ヘ"; if (r.endsWith("me")) return "メ";
      if (r.endsWith("re")) return "レ";
      return "エ";
    }
    if (r.endsWith("o")) {
      if (r.endsWith("ko")) return "コ"; if (r.endsWith("so")) return "ソ"; if (r.endsWith("to")) return "ト";
      if (r.endsWith("no")) return "ノ"; if (r.endsWith("ho")) return "ホ"; if (r.endsWith("mo")) return "モ";
      if (r.endsWith("yo")) return "ヨ"; if (r.endsWith("ro")) return "ロ"; if (r.endsWith("wo")) return "ヲ";
      return "オ";
    }
    if (r.endsWith("nn")) return "ン";
    return "";
  }

  function initJpMorseMap() {
    jpMorseMap["ア"] = "--.--"; jpMorseMap["イ"] = ".-";    jpMorseMap["ウ"] = "..-";  jpMorseMap["エ"] = "-.---"; jpMorseMap["オ"] = ".-...";
    jpMorseMap["カ"] = ".-..";  jpMorseMap["キ"] = "-.-.."; jpMorseMap["ク"] = "...-"; jpMorseMap["ケ"] = "-.--";  jpMorseMap["コ"] = "----";
    jpMorseMap["サ"] = "-.-.-"; jpMorseMap["シ"] = "--.-."; jpMorseMap["ス"] = "---.-"; jpMorseMap["セ"] = ".---."; jpMorseMap["ソ"] = "---.";
    jpMorseMap["タ"] = "-.";    jpMorseMap["チ"] = "..-.";  jpMorseMap["ツ"] = ".--."; jpMorseMap["テ"] = ".-.--"; jpMorseMap["ト"] = "..-..";
    jpMorseMap["ナ"] = ".-.";   jpMorseMap["ニ"] = "-.-.";  jpMorseMap["ヌ"] = "...."; jpMorseMap["ネ"] = "--.-";  jpMorseMap["ノ"] = "..--";
    jpMorseMap["ハ"] = "-...";  jpMorseMap["ヒ"] = "--..";  jpMorseMap["フ"] = "--.."; jpMorseMap["ヘ"] = ".";     jpMorseMap["ホ"] = "-..-.";
    jpMorseMap["マ"] = "-..-";  jpMorseMap["ミ"] = "..-.-"; jpMorseMap["ム"] = "-";    jpMorseMap["メ"] = "-...-"; jpMorseMap["モ"] = "-..-.";
    jpMorseMap["ヤ"] = ".--";   jpMorseMap["ユ"] = "-..--"; jpMorseMap["ヨ"] = "--";
    jpMorseMap["ラ"] = "...";   jpMorseMap["リ"] = "--.";   jpMorseMap["ル"] = "-.--."; jpMorseMap["レ"] = "---";   jpMorseMap["ロ"] = ".-.-";
    jpMorseMap["ワ"] = "-.-";   jpMorseMap["ヲ"] = ".---";  jpMorseMap["ン"] = ".-.-.";
  }

  class FloatingText {
    constructor(txt, startX, startY) {
      this.letter = txt;
      this.px = startX;
      this.py = startY - 12;
      this.alpha = 200;
    }

    update() {
      this.py -= 0.6;
      this.alpha -= 5.0;
    }

    display() {
      p.push();
      p.translate(this.px, this.py);

      p.blendMode(p.BLEND);
      p.fill(0);
      p.noStroke();
      p.textAlign(p.CENTER, p.CENTER);
      p.textSize(16);
      p.text(this.letter, 0, 0);

      p.blendMode(p.ADD);
      p.fill(120, 255, 200, this.alpha);
      p.text(this.letter, 0, 0);

      p.pop();
    }

    isDead() {
      return this.alpha <= 0;
    }
  }
};

new p5(s1, 'sketch-holder1');
new p5(s2, 'sketch-holder2');

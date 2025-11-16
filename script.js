const startScreen = document.getElementById("startScreen");
const playBtn = document.getElementById("playBtn");
const gameDiv = document.querySelector(".game");

const questionEl = document.getElementById("question");
const answerEl = document.getElementById("answer");
const submitBtn = document.getElementById("submit");
const feedbackEl = document.getElementById("feedback");
const scoreEl = document.getElementById("score");
const retryBtn = document.getElementById("retry");
const progressEl = document.getElementById("progress");

const bgMusic = document.getElementById("bgMusic");
const correctSound = document.getElementById("correctSound");
const wrongSound = document.getElementById("wrongSound");

let score = 0;
let a, b;
let timeLeft = 40;
let timerId;

function newQuestion() {
  a = Math.floor(Math.random() * 12) + 1;
  b = Math.floor(Math.random() * 12) + 1;
  questionEl.textContent = `${a} × ${b} = ?`;
  answerEl.value = "";
}

function checkAnswer() {
  const val = parseInt(answerEl.value, 10);
  if (val === a * b) {
    score += 10;
    feedbackEl.textContent = "Bravo !";
    feedbackEl.className = "feedback correct";
    correctSound.play();

    gameDiv.classList.add("flash-green");
    setTimeout(() => gameDiv.classList.remove("flash-green"), 1000);

  } else {
    score = Math.max(0, score - 5);
    feedbackEl.textContent = `Raté… c'était ${a*b}`;
    feedbackEl.className = "feedback wrong";
    wrongSound.play();

    gameDiv.classList.add("flash-red");
    setTimeout(() => gameDiv.classList.remove("flash-red"), 1000);
  }
  scoreEl.textContent = `Score: ${score}`;
  setTimeout(newQuestion, 500);
}


function startTimer() {
  timeLeft = 40;
  progressEl.style.width = "100%";
  progressEl.style.background = "green";
  progressEl.classList.remove("blink");
  clearInterval(timerId);

  timerId = setInterval(() => {
    timeLeft--;
    const percent = (timeLeft / 40) * 100;
    progressEl.style.width = percent + "%";

    // Couleur dynamique
    if (timeLeft > 25) {
      progressEl.style.background = "green";
    } else if (timeLeft > 10) {
      progressEl.style.background = "orange";
    } else {
      progressEl.style.background = "red";
      progressEl.classList.add("blink");
    }

    if (timeLeft <= 0) {
      clearInterval(timerId);
      feedbackEl.textContent = "Temps écoulé ⏳";
      feedbackEl.className = "feedback wrong";
      submitBtn.disabled = true;
      answerEl.disabled = true;
    }
  }, 1000);
}

function startGame() {
  score = 0;
  scoreEl.textContent = `Score: ${score}`;
  feedbackEl.textContent = "";
  submitBtn.disabled = false;
  answerEl.disabled = false;
  newQuestion();
  startTimer();

  // Relancer la musique depuis le début
  bgMusic.pause();
  bgMusic.currentTime = 0;
  bgMusic.play();
}

submitBtn.addEventListener("click", checkAnswer);
answerEl.addEventListener("keydown", (e) => {
  if (e.key === "Enter") checkAnswer();
});
retryBtn.addEventListener("click", startGame);

// Fenêtre "Es-tu prêt ?"
playBtn.addEventListener("click", () => {
  startScreen.style.display = "none";
  gameDiv.hidden = false;
  startGame();
});

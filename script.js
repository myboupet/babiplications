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

const paramBtn = document.getElementById("paramBtn");
const paramModal = document.getElementById("paramModal");
const saveTablesBtn = document.getElementById("saveTables");
const tablesForm = document.getElementById("tablesForm");

let currentStreak = parseInt(localStorage.getItem("streak")) || 0;
let gems = parseInt(localStorage.getItem("gems")) || 0;
let lastPlayedDate = localStorage.getItem("lastPlayedDate") || null;

function updateStats() {
  document.getElementById("streak").textContent = currentStreak;
  document.getElementById("gems").textContent = gems;
}

window.addEventListener("DOMContentLoaded", () => {
  checkStreak(); // vérifie la série au démarrage
});

let calcStats = JSON.parse(localStorage.getItem("calcStats")) || {};

function checkStreak() {
  const today = new Date().toISOString().split("T")[0];
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split("T")[0];

  if (lastPlayedDate) {
    if (lastPlayedDate === yesterdayStr) {
      // OK, série continue
    } else if (lastPlayedDate !== today) {
      // Jour manqué → payer ou perdre
      if (gems >= 19) {
        gems -= 19; // payer pour sauver
        localStorage.setItem("gems", gems);
      } else {
        currentStreak = 0; // série perdue
      }
    }
  } else {
    currentStreak = 0; // première fois
  }

  localStorage.setItem("streak", currentStreak);
  updateStats();
}

function endOfDay(score) {
  const today = new Date().toISOString().split("T")[0];

  if (score >= 90) {
    if (currentStreak === 0) {
      // première réussite → démarre la série
      currentStreak = 1;
    } else if (lastPlayedDate !== today) {
      // nouvelle journée réussie → incrémente la série
      currentStreak++;
    }
    animateBox("streakBox");
    lastPlayedDate = today; // on valide la journée seulement si score >= 90
  }

  // sauvegarde
  localStorage.setItem("streak", currentStreak);
  localStorage.setItem("gems", gems);
  localStorage.setItem("lastPlayedDate", lastPlayedDate);

  updateStats();
}



// Animation visuelle
function animateBox(id) {
  const box = document.getElementById(id);
  box.classList.add("animate");
  setTimeout(() => box.classList.remove("animate"), 600);
}

function updateUI() {
  document.getElementById("streak").textContent = `Série : ${currentStreak}`;
  document.getElementById("gems").textContent = `Gemmes : ${gems}`;
}

paramBtn.addEventListener("click", () => {
  paramBtn.classList.add("spin");
  setTimeout(() => {
    paramBtn.classList.remove("spin");
    paramModal.style.display = "flex";
  }, 1000);
});

let selectedTables = Array.from({length:12}, (_,i)=>i+1);

paramBtn.addEventListener("click", () => {
  paramModal.style.display = "flex";
});

saveTablesBtn.addEventListener("click", () => {
  const checked = [...tablesForm.querySelectorAll("input[type=checkbox]:checked")]
    .map(cb => parseInt(cb.value));
  selectedTables = checked.length ? checked : [1];
  paramModal.style.display = "none";
  startGame();
});

let score = 0;
let a, b;
let timeLeft = 40;
let timerId;

function newQuestion() {
  const fails = Object.entries(calcStats)
    .filter(([_, data]) => data.fail > data.success) // calculs faibles
    .map(([key]) => key);

  let useFail = fails.length > 0 && Math.random() < 0.5; // 50% de chance

  if (useFail) {
    const [fa] = fails[Math.floor(Math.random() * fails.length)].split("x");
    a = parseInt(fa);
  } else {
    a = selectedTables[Math.floor(Math.random() * selectedTables.length)];
  }

  b = Math.floor(Math.random() * 12) + 1;
  questionEl.textContent = `${a} × ${b} = ?`;
  answerEl.value = "";
}


let previousScore = 0;

function checkAnswer() {
  const val = parseInt(answerEl.value, 10);
  if (val === a * b) {
    previousScore = score;
    score += 10;
    feedbackEl.textContent = "Bravo !";
    feedbackEl.className = "feedback correct";
    correctSound.play();

    if (Math.floor(score / 50) > Math.floor(previousScore / 50)) {
      gems += 1;
      animateBox("gemsBox");
      localStorage.setItem("gems", gems);
      updateStats();
    }

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
  
  function recordCalcResult(a, b, success) {
  const key = `${a}x${b}`;
  if (!calcStats[key]) calcStats[key] = {success:0, fail:0};
  if (success) calcStats[key].success++;
  else calcStats[key].fail++;
  localStorage.setItem("calcStats", JSON.stringify(calcStats));
}

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

      endOfDay(score); // fin de partie → vérifie la série
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

  bgMusic.pause();
  bgMusic.currentTime = 0;
  bgMusic.play();
}

submitBtn.addEventListener("click", checkAnswer);
answerEl.addEventListener("keydown", (e) => {
  if (e.key === "Enter") checkAnswer();
});
retryBtn.addEventListener("click", startGame);

document.getElementById("statsBtn").addEventListener("click", () => {
  const stats = JSON.parse(localStorage.getItem("calcStats")) || {};
  const container = document.getElementById("statsContent");
  container.innerHTML = "";

  let lines = [];
  for (const calc in stats) {
    const {success, fail} = stats[calc];
    const total = success + fail;
    if (total > 0) {
      const rate = Math.round((success/total)*100);
      let message;
      if (rate < 50) {
        message = `🤖 Je vois que ${calc} est souvent raté (${fail} erreurs). Révise ce calcul !`;
      } else {
        message = `🤖 Bien joué sur ${calc}, taux de réussite ${rate}%.`;
      }
      lines.push(message);
    }
  }

  // Affichage ligne par ligne avec effet chatbot
  lines.forEach((line, i) => {
    const div = document.createElement("div");
    div.className = "stats-line";
    div.style.animationDelay = `${i*0.8}s`; // décalage progressif
    div.textContent = line;
    container.appendChild(div);
  });

  document.getElementById("statsModal").hidden = false;
});

playBtn.addEventListener("click", () => {
  startScreen.style.display = "none";
  gameDiv.hidden = false;
  startGame();
});





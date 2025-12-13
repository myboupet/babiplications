// --- Sélecteurs principaux ---
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

// --- Stats UI ---
const statsBtn = document.getElementById("statsBtn");
const statsModal = document.getElementById("statsModal");
const statsContent = document.getElementById("statsContent");
const closeStatsBtn = document.getElementById("closeStats");

// --- Vidéo du logo stats (optionnelle, protégée) ---
const statsLogoVideo = document.getElementById("statsLogoVideo");

let currentStreak = parseInt(localStorage.getItem("streak")) || 0;
let gems = parseInt(localStorage.getItem("gems")) || 0;
let lastPlayedDate = localStorage.getItem("lastPlayedDate") || null;

// Calculs faibles (persistés)
let calcStats = JSON.parse(localStorage.getItem("calcStats")) || {};

// Tables sélectionnées (doit exister AVANT pickQuestion)
let selectedTables = Array.from({ length: 12 }, (_, i) => i + 1);

function updateStats() {
  const streakEl = document.getElementById("streak");
  const gemsEl = document.getElementById("gems");
  if (streakEl) streakEl.textContent = currentStreak;
  if (gemsEl) gemsEl.textContent = gems;
}

window.addEventListener("DOMContentLoaded", () => {
  checkStreak();
  updateStats();
});

// --- Série ---
function checkStreak() {
  const today = new Date().toISOString().split("T")[0];
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split("T")[0];

  if (lastPlayedDate) {
    if (lastPlayedDate === yesterdayStr) {
      // série continue
    } else if (lastPlayedDate !== today) {
      if (gems >= 19) {
        gems -= 19;
        localStorage.setItem("gems", gems);
      } else {
        currentStreak = 0;
      }
    }
  } else {
    currentStreak = 0;
  }

  localStorage.setItem("streak", currentStreak);
  updateStats();
}

function endOfDay(score) {
  const today = new Date().toISOString().split("T")[0];

  if (score >= 90) {
    if (currentStreak === 0) {
      currentStreak = 1;
    } else if (lastPlayedDate !== today) {
      currentStreak++;
    }
    animateBox("streakBox");
    lastPlayedDate = today;
  }

  localStorage.setItem("streak", currentStreak);
  localStorage.setItem("gems", gems);
  localStorage.setItem("lastPlayedDate", lastPlayedDate);
  updateStats();
}

// Animation visuelle
function animateBox(id) {
  const box = document.getElementById(id);
  if (!box) return;
  box.classList.add("animate");
  setTimeout(() => box.classList.remove("animate"), 600);
}

function openModal(el) {
  if (el) el.hidden = false;
}
function closeModal(el) {
  if (el) el.hidden = true;
}

// Paramètres
paramBtn?.addEventListener("click", () => {
  paramBtn.classList.add("spin");
  setTimeout(() => {
    paramBtn.classList.remove("spin");
    openModal(paramModal);
  }, 300);
});

saveTablesBtn?.addEventListener("click", () => {
  const checked = [...tablesForm.querySelectorAll("input[type=checkbox]:checked")]
    .map(cb => parseInt(cb.value, 10));
  selectedTables = checked.length ? checked : [1];
  closeModal(paramModal);
  startGame();
});

// --- Jeu ---
let score = 0;
let a, b;
let timeLeft = 40;
let timerId;

function recordCalcResult(a, b, success) {
  const key = `${a}x${b}`;
  if (!calcStats[key]) calcStats[key] = { success: 0, fail: 0 };
  if (success) calcStats[key].success++;
  else calcStats[key].fail++;
  localStorage.setItem("calcStats", JSON.stringify(calcStats));
}

// 50% de questions depuis calculs faibles exacts (a ET b)
function pickQuestion() {
  const weakCalcs = Object.entries(calcStats)
    .filter(([_, data]) => (data.fail || 0) > (data.success || 0))
    .map(([key]) => key);

  const useWeak = weakCalcs.length > 0 && Math.random() < 0.5;

  if (useWeak) {
    const [wa, wb] = weakCalcs[Math.floor(Math.random() * weakCalcs.length)].split("x");
    a = parseInt(wa, 10);
    b = parseInt(wb, 10);
    if (!selectedTables.includes(a)) {
      a = selectedTables[Math.floor(Math.random() * selectedTables.length)];
      b = Math.floor(Math.random() * 12) + 1;
    }
  } else {
    a = selectedTables[Math.floor(Math.random() * selectedTables.length)];
    b = Math.floor(Math.random() * 12) + 1;
  }
}

function newQuestion() {
  pickQuestion();
  questionEl.textContent = `${a} × ${b} = ?`;
  answerEl.value = "";
}

let previousScore = 0;

function checkAnswer() {
  const val = parseInt(answerEl.value, 10);
  const isCorrect = val === a * b;

  if (isCorrect) {
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
    feedbackEl.textContent = `Raté… c'était ${a * b}`;
    feedbackEl.className = "feedback wrong";
    wrongSound.play();
    gameDiv.classList.add("flash-red");
    setTimeout(() => gameDiv.classList.remove("flash-red"), 1000);
  }

  recordCalcResult(a, b, isCorrect);
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
      endOfDay(score);
    }
  }, 1000);
}

// Déclin léger des stats à chaque partie (mémoire récente)
function decayCalcStats() {
  let changed = false;
  for (const key in calcStats) {
    const s = calcStats[key];
    if (s.success > 0) { s.success--; changed = true; }
    if (s.fail > 0) { s.fail--; changed = true; }
    if (s.success === 0 && s.fail === 0) {
      delete calcStats[key];
      changed = true;
    }
  }
  if (changed) localStorage.setItem("calcStats", JSON.stringify(calcStats));
}

function startGame() {
  score = 0;
  scoreEl.textContent = `Score: ${score}`;
  feedbackEl.textContent = "";
  submitBtn.disabled = false;
  answerEl.disabled = false;

  decayCalcStats();
  newQuestion();
  startTimer();

  bgMusic.pause();
  bgMusic.currentTime = 0;
  bgMusic.play();
}

// --- Events ---
submitBtn.addEventListener("click", checkAnswer);
answerEl.addEventListener("keydown", (e) => { if (e.key === "Enter") checkAnswer(); });
retryBtn.addEventListener("click", startGame);

playBtn.addEventListener("click", () => {
  startScreen.style.display = "none";
  gameDiv.hidden = false;
  startGame();
});

// --- Stats IA UI ---
statsBtn?.addEventListener("click", () => {
  const stats = JSON.parse(localStorage.getItem("calcStats")) || {};
  statsContent.innerHTML = "";

  const lines = [];
  const entries = Object.entries(stats).filter(([_, data]) => data.fail > 0)
    .sort((a, b) => {
      const sa = a[1].fail - a[1].success;
      const sb = b[1].fail - b[1].success;
      return sb - sa;
    });

  for (const [calc, { success = 0, fail = 0 }] of entries) {
    const total = success + fail;
    if (total > 0) {
      const rate = Math.round((success / total) * 100);
      let message;
      if (fail > success) {
        message = `🤖 ${calc} te pose encore problème (${fail} erreurs). On va le revoir.`;
      } else {
        message = `🤖 Tu maîtrises mieux ${calc} maintenant (réussite ${rate}%).`;
      }
      lines.push(message);
    }
  }

  if (lines.length === 0) {
    lines.push("🤖 Rien à signaler pour l’instant. Continue comme ça !");
  }

  lines.forEach((line, i) => {
    const div = document.createElement("div");
    div.className = "stats-line";
    div.style.animationDelay = `${i * 0.8}s`;
    div.textContent = line;
    statsContent.appendChild(div);
  });

  // Ouvre la modale
  openModal(statsModal);

  // Active la vidéo du logo stats si présente
  if (statsLogoVideo) {
    statsBtn.hidden = true;
    statsLogoVideo.hidden = false;   // <-- uniquement hidden
    statsLogoVideo.play().catch(() => {});
  }
});

closeStatsBtn?.addEventListener("click", () => {
  // Ferme la fenêtre stats
  closeModal(statsModal);

  // Stoppe et cache la vidéo du logo stats
  if (statsLogoVideo) {
    statsLogoVideo.pause();
    statsLogoVideo.currentTime = 0;
    statsLogoVideo.hidden = true;    // <-- uniquement hidden
  }

  // Réaffiche le bouton image
  if (statsBtn) statsBtn.hidden = false;
});







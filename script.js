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
  const today = new Date().toDateString();
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);

  if (lastPlayedDate) {
    if (lastPlayedDate === yesterday.toDateString()) {
      currentStreak++;
    } else if (lastPlayedDate !== today) {
      currentStreak = 1;
    }
  } else {
    currentStreak = 1;
  }

  localStorage.setItem("streak", currentStreak);
  localStorage.setItem("lastPlayedDate", today);

  updateStats();
});
function checkStreakRachat() {
  const today = new Date().toISOString().split("T")[0]; 
// Exemple : "2025-11-16"
  const storedLastPlayedDate = localStorage.getItem("lastPlayedDate"); // ← renommée
if (storedLastPlayedDate) {
    const diffDays = Math.floor(
        (new Date(today) - new Date(storedLastPlayedDate)) / (1000 * 60 * 60 * 24)
    );
    if (diffDays > 1) {
        if (gems >= 19) {
            gems -= 19;
            localStorage.setItem("gems", gems);
        } else {
            currentStreak = 0;
        }
    }
}
localStorage.setItem("lastPlayedDate", today);
}
// Animation visuelle
function animateBox(id) {
  const box = document.getElementById(id);
  box.classList.add("animate");
  setTimeout(() => box.classList.remove("animate"), 600);
}

// Fin de partie
function endOfDay(score) {
  const today = new Date().toISOString().split("T")[0];

  // Empêche de rejouer plusieurs fois dans la même journée
  if (lastPlayedDate === today) return;

  if (score >= 90) {
    // Partie réussie → on augmente la série
    currentStreak++;
    animateBox("streakBox");
  } else {
    
}

  // Mise à jour de la date et sauvegarde
  lastPlayedDate = today;
  localStorage.setItem("streak", currentStreak);
  localStorage.setItem("gems", gems);
  localStorage.setItem("lastPlayedDate", lastPlayedDate);

  updateStats();
}

function updateUI() {
  document.getElementById("streak").textContent = `Série : ${currentStreak}`;
  document.getElementById("gems").textContent = `Gemmes : ${gems}`;
}

paramBtn.addEventListener("click", () => {
  // Ajoute la classe spin
  paramBtn.classList.add("spin");

  // Retire la classe après l’animation pour pouvoir relancer plus tard
  setTimeout(() => {
    paramBtn.classList.remove("spin");
    // Ici tu peux aussi ouvrir la fenêtre des paramètres
    paramModal.style.display = "flex";
  }, 1000); // durée de l’animation
});
let selectedTables = Array.from({length:12}, (_,i)=>i+1);

// Quand on clique sur l’icône paramètre → ouvrir la fenêtre
paramBtn.addEventListener("click", () => {
  paramModal.style.display = "flex"; // affiche la modale
});
saveTablesBtn.addEventListener("click", () => {
  const checked = [...tablesForm.querySelectorAll("input[type=checkbox]:checked")]
    .map(cb => parseInt(cb.value));
  selectedTables = checked.length ? checked : [1];

  // FERMER la fenêtre
  paramModal.style.display = "none";   // ← utilise style.display au lieu de hidden
  startGame();                         // lance le jeu
});


let score = 0;
let a, b;
let timeLeft = 40;
let timerId;

function newQuestion() {
  a = selectedTables[Math.floor(Math.random() * selectedTables.length)];
  b = Math.floor(Math.random() * 12) + 1;
  questionEl.textContent = `${a} × ${b} = ?`;
  answerEl.value = "";
}

let previousScore = 0; // garde en mémoire le score avant la réponse

function checkAnswer() {
  const val = parseInt(answerEl.value, 10);
  if (val === a * b) {
    previousScore = score;       // sauvegarde l’ancien score
    score += 10;                 // ajoute les points
    feedbackEl.textContent = "Bravo !";
    feedbackEl.className = "feedback correct";
    correctSound.play();

    // Vérifie si on a franchi un palier de 50
    if (Math.floor(score / 50) > Math.floor(previousScore / 50)) {
      gems += 1; // ajoute 1 gemme
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












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
function endOfDay(score) {
  const today = new Date().toDateString();

  if (lastPlayedDate === today) {
    // déjà joué aujourd'hui → rien à faire
    return;
  }

  if (score >= 90) {
    currentStreak++;
    gems += 1; // 1 gemme par point de série
  } else {
    // joueur a raté → proposer rachat
    if (gems >= 10) {
      if (confirm("Tu as raté aujourd'hui. Dépenser 10 gemmes pour racheter ?")) {
        gems -= 10;
        // streak continue
      } else {
        currentStreak = 0; // série perdue
      }
    } else {
      currentStreak = 0; // pas assez de gemmes
    }
  }

  lastPlayedDate = today;

  // sauvegarde
  localStorage.setItem("streak", currentStreak);
  localStorage.setItem("gems", gems);
  localStorage.setItem("lastPlayedDate", lastPlayedDate);
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


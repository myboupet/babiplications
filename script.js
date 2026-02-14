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
const comboEl = document.getElementById("combo");
const livesEl = document.getElementById("lives");
const missionEl = document.getElementById("mission");
const levelEl = document.getElementById("level");
const xpBarEl = document.getElementById("xpBar");
const questsEl = document.getElementById("quests");
const coachTipEl = document.getElementById("coachTip");

const bgMusic = document.getElementById("bgMusic");
const correctSound = document.getElementById("correctSound");
const wrongSound = document.getElementById("wrongSound");

const paramBtn = document.getElementById("paramBtn");
const paramModal = document.getElementById("paramModal");
const saveTablesBtn = document.getElementById("saveTables");
const tablesForm = document.getElementById("tablesForm");

const statsBtn = document.getElementById("statsBtn");
const statsModal = document.getElementById("statsModal");
const statsContent = document.getElementById("statsContent");
const statsQuestsEl = document.getElementById("statsQuests");
const closeStatsBtn = document.getElementById("closeStats");
const statsLogoAnim = document.getElementById("statsLogoAnim");

let currentStreak = parseInt(localStorage.getItem("streak"), 10) || 0;
let gems = parseInt(localStorage.getItem("gems"), 10) || 0;
let lastPlayedDate = localStorage.getItem("lastPlayedDate") || null;
let calcStats = JSON.parse(localStorage.getItem("calcStats")) || {};
let selectedTables = Array.from({ length: 12 }, (_, i) => i + 1);

let score = 0;
let a;
let b;
let timeLeft = 40;
let timerId;
let combo = 0;
let bestCombo = parseInt(localStorage.getItem("bestCombo"), 10) || 0;
let lives = 3;
let fastAnswerStreak = 0;
let questionStartedAt = 0;
let totalCorrect = parseInt(localStorage.getItem("totalCorrect"), 10) || 0;
let totalWrong = parseInt(localStorage.getItem("totalWrong"), 10) || 0;
let level = parseInt(localStorage.getItem("level"), 10) || 1;
let xp = parseInt(localStorage.getItem("xp"), 10) || 0;
let sessionWrong = 0;
let sessionCorrect = 0;
let sameTableStreak = 0;
let lastCorrectTable = null;
let recoveryStreak = 0;
let justAfterError = false;
let isRunActive = false;

const todayKey = new Date().toISOString().split("T")[0];
let questsState = JSON.parse(localStorage.getItem("dailyQuests")) || { date: "", quests: [] };

const missions = [
  { text: "🎯 Mission : 6 bonnes réponses d'affilée", target: 6, reward: 2, type: "combo" },
  { text: "⚡ Mission : 4 réponses en moins de 3 secondes", target: 4, reward: 2, type: "speed" },
  { text: "💎 Mission : Atteins 120 points", target: 120, reward: 3, type: "score" }
];

const questTemplates = [
  { id: "precision", text: "🎯 5 bonnes réponses sans erreur", target: 5, reward: 3, type: "perfect" },
  { id: "speed-run", text: "⚡ 8 réponses rapides (<3s)", target: 8, reward: 4, type: "speed" },
  { id: "weak-focus", text: "🧠 Corrige 6 calculs faibles IA", target: 6, reward: 5, type: "weak" },
  { id: "combo-master", text: "🔥 Atteins un combo x7", target: 1, reward: 4, type: "combo7" },
  { id: "score-hero", text: "🏆 Atteins 140 points", target: 140, reward: 5, type: "score" },
  { id: "survivor", text: "❤️ Termine avec au moins 2 vies", target: 1, reward: 4, type: "survivor" },
  { id: "table-focus", text: "📘 Réussis 10 calculs de la même table", target: 10, reward: 4, type: "sameTable" },
  { id: "marathon", text: "⏱️ Donne 12 bonnes réponses", target: 12, reward: 5, type: "correctTotal" },
  { id: "sniper", text: "🎯 4 réponses parfaites d'affilée", target: 4, reward: 4, type: "combo4" },
  { id: "recovery", text: "💪 Après une erreur, fais 5 bonnes réponses", target: 5, reward: 4, type: "recovery" }
];

let currentMission = missions[0];

function updateStats() {
  const streakEl = document.getElementById("streak");
  const gemsEl = document.getElementById("gems");
  if (streakEl) streakEl.textContent = currentStreak;
  if (gemsEl) gemsEl.textContent = gems;
}

function xpForNextLevel(currentLevel) {
  return 60 + (currentLevel - 1) * 25;
}

function saveProgress() {
  localStorage.setItem("level", String(level));
  localStorage.setItem("xp", String(xp));
  localStorage.setItem("totalCorrect", String(totalCorrect));
  localStorage.setItem("totalWrong", String(totalWrong));
}

function updateLevelUI() {
  if (levelEl) levelEl.textContent = `Niv.${level}`;
  if (!xpBarEl) return;
  const maxXp = xpForNextLevel(level);
  const percent = Math.max(0, Math.min(100, Math.round((xp / maxXp) * 100)));
  xpBarEl.style.width = `${percent}%`;
}

function addXp(amount) {
  xp += amount;
  while (xp >= xpForNextLevel(level)) {
    xp -= xpForNextLevel(level);
    level += 1;
    gems += 2;
    animateBox("levelBox");
    feedbackEl.textContent = `Level up ! Niveau ${level} ⭐ (+2 gemmes)`;
    feedbackEl.className = "feedback correct";
  }
  saveProgress();
  updateStats();
  updateLevelUI();
}

function getWeakEntries() {
  return Object.entries(calcStats)
    .filter(([_, data]) => (data.fail || 0) > (data.success || 0))
    .sort((a1, b1) => (b1[1].fail - b1[1].success) - (a1[1].fail - a1[1].success));
}

function getWeakTables() {
  return getWeakEntries().slice(0, 3).map(([key]) => parseInt(key.split("x")[0], 10));
}

function buildCoachTip() {
  const weakEntries = getWeakEntries();
  const total = totalCorrect + totalWrong;
  const accuracy = total ? Math.round((totalCorrect / total) * 100) : 100;

  if (!weakEntries.length) {
    return "🤖 AiBabi: excellent ! Passe en mode vitesse pour monter niveau + gemmes.";
  }

  const [worstCalc, worstData] = weakEntries[0];
  const pressure = worstData.fail - worstData.success;
  if (accuracy < 70 || pressure >= 3) {
    return `🤖 Focus du jour: ${worstCalc}. Réponds lentement et vise 3 bonnes réponses d'affilée.`;
  }

  return `🤖 Tu progresses ! Défi IA: combo x${Math.min(8, 4 + level)} sur la table ${worstCalc.split("x")[0]}.`;
}

function updateCoachTip() {
  if (coachTipEl) coachTipEl.textContent = buildCoachTip();
}

function initializeDailyQuests() {
  if (questsState.date !== todayKey || !Array.isArray(questsState.quests) || !questsState.quests.length) {
    const shuffled = [...questTemplates].sort(() => Math.random() - 0.5);
    const selectedDaily = shuffled.slice(0, 3);
    questsState = {
      date: todayKey,
      quests: selectedDaily.map((quest) => ({ ...quest, progress: 0, done: false }))
    };
    localStorage.setItem("dailyQuests", JSON.stringify(questsState));
  }
  renderQuests();
}

function renderQuests() {
  if (!questsEl) return;
  questsEl.innerHTML = "";

  questsState.quests.forEach((quest) => {
    const percent = Math.round((quest.progress / quest.target) * 100);
    const item = document.createElement("div");
    item.className = `quest-item ${quest.done ? "done" : ""}`;
    item.innerHTML = `
      <div class="quest-title">${quest.text} (+${quest.reward}💎)</div>
      <div class="quest-track"><div class="quest-fill" style="width:${Math.min(percent, 100)}%"></div></div>
      <div class="quest-progress">${quest.progress}/${quest.target}</div>
    `;
    questsEl.appendChild(item);
  });
}

function renderQuestsInStats() {
  if (!statsQuestsEl) return;
  statsQuestsEl.innerHTML = "";

  questsState.quests.forEach((quest, index) => {
    const percent = Math.round((quest.progress / quest.target) * 100);
    const item = document.createElement("div");
    item.className = `stats-quest-item ${quest.done ? "done" : ""}`;
    item.style.animationDelay = `${index * 0.25}s`;
    item.innerHTML = `
      <div class="stats-quest-title">${quest.text}</div>
      <div class="stats-quest-track"><div class="stats-quest-fill" style="width:${Math.min(percent, 100)}%"></div></div>
      <div class="stats-quest-meta">${quest.progress}/${quest.target} • +${quest.reward}💎</div>
    `;
    statsQuestsEl.appendChild(item);
  });
}

function setQuestVisibility(visible) {
  if (questsEl) questsEl.hidden = !visible;
  if (statsQuestsEl) statsQuestsEl.hidden = !visible;
}

function openStatsModal() {
  const stats = JSON.parse(localStorage.getItem("calcStats")) || {};
  statsContent.innerHTML = "";

  const lines = [];
  const entries = Object.entries(stats)
    .filter(([_, data]) => data.fail > 0)
    .sort((a1, b1) => (b1[1].fail - b1[1].success) - (a1[1].fail - a1[1].success));

  const levelProgress = `${xp}/${xpForNextLevel(level)} XP`;
  lines.push(`⭐ Niveau ${level} — progression ${levelProgress}`);

  for (const [calc, { success = 0, fail = 0 }] of entries.slice(0, 5)) {
    const total = success + fail;
    const rate = Math.round((success / total) * 100);
    if (fail > success) {
      lines.push(`🤖 Priorité IA: ${calc} (${fail} erreurs). Réussite actuelle: ${rate}%.`);
    } else {
      lines.push(`🤖 Bon progrès sur ${calc}: réussite ${rate}%.`);
    }
  }

  if (entries.length === 0) lines.push("🤖 Rien à signaler. Tu peux activer des tables plus dures pour accélérer ta progression.");

  lines.forEach((line, i) => {
    const div = document.createElement("div");
    div.className = "stats-line";
    div.style.animationDelay = `${i * 0.35}s`;
    div.textContent = line;
    statsContent.appendChild(div);
  });

  if (isRunActive) {
    setQuestVisibility(false);
    const runLine = document.createElement("div");
    runLine.className = "stats-line";
    runLine.textContent = "🎯 Les quêtes s'affichent uniquement à la fin de la partie.";
    statsContent.prepend(runLine);
  } else {
    setQuestVisibility(true);
    renderQuestsInStats();
  }
  openModal(statsModal);
  if (statsLogoAnim) {
    statsBtn.hidden = true;
    statsLogoAnim.hidden = false;
  }
}

function updateQuestProgress(type, amount = 1) {
  let completed = false;
  questsState.quests.forEach((quest) => {
    if (quest.done || quest.type !== type || amount <= 0) return;
    if (quest.type === "score") {
      quest.progress = Math.min(quest.target, Math.max(quest.progress, amount));
    } else {
      quest.progress = Math.min(quest.target, quest.progress + amount);
    }
    if (quest.progress >= quest.target) {
      quest.done = true;
      gems += quest.reward;
      addXp(10);
      completed = true;
    }
  });

  if (completed) {
    animateBox("gemsBox");
    feedbackEl.textContent = "Quête terminée ! Récompense ajoutée ✨";
    feedbackEl.className = "feedback correct";
  }

  localStorage.setItem("dailyQuests", JSON.stringify(questsState));
  updateStats();
  renderQuests();
}

function updateComboAndLives() {
  if (comboEl) comboEl.textContent = `x${Math.max(1, combo)}`;
  if (livesEl) livesEl.textContent = lives;
}

function checkStreak() {
  const today = new Date().toISOString().split("T")[0];
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split("T")[0];

  if (lastPlayedDate) {
    if (lastPlayedDate !== yesterdayStr && lastPlayedDate !== today) {
      if (gems >= 19) {
        gems -= 19;
      } else {
        currentStreak = 0;
      }
    }
  } else {
    currentStreak = 0;
  }

  localStorage.setItem("streak", currentStreak);
  localStorage.setItem("gems", gems);
  updateStats();
}

function endOfDay(finalScore) {
  const today = new Date().toISOString().split("T")[0];
  if (finalScore >= 90) {
    if (currentStreak === 0) currentStreak = 1;
    else if (lastPlayedDate !== today) currentStreak++;
    animateBox("streakBox");
    lastPlayedDate = today;
  }

  localStorage.setItem("streak", currentStreak);
  localStorage.setItem("gems", gems);
  localStorage.setItem("lastPlayedDate", lastPlayedDate);
  updateStats();
}

function animateBox(id) {
  const box = document.getElementById(id);
  if (!box) return;
  box.classList.add("animate");
  setTimeout(() => box.classList.remove("animate"), 600);
}

function openModal(el) { if (el) el.hidden = false; }
function closeModal(el) { if (el) el.hidden = true; }

paramBtn?.addEventListener("click", () => {
  paramBtn.classList.add("spin");
  setTimeout(() => {
    paramBtn.classList.remove("spin");
    openModal(paramModal);
  }, 300);
});

saveTablesBtn?.addEventListener("click", () => {
  const checked = [...tablesForm.querySelectorAll("input[type=checkbox]:checked")]
    .map((cb) => parseInt(cb.value, 10));
  selectedTables = checked.length ? checked : [1];
  closeModal(paramModal);
  startGame();
});

function pickMission() {
  currentMission = missions[Math.floor(Math.random() * missions.length)];
  if (missionEl) missionEl.textContent = currentMission.text;
}

function isMissionCompleted() {
  if (currentMission.type === "combo") return combo >= currentMission.target;
  if (currentMission.type === "speed") return fastAnswerStreak >= currentMission.target;
  if (currentMission.type === "score") return score >= currentMission.target;
  return false;
}

function rewardMission() {
  gems += currentMission.reward;
  addXp(8);
  localStorage.setItem("gems", gems);
  updateStats();
  animateBox("gemsBox");
  feedbackEl.textContent = `Mission réussie ! +${currentMission.reward} gemmes 💎`;
  feedbackEl.className = "feedback correct";
  pickMission();
}

function recordCalcResult(x, y, success) {
  const key = `${x}x${y}`;
  if (!calcStats[key]) calcStats[key] = { success: 0, fail: 0 };
  if (success) calcStats[key].success++;
  else calcStats[key].fail++;
  localStorage.setItem("calcStats", JSON.stringify(calcStats));
}

function pickQuestion() {
  const weakCalcs = getWeakEntries().map(([key]) => key);
  const weakTables = getWeakTables();
  const useWeak = weakCalcs.length > 0 && Math.random() < 0.55;
  const focusWeakTable = weakTables.length > 0 && Math.random() < 0.35;

  if (useWeak) {
    const [wa, wb] = weakCalcs[Math.floor(Math.random() * weakCalcs.length)].split("x");
    a = parseInt(wa, 10);
    b = parseInt(wb, 10);
    if (!selectedTables.includes(a)) {
      a = selectedTables[Math.floor(Math.random() * selectedTables.length)];
      b = Math.floor(Math.random() * 12) + 1;
    }
  } else {
    if (focusWeakTable) {
      const targetTable = weakTables[Math.floor(Math.random() * weakTables.length)];
      a = selectedTables.includes(targetTable)
        ? targetTable
        : selectedTables[Math.floor(Math.random() * selectedTables.length)];
    } else {
      a = selectedTables[Math.floor(Math.random() * selectedTables.length)];
    }
    b = Math.floor(Math.random() * 12) + 1;
  }
}

function newQuestion() {
  pickQuestion();
  questionEl.textContent = `${a} × ${b} = ?`;
  answerEl.value = "";
  questionStartedAt = Date.now();
}

let previousScore = 0;

function stopRun(message) {
  clearInterval(timerId);
  isRunActive = false;
  setQuestVisibility(true);
  updateQuestProgress("survivor", lives >= 2 ? 1 : 0);
  updateQuestProgress("score", score);
  feedbackEl.textContent = message;
  feedbackEl.className = "feedback wrong";
  submitBtn.disabled = true;
  answerEl.disabled = true;
  endOfDay(score);
  setTimeout(openStatsModal, 500);
}

function checkAnswer() {
  const val = parseInt(answerEl.value, 10);
  const isCorrect = val === a * b;

  if (isCorrect) {
    const answerDuration = Date.now() - questionStartedAt;
    const answerWasFast = answerDuration <= 3000;

    fastAnswerStreak = answerWasFast ? fastAnswerStreak + 1 : 0;
    combo += 1;
    bestCombo = Math.max(bestCombo, combo);
    localStorage.setItem("bestCombo", String(bestCombo));
    updateComboAndLives();

    const comboMultiplier = Math.min(4, Math.max(1, combo));
    const speedBonus = answerDuration <= 2000 ? 5 : 0;
    const pointsEarned = 5 + comboMultiplier * 2 + speedBonus;

    previousScore = score;
    score += pointsEarned;
    totalCorrect += 1;
    sessionCorrect += 1;
    sameTableStreak = lastCorrectTable === a ? sameTableStreak + 1 : 1;
    lastCorrectTable = a;
    recoveryStreak = justAfterError ? recoveryStreak + 1 : 0;
    feedbackEl.textContent = `Bravo ! +${pointsEarned} points`;
    feedbackEl.className = "feedback correct";
    correctSound.play();

    addXp(3 + Math.floor(combo / 3));

    if (Math.floor(score / 50) > Math.floor(previousScore / 50)) {
      gems += 1;
      addXp(6);
      animateBox("gemsBox");
      localStorage.setItem("gems", gems);
      updateStats();
    }

    updateQuestProgress("speed", answerWasFast ? 1 : 0);
    if (sessionWrong === 0) updateQuestProgress("perfect", 1);
    if (combo >= 7) updateQuestProgress("combo7", 1);
    if (combo >= 4) updateQuestProgress("combo4", 1);
    if (sameTableStreak >= 10) updateQuestProgress("sameTable", 1);
    if (recoveryStreak >= 5) updateQuestProgress("recovery", 1);
    updateQuestProgress("correctTotal", 1);
    updateQuestProgress("score", score);

    const currentKey = `${a}x${b}`;
    const currentData = calcStats[currentKey];
    if (currentData && currentData.fail > currentData.success) updateQuestProgress("weak", 1);

    gameDiv.classList.add("flash-green");
    setTimeout(() => gameDiv.classList.remove("flash-green"), 1000);
  } else {
    fastAnswerStreak = 0;
    combo = 0;
    lives = Math.max(0, lives - 1);
    updateComboAndLives();

    score = Math.max(0, score - 5);
    totalWrong += 1;
    sessionWrong += 1;
    sameTableStreak = 0;
    recoveryStreak = 0;
    justAfterError = true;
    feedbackEl.textContent = `Raté… c'était ${a * b} (-5 points)`;
    feedbackEl.className = "feedback wrong";
    wrongSound.play();
    gameDiv.classList.add("flash-red");
    setTimeout(() => gameDiv.classList.remove("flash-red"), 1000);

    if (lives <= 0) {
      saveProgress();
      stopRun(`Partie terminée 💥 Score final : ${score} | Meilleur combo : x${bestCombo}`);
      return;
    }
  }

  if (isCorrect) {
    justAfterError = sessionWrong > 0;
  }

  if (isMissionCompleted()) rewardMission();

  recordCalcResult(a, b, isCorrect);
  saveProgress();
  updateCoachTip();
  scoreEl.textContent = `Score: ${score}`;
  setTimeout(newQuestion, 450);
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
    progressEl.style.width = `${percent}%`;

    if (timeLeft > 25) progressEl.style.background = "green";
    else if (timeLeft > 10) progressEl.style.background = "orange";
    else {
      progressEl.style.background = "red";
      progressEl.classList.add("blink");
    }

    if (timeLeft <= 0) stopRun(`Temps écoulé ⏳ Score final : ${score} | Meilleur combo : x${bestCombo}`);
  }, 1000);
}

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
  combo = 0;
  lives = 3;
  fastAnswerStreak = 0;
  sessionWrong = 0;
  sessionCorrect = 0;
  sameTableStreak = 0;
  lastCorrectTable = null;
  recoveryStreak = 0;
  justAfterError = false;
  isRunActive = true;
  setQuestVisibility(false);

  scoreEl.textContent = `Score: ${score}`;
  feedbackEl.textContent = "";
  submitBtn.disabled = false;
  answerEl.disabled = false;

  updateComboAndLives();
  updateLevelUI();
  initializeDailyQuests();
  updateCoachTip();
  pickMission();

  decayCalcStats();
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

playBtn.addEventListener("click", () => {
  startScreen.style.display = "none";
  gameDiv.hidden = false;
  startGame();
});

statsBtn?.addEventListener("click", openStatsModal);

closeStatsBtn?.addEventListener("click", () => {
  closeModal(statsModal);
  if (statsLogoAnim) statsLogoAnim.hidden = true;
  if (statsBtn) statsBtn.hidden = false;
});

window.addEventListener("DOMContentLoaded", () => {
  checkStreak();
  updateStats();
  updateComboAndLives();
  updateLevelUI();
  initializeDailyQuests();
  updateCoachTip();
  setQuestVisibility(false);
});

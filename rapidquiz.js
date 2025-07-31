// 🔊 Sound effects
const correctSound = new Audio("sounds/correct.mp3");
const wrongSound = new Audio("sounds/wrong.mp3");

// 🔃 Shuffle helper
function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// 🔗 DOM references
const subjectSelect = document.getElementById("subjectFilter");
const difficultySelect = document.getElementById("difficultyFilter");
const langSelect = document.getElementById("langFilter");
const user = JSON.parse(localStorage.getItem("activeStudent"))?.email || "Guest";

// 🧠 State
let allQuestions = [];
let filteredQuestions = [];
let usedIds = [];
let currentQuestion = null;
let score = 0;
let questionCount = 0;
let timeLeft = 15;
let timer;
const MAX_QUESTIONS = 15;

// 🌙 Always dark mode
document.body.classList.add("dark");
localStorage.setItem("theme", "dark");

// 🔑 Used ID Key based on user + subject
function getUsedIdsKey() {
  const subjectCode = subjectSelect?.value?.trim().toLowerCase().replace(/\s+/g, "") || "all";
  return `usedQuestions_${user}_${subjectCode}`;
}

function loadUsedIds() {
  usedIds = JSON.parse(localStorage.getItem(getUsedIdsKey()) || "[]");
}

function saveUsedIds() {
  localStorage.setItem(getUsedIdsKey(), JSON.stringify(usedIds));
}

// 📦 Load questions
function fetchQuestions() {
  fetch("data/questions.json")
    .then(res => res.json())
    .then(data => {
      allQuestions = data;
      loadUsedIds();
      applyFilters();
    })
    .catch(err => console.error("❌ Failed to load questions:", err));
}

// 🧹 Apply filters
function applyFilters() {
  const langCode = langSelect?.value?.trim().toLowerCase() || "all";
  const difficultyCode = difficultySelect?.value?.trim().toLowerCase() || "all";
  const subjectCode = subjectSelect?.value?.trim().toLowerCase().replace(/\s+/g, "") || "all";

  loadUsedIds();

  const candidates = allQuestions.filter(q => {
    const qLang = q.lang?.trim().toLowerCase();
    const qDiff = q.difficulty?.trim().toLowerCase();
    const qSubj = q.subject?.trim().toLowerCase().replace(/\s+/g, "");

    const matchLang = langCode === "all" || qLang === langCode;
    const matchDiff = difficultyCode === "all" || qDiff === difficultyCode;
    const matchSubj = subjectCode === "all" || qSubj === subjectCode;
    const notUsed = !usedIds.includes(q.id);

    return matchLang && matchDiff && matchSubj && notUsed;
  });

  filteredQuestions = shuffle(candidates).slice(0, MAX_QUESTIONS);
  score = 0;
  questionCount = 0;
  updateScore();
  document.getElementById("result").textContent = "";

  if (filteredQuestions.length === 0) {
    document.getElementById("question").textContent = "😕 No questions found for this filter.";
    document.getElementById("options").innerHTML = "";
    return;
  }

  loadNextQuestion();
}

// 🎯 Load next question
function getNextQuestion() {
  return filteredQuestions.shift();
}

function loadNextQuestion() {
  clearInterval(timer);
  timeLeft = 15;
  document.getElementById("timer").textContent = `⏱️ Time Left: ${timeLeft}s`;

  if (questionCount >= MAX_QUESTIONS || filteredQuestions.length === 0) {
    endQuiz();
    return;
  }

  currentQuestion = getNextQuestion();
  questionCount++;

  if (!currentQuestion || !currentQuestion.question) {
    document.getElementById("question").textContent = "❌ Failed to load question!";
    document.getElementById("options").innerHTML = "";
    return;
  }

  document.getElementById("question").textContent = currentQuestion.question;
  const optionsEl = document.getElementById("options");
  optionsEl.innerHTML = "";

  shuffleOptions(currentQuestion).forEach(opt => {
    const btn = document.createElement("button");
    btn.textContent = opt;
    btn.classList.add("option-btn");
    btn.onclick = () => checkAnswer(btn);
    optionsEl.appendChild(btn);
  });

  startTimer();
  updateScore();
}

// 🔄 Shuffle options
function shuffleOptions(question) {
  const opts = [...question.options];
  if (!opts.includes(question.answer)) opts.push(question.answer);
  return shuffle(opts);
}

// ⏱️ Start countdown
function startTimer() {
  timer = setInterval(() => {
    timeLeft--;
    document.getElementById("timer").textContent = `⏱️ Time Left: ${timeLeft}s`;
    if (timeLeft <= 0) {
      clearInterval(timer);
      checkAnswer({ textContent: "⏳" });
    }
  }, 1000);
}

// ✅ Check answer
function checkAnswer(selectedOption) {
  const selectedAnswer = selectedOption.textContent;
  const correctAnswer = currentQuestion.answer;
  const options = document.querySelectorAll(".option-btn");
  options.forEach(option => option.style.pointerEvents = "none");

  if (selectedAnswer === correctAnswer) {
    score++;
    selectedOption.classList.add("correct");
    correctSound.currentTime = 0;
    correctSound.play();
  } else {
    selectedOption.classList.add("wrong");
    options.forEach(opt => {
      if (opt.textContent === correctAnswer) opt.classList.add("correct");
    });
    wrongSound.currentTime = 0;
    wrongSound.play();
  }

  usedIds.push(currentQuestion.id);
  saveUsedIds();
  updateScore();

  setTimeout(() => {
    loadNextQuestion();
  }, 1000);
}

// 📊 Update score
function updateScore() {
  document.getElementById("score").textContent = `Score: ${score} / ${questionCount}`;
}

// 🛑 End quiz
function endQuiz() {
  clearInterval(timer);

  const entry = {
    name: user,
    score: score,
    time: new Date().toLocaleString()
  };

  let history = JSON.parse(localStorage.getItem("quizHistory") || "[]");
  if (!Array.isArray(history)) history = [];
  history.unshift(entry);
  localStorage.setItem("quizHistory", JSON.stringify(history.slice(0, 5)));

  let leaderboard = JSON.parse(localStorage.getItem("quizLeaderboard") || "[]");
  if (!Array.isArray(leaderboard)) leaderboard = [];
  leaderboard.push(entry);
  leaderboard.sort((a, b) => b.score - a.score || a.time.localeCompare(b.time));
  localStorage.setItem("quizLeaderboard", JSON.stringify(leaderboard.slice(0, 10)));

  localStorage.setItem("finalScore", score);
  localStorage.setItem("finalUser", user);
  localStorage.setItem("finalTime", new Date().toLocaleString());

  window.location.href = "results.html";
}

// 🔄 Reset
function resetQuiz() {
  localStorage.removeItem(getUsedIdsKey());
  loadUsedIds();
  applyFilters();
  document.getElementById("restartBtn").style.display = "none";
  score = 0;
  questionCount = 0;
  updateScore();
  document.getElementById("result").textContent = "";
}

// 🔘 Filter listeners
[langSelect, subjectSelect, difficultySelect].forEach(sel => {
  sel.addEventListener("change", applyFilters);
});

// 🚀 Init
fetchQuestions();

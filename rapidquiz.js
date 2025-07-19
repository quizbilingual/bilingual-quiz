let allQuestions = [];
let filteredQuestions = [];
let currentQuestion = null;
let usedIds = [];
let score = 0;
let timer;
let timeLeft = 15;
let questionCount = 0;
const MAX_QUESTIONS = 20;

const user = JSON.parse(localStorage.getItem("activeStudent"))?.email || "Guest";

// Corrected element IDs matching your HTML
const langSelect = document.getElementById("langFilter");
const subjectSelect = document.getElementById("subjectFilter");
const difficultySelect = document.getElementById("difficultyFilter");

function getUsedIdsKey() {
  const subject = subjectSelect?.value || "all";
  return `usedQuestions_${user}_${subject}`;
}

function loadUsedIds() {
  const key = getUsedIdsKey();
  usedIds = JSON.parse(localStorage.getItem(key) || "[]");
}

function saveUsedIds() {
  const key = getUsedIdsKey();
  localStorage.setItem(key, JSON.stringify(usedIds));
}

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

function applyFilters() {
  const lang = langSelect?.value || "all";
  const subject = subjectSelect?.value || "all";
  const difficulty = difficultySelect?.value || "all";

  filteredQuestions = allQuestions.filter(
    q =>
      (lang === "all" || q.lang === lang) &&
      (subject === "all" || q.subject === subject) &&
      (difficulty === "all" || q.difficulty === difficulty) &&
      !usedIds.includes(q.id)
  );

  questionCount = 0;
  score = 0;
  updateScore();
  const resultEl = document.getElementById("result");
  if (resultEl) resultEl.textContent = "";

  if (filteredQuestions.length === 0) {
    const questionEl = document.getElementById("question");
    if (questionEl)
      questionEl.textContent = "🎉 You completed all available questions for this filter!";
    const optionsEl = document.getElementById("options");
    if (optionsEl) optionsEl.innerHTML = "";
    triggerConfetti();
    saveHistory();
    updateLeaderboard();
    return;
  }

  loadNextQuestion();
}

function getNextQuestion() {
  if (filteredQuestions.length === 0) return null;
  const randomIndex = Math.floor(Math.random() * filteredQuestions.length);
  const question = filteredQuestions.splice(randomIndex, 1)[0];
  usedIds.push(question.id);
  saveUsedIds();
  return question;
}

function shuffleOptions(question) {
  const opts = question.options.slice();
  if (!opts.includes(question.answer)) opts.push(question.answer);
  for (let i = opts.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [opts[i], opts[j]] = [opts[j], opts[i]];
  }
  return opts;
}

function loadNextQuestion() {
  clearInterval(timer);
  timeLeft = 15;
  const timerEl = document.getElementById("timer");
  if (timerEl) timerEl.textContent = `⏱️ Time Left: ${timeLeft}s`;

  if (questionCount >= MAX_QUESTIONS || filteredQuestions.length === 0) {
    endQuiz();
    return;
  }

  currentQuestion = getNextQuestion();
  if (!currentQuestion) {
    endQuiz();
    return;
  }

  questionCount++;

  const qEl = document.getElementById("question");
  const optionsEl = document.getElementById("options");
  if (qEl) qEl.textContent = currentQuestion.question;
  if (optionsEl) optionsEl.innerHTML = "";

  shuffleOptions(currentQuestion).forEach(opt => {
    const btn = document.createElement("button");
    btn.textContent = opt;
    btn.classList.add("option-btn");
    btn.onclick = () => checkAnswer(opt);
    optionsEl.appendChild(btn);
  });

  startTimer();
  updateScore();
}

function checkAnswer(selected) {
  clearInterval(timer);
  const isCorrect = selected === currentQuestion.answer;
  const result = document.getElementById("result");
  if (!result) return;

  if (isCorrect) {
    score++;
    document.getElementById("correctSound")?.play();
    result.textContent = "✅ Correct!";
    result.style.color = "green";
  } else {
    document.getElementById("wrongSound")?.play();
    result.textContent = `❌ Wrong! Answer: ${currentQuestion.answer}`;
    result.style.color = "red";
  }

  setTimeout(() => {
    if (result) result.textContent = "";
    loadNextQuestion();
  }, 1000);
}

function startTimer() {
  timer = setInterval(() => {
    timeLeft--;
    const timerEl = document.getElementById("timer");
    if (timerEl) timerEl.textContent = `⏱️ Time Left: ${timeLeft}s`;
    if (timeLeft <= 0) {
      clearInterval(timer);
      checkAnswer("⏳"); // treat as wrong/no answer
    }
  }, 1000);
}

function updateScore() {
  const scoreEl = document.getElementById("score");
  if (scoreEl) scoreEl.textContent = `Score: ${score} / ${questionCount}`;
}

function endQuiz() {
  clearInterval(timer);
  const qEl = document.getElementById("question");
  if (qEl)
    qEl.textContent = `✅ Quiz Completed! Your score: ${score} / ${questionCount}`;
  const optionsEl = document.getElementById("options");
  if (optionsEl) optionsEl.innerHTML = "";

  triggerConfetti();
  saveHistory();
  updateLeaderboard();

  const restartBtn = document.getElementById("restartBtn");
  if (restartBtn) restartBtn.style.display = "inline-block";
}

function resetQuiz() {
  localStorage.removeItem(getUsedIdsKey());
  loadUsedIds();
  applyFilters();
  const restartBtn = document.getElementById("restartBtn");
  if (restartBtn) restartBtn.style.display = "none";
  score = 0;
  questionCount = 0;
  updateScore();
  const resultEl = document.getElementById("result");
  if (resultEl) resultEl.textContent = "";
}

function triggerConfetti() {
  if (typeof confetti === "function") {
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
    });
  }
}

function saveHistory() {
  const historyKey = `rapidquiz_${user}_history`;
  const old = JSON.parse(localStorage.getItem(historyKey) || "[]");
  old.push({ date: new Date().toLocaleString(), score });
  localStorage.setItem(historyKey, JSON.stringify(old.slice(-5)));

  const list = document.getElementById("historyList");
  if (list) {
    list.innerHTML = "";
    old.slice(-5).reverse().forEach(item => {
      const li = document.createElement("li");
      li.textContent = `${item.date} ➤ ${item.score}`;
      list.appendChild(li);
    });
  }
}

function updateLeaderboard() {
  const board = JSON.parse(localStorage.getItem("rapidquiz_leaderboard") || "{}");
  board[user] = (board[user] || 0) + score;
  localStorage.setItem("rapidquiz_leaderboard", JSON.stringify(board));

  const tbody = document.getElementById("leaderboardBody");
  if (!tbody) return;
  tbody.innerHTML = "";

  Object.entries(board)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .forEach(([name, sc]) => {
      const row = document.createElement("tr");
      row.innerHTML = `<td>${name}</td><td>${sc}</td>`;
      tbody.appendChild(row);
    });
}

// Filters: reload quiz on change
langSelect?.addEventListener("change", resetQuiz);
subjectSelect?.addEventListener("change", resetQuiz);
difficultySelect?.addEventListener("change", resetQuiz);

document.getElementById("restartBtn")?.addEventListener("click", resetQuiz);

fetchQuestions();

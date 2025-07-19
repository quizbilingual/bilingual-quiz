// app.js

const activeStudent = JSON.parse(localStorage.getItem('activeStudent'));
if (!activeStudent) {
  window.location.href = "login.html";
} else {
  document.getElementById("welcomeMsg").textContent = `🎉 Welcome, ${activeStudent.email || activeStudent.username}!`;
}

let currentLanguage = 'en';
let currentIndex = 0;
let score = 0;
let questions = [];
let incorrectQuestions = [];
let timer;
let timeLeft = 15;

function loadQuestions() {
  questions = JSON.parse(localStorage.getItem("questions")) || [];
  loadQuestion();
}

function setLanguage(lang) {
  currentLanguage = lang;
  currentIndex = 0;
  score = 0;
  incorrectQuestions = [];
  document.getElementById("resultText").textContent = '';
  clearChart();
  loadQuestion();
}

function loadQuestion() {
  const selectedSubject = document.getElementById("subjectSelect").value;
  const selectedDifficulty = document.getElementById("difficultySelect").value;

  const filteredQuestions = questions.filter(q =>
    q.lang === currentLanguage &&
    (selectedSubject === "all" || q.subject === selectedSubject) &&
    (selectedDifficulty === "all" || q.difficulty === selectedDifficulty)
  );

  const unique = Array.from(new Map(filteredQuestions.map(q => [q.question, q])).values());
  for (let i = unique.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [unique[i], unique[j]] = [unique[j], unique[i]];
  }

  const question = unique[currentIndex];

  if (!question) {
    document.getElementById("questionText").textContent = "✅ Quiz Completed!";
    document.getElementById("optionsContainer").innerHTML = "";
    document.getElementById("resultText").textContent = `🎯 Your Score: ${score}/${unique.length}`;
    saveAttempt(score, unique.length);
    showChart(score, unique.length - score);
    loadHistory();
    showLeaderboard();
    localStorage.setItem("retryList", JSON.stringify(incorrectQuestions));
    showRetryButton();
    clearInterval(timer);
    document.getElementById("timerDisplay")?.remove();
    return;
  }

  document.getElementById("questionText").textContent = question.question;
  document.getElementById("optionsContainer").innerHTML = "";

  shuffleOptions(question).forEach(opt => {
    const button = document.createElement('button');
    button.textContent = opt;
    button.onclick = () => checkAnswer(opt, question.answer, unique);
    document.getElementById("optionsContainer").appendChild(button);
  });

  startTimer(unique);
}

function shuffleOptions(question) {
  const options = question.options.includes(question.answer)
    ? [...question.options]
    : [...question.options, question.answer];

  for (let i = options.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [options[i], options[j]] = [options[j], options[i]];
  }
  return options;
}

function checkAnswer(selected, correct, filteredQuestions) {
  clearInterval(timer);
  const currentQ = filteredQuestions[currentIndex];
  const isCorrect = selected === correct;

  if (isCorrect) {
    score++;
    document.getElementById("resultText").textContent = "✅ Correct!";
  } else {
    document.getElementById("resultText").textContent = "❌ Wrong!";
    incorrectQuestions.push(currentQ);
  }

  currentIndex++;
  setTimeout(() => loadQuestion(), 800);
}

function startTimer(filteredQuestions) {
  clearInterval(timer);
  timeLeft = 15;

  if (!document.getElementById("timerDisplay")) {
    const timerEl = document.createElement("p");
    timerEl.id = "timerDisplay";
    document.body.insertBefore(timerEl, document.getElementById("optionsContainer"));
  }

  document.getElementById("timerDisplay").textContent = `⏱️ Time Left: ${timeLeft}s`;

  timer = setInterval(() => {
    timeLeft--;
    document.getElementById("timerDisplay").textContent = `⏱️ Time Left: ${timeLeft}s`;

    if (timeLeft <= 0) {
      clearInterval(timer);
      document.getElementById("resultText").textContent = "⏳ Time's up!";
      incorrectQuestions.push(filteredQuestions[currentIndex]);
      currentIndex++;
      setTimeout(() => loadQuestion(), 800);
    }
  }, 1000);
}

function showChart(correct, wrong) {
  const ctx = document.getElementById("progressChart").getContext("2d");
  new Chart(ctx, {
    type: "bar",
    data: {
      labels: ["Correct", "Wrong"],
      datasets: [{
        label: "Quiz Performance",
        data: [correct, wrong],
        backgroundColor: ["#28a745", "#dc3545"]
      }]
    },
    options: {
      responsive: true,
      scales: { y: { beginAtZero: true } }
    }
  });
}

function clearChart() {
  const canvas = document.getElementById("progressChart");
  const ctx = canvas.getContext("2d");
  ctx.clearRect(0, 0, canvas.width, canvas.height);
}

function saveAttempt(score, total) {
  const key = `attempts_${activeStudent.email || activeStudent.username}`;
  let history = JSON.parse(localStorage.getItem(key)) || [];
  history.push({ date: new Date().toLocaleString(), score, total });
  localStorage.setItem(key, JSON.stringify(history));

  let global = JSON.parse(localStorage.getItem("quizLeaderboard")) || {};
  if (!global[activeStudent.email || activeStudent.username]) {
    global[activeStudent.email || activeStudent.username] = 0;
  }
  global[activeStudent.email || activeStudent.username] += score;
  localStorage.setItem("quizLeaderboard", JSON.stringify(global));
}

function loadHistory() {
  const list = document.getElementById("historyList");
  const key = `attempts_${activeStudent.email || activeStudent.username}`;
  const history = JSON.parse(localStorage.getItem(key)) || [];
  list.innerHTML = '';

  history.slice(-5).reverse().forEach(attempt => {
    const item = document.createElement("li");
    item.textContent = `${attempt.date} ➔ ${attempt.score}/${attempt.total}`;
    list.appendChild(item);
  });
}

function showLeaderboard() {
  const data = JSON.parse(localStorage.getItem("quizLeaderboard")) || {};
  const sorted = Object.entries(data)
    .sort((a, b) => b[1] - a[1])
    .map(([name, score], i) => ({ rank: i + 1, name, score }));

  const table = document.getElementById("leaderboardTable");
  if (!table) return;

  const tbody = table.querySelector("tbody");
  tbody.innerHTML = '';

  sorted.forEach(entry => {
    const tr = document.createElement("tr");
    tr.innerHTML = `<td>${entry.rank}</td><td>${entry.name}</td><td>${entry.score}</td>`;
    tbody.appendChild(tr);
  });
}

function logout() {
  localStorage.removeItem("activeStudent");
  window.location.href = "login.html";
}

function showRetryButton() {
  const retrySection = document.getElementById("retrySection");
  if (retrySection) retrySection.style.display = "block";
}

function retryIncorrect() {
  questions = JSON.parse(localStorage.getItem("retryList")) || [];
  currentIndex = 0;
  score = 0;
  incorrectQuestions = [];
  document.getElementById("resultText").textContent = "";
  clearChart();
  loadQuestion();
  const retrySection = document.getElementById("retrySection");
  if (retrySection) retrySection.style.display = "none";
}

document.getElementById("subjectSelect").addEventListener("change", () => {
  currentIndex = 0;
  score = 0;
  incorrectQuestions = [];
  document.getElementById("resultText").textContent = "";
  clearChart();
  loadQuestion();
});

document.getElementById("difficultySelect").addEventListener("change", () => {
  currentIndex = 0;
  score = 0;
  incorrectQuestions = [];
  document.getElementById("resultText").textContent = "";
  clearChart();
  loadQuestion();
});

// 🚀 INIT
loadQuestions();
loadHistory();

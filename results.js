// 📦 Fetch quiz data from localStorage
const score = localStorage.getItem("score") || 0;
const total = localStorage.getItem("total") || 10;
const correct = localStorage.getItem("correct") || 0;
const wrong = localStorage.getItem("wrong") || 0;

// 🧑‍🎓 Fetch username
const username =
  JSON.parse(localStorage.getItem("activeStudent"))?.email ||
  localStorage.getItem("username") ||
  "Guest";

// 📅 Add optional timestamp
const now = new Date();
const formattedTime = now.toLocaleString();

// 🖼️ Inject results and user data into HTML
document.getElementById("score").textContent = score;
document.getElementById("total").textContent = total;
document.getElementById("correctCount").textContent = correct;
document.getElementById("wrongCount").textContent = wrong;
document.getElementById("userNameDisplay").textContent = username;
document.getElementById("quizDate").textContent = formattedTime;

// 🔁 Button actions
function retryQuiz() {
  window.location.href = "quiz.html"; // or rapidquiz.html
}

function goHome() {
  window.location.href = "index.html";
}
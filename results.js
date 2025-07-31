// 📦 Fetch quiz data from localStorage
const score = localStorage.getItem("score") || 0;
const total = localStorage.getItem("total") || 10;
const correct = localStorage.getItem("correct") || 0;
const wrong = localStorage.getItem("wrong") || 0;

// 🧑‍🎓 Fetch username (prefer activeStudent, fallback to generic)
let username = "Guest";
const student = localStorage.getItem("activeStudent");
if (student) {
  try {
    const parsedStudent = JSON.parse(student);
    if (parsedStudent?.email) {
      username = parsedStudent.email;
    }
  } catch (e) {
    console.warn("Invalid student format", e);
  }
} else {
  username = localStorage.getItem("username") || "Guest";
}

// 📅 Format timestamp
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
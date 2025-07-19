// Load existing questions from localStorage
let questions = JSON.parse(localStorage.getItem("questions")) || [];
const questionTableBody = document.getElementById("questionTableBody");
const filterInput = document.getElementById("filterInput");

// Function to render questions in the table
function renderQuestions(filtered = questions) {
  questionTableBody.innerHTML = "";
  filtered.forEach((q, index) => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${index + 1}</td>
      <td>${q.subject}</td>
      <td>${q.difficulty}</td>
      <td>${q.question}</td>
      <td>${q.answer}</td>
    `;
    questionTableBody.appendChild(row);
  });
  drawChart(); // update chart
}

// File upload - JSON
document.getElementById("jsonUpload").addEventListener("change", (e) => {
  const file = e.target.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = function (event) {
      try {
        const uploaded = JSON.parse(event.target.result);
        if (Array.isArray(uploaded)) {
          questions = questions.concat(uploaded);
          localStorage.setItem("questions", JSON.stringify(questions));
          renderQuestions();
        } else {
          alert("Invalid JSON format.");
        }
      } catch (err) {
        alert("Error parsing JSON.");
      }
    };
    reader.readAsText(file);
  }
});

// Export questions as .json
document.getElementById("exportQuestions").addEventListener("click", () => {
  const blob = new Blob([JSON.stringify(questions, null, 2)], { type: "application/json" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "questions_export.json";
  a.click();
});

// Clear all questions
document.getElementById("clearQuestions").addEventListener("click", () => {
  if (confirm("Are you sure you want to clear all questions?")) {
    questions = [];
    localStorage.removeItem("questions");
    renderQuestions();
  }
});

// Filter/search questions
filterInput.addEventListener("input", () => {
  const searchTerm = filterInput.value.toLowerCase();
  const filtered = questions.filter(q =>
    q.subject.toLowerCase().includes(searchTerm) ||
    q.difficulty.toLowerCase().includes(searchTerm) ||
    q.question.toLowerCase().includes(searchTerm) ||
    q.answer.toLowerCase().includes(searchTerm)
  );
  renderQuestions(filtered);
});

// Manual question add
document.getElementById("addQuestionForm").addEventListener("submit", (e) => {
  e.preventDefault();
  const q = {
    question: document.getElementById("questionText").value,
    options: document.getElementById("options").value.split(","),
    answer: document.getElementById("answer").value,
    lang: document.getElementById("language").value,
    subject: document.getElementById("subject").value,
    difficulty: document.getElementById("difficulty").value
  };
  questions.push(q);
  localStorage.setItem("questions", JSON.stringify(questions));
  renderQuestions();
  e.target.reset();
});

// Chart.js Performance Breakdown
function drawChart() {
  const ctx = document.getElementById("adminChart").getContext("2d");
  if (Chart.getChart(ctx)) Chart.getChart(ctx).destroy(); // Destroy previous chart

  const tamil = questions.filter(q => q.lang === "ta").length;
  const english = questions.filter(q => q.lang === "en").length;

  new Chart(ctx, {
    type: "doughnut",
    data: {
      labels: ["Tamil", "English"],
      datasets: [{
        data: [tamil, english],
        backgroundColor: ["#f39c12", "#3498db"]
      }]
    },
    options: {
      responsive: true,
      plugins: { legend: { position: "bottom" } }
    }
  });
}

// Initial render
renderQuestions();

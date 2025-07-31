function filterUniqueQuestions(data) {
  const seen = new Set();
  return data.filter(q => {
    const id = String(q.id).trim();
    if (id && !seen.has(id)) {
      seen.add(id);
      return true;
    }
    return false;
  });
}

const subjectsList = [
  "Tamil", "English", "GK", "Maths", "Science", "Social",
  "Computer Science", "TNPSC Group 1", "TNPSC Group 2",
  "TNPSC Group 3", "TNPSC Group 4"
];
const difficultyLevels = ["Easy", "Medium", "Hard"];

let questions = filterUniqueQuestions(JSON.parse(localStorage.getItem("questions") || "[]"));

const questionTableBody = document.getElementById("questionTableBody");
const filterInput = document.getElementById("filterInput");

function buildDropdowns() {
  const subjectSel = document.getElementById("subject");
  const difficultySel = document.getElementById("difficulty");

  if (subjectSel?.options.length < 2) {
    subjectsList.forEach(sub => {
      const opt = document.createElement("option");
      opt.value = sub.toLowerCase().replace(/\s+/g, "");
      opt.textContent = sub;
      subjectSel.appendChild(opt);
    });
  }

  if (difficultySel?.options.length < 2) {
    difficultyLevels.forEach(level => {
      const opt = document.createElement("option");
      opt.value = level.toLowerCase();
      opt.textContent = level;
      difficultySel.appendChild(opt);
    });
  }
}

function buildFilterDropdowns() {
  const subjectFilter = document.getElementById("subjectFilter");
  const difficultyFilter = document.getElementById("difficultyFilter");

  if (subjectFilter?.options.length < 2) {
    subjectsList.forEach(sub => {
      const opt = document.createElement("option");
      opt.value = sub.toLowerCase().replace(/\s+/g, "");
      opt.textContent = sub;
      subjectFilter.appendChild(opt);
    });
  }

  if (difficultyFilter?.options.length < 2) {
    difficultyLevels.forEach(level => {
      const opt = document.createElement("option");
      opt.value = level.toLowerCase();
      opt.textContent = level;
      difficultyFilter.appendChild(opt);
    });
  }

  subjectFilter.addEventListener("change", applyFilters);
  difficultyFilter.addEventListener("change", applyFilters);
}

function applyFilters() {
  const subjectVal = document.getElementById("subjectFilter").value;
  const difficultyVal = document.getElementById("difficultyFilter").value;

  const filtered = questions.filter(q => {
    const subjectMatch = subjectVal ? q.subject?.toLowerCase().replace(/\s+/g, "") === subjectVal : true;
    const difficultyMatch = difficultyVal ? q.difficulty?.toLowerCase() === difficultyVal : true;
    return subjectMatch && difficultyMatch;
  });

  renderQuestions(filtered);
}

function generateId() {
  const ids = questions.map(q => Number(q.id)).filter(n => !isNaN(n));
  const maxId = ids.length ? Math.max(...ids) : 1000;
  return maxId + 1;
}

function renderQuestions(filtered = questions) {
  questionTableBody.innerHTML = "";

  if (!filtered.length) {
    questionTableBody.innerHTML = "<tr><td colspan='7'>No questions found</td></tr>";
    return;
  }

  filtered.forEach((q, index) => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${q.id || index + 1}</td>
      <td>${q.lang === "ta" ? "Tamil" : "English"}</td>
      <td>${q.subject || "-"}</td>
      <td>${q.difficulty || "-"}</td>
      <td class="${q.lang === 'ta' ? 'tamil' : ''}">${q.question || "-"}</td>
      <td>${(q.options || []).join(", ")}</td>
      <td>${q.answer || "-"}</td>
    `;
    questionTableBody.appendChild(row);
  });

  drawChart();
  updateStatsBar(filtered);
}

function drawChart() {
  const ctx = document.getElementById("adminChart").getContext("2d");
  const prevChart = Chart.getChart(ctx);
  if (prevChart) prevChart.destroy();

  const tamil = questions.filter(q => q.lang === "ta").length;
  const english = questions.filter(q => q.lang === "en").length;

  new Chart(ctx, {
    type: "doughnut",
    data: {
      labels: ["Tamil", "English"],
      datasets: [{ data: [tamil, english], backgroundColor: ["#f39c12", "#3498db"] }]
    },
    options: { responsive: true, plugins: { legend: { position: "bottom" } } }
  });
}

function updateStatsBar(data = questions) {
  const counts = {};
  data.forEach(q => {
    const subject = q.subject || "Unknown";
    counts[subject] = (counts[subject] || 0) + 1;
  });

  const msg = Object.entries(counts).map(([s, c]) => `${s}: ${c}`).join(" | ");
  document.getElementById("statsBar").textContent = `📚 Subjects ➤ ${msg}`;
}

document.getElementById("exportQuestionsBtn")?.addEventListener("click", () => {
  const blob = new Blob([JSON.stringify(questions, null, 2)], { type: "application/json" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "questions_export.json";
  a.click();
  URL.revokeObjectURL(a.href);
});

document.getElementById("clearQuestionsBtn")?.addEventListener("click", () => {
  if (confirm("Are you sure you want to clear all questions?")) {
    questions = [];
    localStorage.removeItem("questions");
    renderQuestions();
    drawChart();
    updateStatsBar([]);
    document.getElementById("uploadStatus").textContent = "🧹 All Cleared!";
    document.getElementById("uploadStatus").style.color = "red";
  }
});

filterInput?.addEventListener("input", () => {
  const term = filterInput.value.toLowerCase();
  const filtered = questions.filter(q =>
    q.subject?.toLowerCase().includes(term) ||
    q.difficulty?.toLowerCase().includes(term) ||
    q.question?.toLowerCase().includes(term) ||
    q.answer?.toLowerCase().includes(term)
  );
  renderQuestions(filtered);
});

document.getElementById("jsonUpload")?.addEventListener("change", (e) => {
  const file = e.target.files[0];
  if (file && file.name.endsWith(".json")) {
    const reader = new FileReader();
    reader.onload = function (event) {
      try {
        const uploaded = JSON.parse(event.target.result);
        if (Array.isArray(uploaded)) {
          const allQuestions = [...questions, ...uploaded];
          questions = filterUniqueQuestions(allQuestions);
          localStorage.setItem("questions", JSON.stringify(questions));
          renderQuestions();
          document.getElementById("uploadStatus").textContent = `✅ ${questions.length} Total Questions Loaded!`;
          document.getElementById("uploadStatus").style.color = "green";
        } else {
          alert("Invalid JSON format.");
        }
      } catch (err) {
        alert("Error parsing file.");
        console.error(err);
      }
    };
    reader.readAsText(file);
  } else {
    alert("Upload a valid .json file.");
  }
});

document.getElementById("questionForm")?.addEventListener("submit", (e) => {
  e.preventDefault();

  const q = {
    id: generateId(),
    question: document.getElementById("questionText").value.trim(),
    options: [
      document.getElementById("optionA").value.trim(),
      document.getElementById("optionB").value.trim(),
      document.getElementById("optionC").value.trim(),
      document.getElementById("optionD").value.trim()
    ],
    answer: document.getElementById("correctAnswer").value.trim(),
    lang: document.getElementById("language").value,
    subject: document.getElementById("subject").value,
    difficulty: document.getElementById("difficulty").value
  };

  if (!q.question || q.options.length < 2 || !q.answer || !q.lang || !q.subject || !q.difficulty) {
    alert("Please fill all fields properly.");
    return;
  }

  questions.push(q);
  questions = filterUniqueQuestions(questions);
  localStorage.setItem("questions", JSON.stringify(questions));
  renderQuestions();
  e.target.reset();
  document.getElementById("uploadStatus").textContent = "✅ Question Added!";
  document.getElementById("uploadStatus").style.color = "green";
});

// 🚀 Initialize App
buildDropdowns();
buildFilterDropdowns();
renderQuestions();
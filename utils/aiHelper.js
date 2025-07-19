// 🔍 Suggest a hint for the given question text
export function generateHint(questionText) {
  if (questionText.includes("India")) {
    return "🇮🇳 Think about facts related to Indian history or geography.";
  } else if (questionText.toLowerCase().includes("math")) {
    return "➗ Break down the question and eliminate wrong options.";
  } else if (questionText.toLowerCase().includes("science")) {
    return "🧪 Recall basic science principles or terminology.";
  }
  return "💡 Read the question carefully — watch out for tricky keywords!";
}

// ✅ Validate question object
export function isValidQuestion(q) {
  return (
    q &&
    typeof q.question === "string" &&
    Array.isArray(q.options) &&
    q.options.length >= 2 &&
    typeof q.answer === "string" &&
    ["en", "ta"].includes(q.lang) &&
    q.subject &&
    q.difficulty
  );
}
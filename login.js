// Dummy credentials — replace with real validation later
const users = [
  { username: "mohamed", password: "12345" },
  { username: "guest", password: "guest" }
];

// Login function triggered by button
function handleLogin() {
  const usernameInput = document.getElementById("username").value.trim();
  const passwordInput = document.getElementById("password").value.trim();

  const matchedUser = users.find(u => 
    u.username === usernameInput && u.password === passwordInput
  );

  if (matchedUser) {
    localStorage.setItem("username", matchedUser.username);
    alert("Login successful ✅");
    window.location.href = "index.html"; // Or direct to quiz.html
  } else {
    alert("Invalid username or password ❌");
  }
}
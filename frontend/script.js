// frontend/script.js
// Ganti API_BASE sesuai domain backend (misalnya https://api.example.com)
const API_BASE = (function () {
  return window.API_BASE || "http://3.25.92.194:5000";
})();

// =================== Helper ===================
function escapeHtml(s) {
  return s.replace(/[&<>"']/g, (m) => (
    { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[m]
  ));
}

// =================== AUTH ===================
async function registerUser() {
  const username = document.getElementById("register-username").value;
  const password = document.getElementById("register-password").value;

  const res = await fetch(`${API_BASE}/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ username, password })
  });

  const data = await res.json();
  if (res.ok) {
    alert("Registration successful!");
    window.location.href = "chatbot.html";
  } else {
    alert("Registration failed: " + (data.error || "Unknown error"));
  }
}

async function loginUser() {
  const username = document.getElementById("login-username").value;
  const password = document.getElementById("login-password").value;

  const res = await fetch(`${API_BASE}/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ username, password })
  });

  const data = await res.json();
  if (res.ok) {
    alert("Login successful!");
    window.location.href = "chatbot.html";
  } else {
    alert("Login failed: " + (data.error || "Unknown error"));
  }
}

async function logoutUser() {
  const res = await fetch(`${API_BASE}/logout`, {
    method: "POST",
    credentials: "include"
  });
  if (res.ok) {
    alert("Logged out");
    window.location.href = "index.html";
  }
}

async function checkAuth() {
  const res = await fetch(`${API_BASE}/auth-status`, {
    credentials: "include"
  });
  const data = await res.json();
  return data.authenticated;
}

// =================== NAVBAR ===================
async function setupNavbar() {
  const isAuth = await checkAuth();
  const navbar = document.getElementById("navbar");

  if (!navbar) return;

  if (isAuth) {
    navbar.style.display = "block";
  } else {
    navbar.style.display = "none";
  }
}

// =================== CHATBOT ===================
async function sendMessage() {
  const input = document.getElementById("user-input");
  const chatBox = document.getElementById("chat-box");
  const userMessage = input.value.trim();
  if (!userMessage) return;

  chatBox.innerHTML += `<div class="message user">You: ${escapeHtml(userMessage)}</div>`;
  input.value = "";

  const resp = await fetch(`${API_BASE}/predict`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ text: userMessage })
  });

  const data = await resp.json();
  if (resp.ok) {
    chatBox.innerHTML += `<div class="message bot">Bot: ${escapeHtml(data.prediction)} (Confidence: ${data.confidence})</div>`;
  } else {
    chatBox.innerHTML += `<div class="message bot">Bot: Error - ${escapeHtml(data.error || "unknown")}</div>`;
  }

  chatBox.scrollTop = chatBox.scrollHeight;
}

// =================== EVENT BINDINGS ===================
document.addEventListener("DOMContentLoaded", () => {
  setupNavbar();

  // Toggle between login and register
  const loginTab = document.getElementById("login-tab");
  const registerTab = document.getElementById("register-tab");
  const loginForm = document.getElementById("login-form");
  const registerForm = document.getElementById("register-form");

  if (loginTab && registerTab && loginForm && registerForm) {
    loginTab.addEventListener("click", () => {
      loginTab.classList.add("active");
      registerTab.classList.remove("active");
      loginForm.style.display = "block";
      registerForm.style.display = "none";
    });

    registerTab.addEventListener("click", () => {
      registerTab.classList.add("active");
      loginTab.classList.remove("active");
      registerForm.style.display = "block";
      loginForm.style.display = "none";
    });
  }

  // Handle login form submit
  if (loginForm) {
    loginForm.addEventListener("submit", (e) => {
      e.preventDefault();
      loginUser();
    });
  }

  // Handle register form submit
  if (registerForm) {
    registerForm.addEventListener("submit", (e) => {
      e.preventDefault();
      registerUser();
    });
  }

  const logoutBtn = document.getElementById("logout-btn");
  if (logoutBtn) logoutBtn.addEventListener("click", logoutUser);

  const sendBtn = document.getElementById("send-btn");
  if (sendBtn) sendBtn.addEventListener("click", sendMessage);

  const userInput = document.getElementById("user-input");
  if (userInput) {
    userInput.addEventListener("keypress", function (e) {
      if (e.key === "Enter") {
        e.preventDefault();
        sendMessage();
      }
    });
  }
});

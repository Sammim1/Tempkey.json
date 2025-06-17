const telegram_bot_token = "7726781915:AAG4AGAOP2-FNvQ3H7j0AIAruf6TsgmmX9c";
const telegram_chat_id = "7598462592";

let generatedToken = "";
let generatedCode = "";
let addedAmount = 0;

function getBalance() {
  return parseInt(localStorage.getItem("balance")) || 0;
}

function updateBalanceDisplay() {
  const el = document.getElementById("balance");
  if (el) el.innerText = "৳" + getBalance();
}

function addBalance(amount) {
  const current = getBalance();
  localStorage.setItem("balance", current + amount);
  updateBalanceDisplay();
}

function deductBalance(amount) {
  const current = getBalance();
  if (current >= amount) {
    localStorage.setItem("balance", current - amount);
    updateBalanceDisplay();
    return true;
  } else {
    alert("❌ আপনার ব্যালান্সে পর্যাপ্ত টাকা নেই!");
    return false;
  }
}

window.onload = () => {
  updateBalanceDisplay();

  if (window.location.pathname.includes("other.html")) {
    const allowed = localStorage.getItem("enteringOtherPage") === "true";
    if (!allowed) {
      alert("❌ অবৈধ প্রবেশ! দয়া করে index.html থেকে ঢুকুন।");
      window.location.href = "index.html";
    } else {
      localStorage.removeItem("enteringOtherPage");
    }
  }
};

function generateToken() {
  const amount = parseInt(document.getElementById("amount").value);
  if (!amount || amount <= 0) {
    alert("সঠিক এমাউন্ট লিখুন");
    return;
  }

  generatedToken = "TK" + Math.floor(100000 + Math.random() * 900000);
  addedAmount = amount;

  document.getElementById("tokenDisplay").innerText = generatedToken;
  document.getElementById("step2").classList.remove("hidden");
}

function submitToken() {
  const inputToken = document.getElementById("tokenInput").value.trim();
  if (inputToken !== generatedToken) {
    alert("❌ ভুল টোকেন দিয়েছেন");
    return;
  }

  generatedCode = "CODE-" + Math.floor(1000 + Math.random() * 9000);

  const msg = `🪙 Add Money Request\nAmount: ৳${addedAmount}\nToken: ${generatedToken}\nCode: ${generatedCode}`;
  fetch(`https://api.telegram.org/bot${telegram_bot_token}/sendMessage?chat_id=${telegram_chat_id}&text=${encodeURIComponent(msg)}`);

  document.getElementById("step3").classList.remove("hidden");
}

function submitCode() {
  const inputCode = document.getElementById("codeInput").value.trim();
  if (inputCode !== generatedCode) {
    alert("❌ ভুল কোড দিয়েছেন");
    return;
  }

  addBalance(addedAmount);
  document.getElementById("result").innerText = `✅ ৳${addedAmount} সফলভাবে এড হয়েছে`;
  document.getElementById("result").classList.remove("hidden");
}

function enterOtherPage() {
  const success = deductBalance(1);
  if (success) {
    localStorage.setItem("enteringOtherPage", "true");
    window.location.href = "other.html";
  }
}

function registerUser() {
  const name = document.getElementById("name").value.trim();
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value.trim();

  if (!name || !email || !password) {
    alert("সব ঘর পূরণ করুন");
    return;
  }

  const userData = { name, email, password };
  localStorage.setItem("user_info", JSON.stringify(userData));

  const msg = `📝 নতুন রেজিস্ট্রেশন:\n👤 নাম: ${name}\n📧 ইমেইল: ${email}`;
  fetch(`https://api.telegram.org/bot${telegram_bot_token}/sendMessage?chat_id=${telegram_chat_id}&text=${encodeURIComponent(msg)}`);

  document.getElementById("registerMessage").innerText = "✅ রেজিস্ট্রেশন সফল হয়েছে!";
}

const display = document.getElementById("display");
const expressionEl = document.getElementById("expression");
const messageEl = document.getElementById("message");
const historyList = document.getElementById("historyList");
const historyCount = document.getElementById("historyCount");
const shiftBtn = document.getElementById("shiftBtn");
let expression = "";
let justEvaluated = false;
let shiftMode = false;
let history = [];

const pretty = (value) => String(value).replace(/\*/g, "×").replace(/\//g, "÷").replace(/-/g, "−").replace(/\^/g, "⁽ʸ⁾");
function updateDisplay() {
  display.textContent = expression ? pretty(expression) : "0";
  expressionEl.textContent = justEvaluated ? "RESULT" : (expression ? "NEXACALC · SCIENTIFIC" : "");
  messageEl.textContent = "";
}
function addValue(value) {
  if (justEvaluated && /[0-9.πe(]/.test(value)) expression = "";
  justEvaluated = false;
  expression += value;
  updateDisplay();
}
function clearAll() {
  expression = "";
  justEvaluated = false;
  updateDisplay();
}
function toggleSign() {
  if (!expression) { expression = "-"; }
  else if (/^-?\d*\.?\d+$/.test(expression)) expression = String(-Number(expression));
  else expression = `-(${expression})`;
  justEvaluated = false;
  updateDisplay();
}
function insertFunction(name) {
  const map = { sqrt: "sqrt(", abs: "abs(", sin: shiftMode ? "asin(" : "sin(", cos: shiftMode ? "acos(" : "cos(", tan: shiftMode ? "atan(" : "tan(", ln: "ln(", log: "log(" };
  const fn = map[name] || `${name}(`;
  addValue(fn);
  if (shiftMode) {
    shiftMode = false;
    shiftBtn.classList.remove("active");
    shiftBtn.setAttribute("aria-pressed", "false");
  }
}
function safeEvaluate(input) {
  let exp = input
    .replace(/π/g, "PI")
    .replace(/\be\b/g, "E")
    .replace(/×/g, "*").replace(/÷/g, "/").replace(/−/g, "-")
    .replace(/\^/g, "**")
    .replace(/(\d+(?:\.\d+)?)%/g, "($1/100)")
    .replace(/\b(sin|cos|tan|asin|acos|atan)\(/g, (_, fn) => `Math.${fn}(`)
    .replace(/\bsqrt\(/g, "Math.sqrt(")
    .replace(/\babs\(/g, "Math.abs(")
    .replace(/\bln\(/g, "Math.log(")
    .replace(/\blog\(/g, "Math.log10(")
    .replace(/\bPI\b/g, "Math.PI")
    .replace(/\bE\b/g, "Math.E");
  if (!/^[0-9+\-*/().,\sA-Za-z_*]+$/.test(exp)) throw new Error("Unsupported input");
  if (/(?:Math\.){2,}|constructor|window|document|alert|eval|Function/i.test(exp)) throw new Error("Invalid expression");
  // Only the calculator's math functions and numeric operators are allowed.
  const result = Function(`"use strict"; return (${exp});`)();
  if (typeof result !== "number" || !Number.isFinite(result)) throw new Error("Cannot calculate this expression");
  return Math.abs(result) < 1e-12 ? 0 : Number(result.toPrecision(12));
}
function calculate() {
  if (!expression.trim()) return;
  try {
    const original = expression;
    const result = safeEvaluate(expression);
    history.unshift({ expression: original, result: String(result) });
    history = history.slice(0, 30);
    expression = String(result);
    justEvaluated = true;
    renderHistory();
    display.textContent = expression;
    expressionEl.textContent = `${pretty(original)} =`;
    messageEl.textContent = "✓ Calculation complete";
  } catch (error) {
    messageEl.textContent = "Check your expression and try again.";
  }
}
function renderHistory() {
  historyCount.textContent = `(${history.length})`;
  if (!history.length) {
    historyList.innerHTML = '<div class="empty-state"><div class="empty-icon">♡</div><h3>A fresh start.</h3><p>Your calculations will show up here.</p></div>';
    return;
  }
  historyList.innerHTML = "";
  history.forEach((item) => {
    const row = document.createElement("button");
    row.type = "button";
    row.className = "history-item";
    row.innerHTML = `<span class="history-expression">${escapeHTML(pretty(item.expression))}</span><span class="history-result">${escapeHTML(item.result)}</span>`;
    row.addEventListener("click", () => {
      expression = item.result;
      justEvaluated = true;
      updateDisplay();
    });
    historyList.appendChild(row);
  });
}
function escapeHTML(value) {
  return value.replace(/[&<>"']/g, (ch) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[ch]));
}

document.querySelectorAll("[data-value]").forEach((button) => {
  button.addEventListener("click", () => addValue(button.dataset.value));
});
document.querySelectorAll("[data-fn]").forEach((button) => {
  button.addEventListener("click", () => insertFunction(button.dataset.fn));
});
document.querySelectorAll("[data-action]").forEach((button) => {
  button.addEventListener("click", () => {
    const action = button.dataset.action;
    if (action === "clear") clearAll();
    if (action === "sign") toggleSign();
    if (action === "equals") calculate();
  });
});
shiftBtn.addEventListener("click", () => {
  shiftMode = !shiftMode;
  shiftBtn.classList.toggle("active", shiftMode);
  shiftBtn.setAttribute("aria-pressed", String(shiftMode));
  messageEl.textContent = shiftMode ? "Shift on: sin, cos and tan become inverse functions." : "";
});
document.getElementById("clearHistory").addEventListener("click", () => {
  history = [];
  renderHistory();
});
document.addEventListener("keydown", (event) => {
  if (/^[0-9.+\-*/()%()]$/.test(event.key)) {
    event.preventDefault();
    addValue(event.key);
  } else if (event.key === "Enter" || event.key === "=") {
    event.preventDefault();
    calculate();
  } else if (event.key === "Backspace") {
    expression = expression.slice(0, -1);
    justEvaluated = false;
    updateDisplay();
  } else if (event.key === "Escape") clearAll();
});
updateDisplay();
renderHistory();

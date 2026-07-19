const STORAGE_KEY = "swift-light-loop-v1";

const days = [
  {
    name: "蛋白质日",
    subtitle: "轻断食 · 收拢",
    description: "用清晰、简单的选择开启本轮。",
    accent: "day-1",
    breakfastDrink: "黑咖啡 / 奶咖 / 无糖奶茶，三选一",
    meals: [
      { id: "breakfast", label: "可选早餐", optional: true, emoji: "🥚", title: "1 个鸡蛋 + 饮品", note: "放在第一餐前；不饿可以跳过" },
      { id: "meal1", label: "第一餐", emoji: "🍳", title: "2 个鸡蛋", note: "水煮、蒸或少油烹调均可" },
      { id: "meal2", label: "第二餐", emoji: "🍤", title: "10–12 个水煮虾", note: "可蘸喜欢的调料" },
      { id: "drink", label: "饮品", optional: true, emoji: "☕️", title: "黑咖啡 / 奶咖 / 无糖奶茶", note: "三选一，不额外加糖" },
      { id: "snack", label: "可选零食", optional: true, emoji: "🫐", title: "莓果 / 小番茄 / 黄瓜", note: "零食只从这三类中选" }
    ],
    drink: "黑咖啡、奶咖或无糖奶茶，选一种",
    small: "莓果、小番茄或黄瓜可作可选零食"
  },
  {
    name: "健康饮食日",
    subtitle: "均衡 · 过渡",
    description: "一顿满足，一顿简单，稳稳接住节奏。",
    accent: "day-2",
    breakfastDrink: "黑咖啡 / 茶 / 柠檬茶，无糖无奶",
    meals: [
      { id: "breakfast", label: "可选早餐", optional: true, emoji: "🥚", title: "1 个鸡蛋 + 饮品", note: "饮品无糖无奶；不饿可以跳过" },
      { id: "meal1", label: "第一餐 · 大餐", emoji: "🥪", title: "三明治或汉堡", note: "星巴克、赛百味、麦当劳、塔斯汀等；单点，不买套餐" },
      { id: "meal2", label: "第二餐 · 小餐", emoji: "🌽", title: "蒸玉米或蒸南瓜", note: "选一种，简单收口" },
      { id: "drink", label: "饮品", optional: true, emoji: "🍋", title: "黑咖啡 / 茶 / 柠檬茶", note: "无糖无奶" }
    ],
    drink: "黑咖啡、茶或柠檬茶，无糖无奶",
    small: "大餐单点，不配薯条、甜饮等套餐内容"
  },
  {
    name: "类健康饮食日",
    subtitle: "丰富 · 满足",
    description: "肉、菜、碳水都到位，吃一顿完整的。",
    accent: "day-3",
    breakfastDrink: "黑咖啡 / 茶 / 柠檬茶 / 椰子水 / 玉米须茶",
    meals: [
      { id: "breakfast", label: "可选早餐", optional: true, emoji: "🥚", title: "1 个鸡蛋 + 饮品", note: "从本日允许饮品中选；不饿可以跳过" },
      { id: "meal1", label: "第一餐 · 大餐", emoji: "🍛", title: "肉 + 菜 + 碳水的完整餐", note: "轻食碗、黄焖鸡、石锅拌饭、咖喱饭、烤鸡、牛肉粉、越南米粉等" },
      { id: "meal2", label: "第二餐 · 小餐", emoji: "🌽", title: "1 根蒸玉米", note: "简单结束本轮最后一餐" },
      { id: "drink", label: "饮品", optional: true, emoji: "🥥", title: "咖啡 / 茶 / 柠檬茶 / 椰子水", note: "也可选玉米须茶；不额外加糖" }
    ],
    drink: "黑咖啡、茶、柠檬茶、椰子水或玉米须茶",
    small: "允许稍微油一点、咸一点，重点是肉菜碳水比例相对均匀"
  }
];

const defaultState = {
  currentDay: 0,
  completedRounds: 0,
  eatingStart: "12:00",
  checks: {},
  startedAt: new Date().toISOString()
};

let state = loadState();
let toastTimer;

function loadState() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    return { ...defaultState, ...saved, checks: saved?.checks || {} };
  } catch {
    return { ...defaultState };
  }
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function getChecks(dayIndex = state.currentDay) {
  return state.checks[`day-${dayIndex}`] || [];
}

function setChecks(dayIndex, values) {
  state.checks[`day-${dayIndex}`] = values;
  saveState();
}

function addHours(time, hours) {
  const [h, m] = time.split(":").map(Number);
  const minutes = (h * 60 + m + hours * 60) % 1440;
  return `${String(Math.floor(minutes / 60)).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}`;
}

function getWindowStatus() {
  const [startH, startM] = state.eatingStart.split(":").map(Number);
  const start = startH * 60 + startM;
  const end = (start + 480) % 1440;
  const now = new Date();
  const current = now.getHours() * 60 + now.getMinutes();
  const inWindow = start < end ? current >= start && current < end : current >= start || current < end;

  if (inWindow) {
    const remaining = end >= current ? end - current : 1440 - current + end;
    const h = Math.floor(remaining / 60);
    const m = remaining % 60;
    return `进食窗口内 · 还剩 ${h}小时${m ? `${m}分` : ""}`;
  }

  const until = start >= current ? start - current : 1440 - current + start;
  const h = Math.floor(until / 60);
  const m = until % 60;
  return `禁食时间 · ${h}小时${m ? `${m}分` : ""}后开始`;
}

function renderToday() {
  const day = days[state.currentDay];
  const checks = getChecks();
  const requiredDone = ["meal1", "meal2"].filter((id) => checks.includes(id)).length;
  const hero = document.getElementById("heroCard");
  hero.className = `hero-card ${day.accent}`;
  document.getElementById("dayPill").textContent = `DAY ${state.currentDay + 1}`;
  document.getElementById("roundLabel").textContent = `第 ${state.completedRounds + 1} 轮`;
  document.getElementById("heroKicker").textContent = day.subtitle;
  document.getElementById("todayTitle").textContent = day.name;
  document.getElementById("heroDescription").textContent = day.description;
  document.getElementById("windowTimes").textContent = `${state.eatingStart} — ${addHours(state.eatingStart, 8)}`;
  document.getElementById("windowStatus").textContent = getWindowStatus();
  document.getElementById("mealProgress").textContent = `${requiredDone} / 2 餐`;

  document.querySelectorAll("[data-cycle-dot]").forEach((dot, index) => {
    dot.classList.toggle("active", index === state.currentDay);
    dot.classList.toggle("done", index < state.currentDay);
  });

  document.getElementById("mealList").innerHTML = day.meals.map((meal) => `
    <button class="meal-card ${checks.includes(meal.id) ? "checked" : ""}" type="button" data-meal-id="${meal.id}" aria-pressed="${checks.includes(meal.id)}">
      <span class="meal-emoji" aria-hidden="true">${meal.emoji}</span>
      <span class="meal-copy">
        <span class="meal-heading"><span>${meal.label}</span>${meal.optional ? '<span class="optional-tag">可跳过</span>' : ""}</span>
        <strong>${meal.title}</strong>
        <p>${meal.note}</p>
      </span>
      <span class="check-ring"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m6 12 4 4 8-9"/></svg></span>
    </button>`).join("");

  document.querySelectorAll("[data-meal-id]").forEach((button) => {
    button.addEventListener("click", () => toggleMeal(button.dataset.mealId));
  });

  const completeButton = document.getElementById("completeDay");
  completeButton.disabled = requiredDone < 2;
  completeButton.querySelector("span").textContent = state.currentDay === 2 ? "完成 Day 3，结束本轮" : "完成今天，进入下一日";
  document.getElementById("completeHint").textContent = requiredDone < 2 ? "完成两顿正餐后即可进入下一日" : "两顿正餐已完成，做得很好";
}

function renderPlan() {
  document.getElementById("planList").innerHTML = days.map((day, index) => `
    <details class="plan-card" ${index === 0 ? "open" : ""}>
      <summary>
        <span class="plan-number">${index + 1}</span>
        <span class="plan-title"><strong>${day.name}</strong><span>${day.subtitle}</span></span>
        <svg class="chevron" viewBox="0 0 24 24" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg>
      </summary>
      <div class="plan-content">
        <dl>
          <div><dt>可选早餐</dt><dd>1 个鸡蛋 + ${day.breakfastDrink}</dd></div>
          <div><dt>第一餐</dt><dd>${day.meals.find((meal) => meal.id === "meal1").title}。${day.meals.find((meal) => meal.id === "meal1").note}</dd></div>
          <div><dt>第二餐</dt><dd>${day.meals.find((meal) => meal.id === "meal2").title}。${day.meals.find((meal) => meal.id === "meal2").note}</dd></div>
          <div><dt>饮品</dt><dd>${day.drink}</dd></div>
          <div><dt>提醒</dt><dd>${day.small}</dd></div>
        </dl>
      </div>
    </details>`).join("");
}

function renderStats() {
  document.getElementById("roundStat").textContent = state.completedRounds;
  document.getElementById("dayStat").textContent = `D${state.currentDay + 1}`;
}

function renderAll() {
  renderToday();
  renderPlan();
  renderStats();
}

function toggleMeal(id) {
  const checks = getChecks();
  const next = checks.includes(id) ? checks.filter((item) => item !== id) : [...checks, id];
  setChecks(state.currentDay, next);
  renderToday();
  if (navigator.vibrate) navigator.vibrate(12);
}

function completeCurrentDay() {
  if (!["meal1", "meal2"].every((id) => getChecks().includes(id))) return;
  if (state.currentDay < 2) {
    state.currentDay += 1;
    saveState();
    renderAll();
    window.scrollTo({ top: 0, behavior: "smooth" });
    showToast(`Day ${state.currentDay} 完成，进入 Day ${state.currentDay + 1}`);
  } else {
    state.completedRounds += 1;
    state.currentDay = 0;
    state.checks = {};
    saveState();
    renderAll();
    openModal("successModal");
  }
}

function openModal(id) {
  const modal = document.getElementById(id);
  if (id === "settingsModal") {
    document.getElementById("eatingStart").value = state.eatingStart;
    updateWindowPreview(state.eatingStart);
  }
  modal.classList.add("open");
  modal.setAttribute("aria-hidden", "false");
  document.body.style.overflow = "hidden";
  setTimeout(() => modal.querySelector("button, input")?.focus(), 50);
}

function closeModal(id) {
  const modal = document.getElementById(id);
  modal.classList.remove("open");
  modal.setAttribute("aria-hidden", "true");
  document.body.style.overflow = "";
}

function updateWindowPreview(value) {
  document.getElementById("windowPreview").textContent = `${value} — ${addHours(value, 8)}`;
}

function showToast(message) {
  const toast = document.getElementById("toast");
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("show"), 2200);
}

document.querySelectorAll(".nav-item").forEach((button) => {
  button.addEventListener("click", () => {
    document.querySelectorAll(".nav-item").forEach((item) => item.classList.toggle("active", item === button));
    document.querySelectorAll(".view").forEach((view) => view.classList.toggle("active", view.id === button.dataset.view));
    window.scrollTo({ top: 0, behavior: "smooth" });
    document.getElementById(button.dataset.view).focus({ preventScroll: true });
  });
});

document.getElementById("openSettings").addEventListener("click", () => openModal("settingsModal"));
document.getElementById("editWindow").addEventListener("click", () => openModal("settingsModal"));
document.getElementById("completeDay").addEventListener("click", completeCurrentDay);
document.querySelector("[data-close-modal]").addEventListener("click", () => closeModal("settingsModal"));
document.querySelector("[data-close-success]").addEventListener("click", () => closeModal("successModal"));

document.getElementById("eatingStart").addEventListener("input", (event) => updateWindowPreview(event.target.value));
document.getElementById("saveSettings").addEventListener("click", () => {
  state.eatingStart = document.getElementById("eatingStart").value || "12:00";
  saveState();
  renderToday();
  closeModal("settingsModal");
  showToast("进食窗口已更新");
});

document.querySelectorAll(".modal-backdrop").forEach((modal) => {
  modal.addEventListener("click", (event) => {
    if (event.target === modal) closeModal(modal.id);
  });
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") document.querySelectorAll(".modal-backdrop.open").forEach((modal) => closeModal(modal.id));
});

document.getElementById("resetProgress").addEventListener("click", () => {
  if (!window.confirm("确定重置所有轮次和打卡进度吗？进食窗口设置会保留。")) return;
  state = { ...defaultState, eatingStart: state.eatingStart, startedAt: new Date().toISOString() };
  saveState();
  renderAll();
  showToast("进度已重置");
});

setInterval(() => {
  const status = document.getElementById("windowStatus");
  if (status) status.textContent = getWindowStatus();
}, 60000);

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./sw.js", { scope: "./" }).catch(() => {});
  });
}

renderAll();

/* ============================================================
 * NutriFit-Planner UI 主逻辑 / Main UI Logic
 * ============================================================ */
(function () {
"use strict";

var STATE = {
  lang: "zh",
  currency: "CNY",
  step: 1,
  maxStep: 1,
  form: {
    sex: "male", age: 25, heightCm: 172, weight: 75, targetWeight: 66,
    region: "east_asia", activity: 2, exercise: 1,
    isStudent: false, pref: "balanced"
  },
  dangerAck: false,
  checks: [],
  calc: null,
  plans: [],
  selectedPlan: null,
  schedule: null,
  seed: 1,
  ingRegion: "all",
  ingCat: "all"
};

var CUR = {
  CNY: { sym: "¥", rate: 1 },
  USD: { sym: "$", rate: 1 / 7.2 },
  EUR: { sym: "€", rate: 1 / 7.8 }
};

/* ---------- 基础工具 ---------- */
function t(key) {
  var v = I18N[STATE.lang] && I18N[STATE.lang][key];
  return v != null ? v : key;
}
function pickName(obj) {
  if (!obj) return "";
  return obj[STATE.lang] || obj.en || obj.zh || "";
}
function money(cny) {
  var c = CUR[STATE.currency];
  return (STATE.lang === "zh" ? "约" : "") + c.sym + (cny * c.rate).toFixed(2);
}
function esc(s) {
  return String(s == null ? "" : s)
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}
function tagLabel(tag) {
  var key = TAG_KEYS[tag];
  return key ? t(key) : tag;
}
function tagChip(tag) {
  var cls = "chip";
  if (tag === "cheap") cls += " chip-green";
  else if (tag === "nocook" || tag === "microwave" || tag === "student" || tag === "quick") cls += " chip-blue";
  else if (tag === "lowcarb") cls += " chip-orange";
  else if (tag === "highprotein") cls += " chip-red";
  return '<span class="' + cls + '">' + esc(tagLabel(tag)) + "</span>";
}
function aboutDays(de) {
  if (!de) return "—";
  return t("aboutDays").replace("{d}", de.days).replace("{lo}", de.daysLo).replace("{hi}", de.daysHi);
}
function difficultyLabel(n) {
  return n <= 1 ? t("difficultyLow") : (n === 2 ? t("difficultyMid") : t("difficultyHigh"));
}
function speedText(p) {
  var v = p.kgPerWeek.toFixed(2);
  return (p.mode === "gain" ? "+" : "") + v + " " + t("speedUnit");
}

/* ---------- 总体渲染 ---------- */
function renderHeader() {
  document.getElementById("tagline").textContent = t("tagline");
  document.getElementById("lblCurrency").textContent = t("currency");
  document.getElementById("langToggle").textContent = STATE.lang === "zh" ? "English" : "中文";
}

function renderStepper() {
  var items = [t("stepInput"), t("stepResults"), t("stepPlans"), t("stepSchedule")];
  var html = "";
  for (var i = 1; i <= 4; i++) {
    var cls = "step-item";
    if (i === STATE.step) cls += " active";
    else if (i < STATE.step) cls += " done";
    var dis = i <= STATE.maxStep ? "" : " disabled";
    html += '<div class="' + cls + '" data-action="goto-step" data-step="' + i + '"' + dis + '>' +
      '<span class="step-num">' + i + "</span>" +
      '<span class="step-label">' + esc(items[i - 1]) + "</span></div>";
  }
  document.getElementById("stepper").innerHTML = html;
}

function renderFooter() {
  var html = '<div class="footer-inner">' +
    '<p class="footer-brand">🥗 NutriFit-Planner</p>' +
    '<div class="disclaimer"><h4>' + t("disclaimerTitle") + "</h4><ul>";
  for (var i = 1; i <= 7; i++) html += "<li>" + t("dis" + i) + "</li>";
  html += '</ul></div><p class="footer-note">' + t("footerNote") + "</p></div>";
  document.getElementById("footer").innerHTML = html;
}

function renderStep() {
  if (STATE.step === 1) renderInput();
  else if (STATE.step === 2) renderResults();
  else if (STATE.step === 3) renderPlans();
  else renderSchedule();
}

function render() {
  renderHeader();
  renderStepper();
  renderStep();
  renderFooter();
}

function gotoStep(n) {
  if (n < 1 || n > STATE.maxStep) return;
  STATE.step = n;
  closeModal();
  renderStepper();
  renderStep();
  window.scrollTo({ top: 0, behavior: "smooth" });
}

/* ---------- 第 1 步：输入 ---------- */
function renderInput() {
  var f = STATE.form;
  var sel = function (v, val, extra) {
    return v === val ? " selected" : "";
  };
  var chk = function (v, val) { return v === val ? " checked" : ""; };

  var regionOpts = "";
  for (var i = 0; i < REGIONS.length; i++) {
    var r = REGIONS[i];
    var label = pickName(r) + "（" + (STATE.lang === "zh" ? r.countriesZh : r.countriesEn) + "）";
    regionOpts += '<option value="' + r.id + '"' + sel(r.id, f.region) + ">" + esc(label) + "</option>";
  }
  var actOpts = "";
  for (var a = 0; a < Calc.ACTIVITY_LEVELS.length; a++) {
    var al = Calc.ACTIVITY_LEVELS[a];
    actOpts += '<option value="' + al.id + '"' + sel(al.id, f.activity) + ">" + esc(pickName(al)) + "</option>";
  }
  var exOpts = "";
  for (var b = 0; b < Calc.EXERCISE_LEVELS.length; b++) {
    var el = Calc.EXERCISE_LEVELS[b];
    exOpts += '<option value="' + el.id + '"' + sel(el.id, f.exercise) + ">" + esc(pickName(el)) + "</option>";
  }

  var html =
  '<div class="card">' +
    "<h2>📝 " + t("inputTitle") + "</h2>" +
    '<p class="subtitle">' + t("inputSub") + "</p>" +
    '<div class="form-grid">' +
      '<div class="field">' +
        "<label>" + t("sex") + "</label>" +
        '<div class="radio-row">' +
          '<label class="radio-chip"><input type="radio" name="f-sex" value="male"' + chk(f.sex, "male") + "> " + t("male") + "</label>" +
          '<label class="radio-chip"><input type="radio" name="f-sex" value="female"' + chk(f.sex, "female") + "> " + t("female") + "</label>" +
        "</div>" +
      "</div>" +
      '<div class="field">' +
        "<label>" + t("age") + "</label>" +
        '<input type="number" id="f-age" min="15" max="80" step="1" value="' + f.age + '">' +
        '<span class="hint">' + t("ageHint") + "</span>" +
      "</div>" +
      '<div class="field">' +
        "<label>" + t("height") + "</label>" +
        '<input type="number" id="f-height" min="120" max="230" step="0.1" value="' + f.heightCm + '">' +
        '<span class="hint">' + t("heightHint") + "</span>" +
      "</div>" +
      '<div class="field">' +
        "<label>" + t("weight") + "</label>" +
        '<input type="number" id="f-weight" min="30" max="300" step="0.1" value="' + f.weight + '">' +
        '<span class="hint">' + t("weightHint") + "</span>" +
      "</div>" +
      '<div class="field">' +
        "<label>" + t("targetWeight") + "</label>" +
        '<input type="number" id="f-target" min="25" max="300" step="0.1" value="' + f.targetWeight + '">' +
        '<span class="hint">' + t("targetWeightHint") + "</span>" +
      "</div>" +
      '<div class="field field-wide">' +
        "<label>" + t("region") + "</label>" +
        '<select id="f-region">' + regionOpts + "</select>" +
      "</div>" +
      '<div class="field">' +
        "<label>" + t("activity") + "</label>" +
        '<select id="f-activity">' + actOpts + "</select>" +
        '<span class="hint">' + t("activityHint") + "</span>" +
      "</div>" +
      '<div class="field">' +
        "<label>" + t("exercise") + "</label>" +
        '<select id="f-exercise">' + exOpts + "</select>" +
        '<span class="hint">' + t("exerciseHint") + "</span>" +
      "</div>" +
      '<div class="field field-wide">' +
        "<label>" + t("pref") + "</label>" +
        '<div class="radio-row">' +
          '<label class="radio-chip"><input type="radio" name="f-pref" value="fast"' + chk(f.pref, "fast") + "> " + t("prefFast") + "</label>" +
          '<label class="radio-chip"><input type="radio" name="f-pref" value="balanced"' + chk(f.pref, "balanced") + "> " + t("prefBalanced") + "</label>" +
          '<label class="radio-chip"><input type="radio" name="f-pref" value="budget"' + chk(f.pref, "budget") + "> " + t("prefBudget") + "</label>" +
        "</div>" +
      "</div>" +
      '<div class="field field-wide">' +
        '<div class="checkbox-row">' +
          '<input type="checkbox" id="f-student"' + (f.isStudent ? " checked" : "") + ">" +
          "<label>" + t("student") + "</label>" +
        "</div>" +
        '<span class="hint">' + t("studentHint") + "</span>" +
      "</div>" +
    "</div>" +
    '<div id="warnArea"></div>' +
    '<div id="errArea"></div>' +
    '<div class="step-actions">' +
      "<span></span>" +
      '<button class="btn btn-primary" id="btnSubmit" data-action="submit">' + t("submit") + "</button>" +
    "</div>" +
  "</div>";

  document.getElementById("sec-input").innerHTML = html;
  document.getElementById("sec-results").hidden = true;
  document.getElementById("sec-plans").hidden = true;
  document.getElementById("sec-schedule").hidden = true;
  document.getElementById("sec-input").hidden = false;

  updateFormVisuals();
  updateWarnings();
}

function saveFormFromDom() {
  var f = STATE.form;
  var g = function (sel, def) {
    var el = document.querySelector(sel);
    return el ? el.value : def;
  };
  f.sex = g('#sec-input input[name="f-sex"]:checked', f.sex);
  f.age = parseFloat(g("#f-age", f.age));
  f.heightCm = parseFloat(g("#f-height", f.heightCm));
  f.weight = parseFloat(g("#f-weight", f.weight));
  f.targetWeight = parseFloat(g("#f-target", f.targetWeight));
  f.region = g("#f-region", f.region);
  f.activity = parseInt(g("#f-activity", f.activity), 10);
  f.exercise = parseInt(g("#f-exercise", f.exercise), 10);
  f.pref = g('#sec-input input[name="f-pref"]:checked', f.pref);
  var st = document.getElementById("f-student");
  if (st) f.isStudent = st.checked;
}

function updateFormVisuals() {
  var radios = document.querySelectorAll("#sec-input input[type=radio]");
  for (var i = 0; i < radios.length; i++) {
    var wrap = radios[i].closest(".radio-chip");
    if (wrap) {
      if (radios[i].checked) wrap.classList.add("checked");
      else wrap.classList.remove("checked");
    }
  }
}

function syncSubmit() {
  var btn = document.getElementById("btnSubmit");
  if (!btn) return;
  btn.disabled = Calc.hasDanger(STATE.checks) && !STATE.dangerAck;
}

function updateWarnings() {
  var box = document.getElementById("warnArea");
  if (!box) return;
  var f = STATE.form;
  var valid = !isNaN(f.age) && !isNaN(f.heightCm) && !isNaN(f.weight) && !isNaN(f.targetWeight) &&
    f.age >= 15 && f.age <= 80 && f.heightCm >= 120 && f.heightCm <= 230 &&
    f.weight >= 30 && f.weight <= 300 && f.targetWeight >= 25 && f.targetWeight <= 300;
  if (!valid) {
    box.innerHTML = "";
    STATE.checks = [];
    syncSubmit();
    return;
  }
  var checks = Calc.targetChecks(f);
  STATE.checks = checks;
  var html = "";
  var danger = [], others = [];
  for (var i = 0; i < checks.length; i++) {
    (checks[i].level === "danger" ? danger : others).push(checks[i]);
  }
  var mode = f.targetWeight > f.weight ? "gain" : "loss";
  if (f.targetWeight === f.weight) {
    html += '<div class="warn-box warn-warn"><p>' + t("errTargetEqual") + "</p></div>";
  } else {
    html += '<div class="warn-box warn-info"><p>' +
      (mode === "gain" ? "🥩 " + t("modeGain") : "🔥 " + t("modeLoss")) + "</p></div>";
  }
  if (danger.length) {
    html += '<div class="warn-box warn-danger"><p><b>' + t("warnTitle") + "</b></p>";
    for (var d = 0; d < danger.length; d++) html += "<p>" + t(danger[d].key) + "</p>";
    html += '<label class="ack"><input type="checkbox" id="f-ack"' +
      (STATE.dangerAck ? " checked" : "") + "> " + t("dangerAck") + "</label></div>";
  }
  for (var o = 0; o < others.length; o++) {
    html += '<div class="warn-box ' + (others[o].level === "warn" ? "warn-warn" : "warn-info") +
      '"><p>' + t(others[o].key) + "</p></div>";
  }
  var tb = Calc.bmi(f.targetWeight, f.heightCm);
  var cat = Calc.bmiCategory(tb, STATE.lang);
  html += '<div class="warn-box warn-info"><p>' + t("targetWeight") + " BMI：<b>" + tb.toFixed(1) +
    "</b>（" + pickName(cat) + "）</p></div>";
  box.innerHTML = html;
  syncSubmit();
}

function validateForm() {
  var f = STATE.form;
  if (isNaN(f.age) || f.age < 15 || f.age > 80) return t("errAge");
  if (isNaN(f.heightCm) || f.heightCm < 120 || f.heightCm > 230) return t("errHeight");
  if (isNaN(f.weight) || f.weight < 30 || f.weight > 300) return t("errWeight");
  if (isNaN(f.targetWeight) || f.targetWeight < 25 || f.targetWeight > 300) return t("errTarget");
  if (f.targetWeight === f.weight) return t("errTargetEqual");
  if (Calc.hasDanger(STATE.checks) && !STATE.dangerAck) return t("errAck");
  return null;
}

function compute() {
  var f = STATE.form;
  var bmiV = Calc.bmi(f.weight, f.heightCm);
  var bf = Calc.bodyFatPct(f.sex, f.age, bmiV);
  var bmr = Calc.bmrMifflin(f.sex, f.age, f.heightCm, f.weight);
  var act = null, ex = null;
  for (var i = 0; i < Calc.ACTIVITY_LEVELS.length; i++) if (Calc.ACTIVITY_LEVELS[i].id === f.activity) act = Calc.ACTIVITY_LEVELS[i];
  for (var j = 0; j < Calc.EXERCISE_LEVELS.length; j++) if (Calc.EXERCISE_LEVELS[j].id === f.exercise) ex = Calc.EXERCISE_LEVELS[j];
  var tdee = Calc.tdee(bmr, act.mult, ex.mid);
  var mode = f.targetWeight > f.weight ? "gain" : "loss";
  var lo, hi;
  if (mode === "gain") {
    /* 增肌：热量盈余区间 */
    lo = tdee + 200;
    hi = tdee + 500;
  } else {
    lo = Math.max(Calc.MIN_INTAKE[f.sex], bmr, tdee - 750);
    hi = Math.max(lo, tdee - 250);
  }
  var gapKg = Math.abs(f.targetWeight - f.weight);
  STATE.calc = {
    mode: mode,
    bmi: bmiV,
    bmiCat: Calc.bmiCategory(bmiV, STATE.lang),
    bf: bf,
    bfCat: Calc.bodyFatCategory(f.sex, bf),
    bmr: bmr,
    act: act,
    ex: ex,
    tdee: tdee,
    intakeLo: lo,
    intakeHi: hi,
    gap: gapKg * 7700,
    gapKg: gapKg
  };
  STATE.plans = [];
  STATE.selectedPlan = null;
  STATE.schedule = null;
}

/* ---------- 第 2 步：计算结果 ---------- */
function renderResults() {
  var f = STATE.form;
  var c = STATE.calc;
  if (!c) { gotoStep(1); return; }
  var gainMode = c.mode === "gain";

  var metric = function (label, value, sub, hl) {
    return '<div class="metric-card' + (hl ? " hl" : "") + '">' +
      '<div class="m-label">' + label + "</div>" +
      '<div class="m-value">' + value + "</div>" +
      '<div class="m-sub">' + sub + "</div></div>";
  };

  var bfRange = (c.bf - 4).toFixed(1) + "% – " + (c.bf + 4).toFixed(1) + "%";
  var grid = "";
  grid += metric(t("bmi"), c.bmi.toFixed(1) + "（" + pickName(c.bmiCat) + "）",
    t("bmiSub").replace("{h}", f.heightCm).replace("{w}", f.weight));
  grid += metric(t("bodyFat"), c.bf.toFixed(1) + "%", t("bfRange") + " · " + pickName(c.bfCat), true);
  grid += metric(t("bmr"), c.bmr.toLocaleString() + " " + t("kcal"), t("bmrSub"));
  grid += metric(t("tdee"), c.tdee.toLocaleString() + " " + t("kcal"), t("tdeeSub"));
  grid += metric(t("intakeRange"), c.intakeLo.toLocaleString() + " – " + c.intakeHi.toLocaleString() + " " + t("kcal"),
    gainMode ? t("intakeSubGain") : t("intakeSub"), true);
  grid += metric(gainMode ? t("gapGain") : t("gapLoss"), Math.round(c.gap).toLocaleString() + " " + t("kcal"),
    t("gapSub").replace("{kg}", c.gapKg.toFixed(1)));

  var w = f.weight;
  var pLo = Math.round((gainMode ? 1.8 : 1.6) * w), pHi = Math.round((gainMode ? 2.4 : 2.2) * w);
  var fLo = Math.round(0.8 * w), fHi = Math.round(1.0 * w);
  var mid = gainMode ? c.tdee + 350 : Math.max(Calc.MIN_INTAKE[f.sex], c.tdee - 500);
  var cLo = Math.max(0, Math.round((mid - 4 * pHi - 9 * fHi) / 4));
  var cHi = Math.max(cLo, Math.round((mid - 4 * pLo - 9 * fLo) / 4));

  var macroRows = "";
  macroRows += macroRow(t("protein"), pLo + " – " + pHi);
  macroRows += macroRow(t("fat"), fLo + " – " + fHi);
  macroRows += macroRow(t("carbs"), cLo + " – " + cHi);

  var html =
  '<div class="card">' +
    "<h2>📊 " + t("resultsTitle") + "</h2>" +
    '<p class="subtitle">' + t("resultsSub") + "</p>" +
    '<div><span class="chip ' + (gainMode ? "chip-orange" : "chip-green") + '">' +
      (gainMode ? "🥩 " + t("modeGain") : "🔥 " + t("modeLoss")) + "</span></div>" +
    '<div class="result-grid">' + grid + "</div>" +
    '<div class="card sub-card" style="margin-top:18px">' +
      "<h3>" + t("macroTitle") + "</h3>" +
      '<table class="data">' +
        "<thead><tr><th>" + t("macroTitle") + "</th><th class=\"num\">" + t("perDayG") + "</th></tr></thead>" +
        "<tbody>" + macroRows + "</tbody>" +
      "</table>" +
      '<p class="subtitle" style="margin-top:10px">' + (gainMode ? t("macroNoteGain") : t("macroNote")) + "</p>" +
    "</div>" +
    '<details class="ing-browser">' +
      "<summary>🧺 " + t("ingBrowser") + "</summary>" +
      '<div class="ing-toolbar">' +
        "<label>" + t("ingRegion") + " " +
          '<select id="ingRegionSel"><option value="all">' + t("ingAll") + "</option>" +
            ingRegionOpts() +
          "</select></label>" +
        "<label>" + t("ingCat") + " " +
          '<select id="ingCatSel"><option value="all">' + t("ingAll") + "</option>" +
            ingCatOpts() +
          "</select></label>" +
      "</div>" +
      '<div class="ing-table-wrap">' +
        '<table class="data">' +
          "<thead><tr><th>" + t("ingColName") + "</th><th class=\"num\">" + t("ingColKcal") +
          '</th><th class="num">' + t("ingColPrice") + "</th></tr></thead>" +
          '<tbody id="ingTableBody"></tbody>' +
        "</table>" +
      "</div>" +
    "</details>" +
    '<details class="ing-browser">' +
      "<summary>🧮 " + t("formulaTitle") + "</summary>" +
      '<p class="subtitle" style="margin-top:8px">' + t("formulaText") + "</p>" +
    "</details>" +
    '<div class="step-actions">' +
      '<button class="btn btn-ghost" data-action="goto-step" data-step="1">← ' + t("btnBack") + "</button>" +
      '<button class="btn btn-primary" data-action="to-plans">' + t("btnToPlans") + "</button>" +
    "</div>" +
  "</div>";

  document.getElementById("sec-input").hidden = true;
  document.getElementById("sec-results").innerHTML = html;
  document.getElementById("sec-results").hidden = false;
  document.getElementById("sec-plans").hidden = true;
  document.getElementById("sec-schedule").hidden = true;
  renderIngTable();
}

function macroRow(name, range) {
  return "<tr><td>" + name + '</td><td class="num hl-cell">' + range + " " + t("perDayG") + "</td></tr>";
}

function ingRegionOpts() {
  var html = "";
  for (var i = 0; i < REGIONS.length; i++) {
    html += '<option value="' + REGIONS[i].id + '">' + esc(pickName(REGIONS[i])) + "</option>";
  }
  return html;
}
function ingCatOpts() {
  var html = "";
  for (var i = 0; i < ING_CAT_ORDER.length; i++) {
    var id = ING_CAT_ORDER[i];
    html += '<option value="' + id + '">' + esc(pickName(ING_CATS[id])) + "</option>";
  }
  return html;
}

function renderIngTable() {
  var body = document.getElementById("ingTableBody");
  if (!body) return;
  var rows = [];
  for (var id in ING) {
    var ing = ING[id];
    if (STATE.ingCat !== "all" && ing.cat !== STATE.ingCat) continue;
    if (STATE.ingRegion !== "all" && ing.regions.indexOf(STATE.ingRegion) === -1) continue;
    rows.push({ id: id, ing: ing });
  }
  rows.sort(function (a, b) {
    var ca = ING_CAT_ORDER.indexOf(a.ing.cat), cb = ING_CAT_ORDER.indexOf(b.ing.cat);
    if (ca !== cb) return ca - cb;
    return pickName(a.ing).localeCompare(pickName(b.ing), STATE.lang);
  });
  var html = "";
  for (var i = 0; i < rows.length; i++) {
    var ing = rows[i].ing;
    html += "<tr><td>" + esc(pickName(ing)) +
      ' <span class="chip">' + esc(pickName(ING_CATS[ing.cat])) + "</span></td>" +
      '<td class="num">' + ing.kcal + '</td>' +
      '<td class="num">' + money(ing.price) + "</td></tr>";
  }
  body.innerHTML = html;
}

/* ---------- 第 3 步：方案 ---------- */
function renderPlans() {
  var f = STATE.form;
  if (!STATE.plans.length) {
    STATE.plans = Planner.generatePlans(f, STATE.calc);
  }
  var gainMode = STATE.plans.length ? STATE.plans[0].mode === "gain" : false;
  var cards = "";
  for (var i = 0; i < STATE.plans.length; i++) {
    cards += planCardHTML(STATE.plans[i]);
  }

  var rows = "";
  for (var j = 0; j < STATE.plans.length; j++) {
    var p = STATE.plans[j];
    rows += "<tr" + (p.recommended ? ' class="selected-row"' : "") + ">" +
      "<td>" + p.type.icon + " " + esc(pickName(p.type)) +
      (p.recommended ? ' <span class="badge badge-green">' + t("recommended") + "</span>" : "") + "</td>" +
      '<td class="num">' + p.intake.toLocaleString() + " " + t("kcal") + "</td>" +
      '<td class="num">' + money(p.dailyCost) + "</td>" +
      '<td class="num">' + aboutDays(p.days) + "</td>" +
      '<td class="num">' + money(p.totalCost) + "</td>" +
      '<td class="num">' + speedText(p) + "</td>" +
      "<td>" + difficultyLabel(p.type.difficulty) + "</td></tr>";
  }

  var intakes = {};
  for (var k = 0; k < STATE.plans.length; k++) intakes[STATE.plans[k].intake] = 1;
  var collapseNote = Object.keys(intakes).length <= 3
    ? '<div class="warn-box warn-info"><p>' + t("plansCollapseNote") + "</p></div>"
    : "";

  var html =
  '<div class="card">' +
    "<h2>🍽️ " + t("plansTitle") + "</h2>" +
    '<p class="subtitle">' + t("plansSub") + "</p>" +
    collapseNote +
    '<div class="plan-grid">' + cards + "</div>" +
  "</div>" +
  '<div class="card">' +
    "<h3>📋 " + t("compareTitle") + "</h3>" +
    '<div class="table-wrap"><table class="data">' +
      "<thead><tr>" +
        "<th>" + t("thPlan") + "</th>" +
        '<th class="num">' + t("thKcal") + "</th>" +
        '<th class="num">' + t("thCost") + "</th>" +
        '<th class="num">' + t("thDays") + "</th>" +
        '<th class="num">' + t("thTotal") + "</th>" +
        '<th class="num">' + (gainMode ? t("thSpeedGain") : t("thSpeedLoss")) + "</th>" +
        "<th>" + t("thDifficulty") + "</th>" +
      "</tr></thead><tbody>" + rows + "</tbody>" +
    "</table></div>" +
    '<p class="subtitle" style="margin-top:10px">' + t("compareNote") + " " + t("currencyNote") + "</p>" +
    '<div class="step-actions">' +
      '<button class="btn btn-ghost" data-action="goto-step" data-step="2">← ' + t("btnBack") + "</button>" +
      '<span class="subtitle">' + t("choose") + "</span>" +
    "</div>" +
  "</div>";

  document.getElementById("sec-input").hidden = true;
  document.getElementById("sec-results").hidden = true;
  document.getElementById("sec-plans").innerHTML = html;
  document.getElementById("sec-plans").hidden = false;
  document.getElementById("sec-schedule").hidden = true;
}

function planCardHTML(p) {
  var type = p.type;
  var gain = p.mode === "gain";
  var feats = "";
  for (var i = 0; i < type.features.length; i++) feats += tagChip(type.features[i]);
  var pros = "";
  var prosList = STATE.lang === "zh"
    ? (gain ? type.gainProsZh : type.prosZh)
    : (gain ? type.gainProsEn : type.prosEn);
  var consList = STATE.lang === "zh"
    ? (gain ? type.gainConsZh : type.consZh)
    : (gain ? type.gainConsEn : type.consEn);
  for (var j = 0; j < prosList.length; j++) pros += "<li>" + esc(prosList[j]) + "</li>";
  var cons = "";
  for (var k = 0; k < consList.length; k++) cons += "<li>" + esc(consList[k]) + "</li>";
  var day = p.preview.days[0];
  var sample = "<b>" + t("sampleMeals") + "</b>：" +
    esc(pickName(day.breakfast)) + " · " + esc(pickName(day.lunch)) + " · " + esc(pickName(day.dinner));

  return '<div class="plan-card' + (p.recommended ? " recommended" : "") +
    '" style="border-top-color:' + type.color + '">' +
    '<div class="plan-head">' +
      '<span class="plan-icon">' + type.icon + "</span>" +
      "<h3>" + esc(pickName(type)) + "</h3>" +
      (p.recommended ? '<span class="badge badge-green">' + t("recommended") + "</span>" : "") +
    "</div>" +
    "<div>" +
      '<span class="chip ' + (gain ? "chip-orange" : "chip-green") + '">' +
        (gain ? "🥩 " + t("modeGainShort") : "🔥 " + t("modeLossShort")) + "</span>" +
      feats +
    "</div>" +
    '<p class="plan-desc">' + esc(STATE.lang === "zh"
      ? (gain ? type.gainDescZh : type.descZh)
      : (gain ? type.gainDescEn : type.descEn)) + "</p>" +
    '<div class="plan-stats">' +
      '<div class="stat"><b>' + p.intake.toLocaleString() + " " + t("kcal") + "</b><span>" + t("statIntake") + "</span></div>" +
      '<div class="stat"><b>' + money(p.dailyCost) + "</b><span>" + t("statCost") + "</span></div>" +
      '<div class="stat"><b>' + aboutDays(p.days) + "</b><span>" + t("statDays") + "</span></div>" +
      '<div class="stat"><b>' + money(p.totalCost) + "</b><span>" + t("statTotal") + "</span></div>" +
    "</div>" +
    '<div class="plan-macros">' +
      t("protein") + " " + p.macros.protein + "g · " + t("fat") + " " + p.macros.fat + "g · " +
      t("carbs") + " " + p.macros.carbs + "g · " +
      (gain ? t("statSpeedGain") : t("statSpeedLoss")) + " " + speedText(p) +
      " · " + difficultyLabel(type.difficulty) +
    "</div>" +
    (p.exerciseReq > 0
      ? '<div class="plan-macros">🏃 ' + t("fastExerciseNote").replace("{x}", p.exerciseReq) + "</div>"
      : "") +
    '<div><b>' + t("pros") + "</b><ul class=\"plan-pros\">" + pros + "</ul></div>" +
    '<div><b>' + t("cons") + "</b><ul class=\"plan-cons\">" + cons + "</ul></div>" +
    '<p class="plan-sample">' + sample + "</p>" +
    '<button class="btn btn-primary btn-wide" data-action="choose-plan" data-plan="' + type.id + '">' +
      t("choose") + "</button>" +
  "</div>";
}

/* ---------- 第 4 步：日程 ---------- */
function renderSchedule() {
  var sch = STATE.schedule, plan = STATE.selectedPlan;
  if (!sch || !plan) { gotoStep(3); return; }

  var weekdays = t("weekdays");
  var rows = "";
  for (var i = 0; i < sch.days.length; i++) {
    var d = sch.days[i];
    rows += "<tr>" +
      '<td class="day-col">' + esc(weekdays[i]) + "</td>" +
      "<td>" + dishCellHTML(d.breakfast) + "</td>" +
      "<td>" + dishCellHTML(d.lunch) + "</td>" +
      "<td>" + dishCellHTML(d.dinner) + "</td>" +
      "<td>" + dishCellHTML(d.snack) + (d.snack2 ? dishCellHTML(d.snack2) : "") + "</td>" +
      '<td class="num"><b>' + d.kcal.toLocaleString() + " " + t("kcal") + "</b>" +
        '<div class="dish-meta">P ' + d.protein + "g · F " + d.fat + "g · C " + d.carbs + "g</div>" +
        '<div class="dish-meta">' + money(d.cost) + "</div></td>" +
      "</tr>";
  }

  var notes = scheduleNotes(sch);
  var notesHtml = "";
  for (var n = 0; n < notes.length; n++) notesHtml += "<li>" + notes[n] + "</li>";

  var html =
  '<div class="card">' +
    "<h2>📅 " + t("schedTitle") + "</h2>" +
    '<p class="subtitle">' + t("schedSub") + "</p>" +
    '<div class="sched-summary">' +
      '<span class="chip chip-green">🎯 ' + t("summaryIntake") + "：" + plan.intake.toLocaleString() + " " + t("kcal") + "</span>" +
      '<span class="chip">💰 ' + t("summaryCost") + "：" + money(sch.avgCost) + "</span>" +
      '<span class="chip">📆 ' + t("summaryDays") + "：" + aboutDays(plan.days) + "</span>" +
      '<span class="chip">⚖️ ' + (plan.mode === "gain" ? t("summarySpeedGain") : t("summarySpeedLoss")) + "：" + speedText(plan) + "</span>" +
      (plan.exerciseReq > 0
        ? '<span class="chip chip-orange">🏃 ' + t("fastExerciseNote").replace("{x}", plan.exerciseReq) + "</span>"
        : "") +
    "</div>" +
    '<div class="table-wrap"><table class="data sched-table">' +
      "<thead><tr>" +
        "<th>" + t("thDay") + "</th>" +
        "<th>" + t("thBreakfast") + "</th>" +
        "<th>" + t("thLunch") + "</th>" +
        "<th>" + t("thDinner") + "</th>" +
        "<th>" + t("thSnack") + "</th>" +
        '<th class="num">' + t("thTotal") + "</th>" +
      "</tr></thead>" +
      "<tbody>" + rows + "</tbody>" +
      "<tfoot>" +
        "<tr><td>" + t("avgRow") + '</td><td colspan="4"></td>' +
          '<td class="num">' + sch.avgKcal.toLocaleString() + " " + t("kcal") +
            '<div class="dish-meta">P ' + sch.avgProtein + "g · F " + sch.avgFat + "g · C " + sch.avgCarbs +
            "g · " + money(sch.avgCost) + "</div></td></tr>" +
        "<tr><td>" + t("targetRow") + '</td><td colspan="4"></td>' +
          '<td class="num">' + sch.targetKcal.toLocaleString() + " " + t("kcal") +
            '<div class="dish-meta">P ' + sch.targetProtein + "g · F " + sch.targetFat + "g · C " +
            sch.targetCarbs + "g</div></td></tr>" +
      "</tfoot>" +
    "</table></div>" +
    '<div class="sched-notes"><b>💡 ' + t("notesTitle") + "</b><ul>" + notesHtml + "</ul></div>" +
    '<div class="step-actions">' +
      '<div style="display:flex;gap:10px;flex-wrap:wrap">' +
        '<button class="btn btn-ghost" data-action="edit-data">← ' + t("editData") + "</button>" +
        '<button class="btn btn-ghost" data-action="change-plan">← ' + t("changePlan") + "</button>" +
      "</div>" +
      '<div style="display:flex;gap:10px;flex-wrap:wrap">' +
        '<button class="btn btn-ghost" data-action="export">' + t("export") + "</button>" +
        '<button class="btn btn-primary" data-action="regenerate">' + t("regenerate") + "</button>" +
      "</div>" +
    "</div>" +
  "</div>";

  document.getElementById("sec-input").hidden = true;
  document.getElementById("sec-results").hidden = true;
  document.getElementById("sec-plans").hidden = true;
  document.getElementById("sec-schedule").innerHTML = html;
  document.getElementById("sec-schedule").hidden = false;
}

function dishCellHTML(item) {
  return '<div class="dish" data-action="open-dish" data-id="' + esc(item.id) + '">' +
    '<div class="dish-name">' + esc(pickName(item)) + "</div>" +
    '<div class="dish-meta">' + item._kcal + " " + t("kcal") + " · " + money(item._cost) + "</div>" +
    '<div class="dish-tags">' +
      (item._scaled ? '<span class="chip chip-orange">×' + item._scaled + "</span>" : "") +
      (item.tags || []).slice(0, 2).map(tagChip).join("") +
    "</div>" +
  "</div>";
}

function scheduleNotes(sch) {
  var notes = [];
  var diff = Math.abs(sch.avgKcal - sch.targetKcal);
  if (diff <= 120) notes.push(t("noteOk"));
  else if (sch.avgKcal > sch.targetKcal) notes.push(t("noteKcalHigh").replace("{x}", diff));
  else notes.push(t("noteKcalLow").replace("{x}", diff));
  var pDiff = sch.targetProtein - sch.avgProtein;
  if (pDiff > 10) notes.push(t("noteProteinLow").replace("{x}", pDiff));
  if (sch.warnings.indexOf("reuse") !== -1) notes.push(t("noteReuse"));
  if (sch.warnings.indexOf("nofood") !== -1) notes.push(t("noteNofood"));
  return notes;
}

/* ---------- 菜品详情弹窗 ---------- */
function snackMetrics(sn) {
  var kcal = 0, cost = 0, p = 0, f = 0, c = 0;
  for (var i = 0; i < sn.ing.length; i++) {
    var id = sn.ing[i][0], g = sn.ing[i][1];
    if (!ING[id]) continue;
    kcal += g / 100 * ING[id].kcal;
    cost += g / 100 * ING[id].price;
    var m = (ING_MACROS && ING_MACROS[id]) || { p: 0, f: 0, c: 0 };
    p += g / 100 * m.p; f += g / 100 * m.f; c += g / 100 * m.c;
  }
  return { kcal: Math.round(kcal), cost: cost, p: Math.round(p), f: Math.round(f), c: Math.round(c) };
}

function openModal(id) {
  var item = null;
  if (STATE.schedule && STATE.schedule.dishes && STATE.schedule.dishes[id]) {
    item = STATE.schedule.dishes[id];
  } else {
    var all = Planner.buildAll();
    for (var i = 0; i < all.length; i++) if (all[i].id === id) { item = all[i]; break; }
    if (!item) {
      for (var j = 0; j < Planner.SNACKS.length; j++) if (Planner.SNACKS[j].id === id) { item = Planner.SNACKS[j]; break; }
    }
  }
  if (!item) return;

  var kcal, cost, p, f, c;
  if (item._kcal != null) {
    kcal = item._kcal; cost = item._cost; p = item._p; f = item._f; c = item._c;
  } else {
    var m = snackMetrics(item);
    kcal = m.kcal; cost = m.cost; p = m.p; f = m.f; c = m.c;
  }

  var ingRows = "";
  for (var k = 0; k < item.ing.length; k++) {
    var id2 = item.ing[k][0], g = item.ing[k][1];
    var ing = ING[id2];
    if (!ing) continue;
    ingRows += "<tr><td>" + esc(pickName(ing)) + " × " + g + t("modalGrams") + "</td>" +
      '<td class="num">' + Math.round(g / 100 * ing.kcal) + " " + t("kcal") + "</td>" +
      '<td class="num">' + money(g / 100 * ing.price) + "</td></tr>";
  }

  var html =
  '<div class="modal-head"><h3>' + esc(pickName(item)) +
    ' <button class="modal-close" data-action="close-modal">×</button></h3></div>' +
  '<div class="modal-body">' +
    '<div class="modal-meta">' +
      "<span>🔥 <b>" + kcal + "</b> " + t("kcal") + "</span>" +
      "<span>💰 <b>" + money(cost) + "</b></span>" +
      (item.min ? "<span>⏱ <b>" + item.min + "</b> " + t("modalMinUnit") + "</span>" : "") +
      '<span>P ' + p + "g · F " + f + "g · C " + c + "g</span>" +
    "</div>" +
    (item.tags && item.tags.length ? "<div>" + item.tags.map(tagChip).join("") + "</div>" : "") +
    (item._scaled
      ? '<div style="margin-top:6px"><span class="chip chip-orange">' + t("scaledNote").replace("{x}", item._scaled) + "</span></div>"
      : "") +
    "<h4 style=\"margin:14px 0 6px\">🧺 " + t("modalIng") + "</h4>" +
    '<table class="data">' +
      "<thead><tr><th>" + t("modalIng") + "</th><th class=\"num\">" + t("kcal") +
      '</th><th class="num">' + t("modalCost") + "</th></tr></thead>" +
      "<tbody>" + ingRows + "</tbody>" +
    "</table>" +
    howBlock(item) +
  "</div>";

  var box = document.getElementById("modalBox");
  box.innerHTML = html;
  document.getElementById("modalOverlay").hidden = false;
}

/* 做法区块：优先展示分步骤菜谱，无步骤时回退到一句话做法 */
function howBlock(item) {
  var steps = STATE.lang === "zh" ? item.steps_zh : item.steps_en;
  if (steps && steps.length) {
    var html = '<div class="modal-steps"><b>👨‍🍳 ' + t("modalHow") + "</b><ol>";
    for (var i = 0; i < steps.length; i++) html += "<li>" + esc(steps[i]) + "</li>";
    html += "</ol></div>";
    return html;
  }
  return '<p class="modal-how"><b>👩‍🍳 ' + t("modalHow") + "：</b>" +
    esc((STATE.lang === "zh" ? item.how_zh : item.how_en) || t("snackNoCook")) + "</p>";
}

function closeModal() {
  document.getElementById("modalOverlay").hidden = true;
}

/* ---------- Excel 导出（.xlsx：行=餐次，列=周一到周日） ---------- */
function exportXLSX() {
  var sch = STATE.schedule, plan = STATE.selectedPlan;
  if (!sch || !plan) return;
  var weekdays = t("weekdays");
  var meals = [
    { key: "breakfast", label: t("thBreakfast") },
    { key: "lunch", label: t("thLunch") },
    { key: "dinner", label: t("thDinner") },
    { key: "snack", label: t("thSnack") }
  ];
  function dishText(item) {
    if (!item) return "";
    var extra = item._scaled ? "（×" + item._scaled + "）" : "";
    return pickName(item) + extra + "\n" + item._kcal + " " + t("kcal") + " · " + money(item._cost);
  }
  var rows = [];
  /* 标题 + 摘要（合并单元格） */
  rows.push({ cells: [{ t: t("schedTitle") + " · " + pickName(plan.type), s: 5 }], h: 30 });
  rows.push({ cells: [{ t: t("summaryIntake") + "：" + plan.intake.toLocaleString() + " " + t("kcal") +
    "　　" + t("summaryCost") + "：" + money(sch.avgCost) +
    "　　" + t("summaryDays") + "：" + aboutDays(plan.days), s: 0 }], h: 20 });
  rows.push({ cells: [{ t: "" }], h: 6 });
  /* 表头：餐次 + 周一~周日 + 周均 */
  var head = [{ t: t("thDay"), s: 1 }];
  for (var w = 0; w < 7; w++) head.push({ t: weekdays[w], s: 1 });
  head.push({ t: t("avgRow"), s: 1 });
  rows.push({ cells: head, h: 26 });
  /* 四个餐次行 */
  for (var m = 0; m < meals.length; m++) {
    var cells = [{ t: meals[m].label, s: 2 }];
    var sum = 0;
    for (var d = 0; d < 7; d++) {
      var item = sch.days[d][meals[m].key];
      var item2 = meals[m].key === "snack" ? sch.days[d].snack2 : null;
      var txt = dishText(item);
      if (item2) txt += "\n+ " + dishText(item2);
      cells.push({ t: txt, s: 3 });
      sum += item._kcal + (item2 ? item2._kcal : 0);
    }
    cells.push({ t: Math.round(sum / 7) + " " + t("kcal"), s: 4 });
    rows.push({ cells: cells, h: 52 });
  }
  /* 全天热量 / 全天成本 两行合计 */
  var kcalCells = [{ t: t("xlSumKcal"), s: 2 }];
  for (var d2 = 0; d2 < 7; d2++) kcalCells.push({ t: sch.days[d2].kcal.toLocaleString(), s: 4 });
  kcalCells.push({ t: sch.avgKcal.toLocaleString(), s: 4 });
  rows.push({ cells: kcalCells, h: 22 });
  var costCells = [{ t: t("xlSumCost"), s: 2 }];
  for (var d3 = 0; d3 < 7; d3++) costCells.push({ t: money(sch.days[d3].cost), s: 4 });
  costCells.push({ t: money(sch.avgCost), s: 4 });
  rows.push({ cells: costCells, h: 22 });
  /* 备注 */
  rows.push({ cells: [{ t: t("xlNote"), s: 0 }], h: 18 });

  var merges = ["A1:I1", "A2:I2", "A3:I3", "A" + rows.length + ":I" + rows.length];
  var cols = [{ w: 11 }];
  for (var cw = 0; cw < 7; cw++) cols.push({ w: 26 });
  cols.push({ w: 13 });

  var data = XLSX.build({
    sheetName: t("xlSheetName"),
    cols: cols,
    rows: rows,
    merges: merges
  });

  var blob = new Blob([data], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
  var dt = new Date();
  var stamp = dt.getFullYear() + String(dt.getMonth() + 1).padStart(2, "0") + String(dt.getDate()).padStart(2, "0");
  var a = document.createElement("a");
  a.download = "NutriFit-Plan_" + stamp + ".xlsx";
  if (typeof URL !== "undefined" && URL.createObjectURL) {
    a.href = URL.createObjectURL(blob);
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  } else {
    /* 回退：data URI（兼容旧浏览器/jsdom 测试环境） */
    var reader = new FileReader();
    reader.onload = function () {
      a.href = "data:application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;base64," +
        String(reader.result).split(",")[1];
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    };
    reader.readAsDataURL(blob);
  }
}

/* ---------- 事件绑定 ---------- */
document.addEventListener("click", function (e) {
  if (e.target.closest("#langToggle")) {
    STATE.lang = STATE.lang === "zh" ? "en" : "zh";
    document.documentElement.lang = STATE.lang === "zh" ? "zh-CN" : "en";
    render();
    return;
  }
  if (e.target.classList.contains("modal-overlay")) {
    closeModal();
    return;
  }
  var el = e.target.closest("[data-action]");
  if (!el) return;
  var action = el.getAttribute("data-action");
  if (action === "goto-step") {
    gotoStep(parseInt(el.getAttribute("data-step"), 10));
  } else if (action === "submit") {
    var err = validateForm();
    var errBox = document.getElementById("errArea");
    if (err) {
      if (errBox) errBox.innerHTML = '<div class="warn-box warn-warn"><p>' + err + "</p></div>";
      return;
    }
    if (errBox) errBox.innerHTML = "";
    compute();
    STATE.maxStep = Math.max(STATE.maxStep, 2);
    gotoStep(2);
  } else if (action === "to-plans") {
    STATE.maxStep = Math.max(STATE.maxStep, 3);
    gotoStep(3);
  } else if (action === "choose-plan") {
    var id = el.getAttribute("data-plan");
    for (var i = 0; i < STATE.plans.length; i++) {
      if (STATE.plans[i].type.id === id) STATE.selectedPlan = STATE.plans[i];
    }
    if (!STATE.selectedPlan) return;
    STATE.seed = (Date.now() % 100000) + 1;
    STATE.schedule = Planner.buildSchedule(STATE.form, STATE.selectedPlan, STATE.seed);
    STATE.maxStep = Math.max(STATE.maxStep, 4);
    gotoStep(4);
  } else if (action === "regenerate") {
    STATE.seed = (Date.now() % 100000) + 1;
    STATE.schedule = Planner.buildSchedule(STATE.form, STATE.selectedPlan, STATE.seed);
    renderStep();
  } else if (action === "export") {
    exportXLSX();
  } else if (action === "change-plan") {
    gotoStep(3);
  } else if (action === "edit-data") {
    gotoStep(1);
  } else if (action === "open-dish") {
    openModal(el.getAttribute("data-id"));
  } else if (action === "close-modal") {
    closeModal();
  }
});

document.addEventListener("change", function (e) {
  if (e.target.id === "currencySel") {
    STATE.currency = e.target.value;
    closeModal();
    renderStep();
    return;
  }
  if (e.target.id === "ingRegionSel") { STATE.ingRegion = e.target.value; renderIngTable(); return; }
  if (e.target.id === "ingCatSel") { STATE.ingCat = e.target.value; renderIngTable(); return; }
  if (e.target.id === "f-ack") {
    STATE.dangerAck = e.target.checked;
    syncSubmit();
    return;
  }
  if (e.target.closest("#sec-input")) {
    saveFormFromDom();
    updateFormVisuals();
    updateWarnings();
  }
});

document.addEventListener("input", function (e) {
  /* 风险确认框由 change 处理器管理，跳过以免重绘警告区导致勾选状态丢失 */
  if (e.target.id === "f-ack") return;
  if (e.target.closest("#sec-input")) {
    saveFormFromDom();
    updateWarnings();
  }
});

document.addEventListener("keydown", function (e) {
  if (e.key === "Escape") closeModal();
});

/* 脚本错误提示（便于排查环境问题） */
window.addEventListener("error", function (e) {
  var b = document.getElementById("jsErrorBanner");
  if (!b) {
    b = document.createElement("div");
    b.id = "jsErrorBanner";
    b.style.cssText = "position:fixed;left:12px;bottom:12px;right:12px;background:#c62828;" +
      "color:#fff;padding:10px 14px;border-radius:10px;z-index:9999;font-size:13px;";
    document.body.appendChild(b);
  }
  b.textContent = "⚠️ 脚本错误: " + (e.message || "unknown") + "（请刷新页面；若仍出现请告知开发者）";
});

/* ---------- 启动 ---------- */
render();
})();

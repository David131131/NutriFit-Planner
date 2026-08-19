/* ============================================================
 * NutriFit-Planner 全项目校验与冒烟测试 / Validation & Smoke Test
 * 运行：node tools/check.js
 * ============================================================ */
"use strict";
const fs = require("fs");
const vm = require("vm");
const path = require("path");

const ROOT = path.join(__dirname, "..");
let errs = 0;
function err(msg) { console.error("  ✗ " + msg); errs++; }
function ok(msg) { console.log("  ✓ " + msg); }

/* ---------- 1. 语法检查（全部 JS，含 app.js） ---------- */
console.log("== 1. 语法检查 ==");
const allJs = [
  "js/i18n.js", "js/data-regions.js", "js/data-ingredients.js", "js/data-macros.js",
  "js/data-dishes-east-asia.js", "js/data-dishes-global.js", "js/data-dishes-south-asia.js",
  "js/data-dishes-west.js", "js/data-dishes-others.js", "js/calc.js",
  "js/planner.js", "js/app.js"
];
const ctx = {};
vm.createContext(ctx);
for (const f of allJs) {
  const code = fs.readFileSync(path.join(ROOT, f), "utf8");
  try {
    if (f === "js/app.js") {
      new vm.Script(code, { filename: f }); // 仅解析，不执行（需要 DOM）
      ok(f + " 语法正确");
    } else {
      vm.runInContext(code, ctx, { filename: f });
      ok(f + " 语法正确");
    }
  } catch (e) {
    err(f + " 语法错误: " + e.message);
  }
}

/* ---------- 2. 数据完整性 ---------- */
console.log("== 2. 数据完整性 ==");
const ING = ctx.ING, ING_MACROS = ctx.ING_MACROS;
const REGIONS = ctx.REGIONS;
const REGION_IDS = ["east_asia", "se_asia", "south_asia", "middle_east", "europe",
  "north_america", "latin_america", "africa", "oceania", "global"];
const MEALS = ["breakfast", "lunch", "dinner"];
const TAGS = ["traditional", "cheap", "quick", "nocook", "microwave", "student",
  "lowcarb", "highprotein", "vegetarian"];
const CATS = ["staple", "protein", "dairy", "veg", "fruit", "fat", "cond", "instant"];

/* ING 检查 */
let ingCount = 0;
for (const id of Object.keys(ING)) {
  ingCount++;
  const g = ING[id];
  if (!g.zh || !g.en) err("ING " + id + " 缺名称");
  if (!CATS.includes(g.cat)) err("ING " + id + " 分类无效: " + g.cat);
  if (typeof g.kcal !== "number" || g.kcal <= 0) err("ING " + id + " 热量无效");
  if (typeof g.price !== "number" || g.price <= 0) err("ING " + id + " 单价无效");
  if (!Array.isArray(g.regions) || !g.regions.length) err("ING " + id + " 缺地区");
  for (const r of g.regions) if (!REGION_IDS.includes(r)) err("ING " + id + " 地区无效: " + r);
  if (!ING_MACROS[id]) err("ING_MACROS 缺少 " + id);
  else {
    const m = ING_MACROS[id];
    if (typeof m.p !== "number" || typeof m.f !== "number" || typeof m.c !== "number")
      err("ING_MACROS " + id + " 字段无效");
    else {
      const sum = m.p * 4 + m.f * 9 + m.c * 4;
      const kcal = g.kcal;
      const tol = g.cat === "cond" ? 0.45 : (g.cat === "fat" ? 0.18 : 0.25);
      const limit = kcal <= 50 ? 12 : kcal * tol;
      if (Math.abs(sum - kcal) > limit)
        err("ING_MACROS " + id + " 与热量不一致 (p*4+f*9+c*4=" + sum.toFixed(0) + " vs kcal=" + kcal + ")");
    }
  }
}
ok("食材库共 " + ingCount + " 种，营养素数据齐全");

/* 菜品检查 */
const dishLists = {
  DISHES_EA: ctx.DISHES_EA, DISHES_GLOBAL: ctx.DISHES_GLOBAL,
  DISHES_SEA: ctx.DISHES_SEA, DISHES_SA: ctx.DISHES_SA,
  DISHES_EU: ctx.DISHES_EU, DISHES_NA: ctx.DISHES_NA, DISHES_OC: ctx.DISHES_OC,
  DISHES_ME: ctx.DISHES_ME, DISHES_LA: ctx.DISHES_LA, DISHES_AF: ctx.DISHES_AF
};
const BANDS = { breakfast: [150, 450], lunch: [350, 650], dinner: [300, 600] };
let all = [];
let regionCount = {};
for (const [name, arr] of Object.entries(dishLists)) {
  if (!Array.isArray(arr)) { err(name + " 不是数组"); continue; }
  for (const d of arr) {
    if (!d.id || !d.zh || !d.en) { err(name + " 存在缺 id/名称的菜品"); continue; }
    if (!REGION_IDS.includes(d.region)) err(d.id + " 地区无效: " + d.region);
    if (!MEALS.includes(d.meal)) err(d.id + " 餐次无效: " + d.meal);
    if (!Array.isArray(d.ing) || !d.ing.length) err(d.id + " 缺食材");
    if (!Array.isArray(d.tags)) err(d.id + " tags 无效");
    if (typeof d.min !== "number" || d.min < 0) err(d.id + " min 无效");
    if (!d.how_zh || !d.how_en) err(d.id + " 缺做法说明");
    if (!Array.isArray(d.steps_zh) || d.steps_zh.length < 3 || d.steps_zh.length > 8)
      err(d.id + " steps_zh 缺失或步数异常(3-8)");
    else if (!Array.isArray(d.steps_en) || d.steps_en.length !== d.steps_zh.length)
      err(d.id + " steps_en 与 steps_zh 不匹配");
    else {
      for (let si = 0; si < d.steps_zh.length; si++) {
        if (!d.steps_zh[si] || !d.steps_en[si]) { err(d.id + " 步骤 " + (si + 1) + " 内容为空"); break; }
      }
    }
    for (const t of d.tags || []) if (!TAGS.includes(t)) err(d.id + " 标签无效: " + t);
    let kcal = 0, cost = 0;
    for (const p of d.ing) {
      if (!Array.isArray(p) || p.length !== 2) { err(d.id + " 食材格式错误"); continue; }
      const [iid, g] = p;
      if (!ING[iid]) { err(d.id + " 食材不存在: " + iid); continue; }
      if (typeof g !== "number" || g <= 0 || g > 1000) { err(d.id + " 克数异常: " + iid + "=" + g); continue; }
      kcal += g / 100 * ING[iid].kcal;
      cost += g / 100 * ING[iid].price;
    }
    kcal = Math.round(kcal);
    const band = BANDS[d.meal];
    if (kcal < band[0] || kcal > band[1]) err(d.id + " " + d.zh + " 热量 " + kcal + " 超出 " + d.meal + " 区间 " + band.join("-"));
    if (cost > 30) err(d.id + " " + d.zh + " 成本 " + cost.toFixed(1) + " 超过 30 CNY");
    d._checkKcal = kcal;
    all.push(d);
    regionCount[d.region] = (regionCount[d.region] || 0) + 1;
  }
}
const ids = new Set();
for (const d of all) {
  if (ids.has(d.id)) err("全局重复菜品 id: " + d.id);
  ids.add(d.id);
}
ok("菜品总数 " + all.length + "，无重复 id");
const withSteps = all.filter(d => Array.isArray(d.steps_zh) && d.steps_zh.length >= 3).length;
if (withSteps !== all.length) err("含分步做法的菜品 " + withSteps + "/" + all.length);
else ok("全部 " + all.length + " 道菜均含双语分步做法 ✓");
for (const r of REGION_IDS) {
  const c = regionCount[r] || 0;
  console.log("    " + r + ": " + c + " 道");
  if (r !== "global" && c < 14) err(r + " 菜品数量偏少 (" + c + ")");
}

/* 各地区一周日程可行性 */
console.log("== 3. 各地区周日程可行性 ==");
for (const r of REGION_IDS) {
  if (r === "global") continue;
  for (const meal of MEALS) {
    const pool = all.filter(d => d.meal === meal && (d.region === r || d.region === "global"));
    if (pool.length < 7) err(r + " " + meal + " 可用菜品不足 7 道 (" + pool.length + ")");
  }
  const studentPool = {};
  for (const meal of MEALS) {
    studentPool[meal] = all.filter(d => d.meal === meal && (d.region === r || d.region === "global") &&
      d.tags.some(t => ["student", "nocook", "microwave"].includes(t))).length;
  }
  const minS = Math.min(studentPool.breakfast, studentPool.lunch, studentPool.dinner);
  console.log("  " + r + ": 学生友好菜品 B/L/D = " + studentPool.breakfast + "/" +
    studentPool.lunch + "/" + studentPool.dinner + (minS < 7 ? "  ⚠ 少于 7，学生方案会有重复" : ""));
}

/* ---------- 4. 端到端冒烟测试 ---------- */
console.log("== 4. 端到端冒烟测试 ==");
const Calc = ctx.Calc, Planner = ctx.Planner;

function buildCalc(u) {
  const bmi = Calc.bmi(u.weight, u.heightCm);
  const bf = Calc.bodyFatPct(u.sex, u.age, bmi);
  const bmr = Calc.bmrMifflin(u.sex, u.age, u.heightCm, u.weight);
  const act = Calc.ACTIVITY_LEVELS.find(a => a.id === u.activity);
  const ex = Calc.EXERCISE_LEVELS.find(a => a.id === u.exercise);
  const tdee = Calc.tdee(bmr, act.mult, ex.mid);
  return { bmi, bf, bmr, tdee,
    intakeLo: Math.max(Calc.MIN_INTAKE[u.sex], bmr, tdee - 750),
    intakeHi: Math.max(Calc.MIN_INTAKE[u.sex], bmr, tdee - 250) };
}

function smoke(u, label) {
  console.log("--- " + label + " ---");
  const calc = buildCalc(u);
  const plans = Planner.generatePlans(u, calc);
  if (plans.length < 5) err(label + " 方案数不足 5: " + plans.length);
  const daysSet = new Set();
  for (const p of plans) {
    if (!p.days || p.days.days < 7) err(label + " " + p.type.id + " 预计天数异常: " + (p.days && p.days.days));
    daysSet.add(p.days.days);
    if (u.targetWeight > u.weight) {
      if (p.intake <= calc.tdee) err(label + " " + p.type.id + " 增肌模式摄入应高于总消耗");
      if (p.exerciseReq !== 0) err(label + " " + p.type.id + " 增肌模式不应有额外运动要求");
    } else if (p.intake >= calc.tdee) {
      err(label + " " + p.type.id + " 减脂模式摄入应低于总消耗");
    }
    const sch = Planner.buildSchedule(u, p, 42);
    if (sch.days.length !== 7) err(label + " " + p.type.id + " 日程不是 7 天");
    const usedIds = new Set();
    let dups = 0;
    for (const day of sch.days) {
      for (const k of ["breakfast", "lunch", "dinner"]) {
        if (usedIds.has(day[k].id)) dups++;
        usedIds.add(day[k].id);
      }
      if (day.kcal < 0.85 * p.intake || day.kcal > 1.2 * p.intake)
        err(label + " " + p.type.id + " 某天热量偏离过大: " + day.kcal + " vs 目标 " + p.intake);
    }
    if (dups > 0 && sch.warnings.indexOf("reuse") === -1)
      err(label + " " + p.type.id + " 出现重复菜品但未提示");
    console.log("  " + p.type.id.padEnd(12) + " 摄入=" + p.intake + " kcal  天数≈" + p.days.days +
      "  日均成本=" + p.dailyCost.toFixed(1) + " CNY  周均=" + sch.avgKcal + " kcal  重复=" + dups +
      "  运动要求=" + (p.exerciseReq || 0) +
      (sch.warnings.length ? "  [警告:" + sch.warnings.join(",") + "]" : ""));
  }
  if (daysSet.size < 2) err(label + " 各方案目标天数区分度不足（" + daysSet.size + " 种）");
}

smoke({ sex: "male", age: 30, heightCm: 175, weight: 82, targetWeight: 72,
  region: "east_asia", activity: 3, exercise: 2, isStudent: false, pref: "balanced" },
  "案例1：东亚 男 82→72kg");
smoke({ sex: "female", age: 21, heightCm: 160, weight: 58, targetWeight: 50,
  region: "europe", activity: 1, exercise: 0, isStudent: true, pref: "fast" },
  "案例2：欧洲 女学生 58→50kg");
smoke({ sex: "male", age: 45, heightCm: 168, weight: 95, targetWeight: 80,
  region: "south_asia", activity: 2, exercise: 1, isStudent: false, pref: "budget" },
  "案例3：南亚 男 95→80kg");
smoke({ sex: "male", age: 28, heightCm: 172, weight: 65, targetWeight: 70,
  region: "europe", activity: 3, exercise: 2, isStudent: false, pref: "fast" },
  "案例4：欧洲 男 65→70kg 增肌");

/* 全部 9 个地区 × 均衡方案 */
console.log("--- 全部地区 × 均衡方案 ---");
for (const r of REGION_IDS) {
  if (r === "global") continue;
  const u = { sex: "male", age: 28, heightCm: 172, weight: 78, targetWeight: 70,
    region: r, activity: 2, exercise: 1, isStudent: false, pref: "balanced" };
  const calc = buildCalc(u);
  const plans = Planner.generatePlans(u, calc);
  const bal = plans.find(p => p.type.id === "balanced");
  const sch = Planner.buildSchedule(u, bal, 7);
  const used = new Set();
  let dups = 0;
  for (const day of sch.days) for (const k of ["breakfast", "lunch", "dinner"]) {
    if (used.has(day[k].id)) dups++;
    used.add(day[k].id);
  }
  console.log("  " + r.padEnd(14) + " 日均=" + sch.avgKcal + " kcal (目标 " + bal.intake +
    ")  重复=" + dups + (sch.warnings.length ? "  [" + sch.warnings.join(",") + "]" : ""));
}

/* 目标体重健康警告 */
console.log("== 5. 目标体重健康警告 ==");
const chk1 = Calc.targetChecks({ age: 25, sex: "female", heightCm: 165, weight: 45, targetWeight: 40 });
if (!Calc.hasDanger(chk1)) err("偏瘦用户继续减脂未触发危险警告");
else ok("偏瘦用户继续减脂 → 触发危险警告 ✓");
const chk2 = Calc.targetChecks({ age: 25, sex: "female", heightCm: 165, weight: 60, targetWeight: 49 });
if (!chk2.some(c => c.key === "targetLow")) err("目标 BMI<18.5 未触发 targetLow 警告");
else ok("目标 BMI<18.5 → 触发 targetLow 警告 ✓");
const chk3 = Calc.targetChecks({ age: 16, sex: "male", heightCm: 170, weight: 70, targetWeight: 60 });
if (!chk3.some(c => c.key === "underage")) err("未成年人未触发警告");
else ok("未成年人 → 触发 underage 警告 ✓");
const chk4 = Calc.targetChecks({ age: 25, sex: "male", heightCm: 180, weight: 80, targetWeight: 95 });
if (!chk4.some(c => c.key === "targetHigh")) err("增肌目标 BMI≥28 未触发 targetHigh 警告");
else ok("增肌目标 BMI≥28 → targetHigh 警告 ✓");
const chk5 = Calc.targetChecks({ age: 25, sex: "female", heightCm: 160, weight: 45, targetWeight: 50 });
if (chk5.some(c => c.key === "alreadyThin")) err("增肌模式下偏瘦不应触发 alreadyThin 危险警告");
else if (!chk5.some(c => c.key === "gainFromThin")) err("增肌模式偏瘦未提示 gainFromThin");
else ok("增肌模式偏瘦 → gainFromThin 提示（而非危险警告）✓");
const chk6 = Calc.targetChecks({ age: 25, sex: "male", heightCm: 175, weight: 70, targetWeight: 90 });
if (!chk6.some(c => c.key === "bigGain")) err("增重>15kg 未触发 bigGain 警告");
else ok("增重>15kg → bigGain 警告 ✓");

console.log("");
if (errs) { console.error("❌ 共 " + errs + " 个问题"); process.exit(1); }
else console.log("✅ 全部校验通过");

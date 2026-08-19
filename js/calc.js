/* ============================================================
 * NutriFit-Planner 计算引擎 / Calculation Engine
 * 所有公式均为公开文献的估算公式，结果仅供参考，不具医疗效力。
 * ============================================================ */
var Calc = (function () {

  /* 日常活动水平（不含额外运动） */
  var ACTIVITY_LEVELS = [
    { id: 1, mult: 1.2,   zh: "久坐少动（办公室/学习为主）", en: "Sedentary (office / study)" },
    { id: 2, mult: 1.375, zh: "轻度活动（每周1-3次运动或日常走动较多）", en: "Lightly active (1-3 workouts/week)" },
    { id: 3, mult: 1.55,  zh: "中度活动（每周3-5次运动）", en: "Moderately active (3-5 workouts/week)" },
    { id: 4, mult: 1.725, zh: "高强度（每周6-7次运动）", en: "Very active (6-7 workouts/week)" },
    { id: 5, mult: 1.9,   zh: "极高强度（体力工作或每日高强度训练）", en: "Extremely active (physical job / daily hard training)" }
  ];

  /* 每日额外运动消耗（大概范围，取中值估算） */
  var EXERCISE_LEVELS = [
    { id: 0, mid: 50,  zh: "基本没有（约<100千卡）", en: "Almost none (~<100 kcal)" },
    { id: 1, mid: 200, zh: "少量（约100-300千卡）", en: "Light (~100-300 kcal)" },
    { id: 2, mid: 400, zh: "中等（约300-500千卡）", en: "Moderate (~300-500 kcal)" },
    { id: 3, mid: 650, zh: "较多（约500-800千卡）", en: "High (~500-800 kcal)" },
    { id: 4, mid: 900, zh: "非常多（约>800千卡）", en: "Very high (~>800 kcal)" }
  ];

  var MIN_INTAKE = { male: 1500, female: 1200 }; /* 安全摄入下限参考 */

  function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }

  function bmi(weightKg, heightCm) {
    var m = heightCm / 100;
    return weightKg / (m * m);
  }

  /* BMI 分级：中文界面用中国标准，英文界面用 WHO 标准 */
  function bmiCategory(bmiValue, lang) {
    if (lang === "zh") {
      if (bmiValue < 18.5) return { key: "under",   zh: "偏瘦",   en: "Underweight" };
      if (bmiValue < 24)   return { key: "normal",  zh: "正常",   en: "Normal" };
      if (bmiValue < 28)   return { key: "over",    zh: "超重",   en: "Overweight" };
      return { key: "obese", zh: "肥胖", en: "Obese" };
    }
    if (bmiValue < 18.5) return { key: "under",   zh: "偏瘦",   en: "Underweight" };
    if (bmiValue < 25)   return { key: "normal",  zh: "正常",   en: "Normal" };
    if (bmiValue < 30)   return { key: "over",    zh: "超重",   en: "Overweight" };
    return { key: "obese", zh: "肥胖", en: "Obese" };
  }

  /* Deurenberg 体脂率估算：BF% = 1.20×BMI + 0.23×Age − 10.8×Gender − 5.4
     Gender：男=1，女=0。仅适合成年人粗略估算。 */
  function bodyFatPct(sex, age, bmiValue) {
    var g = (sex === "male") ? 1 : 0;
    var p = 1.20 * bmiValue + 0.23 * age - 10.8 * g - 5.4;
    return clamp(p, 3, 60);
  }

  function bodyFatCategory(sex, pct) {
    var male = (sex === "male");
    if (male) {
      if (pct < 6)  return { level: "danger", zh: "过低（低于必需脂肪水平）", en: "Too low (below essential fat)" };
      if (pct < 14) return { level: "info",   zh: "偏低（运动员水平）", en: "Lean (athlete level)" };
      if (pct < 18) return { level: "ok",     zh: "健康", en: "Healthy" };
      if (pct < 25) return { level: "warn",   zh: "偏高", en: "Elevated" };
      return { level: "danger", zh: "肥胖", en: "Obese" };
    }
    if (pct < 14) return { level: "danger", zh: "过低（低于必需脂肪水平）", en: "Too low (below essential fat)" };
    if (pct < 21) return { level: "info",   zh: "偏低（运动员水平）", en: "Lean (athlete level)" };
    if (pct < 25) return { level: "ok",     zh: "健康", en: "Healthy" };
    if (pct < 32) return { level: "warn",   zh: "偏高", en: "Elevated" };
    return { level: "danger", zh: "肥胖", en: "Obese" };
  }

  /* Mifflin-St Jeor 基础代谢 */
  function bmrMifflin(sex, age, heightCm, weightKg) {
    var base = 10 * weightKg + 6.25 * heightCm - 5 * age;
    return Math.round(sex === "male" ? base + 5 : base - 161);
  }

  /* 每日总消耗 = 基础代谢 × 活动系数 + 额外运动消耗(估算) */
  function tdee(bmr, activityMult, exerciseKcal) {
    return Math.round(bmr * activityMult + exerciseKcal);
  }

  /* 目标摄入 = 总消耗 − 热量缺口；不低于 BMR 与安全下限 */
  function intakeFor(tdeeValue, bmrValue, sex, deficit) {
    var floor = Math.max(MIN_INTAKE[sex], bmrValue);
    return Math.round(clamp(tdeeValue - deficit, floor, tdeeValue));
  }

  /* 三大营养素：蛋白质按体重系数，脂肪按热量占比，碳水取剩余 */
  function macros(intake, weightKg, proteinPerKg, fatPct, minCarbs) {
    var protein = Math.round(proteinPerKg * weightKg);
    var fat = Math.round(intake * fatPct / 9);
    var carbs = Math.round((intake - protein * 4 - fat * 9) / 4);
    if (carbs < minCarbs) carbs = minCarbs;
    return { protein: protein, fat: fat, carbs: carbs };
  }

  /* 每周减重速度(kg) = 日缺口 × 7 ÷ 7700 */
  function kgPerWeek(dailyDeficit) {
    return dailyDeficit * 7 / 7700;
  }

  /* 预计天数（含 ±20% 浮动区间） */
  function daysEstimate(kgToLose, dailyDeficit) {
    var w = kgPerWeek(dailyDeficit);
    if (w <= 0) return null;
    var d = Math.ceil(kgToLose / w * 7);
    return { days: d, daysLo: Math.max(7, Math.round(d * 0.8)), daysHi: Math.round(d * 1.2) };
  }

  /* 目标体重健康检查；返回警告数组 {level, key}
     mode: "loss"=减脂（目标低于当前） / "gain"=增肌（目标高于当前） */
  function targetChecks(user) {
    var checks = [];
    var mode = user.targetWeight > user.weight ? "gain" : "loss";
    var tb = bmi(user.targetWeight, user.heightCm);
    var cb = bmi(user.weight, user.heightCm);
    var delta = user.targetWeight - user.weight;

    if (user.age < 18) {
      checks.push({ level: "warn", key: "underage" });
    }
    if (cb < 18.5) {
      if (mode === "gain") {
        checks.push({ level: "info", key: "gainFromThin" });
      } else {
        checks.push({ level: "danger", key: "alreadyThin" });
      }
    }
    if (tb < 16) {
      checks.push({ level: "danger", key: "targetExtreme" });
    } else if (tb < 17) {
      checks.push({ level: "danger", key: "targetVeryLow" });
    } else if (tb < 18.5) {
      checks.push({ level: "warn", key: "targetLow" });
    }
    if (tb >= 35) {
      checks.push({ level: "danger", key: "targetVeryHigh" });
    } else if (tb >= 28) {
      checks.push({ level: "warn", key: "targetHigh" });
    }
    if (delta < -25) {
      checks.push({ level: "warn", key: "bigLoss" });
    }
    if (delta > 15) {
      checks.push({ level: "warn", key: "bigGain" });
    }
    if (user.age >= 60) {
      checks.push({ level: "info", key: "senior" });
    }
    return checks;
  }

  function hasDanger(checks) {
    for (var i = 0; i < checks.length; i++) if (checks[i].level === "danger") return true;
    return false;
  }

  return {
    ACTIVITY_LEVELS: ACTIVITY_LEVELS,
    EXERCISE_LEVELS: EXERCISE_LEVELS,
    MIN_INTAKE: MIN_INTAKE,
    clamp: clamp,
    bmi: bmi,
    bmiCategory: bmiCategory,
    bodyFatPct: bodyFatPct,
    bodyFatCategory: bodyFatCategory,
    bmrMifflin: bmrMifflin,
    tdee: tdee,
    intakeFor: intakeFor,
    macros: macros,
    kgPerWeek: kgPerWeek,
    daysEstimate: daysEstimate,
    targetChecks: targetChecks,
    hasDanger: hasDanger
  };
})();

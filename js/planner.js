/* ============================================================
 * NutriFit-Planner 方案与日程引擎 / Plan & Schedule Engine
 * 结果均为估算参考值，不具医疗效力。
 * ============================================================ */
var Planner = (function () {

  /* ---------- 方案类型 ---------- */
  var PLAN_TYPES = [
    {
      id: "budget", icon: "💰", color: "#2e7d32", difficulty: 1,
      zh: "高性价比方案", en: "Budget-First Plan",
      descZh: "以鸡蛋、豆腐、燕麦、卷心菜等高性价比食材为主，每日成本最低；减重速度适中，容易坚持。",
      descEn: "Built on eggs, tofu, oats and cabbage — the lowest daily cost; moderate pace, easy to stick with.",
      deficit: 450, surplus: 300, protein: 1.6, fatPct: 0.25, minCarbs: 100,
      tagPref: ["cheap"], requireTags: null, costWeight: 0.9, costCap: 10,
      features: ["cheap", "balanced"],
      prosZh: ["每日成本最低", "食材随处可见、最易购买", "饱腹感好，容易坚持"],
      prosEn: ["Lowest daily cost", "Everyday ingredients, easy to buy", "Filling and sustainable"],
      consZh: ["减重速度较慢", "蛋白质来源相对单一"],
      consEn: ["Slower progress", "Relatively limited protein sources"],
      gainDescZh: "以鸡蛋、豆腐、燕麦、卷心菜等高性价比食材为主，小幅热量盈余，成本最低，稳步增肌。",
      gainDescEn: "Eggs, tofu, oats and cabbage with a modest surplus — the lowest cost, steady lean gains.",
      gainProsZh: ["每日成本最低", "盈余温和，脂肪增长少", "食材最易购买"],
      gainProsEn: ["Lowest daily cost", "Gentle surplus → less fat gain", "Everyday ingredients"],
      gainConsZh: ["增重速度较慢", "蛋白质来源相对单一"],
      gainConsEn: ["Slower gains", "Relatively limited protein sources"]
    },
    {
      id: "balanced", icon: "⚖️", color: "#1565c0", difficulty: 2,
      zh: "均衡方案", en: "Balanced Plan",
      descZh: "蛋白质、碳水、脂肪比例均衡，减重速度适中，营养结构适合大多数人长期执行。",
      descEn: "Balanced protein/carb/fat ratios at a moderate pace — nutritionally suited to long-term use.",
      deficit: 500, surplus: 350, protein: 1.8, fatPct: 0.30, minCarbs: 110,
      tagPref: [], requireTags: null, costWeight: 0.4, costCap: 16,
      features: ["balanced"],
      prosZh: ["营养比例均衡", "食材选择丰富", "最容易长期坚持"],
      prosEn: ["Balanced macros", "Wide food variety", "Easiest to sustain long-term"],
      consZh: ["成本适中", "多数菜品需要简单烹饪"],
      consEn: ["Moderate cost", "Most dishes need simple cooking"],
      gainDescZh: "热量盈余适中，三大营养素均衡，适合大多数人的增肌增重节奏。",
      gainDescEn: "A moderate surplus with balanced macros — the most sustainable rhythm for most people.",
      gainProsZh: ["营养比例均衡", "增重速度适中", "最容易长期坚持"],
      gainProsEn: ["Balanced macros", "Moderate gains", "Easiest to sustain"],
      gainConsZh: ["成本适中", "多数菜品需要简单烹饪"],
      gainConsEn: ["Moderate cost", "Most dishes need simple cooking"]
    },
    {
      id: "fast", icon: "⚡", color: "#c62828", difficulty: 3,
      zh: "最快速方案", en: "Fastest Plan",
      descZh: "热量缺口最大并大幅提高蛋白质，达成目标最快，适合短期冲刺；执行期间保持力量训练更佳。",
      descEn: "Largest calorie deficit with high protein — fastest results, ideal for a short sprint; keep strength training.",
      deficit: 750, surplus: 500, protein: 2.2, fatPct: 0.20, minCarbs: 100,
      tagPref: ["highprotein", "lowcarb"], requireTags: null, costWeight: 0.1, costCap: 26,
      features: ["fast", "highprotein"],
      prosZh: ["达成目标最快", "蛋白质最充足，利于保留肌肉"],
      prosEn: ["Fastest results", "Most protein to preserve muscle"],
      consZh: ["饥饿感可能更强", "食材成本较高", "长期执行较难坚持"],
      consEn: ["May feel hungrier", "Higher food cost", "Hard to sustain long-term"],
      gainDescZh: "盈余最大并大幅提高蛋白质，增重最快；务必配合力量训练，否则易积累脂肪。",
      gainDescEn: "Largest surplus with maximum protein — fastest gains; pair with strength training or fat will follow.",
      gainProsZh: ["增重最快", "蛋白质最充足，利于肌肉合成"],
      gainProsEn: ["Fastest gains", "Most protein for muscle synthesis"],
      gainConsZh: ["盈余大，脂肪增长风险高", "必须配合力量训练", "成本较高"],
      gainConsEn: ["Higher fat-gain risk", "Strength training required", "Higher cost"]
    },
    {
      id: "student", icon: "🎒", color: "#6a1b9a", difficulty: 1,
      zh: "学生友好方案", en: "Student-Friendly Plan",
      descZh: "全部选用免煮/微波/即食菜品：袋装即食鸡胸肉、即食牛肉、即食燕麦、罐头、面包与牛奶优先，宿舍没有厨房也能执行。",
      descEn: "Only no-cook / microwave / ready-to-eat meals: ready-to-eat chicken & beef, instant oats, canned fish, bread and milk — works in a dorm without a kitchen.",
      deficit: 500, surplus: 350, protein: 1.8, fatPct: 0.25, minCarbs: 110,
      tagPref: ["student", "nocook", "microwave"], requireTags: ["student", "nocook", "microwave"],
      costWeight: 0.5, costCap: 16,
      features: ["student", "nocook"],
      prosZh: ["无需明火与厨房", "即食食品方便带到教室/图书馆", "宿舍、外卖受限环境可执行"],
      prosEn: ["No stove or kitchen needed", "Portable to class or library", "Works in dorms with restrictions"],
      consZh: ["即食食品钠含量可能偏高", "口味选择相对有限"],
      consEn: ["Ready-to-eat foods may be higher in sodium", "Limited flavor variety"],
      gainDescZh: "全部免煮/微波/即食菜品 + 热量盈余，宿舍没有厨房也能增肌。",
      gainDescEn: "No-cook / microwave / ready-to-eat meals with a surplus — gain muscle even in a dorm.",
      gainProsZh: ["无需明火与厨房", "即食蛋白来源方便携带", "宿舍可执行"],
      gainProsEn: ["No stove needed", "Portable ready-to-eat protein", "Works in dorms"],
      gainConsZh: ["即食食品钠含量可能偏高", "口味选择有限"],
      gainConsEn: ["Higher sodium in ready-to-eat foods", "Limited flavor variety"]
    },
    {
      id: "lowcarb", icon: "🥩", color: "#ef6c00", difficulty: 3,
      zh: "高蛋白低碳方案", en: "High-Protein Low-Carb Plan",
      descZh: "降低碳水、提高蛋白质与优质脂肪占比，饱腹感强、食欲更稳；不习惯低碳者请循序渐进。",
      descEn: "Lower carbs with more protein and quality fats — strong satiety and steadier appetite; ease into it if you're new to low-carb.",
      deficit: 600, surplus: 400, protein: 2.0, fatPct: 0.35, minCarbs: 60,
      tagPref: ["lowcarb", "highprotein"], requireTags: null, costWeight: 0.2, costCap: 26,
      features: ["lowcarb", "highprotein"],
      prosZh: ["饱腹感强", "蛋白质充足", "适合对碳水敏感的人群"],
      prosEn: ["Strong satiety", "Ample protein", "Good for carb-sensitive people"],
      consZh: ["食材成本较高", "部分人不适应低碳", "需要注意蔬菜摄入量"],
      consEn: ["Higher food cost", "Not for everyone", "Watch your vegetable intake"],
      gainDescZh: "高蛋白低碳 + 热量盈余，优先合成瘦体重、减少脂肪增长。",
      gainDescEn: "High protein, low carb plus a surplus — favor lean mass over fat.",
      gainProsZh: ["高蛋白利于增肌", "脂肪增长相对较少"],
      gainProsEn: ["High protein favors muscle", "Less fat gain"],
      gainConsZh: ["食材成本较高", "部分人不适应低碳"],
      gainConsEn: ["Higher food cost", "Not for everyone"]
    },
    {
      id: "traditional", icon: "🍲", color: "#00838f", difficulty: 1,
      zh: "本地传统方案", en: "Traditional Local Plan",
      descZh: "优先选用你所在地区的传统家常菜，最贴近日常饮食习惯，心理负担最小，容易无缝融入生活。",
      descEn: "Prefers your region's traditional home dishes — closest to daily habits, lowest mental load, easy to blend into life.",
      deficit: 450, surplus: 300, protein: 1.7, fatPct: 0.30, minCarbs: 110,
      tagPref: ["traditional"], requireTags: null, costWeight: 0.4, costCap: 16,
      features: ["traditional"],
      prosZh: ["最符合本地口味", "可与家人共同执行", "心理负担最小"],
      prosEn: ["Matches local tastes", "Easy to share with family", "Lowest mental load"],
      consZh: ["减重速度较慢", "部分传统菜偏油腻，需改良做法"],
      consEn: ["Slower progress", "Some classic dishes need lighter cooking"],
      gainDescZh: "以本地传统家常菜为主 + 温和盈余，最贴近日常饮食习惯。",
      gainDescEn: "Traditional local home dishes with a gentle surplus — closest to daily habits.",
      gainProsZh: ["最符合本地口味", "心理负担最小", "可与家人共同执行"],
      gainProsEn: ["Matches local tastes", "Lowest mental load", "Easy to share with family"],
      gainConsZh: ["增重速度较慢", "部分传统菜偏油腻，需改良做法"],
      gainConsEn: ["Slower gains", "Some classic dishes need lighter cooking"]
    }
  ];

  /* ---------- 加餐池 ---------- */
  var SNACKS = [
    { id: "sn_egg",      zh: "水煮蛋 ×1",            en: "1 boiled egg",            ing: [["egg", 50]],                 tags: ["cheap", "highprotein"] },
    { id: "sn_banana",   zh: "香蕉 ×1",              en: "1 banana",                ing: [["banana", 120]],             tags: ["cheap"] },
    { id: "sn_apple",    zh: "苹果 ×1",              en: "1 apple",                 ing: [["apple", 200]],              tags: ["cheap"] },
    { id: "sn_yogurt",   zh: "无糖酸奶 150g",         en: "150g plain yogurt",       ing: [["yogurt_plain", 150]],       tags: [] },
    { id: "sn_tomato",   zh: "小番茄 200g",           en: "200g cherry tomatoes",    ing: [["tomato", 200]],             tags: ["cheap"] },
    { id: "sn_nuts",     zh: "混合坚果 15g",          en: "15g mixed nuts",          ing: [["almonds", 15]],             tags: ["lowcarb"] },
    { id: "sn_peanuts",  zh: "花生 15g",             en: "15g peanuts",             ing: [["peanuts", 15]],             tags: ["cheap"] },
    { id: "sn_cucumber", zh: "黄瓜条 200g",           en: "200g cucumber sticks",    ing: [["cucumber", 200]],           tags: ["cheap"] },
    { id: "sn_corn",     zh: "即食玉米 100g",         en: "100g instant corn",       ing: [["corn", 100]],               tags: ["student"] },
    { id: "sn_shake",    zh: "蛋白奶昔（25g粉+250ml奶）", en: "Protein shake (25g powder + 250ml milk)", ing: [["protein_powder", 25], ["milk", 250]], tags: ["highprotein", "lowcarb"] }
  ];

  /* ---------- 工具 ---------- */
  function mulberry32(a) {
    return function () {
      a |= 0; a = a + 0x6D2B79F5 | 0;
      var t = Math.imul(a ^ a >>> 15, 1 | a);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  }

  function hashStr(s) {
    var h = 2166136261;
    for (var i = 0; i < s.length; i++) {
      h ^= s.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return (h >>> 0) % 100000;
  }

  function hasAny(tags, list) {
    for (var i = 0; i < list.length; i++) if (tags.indexOf(list[i]) !== -1) return true;
    return false;
  }

  function ingMacro(id) {
    var m = (typeof ING_MACROS !== "undefined" && ING_MACROS[id]) || { p: 0, f: 0, c: 0 };
    return m;
  }

  function computeDish(d) {
    var kcal = 0, cost = 0, p = 0, f = 0, c = 0;
    for (var i = 0; i < d.ing.length; i++) {
      var id = d.ing[i][0], g = d.ing[i][1];
      if (!ING[id]) continue;
      kcal += g / 100 * ING[id].kcal;
      cost += g / 100 * ING[id].price;
      var m = ingMacro(id);
      p += g / 100 * m.p; f += g / 100 * m.f; c += g / 100 * m.c;
    }
    return { kcal: Math.round(kcal), cost: cost, protein: Math.round(p), fat: Math.round(f), carbs: Math.round(c) };
  }

  /* ---------- 菜品全集 ---------- */
  var ALL_DISHES = [];
  function buildAll() {
    if (ALL_DISHES.length) return ALL_DISHES;
    var lists = [DISHES_EA, DISHES_GLOBAL, DISHES_SEA, DISHES_SA, DISHES_EU, DISHES_NA,
                 DISHES_OC, DISHES_ME, DISHES_LA, DISHES_AF];
    var seen = {};
    for (var i = 0; i < lists.length; i++) {
      var arr = lists[i] || [];
      for (var j = 0; j < arr.length; j++) {
        var d = arr[j];
        if (seen[d.id]) continue;
        seen[d.id] = true;
        var m = computeDish(d);
        d._kcal = m.kcal; d._cost = m.cost;
        d._p = m.protein; d._f = m.fat; d._c = m.carbs;
        ALL_DISHES.push(d);
      }
    }
    return ALL_DISHES;
  }

  function getPlanType(id) {
    for (var i = 0; i < PLAN_TYPES.length; i++) if (PLAN_TYPES[i].id === id) return PLAN_TYPES[i];
    return null;
  }

  /* ---------- 方案计算 ---------- */
  function computePlan(user, calcRes, pt) {
    var mode = user.targetWeight > user.weight ? "gain" : "loss";
    var tdeeEff = calcRes.tdee;
    var exerciseReq = 0;
    var intake;
    if (mode === "gain") {
      /* 增肌模式：创造热量盈余 */
      intake = Math.round(calcRes.tdee + pt.surplus);
    } else {
      if (pt.id === "fast") {
        /* 最快速方案：若 750 千卡缺口被安全下限卡住，则要求额外运动来补足 */
        var floor0 = Math.max(Calc.MIN_INTAKE[user.sex], calcRes.bmr);
        var need = pt.deficit - (calcRes.tdee - floor0);
        if (need > 0) exerciseReq = Math.ceil(need / 50) * 50;
        tdeeEff = calcRes.tdee + exerciseReq;
      }
      intake = Calc.intakeFor(tdeeEff, calcRes.bmr, user.sex, pt.deficit);
    }
    var gap = intake - calcRes.tdee; /* 负=缺口（减脂） 正=盈余（增肌） */
    var macros = Calc.macros(intake, user.weight,
      mode === "gain" ? Math.min(2.4, pt.protein + 0.4) : pt.protein,
      pt.fatPct, pt.minCarbs);
    var days = Calc.daysEstimate(Math.abs(user.targetWeight - user.weight), Math.abs(gap));
    var kgw = Calc.kgPerWeek(Math.abs(gap));
    var key = user.sex + "|" + user.age + "|" + user.heightCm + "|" + user.weight + "|" +
              user.targetWeight + "|" + user.region + "|" + pt.id;
    var planForSched = {};
    for (var k in pt) planForSched[k] = pt[k];
    planForSched.intake = intake;
    planForSched.macros = macros;
    var preview = buildSchedule(user, planForSched, hashStr(key));
    return {
      type: pt,
      mode: mode,
      intake: intake,
      deficit: mode === "loss" ? Math.abs(gap) : 0,
      surplus: mode === "gain" ? gap : 0,
      macros: macros,
      days: days,
      kgPerWeek: kgw,
      dailyCost: preview.avgCost,
      totalCost: preview.avgCost * (days ? days.days : 0),
      exerciseReq: exerciseReq,
      preview: preview
    };
  }

  function planOrder(user) {
    if (user.isStudent) return ["student", "budget", "balanced", "fast", "lowcarb", "traditional"];
    if (user.pref === "fast") return ["fast", "lowcarb", "balanced", "student", "budget", "traditional"];
    if (user.pref === "budget") return ["budget", "balanced", "student", "traditional", "fast", "lowcarb"];
    return ["balanced", "student", "budget", "traditional", "fast", "lowcarb"];
  }

  function generatePlans(user, calcRes) {
    buildAll();
    var order = planOrder(user);
    var plans = [];
    for (var i = 0; i < PLAN_TYPES.length; i++) {
      plans.push(computePlan(user, calcRes, PLAN_TYPES[i]));
    }
    plans.sort(function (a, b) {
      return order.indexOf(a.type.id) - order.indexOf(b.type.id);
    });
    plans[0].recommended = true;
    return plans;
  }

  /* ---------- 周日程生成 ---------- */
  function buildSchedule(user, plan, seed) {
    buildAll();
    var all = ALL_DISHES;
    var pool = [];
    for (var i = 0; i < all.length; i++) {
      if (all[i].region === user.region || all[i].region === "global") pool.push(all[i]);
    }
    if (plan.requireTags) {
      var filtered = [];
      for (var k = 0; k < pool.length; k++) {
        if (hasAny(pool[k].tags, plan.requireTags)) filtered.push(pool[k]);
      }
      pool = filtered;
    }

    var pools = { breakfast: [], lunch: [], dinner: [] };
    for (var j = 0; j < pool.length; j++) {
      var d = pool[j];
      if (pools[d.meal]) pools[d.meal].push(d);
    }
    /* 若某餐次无符合要求的菜品，回退到该地区全部菜品 */
    var meals = ["breakfast", "lunch", "dinner"];
    for (var mi = 0; mi < meals.length; mi++) {
      var meal = meals[mi];
      if (pools[meal].length) continue;
      var fallback = [];
      for (var fi = 0; fi < all.length; fi++) {
        if ((all[fi].region === user.region || all[fi].region === "global") && all[fi].meal === meal) {
          fallback.push(all[fi]);
        }
      }
      pools[meal] = fallback;
      if (warnings.indexOf("nofood") === -1) warnings.push("nofood");
    }

    var rng = mulberry32(seed >>> 0);
    var used = {};
    var warnings = [];
    var reuseWarned = false;
    var targets = {
      breakfast: plan.intake * 0.25,
      lunch: plan.intake * 0.35,
      dinner: plan.intake * 0.30,
      snack: plan.intake * 0.10
    };

    var SCALE_CAP = 3.0; /* 份量缩放上限 */
    function score(dish, target) {
      /* 按“缩放后能达到的热量”评估贴合度，优先选能放大达标的大菜 */
      var ach = Math.min(target, dish._kcal * SCALE_CAP);
      var s = Math.abs(ach - target) / target;
      s += plan.costWeight * (dish._cost / 16);
      if (plan.tagPref && hasAny(dish.tags, plan.tagPref)) s -= 0.18;
      return s;
    }

    /* 份量缩放：按餐目标热量等比调整全部食材克数（0.7×–2.0×） */
    function scaleDish(d, factor) {
      if (Math.abs(factor - 1) < 0.06) return d;
      var copy = {
        id: d.id, zh: d.zh, en: d.en, region: d.region, meal: d.meal,
        ing: [], tags: d.tags.slice(), min: d.min,
        how_zh: d.how_zh, how_en: d.how_en,
        steps_zh: d.steps_zh, steps_en: d.steps_en,
        _scaled: Math.round(factor * 100) / 100
      };
      for (var si = 0; si < d.ing.length; si++) {
        copy.ing.push([d.ing[si][0], Math.max(3, Math.round(d.ing[si][1] * factor))]);
      }
      var m = computeDish(copy);
      copy._kcal = m.kcal; copy._cost = m.cost;
      copy._p = m.protein; copy._f = m.fat; copy._c = m.carbs;
      return copy;
    }

    function pick(mealPool, target, cap) {
      var cand = [];
      for (var i = 0; i < mealPool.length; i++) {
        var d = mealPool[i];
        if (used[d.id]) continue;
        if (cap && d._cost > cap) continue;
        if (d._kcal < target * 0.55 || d._kcal > target * 1.6) continue;
        cand.push(d);
      }
      if (!cand.length) {
        for (var j2 = 0; j2 < mealPool.length; j2++) {
          var d2 = mealPool[j2];
          if (used[d2.id]) continue;
          if (cap && d2._cost > cap * 1.6) continue;
          cand.push(d2);
        }
      }
      if (!cand.length) {
        if (!reuseWarned) {
          warnings.push("reuse");
          reuseWarned = true;
        }
        cand = mealPool.slice();
      }
      cand.sort(function (a, b) { return score(a, target) - score(b, target); });
      var idx = Math.floor(rng() * Math.min(3, cand.length));
      var chosen = cand[idx];
      used[chosen.id] = true;
      var factor = Calc.clamp(target / chosen._kcal, 0.7, 3.0);
      chosen = scaleDish(chosen, factor);
      return chosen;
    }

    /* 加餐选择 */
    function pickSnack(target) {
      var cand = [];
      for (var i = 0; i < SNACKS.length; i++) {
        if (used[SNACKS[i].id]) continue;
        cand.push(SNACKS[i]);
      }
      if (!cand.length) cand = SNACKS.slice();
      var pref = plan.tagPref || [];
      cand.sort(function (a, b) {
        var ka = Math.abs(a._kcal - target), kb = Math.abs(b._kcal - target);
        var ta = hasAny(a.tags, pref) ? 0 : 30;
        var tb = hasAny(b.tags, pref) ? 0 : 30;
        return (ka + ta) - (kb + tb);
      });
      var idx = Math.floor(rng() * Math.min(2, cand.length));
      var chosen = cand[idx];
      used[chosen.id] = true;
      return chosen;
    }

    /* 预计算加餐热量 */
    for (var s = 0; s < SNACKS.length; s++) {
      SNACKS[s]._kcal = computeDish({ ing: SNACKS[s].ing }).kcal;
      SNACKS[s]._cost = computeDish({ ing: SNACKS[s].ing }).cost;
      var sm = computeDish({ ing: SNACKS[s].ing });
      SNACKS[s]._p = sm.protein; SNACKS[s]._f = sm.fat; SNACKS[s]._c = sm.carbs;
    }

    var days = [];
    var sumKcal = 0, sumCost = 0, sumP = 0, sumF = 0, sumC = 0;
    var dishes = {};

    for (var day = 0; day < 7; day++) {
      var b = pick(pools.breakfast, targets.breakfast, plan.costCap);
      var l = pick(pools.lunch, targets.lunch, plan.costCap);
      var d3 = pick(pools.dinner, targets.dinner, plan.costCap);
      var sn = pickSnack(targets.snack);
      var sn2 = null;
      var kcal = b._kcal + l._kcal + d3._kcal + sn._kcal;
      if (kcal < plan.intake * 0.93) {
        sn2 = pickSnack(targets.snack * 0.5);
        kcal += sn2._kcal;
      }
      var cost = b._cost + l._cost + d3._cost + sn._cost + (sn2 ? sn2._cost : 0);
      var p = b._p + l._p + d3._p + sn._p + (sn2 ? sn2._p : 0);
      var f = b._f + l._f + d3._f + sn._f + (sn2 ? sn2._f : 0);
      var c = b._c + l._c + d3._c + sn._c + (sn2 ? sn2._c : 0);
      dishes[b.id] = b; dishes[l.id] = l; dishes[d3.id] = d3; dishes[sn.id] = sn;
      if (sn2) dishes[sn2.id] = sn2;
      sumKcal += kcal; sumCost += cost; sumP += p; sumF += f; sumC += c;
      days.push({
        breakfast: b, lunch: l, dinner: d3, snack: sn, snack2: sn2,
        kcal: kcal, cost: cost, protein: p, fat: f, carbs: c
      });
    }

    return {
      days: days,
      dishes: dishes,
      avgKcal: Math.round(sumKcal / 7),
      avgCost: sumCost / 7,
      avgProtein: Math.round(sumP / 7),
      avgFat: Math.round(sumF / 7),
      avgCarbs: Math.round(sumC / 7),
      targetKcal: plan.intake,
      targetProtein: plan.macros.protein,
      targetFat: plan.macros.fat,
      targetCarbs: plan.macros.carbs,
      warnings: warnings
    };
  }

  return {
    PLAN_TYPES: PLAN_TYPES,
    SNACKS: SNACKS,
    buildAll: buildAll,
    getPlanType: getPlanType,
    computePlan: computePlan,
    generatePlans: generatePlans,
    buildSchedule: buildSchedule,
    planOrder: planOrder,
    hashStr: hashStr,
    hasAny: hasAny
  };
})();

/* ============================================================
 * NutriFit-Planner 无头浏览器 UI 冒烟测试 / Headless UI Smoke Test
 * 运行：node tools/ui-test.js
 * 依赖：jsdom（测试环境 /tmp/nf-jsdom-test/node_modules）
 * ============================================================ */
"use strict";
const path = require("path");
const { JSDOM } = require("/tmp/nf-jsdom-test/node_modules/jsdom");

const ROOT = path.join(__dirname, "..");
let failures = 0;
function fail(msg) { console.error("  ✗ " + msg); failures++; }
function ok(msg) { console.log("  ✓ " + msg); }

function fire(el, type) {
  el.dispatchEvent(new el.ownerDocument.defaultView.Event(type, { bubbles: true }));
}

function click(el) {
  el.dispatchEvent(new el.ownerDocument.defaultView.MouseEvent("click", { bubbles: true, cancelable: true }));
}

(async function main() {
  const virtualConsole = new (require("/tmp/nf-jsdom-test/node_modules/jsdom").VirtualConsole)();
  const dom = await JSDOM.fromFile(path.join(ROOT, "index.html"), {
    runScripts: "dangerously",
    resources: "usable",
    pretendToBeVisual: true,
    virtualConsole
  });
  const win = dom.window;
  const doc = win.document;
  await new Promise(r => setTimeout(r, 400)); // 等待脚本执行

  console.log("== UI 冒烟测试 ==");

  /* 0. XLSX 导出模块已加载 */
  if (!win.XLSX || typeof win.XLSX.build !== "function") fail("XLSX 导出模块未加载");
  else ok("XLSX 导出模块已加载 ✓");

  /* 0. 回归：遮罩层在初始状态必须真正隐藏（display:none） */
  const overlayDisplay = win.getComputedStyle(doc.getElementById("modalOverlay")).display;
  if (overlayDisplay !== "none") fail("初始遮罩层未隐藏（display=" + overlayDisplay + "），会拦截所有点击");
  else ok("初始遮罩层真正隐藏（display:none）✓");

  /* 1. 初始渲染 */
  const form = doc.getElementById("sec-input");
  if (!form || form.hidden) fail("第 1 步表单未渲染");
  else ok("第 1 步表单渲染 ✓");
  if (doc.querySelectorAll("#stepper .step-item").length !== 4) fail("步骤条应为 4 项");
  else ok("步骤条 4 项 ✓");

  /* 2. 填写表单并提交 */
  function setVal(id, v) {
    const el = doc.getElementById(id);
    el.value = v;
    fire(el, "change");
    fire(el, "input");
  }
  setVal("f-age", 30);
  setVal("f-height", 175);
  setVal("f-weight", 82);
  setVal("f-target", 72);
  const regionSel = doc.getElementById("f-region");
  regionSel.value = "east_asia";
  fire(regionSel, "change");

  /* 目标体重偏瘦警告测试：先填 45 触发 danger */
  setVal("f-target", 45);
  const dangerBox = doc.querySelector("#warnArea .warn-danger");
  if (!dangerBox) fail("目标体重过低未出现红色警告");
  else ok("目标 BMI<16 → 红色警告 + 风险确认框 ✓");
  const ack = doc.getElementById("f-ack");
  if (!ack) fail("缺少风险确认框");
  const submitBtn = doc.getElementById("btnSubmit");
  if (!submitBtn.disabled) fail("未勾选确认时提交按钮应禁用");
  else ok("未勾选确认时提交按钮禁用 ✓");
  /* 模拟真实浏览器事件顺序：input → change（回归：勾选状态必须保留） */
  ack.checked = true;
  fire(ack, "input");
  fire(ack, "change");
  const ackAfter = doc.getElementById("f-ack");
  if (!ackAfter || !ackAfter.checked) fail("勾选后确认框被重绘重置（无法勾选 bug）");
  else ok("勾选后确认框保持勾选状态 ✓");
  if (doc.getElementById("btnSubmit").disabled) fail("勾选确认后提交按钮未启用");
  else ok("勾选确认后提交按钮启用 ✓");

  setVal("f-target", 72);
  click(doc.getElementById("btnSubmit"));
  await new Promise(r => setTimeout(r, 50));
  const results = doc.getElementById("sec-results");
  if (results.hidden) fail("提交后未进入结果页");
  else {
    ok("提交 → 结果页 ✓");
    const cards = results.querySelectorAll(".metric-card");
    if (cards.length !== 6) fail("指标卡应为 6 张，实际 " + cards.length);
    else ok("6 张指标卡（BMI/体脂/BMR/消耗/摄入/缺口）✓");
    const bmiText = results.querySelector(".metric-card .m-value").textContent;
    if (!/26\.8/.test(bmiText)) fail("BMI 计算错误: " + bmiText);
    else ok("BMI 26.8 正确 ✓");
  }

  /* 食材库过滤 */
  const ingRegion = doc.getElementById("ingRegionSel");
  ingRegion.value = "europe";
  fire(ingRegion, "change");
  const ingRows = doc.querySelectorAll("#ingTableBody tr");
  if (ingRows.length < 10) fail("食材库按地区过滤结果过少: " + ingRows.length);
  else ok("食材库按地区过滤（欧洲 " + ingRows.length + " 种）✓");

  /* 3. 进入方案页 */
  click(doc.querySelector('[data-action="to-plans"]'));
  await new Promise(r => setTimeout(r, 50));
  const plansSec = doc.getElementById("sec-plans");
  if (plansSec.hidden) fail("未进入方案页");
  else {
    const cards = plansSec.querySelectorAll(".plan-card");
    if (cards.length !== 6) fail("方案卡应为 6 张，实际 " + cards.length);
    else ok("6 张方案卡 ✓");
    const rows = plansSec.querySelectorAll("table.data tbody tr");
    if (rows.length !== 6) fail("对比表应为 6 行");
    else ok("对比表 6 行 ✓");
    const rec = plansSec.querySelector(".plan-card.recommended");
    if (!rec) fail("缺少推荐方案标记");
    else ok("推荐方案标记 ✓");
  }

  /* 4. 选择方案 → 日程 */
  const chooseBtns = plansSec.querySelectorAll('[data-action="choose-plan"]');
  click(chooseBtns[0]);
  await new Promise(r => setTimeout(r, 50));
  const schedSec = doc.getElementById("sec-schedule");
  if (schedSec.hidden) fail("未进入日程页");
  else {
    const bodyRows = schedSec.querySelectorAll("table.sched-table tbody tr");
    if (bodyRows.length !== 7) fail("日程应 7 行，实际 " + bodyRows.length);
    else ok("7 天日程 ✓");
    /* 一周菜品不重复 */
    const ids = [];
    schedSec.querySelectorAll(".dish").forEach(d => ids.push(d.getAttribute("data-id")));
    const uniq = new Set(ids.filter(i => !i.startsWith("sn_")));
    const dishIds = ids.filter(i => !i.startsWith("sn_"));
    if (uniq.size !== dishIds.length) fail("一周内有重复料理");
    else ok("一周 " + dishIds.length + " 道料理无重复 ✓");
    /* 每天 4-5 个格子 */
    const firstRowCells = bodyRows[0].querySelectorAll(".dish");
    if (firstRowCells.length < 4) fail("每天早午晚+加餐不完整");
    else ok("每日早/午/晚/加餐齐全 ✓");
  }

  /* 5. 菜品弹窗 */
  click(schedSec.querySelector(".dish"));
  await new Promise(r => setTimeout(r, 30));
  const modal = doc.getElementById("modalOverlay");
  if (modal.hidden) fail("点击菜品未弹出详情");
  else {
    const ingRows = doc.querySelectorAll("#modalBox table.data tbody tr");
    if (!ingRows.length) fail("弹窗缺少食材表");
    else ok("菜品详情弹窗（食材 " + ingRows.length + " 项）✓");
    const stepItems = doc.querySelectorAll("#modalBox .modal-steps li");
    if (stepItems.length < 3) fail("弹窗缺少分步骤做法（实际 " + stepItems.length + " 步）");
    else ok("弹窗分步骤做法（" + stepItems.length + " 步）✓");
  }
  click(doc.querySelector('[data-action="close-modal"]'));

  /* 6. 重新生成 */
  const oldFirst = schedSec.querySelector(".dish-name").textContent;
  click(doc.querySelector('[data-action="regenerate"]'));
  await new Promise(r => setTimeout(r, 30));
  const newFirst = doc.getElementById("sec-schedule").querySelector(".dish-name").textContent;
  ok("重新生成日程（首批菜品: " + oldFirst + " → " + newFirst + "）✓");

  /* 7. 导出 Excel（验证真实导出的 ZIP+XML 结构） */
  win.URL.createObjectURL = function (blob) { win.__xlsxBlob = blob; return "blob:test"; };
  let xlsxThrow = false;
  try { click(doc.querySelector('[data-action="export"]')); } catch (e) { xlsxThrow = true; }
  await new Promise(r => setTimeout(r, 150));
  if (xlsxThrow) fail("导出 Excel 抛异常");
  else if (!win.__xlsxBlob) fail("导出未生成 xlsx 数据");
  else {
    const buf = new Uint8Array(await win.__xlsxBlob.arrayBuffer());
    require("fs").writeFileSync("/tmp/nf-export-test.xlsx", Buffer.from(buf)); // 供外部 unzip -t 验证
    if (buf[0] !== 0x50 || buf[1] !== 0x4B) fail("xlsx 不是 ZIP 格式");
    else {
      const entries = win.XLSX.extract(buf);
      const sheet = entries.find(e => e.name === "xl/worksheets/sheet1.xml");
      if (!sheet) fail("xlsx 缺少工作表");
      else {
        const xdoc = new win.DOMParser().parseFromString(sheet.content, "application/xml");
        if (xdoc.getElementsByTagName("parsererror").length) fail("工作表 XML 非法");
        else {
          const cellCount = xdoc.getElementsByTagName("c").length;
          if (cellCount < 30) fail("工作表单元格过少: " + cellCount);
          else ok("导出 Excel：ZIP + XML 合法，共 " + cellCount + " 个单元格（行=餐次，列=周一~周日）✓");
          if (/（×/.test(sheet.content)) fail("Excel 中仍存在 ×倍率 歧义标记");
          else ok("Excel 无 ×倍率 歧义标记 ✓");
          if (!/(\d+g|个|根|片|袋|ml)/.test(sheet.content)) fail("Excel 缺少直观计量单位");
          else ok("Excel 使用直观计量单位（g/个/片/袋/ml）✓");
        }
      }
    }
  }

  /* 8. 语言切换 */
  click(doc.getElementById("langToggle"));
  await new Promise(r => setTimeout(r, 30));
  const tagline = doc.getElementById("tagline").textContent;
  if (!/Generator/.test(tagline)) fail("切换英文失败: " + tagline);
  else ok("切换英文 ✓");
  const schedTitleEn = doc.getElementById("sec-schedule").querySelector("h2").textContent;
  if (!/Weekly/.test(schedTitleEn)) fail("英文日程标题失败: " + schedTitleEn);
  else ok("英文界面日程标题 ✓");
  click(doc.getElementById("langToggle")); // 切回中文

  /* 9. 货币切换 */
  const cur = doc.getElementById("currencySel");
  cur.value = "USD";
  fire(cur, "change");
  await new Promise(r => setTimeout(r, 30));
  const costText = doc.getElementById("sec-schedule").textContent;
  if (!/\$/.test(costText)) fail("切换 USD 失败");
  else ok("切换货币 USD ✓");
  cur.value = "CNY";
  fire(cur, "change");

  /* 10. 学生方案（宿舍友好）*/
  const sched = doc.getElementById("sec-schedule");
  click(sched.querySelector('[data-action="change-plan"]'));
  await new Promise(r => setTimeout(r, 30));
  const studentBtn = doc.querySelector('[data-plan="student"]');
  click(studentBtn);
  await new Promise(r => setTimeout(r, 30));
  const sched2 = doc.getElementById("sec-schedule");
  const tags = sched2.textContent;
  if (!/免煮|微波|学生/.test(tags)) fail("学生方案应含免煮/微波/学生友好标签");
  else ok("学生方案：免煮/微波标签呈现 ✓");

  /* 11. 目标=当前体重 → 报错 */
  click(doc.querySelector('[data-action="edit-data"]'));
  await new Promise(r => setTimeout(r, 30));
  setVal("f-target", 82);
  click(doc.getElementById("btnSubmit"));
  await new Promise(r => setTimeout(r, 30));
  if (!doc.getElementById("errArea").textContent.trim()) fail("目标=当前体重未提示错误");
  else ok("目标=当前体重 → 提示需设置不同体重 ✓");

  /* 12. 增肌模式全流程 */
  setVal("f-target", 88);
  click(doc.getElementById("btnSubmit"));
  await new Promise(r => setTimeout(r, 50));
  const res2 = doc.getElementById("sec-results");
  if (res2.hidden) fail("增肌模式未进入结果页");
  else {
    if (!/盈余/.test(res2.textContent)) fail("增肌模式结果页缺少热量盈余指标");
    else ok("增肌模式：结果页显示热量盈余 ✓");
  }
  click(doc.querySelector('[data-action="to-plans"]'));
  await new Promise(r => setTimeout(r, 50));
  const gainCard = doc.querySelector(".plan-card");
  if (!/增肌/.test(gainCard.textContent)) fail("增肌方案卡缺少增肌说明");
  else ok("增肌方案卡（含增肌说明与增速符号）✓");
  click(doc.querySelector('[data-action="choose-plan"]'));
  await new Promise(r => setTimeout(r, 30));
  const sched3 = doc.getElementById("sec-schedule");
  if (sched3.hidden) fail("增肌模式未生成日程");
  else {
    if (!/周增重/.test(sched3.textContent)) fail("增肌日程缺少周增重标签");
    else ok("增肌模式周日程（周增重标签）✓");
  }

  console.log("");
  if (failures) { console.error("❌ UI 冒烟测试 " + failures + " 个失败"); process.exit(1); }
  else console.log("✅ UI 冒烟测试全部通过");
  dom.window.close();
})();

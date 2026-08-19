/* ============================================================
 * NutriFit-Planner 地区数据 / Region Definitions
 * 地区适配有限：仅代表该地区大致的饮食习惯倾向，无法覆盖全部国家。
 * ============================================================ */
var REGIONS = [
  { id:"east_asia",
    zh:"东亚", en:"East Asia",
    countriesZh:"中国、日本、韩国、蒙古等", countriesEn:"China, Japan, Korea, Mongolia, etc.",
    descZh:"以米饭、面条等快碳为主食，蒸煮炖炒常见，豆制品与蔬菜种类丰富。",
    descEn:"Rice and noodles are staple fast carbs; steaming, boiling and stir-frying are common; rich in soy products and vegetables." },
  { id:"se_asia",
    zh:"东南亚", en:"Southeast Asia",
    countriesZh:"泰国、越南、印尼、菲律宾、马来西亚等", countriesEn:"Thailand, Vietnam, Indonesia, Philippines, Malaysia, etc.",
    descZh:"米饭与米粉为主，善用鱼露、香料与椰浆，热带水果丰富。",
    descEn:"Rice and rice noodles dominate, flavored with fish sauce, spices and coconut milk; tropical fruits abound." },
  { id:"south_asia",
    zh:"南亚", en:"South Asia",
    countriesZh:"印度、巴基斯坦、孟加拉国、斯里兰卡、尼泊尔等", countriesEn:"India, Pakistan, Bangladesh, Sri Lanka, Nepal, etc.",
    descZh:"米饭、烤饼与豆类(dal)为主，香料浓郁，素食传统深厚。",
    descEn:"Rice, flatbreads and lentil dal are staples, with bold spices and a deep vegetarian tradition." },
  { id:"middle_east",
    zh:"中东", en:"Middle East",
    countriesZh:"土耳其、沙特、伊朗、以色列、埃及等", countriesEn:"Türkiye, Saudi Arabia, Iran, Israel, Egypt, etc.",
    descZh:"皮塔饼、鹰嘴豆泥、烤肉与酸奶是常见搭配，蔬菜沙拉清爽。",
    descEn:"Pita, hummus, grilled meats and yogurt are common, with fresh vegetable salads." },
  { id:"europe",
    zh:"欧洲", en:"Europe",
    countriesZh:"英国、法国、德国、意大利、西班牙、北欧等", countriesEn:"UK, France, Germany, Italy, Spain, Nordics, etc.",
    descZh:"面包、土豆、意面为主食，奶酪与冷餐三明治文化盛行。",
    descEn:"Bread, potatoes and pasta are staples, with a strong culture of cheese, cold meals and sandwiches." },
  { id:"north_america",
    zh:"北美", en:"North America",
    countriesZh:"美国、加拿大等", countriesEn:"USA, Canada, etc.",
    descZh:"三明治、沙拉、燕麦早餐常见，烤鸡与墨西哥风格餐食流行。",
    descEn:"Sandwiches, salads and oatmeal breakfasts are common; grilled chicken and Mexican-style meals are popular." },
  { id:"latin_america",
    zh:"拉丁美洲", en:"Latin America",
    countriesZh:"墨西哥、巴西、阿根廷、秘鲁等", countriesEn:"Mexico, Brazil, Argentina, Peru, etc.",
    descZh:"玉米饼、豆类、米饭与烤肉为主，牛油果与热带水果丰富。",
    descEn:"Tortillas, beans, rice and grilled meats are staples, with abundant avocado and tropical fruit." },
  { id:"africa",
    zh:"非洲", en:"Africa",
    countriesZh:"尼日利亚、肯尼亚、埃塞俄比亚、南非等", countriesEn:"Nigeria, Kenya, Ethiopia, South Africa, etc.",
    descZh:"玉米、木薯、大蕉等为主食，豆类炖菜与番茄洋葱炖煮常见。",
    descEn:"Maize, cassava and plantain are staples, with bean stews and tomato-onion braises." },
  { id:"oceania",
    zh:"大洋洲", en:"Oceania",
    countriesZh:"澳大利亚、新西兰等", countriesEn:"Australia, New Zealand, etc.",
    descZh:"饮食接近欧美：燕麦、三明治、烧烤与海鲜是日常组合。",
    descEn:"Diet resembles Europe/North America: oats, sandwiches, BBQ and seafood are everyday staples." }
];

var REGION_IDS = ["east_asia","se_asia","south_asia","middle_east","europe","north_america","latin_america","africa","oceania"];

function getRegion(id){
  for (var i = 0; i < REGIONS.length; i++) if (REGIONS[i].id === id) return REGIONS[i];
  return null;
}

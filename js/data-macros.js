/* ============================================================
 * NutriFit-Planner 食材营养素近似值 / Ingredient Macros (per 100g)
 * p=蛋白质 f=脂肪 c=碳水（克），为公开数据的近似参考值。
 * ============================================================ */
var ING_MACROS = {
/* 主食 */
rice:{p:2.6,f:0.3,c:25.9}, brown_rice:{p:2.6,f:0.9,c:23}, oats:{p:13.2,f:6.5,c:67.7},
millet:{p:11,f:4,c:73}, quinoa:{p:14.1,f:6.1,c:64.2}, buckwheat:{p:13,f:3,c:71},
pasta:{p:13,f:1.5,c:75}, noodles_wheat:{p:11,f:1.5,c:72}, soba:{p:14,f:0.7,c:71},
rice_noodle:{p:7,f:0.7,c:78}, vermicelli:{p:0.2,f:0,c:84},
white_bread:{p:9,f:3.2,c:49}, whole_wheat_bread:{p:13,f:3.5,c:41},
baguette:{p:9,f:2.5,c:52}, rye_bread:{p:8.5,f:3.3,c:48}, tortilla:{p:5.5,f:2.5,c:42},
naan:{p:9,f:5,c:45}, pita:{p:9,f:1.2,c:55.7}, injera:{p:4,f:1,c:26},
steamed_bun:{p:7,f:1,c:47}, baozi_veg:{p:5.5,f:3.5,c:32}, dumpling_wrapper:{p:7,f:1,c:52},
potato:{p:2,f:0.1,c:17.5}, sweet_potato:{p:1.6,f:0.1,c:20}, corn:{p:3.3,f:1.4,c:21.6},
yam:{p:1.5,f:0.2,c:12.4}, plantain:{p:1.3,f:0.4,c:28}, cassava:{p:1.4,f:0.3,c:38},
couscous:{p:12.8,f:0.6,c:77.4}, rice_cake:{p:3,f:0.3,c:35},
/* 蛋白质 */
chicken_breast:{p:31,f:4,c:0}, chicken_thigh:{p:26,f:10.9,c:0}, turkey_breast:{p:29,f:1.8,c:0},
duck_breast:{p:23,f:11,c:0}, lean_pork:{p:21,f:6.2,c:0}, pork_loin:{p:22,f:7,c:0},
beef_lean:{p:26,f:3,c:0}, beef_shank_cooked:{p:29,f:5,c:0}, lamb_lean:{p:25,f:2,c:0},
fish_white:{p:18,f:1,c:0}, salmon:{p:20,f:13,c:0}, tuna_canned:{p:26,f:1,c:0},
sardines_canned:{p:24.6,f:11.5,c:0}, mackerel_canned:{p:23,f:12,c:0},
shrimp:{p:24,f:0.3,c:0.2}, squid:{p:15.6,f:1.4,c:3.1},
egg:{p:13,f:9.5,c:1.1}, salted_duck_egg:{p:12.7,f:14.5,c:2}, century_egg:{p:14,f:11,c:3.5},
tofu:{p:12,f:4.8,c:1.5}, silken_tofu:{p:5,f:2.5,c:1.5}, tofu_skin:{p:20,f:7,c:1.5},
edamame:{p:12,f:5.2,c:8.9}, chickpeas_cooked:{p:8.9,f:2.6,c:26}, lentils_cooked:{p:9,f:0.4,c:20.1},
black_beans_cooked:{p:8.5,f:0.5,c:23}, red_beans_cooked:{p:8,f:0.4,c:23}, kidney_beans_canned:{p:7.5,f:0.3,c:19},
tempeh:{p:19,f:11,c:5}, seitan:{p:24,f:1.5,c:7.5}, fish_ball:{p:12,f:2.5,c:10},
ham_slice:{p:16,f:8,c:1.5}, turkey_slice:{p:20,f:2,c:2}, beef_jerky:{p:33,f:26,c:11},
chicken_rtd:{p:22,f:2,c:1}, beef_rtd:{p:27,f:5,c:2},
/* 乳制品 */
milk:{p:3,f:3.2,c:4.6}, soy_milk:{p:3,f:1.8,c:1.2}, yogurt_plain:{p:5,f:3.3,c:3.5},
greek_yogurt:{p:9,f:5,c:4}, cottage_cheese:{p:11,f:4.3,c:3.4}, cheese:{p:25,f:27,c:1.3},
/* 蔬菜 */
broccoli:{p:2.8,f:0.4,c:4}, cauliflower:{p:2,f:0.3,c:4}, spinach:{p:2.5,f:0.4,c:2.5},
cabbage:{p:1.3,f:0.1,c:4.5}, napa_cabbage:{p:1.1,f:0.2,c:2.7}, bok_choy:{p:1.5,f:0.2,c:1.7},
lettuce:{p:1.2,f:0.2,c:1.8}, kale:{p:2.9,f:0.6,c:4.4}, arugula:{p:2.5,f:0.7,c:2.5},
tomato:{p:0.9,f:0.2,c:3}, cucumber:{p:0.7,f:0.1,c:3}, carrot:{p:0.9,f:0.2,c:9},
bell_pepper:{p:1,f:0.3,c:5}, eggplant:{p:1,f:0.2,c:5}, zucchini:{p:1.2,f:0.2,c:2.6},
mushroom:{p:3,f:0.3,c:2.7}, enoki:{p:2.5,f:0.3,c:5.3}, onion:{p:1.1,f:0.1,c:8.5},
green_onion:{p:1.8,f:0.2,c:4.3}, cilantro:{p:2,f:0.5,c:2.6}, green_beans:{p:1.8,f:0.2,c:5.5},
peas:{p:5.4,f:0.4,c:14}, corn_kernel_can:{p:2.5,f:0.9,c:15}, pumpkin:{p:1,f:0.1,c:5},
winter_melon:{p:0.4,f:0.1,c:2.5}, daikon:{p:0.7,f:0.1,c:3.5}, bitter_melon:{p:1,f:0.2,c:4},
okra:{p:1.9,f:0.2,c:5.5}, asparagus:{p:2.2,f:0.1,c:3}, celery:{p:0.7,f:0.2,c:3},
seaweed:{p:1.3,f:0.2,c:1.7}, bean_sprouts:{p:1.8,f:0.2,c:2.2}, kimchi:{p:1.3,f:0.3,c:4},
sauerkraut:{p:0.9,f:0.1,c:3.7}, pickles:{p:0.3,f:0.1,c:2.4}, frozen_veg_mix:{p:2,f:0.3,c:6},
/* 水果 */
apple:{p:0.3,f:0.2,c:12.5}, banana:{p:1.1,f:0.3,c:20}, orange:{p:0.9,f:0.1,c:11},
grapefruit:{p:0.8,f:0.1,c:9.5}, kiwi:{p:1.1,f:0.5,c:13}, strawberry:{p:0.7,f:0.3,c:6.8},
blueberry:{p:0.7,f:0.3,c:13}, watermelon:{p:0.6,f:0.2,c:6.7}, mango:{p:0.8,f:0.4,c:13.5},
papaya:{p:0.5,f:0.3,c:9.7}, pineapple:{p:0.5,f:0.1,c:12}, dragonfruit:{p:1.1,f:0.4,c:12},
pear:{p:0.4,f:0.1,c:12.5}, grapes:{p:0.7,f:0.2,c:16},
/* 油脂坚果 */
olive_oil:{p:0,f:100,c:0}, peanut_oil:{p:0,f:100,c:0}, butter:{p:0.5,f:79,c:0.1},
peanut_butter:{p:25,f:48,c:16}, tahini:{p:17,f:50,c:19}, hummus:{p:7.5,f:9.5,c:12},
avocado:{p:2,f:14,c:7.5}, peanuts:{p:25,f:48,c:14}, almonds:{p:21,f:49,c:20},
walnuts:{p:15,f:60,c:13}, cashews:{p:18,f:41,c:28}, sunflower_seeds:{p:20,f:48,c:18},
coconut_milk:{p:2.3,f:23,c:4},
/* 调味料 */
soy_sauce:{p:8,f:0.1,c:7}, oyster_sauce:{p:4,f:0,c:25}, fish_sauce:{p:5,f:0,c:3.6},
vinegar:{p:0.1,f:0,c:7}, chili_sauce:{p:1,f:0.5,c:8}, ketchup:{p:1.2,f:0.1,c:26.7},
mustard:{p:4,f:3,c:5.5}, curry_powder:{p:13,f:13,c:40}, miso:{p:12,f:6,c:25},
gochujang:{p:5.5,f:2,c:42}, salsa:{p:1.5,f:0.2,c:4.8}, honey:{p:0.3,f:0,c:75},
jam:{p:0.4,f:0.1,c:62}, sugar:{p:0,f:0,c:100}, spices_mix:{p:10,f:8,c:36}, garlic:{p:6,f:0.5,c:26},
/* 即食 */
instant_oatmeal:{p:11,f:6.5,c:66}, instant_congee:{p:8,f:4,c:78}, instant_rice:{p:3,f:0.5,c:31},
instant_miso_soup:{p:2.5,f:1,c:3}, frozen_dumpling:{p:10,f:9,c:25}, frozen_bun:{p:6,f:4.5,c:31},
granola:{p:10,f:20,c:63}, rice_cracker:{p:7,f:2,c:85}, protein_powder:{p:80,f:6,c:8},
protein_bar:{p:30,f:12,c:40}
};

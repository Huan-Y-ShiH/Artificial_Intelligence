/** 每 100g 近似营养成分（本地演示用，非临床精度） */
const FOOD_PER_100G = {
  苹果: { cal: 52, protein: 0.2, carb: 12.3, fat: 0.2 },
  米饭: { cal: 116, protein: 2.6, carb: 25.6, fat: 0.3 },
  鸡胸肉: { cal: 165, protein: 31, carb: 0, fat: 3.6 },
  鸡蛋: { cal: 144, protein: 13, carb: 1.1, fat: 8.8 },
  燕麦: { cal: 389, protein: 16.9, carb: 66, fat: 6.9 },
  牛奶: { cal: 54, protein: 3, carb: 5, fat: 3.2 },
  香蕉: { cal: 89, protein: 1.1, carb: 23, fat: 0.3 },
  西兰花: { cal: 34, protein: 2.8, carb: 7, fat: 0.4 },
  三文鱼: { cal: 208, protein: 20, carb: 0, fat: 13 },
  豆腐: { cal: 81, protein: 8.1, carb: 4.8, fat: 3.7 },
  牛肉: { cal: 250, protein: 26, carb: 0, fat: 15 },
  番茄: { cal: 18, protein: 0.9, carb: 3.9, fat: 0.2 },
  default: { cal: 100, protein: 3, carb: 15, fat: 3 }
};

function matchFoodKey(name) {
  const n = String(name || '').trim();
  const keys = Object.keys(FOOD_PER_100G).filter((k) => k !== 'default');
  for (let i = 0; i < keys.length; i++) {
    if (n.includes(keys[i])) return keys[i];
  }
  return null;
}

function nutritionForAmount(rawName, grams) {
  const g = Math.max(1, Number(grams) || 100);
  const key = matchFoodKey(rawName);
  const base = key ? FOOD_PER_100G[key] : FOOD_PER_100G.default;
  const r = g / 100;
  const displayName = key || String(rawName).trim() || '食物';
  return {
    name: displayName,
    weight: g,
    calorie: Math.round(base.cal * r * 10) / 10,
    protein: Math.round(base.protein * r * 10) / 10,
    fat: Math.round(base.fat * r * 10) / 10,
    carb: Math.round(base.carb * r * 10) / 10
  };
}

function goalNutrition(goal) {
  const map = {
    减脂: { cal: 1800, protein: 90, fat: 55, carb: 200, water: 2000 },
    增肌: { cal: 2400, protein: 120, fat: 70, carb: 280, water: 2500 },
    维持: { cal: 2000, protein: 70, fat: 65, carb: 250, water: 2000 },
    疾病调理: { cal: 1800, protein: 65, fat: 50, carb: 220, water: 2000 }
  };
  return map[goal] || map.维持;
}

function sumDayNutrients(foodList) {
  const t = { cal: 0, protein: 0, fat: 0, carb: 0 };
  (foodList || []).forEach((item) => {
    t.cal += Number(item.calorie || 0);
    t.protein += Number(item.protein || 0);
    t.fat += Number(item.fat || 0);
    t.carb += Number(item.carb || 0);
  });
  t.cal = Math.round(t.cal * 10) / 10;
  t.protein = Math.round(t.protein * 10) / 10;
  t.fat = Math.round(t.fat * 10) / 10;
  t.carb = Math.round(t.carb * 10) / 10;
  return t;
}

function migrateRecord(saved) {
  if (!saved || typeof saved !== 'object') {
    return { foodList: [], waterMl: 0, waterCount: 0, totalCal: 0 };
  }
  let waterMl = saved.waterMl;
  if (waterMl == null) {
    waterMl = (Number(saved.waterCount) || 0) * 250;
  }
  const foodList = (saved.foodList || []).map((item, idx) => {
    if (item.id) return item;
    const w = item.weight != null ? item.weight : 100;
    const base = nutritionForAmount(item.name, w);
    return {
      id: `legacy-${idx}-${Date.now()}`,
      name: item.name,
      weight: w,
      calorie: Number(item.calorie != null ? item.calorie : base.calorie),
      protein: item.protein != null ? Number(item.protein) : base.protein,
      fat: item.fat != null ? Number(item.fat) : base.fat,
      carb: item.carb != null ? Number(item.carb) : base.carb,
      note: item.note || ''
    };
  });
  let totalCal = saved.totalCal;
  if (totalCal == null) {
    totalCal = sumDayNutrients(foodList).cal;
  }
  return {
    foodList,
    waterMl: Number(waterMl) || 0,
    waterCount: saved.waterCount || 0,
    totalCal: Number(totalCal) || 0
  };
}

module.exports = {
  FOOD_PER_100G,
  nutritionForAmount,
  goalNutrition,
  sumDayNutrients,
  migrateRecord
};

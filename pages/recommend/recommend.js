const { goalNutrition } = require('../../utils/nutrition.js');
const tabBarAutoHide = require('../../utils/tabBarAutoHide.js');
const scrollHost = require('../../utils/scrollHost.js');

const TAGS = ['少盐', '高纤维', '低脂', '少油', '低糖', '高蛋白', '不辣', '素食', '低碳水'];

const MEAL_POOL = [
  {
    name: '牛油果吐司',
    desc: '全麦面包配牛油果泥与少量柠檬汁',
    cal: 350,
    protein: 12,
    fat: 18,
    carb: 38,
    reason: '优质脂肪与膳食纤维兼顾，适合早餐开启代谢。',
    tags: ['高纤维', '素食'],
    types: ['早餐']
  },
  {
    name: '燕麦莓果碗',
    desc: '燕麦片、蓝莓、无糖酸奶',
    cal: 320,
    protein: 14,
    fat: 8,
    carb: 52,
    reason: '低升糖指数碳水，饱腹感好。',
    tags: ['高纤维', '低糖', '高蛋白'],
    types: ['早餐']
  },
  {
    name: '水煮蛋配小米粥',
    desc: '鸡蛋2个、小米蔬菜粥',
    cal: 380,
    protein: 22,
    fat: 14,
    carb: 42,
    reason: '易消化蛋白与温和碳水，适合调理期。',
    tags: ['少油', '高蛋白'],
    types: ['早餐']
  },
  {
    name: '清蒸鸡胸沙拉',
    desc: '鸡胸肉、生菜、番茄、橄榄油少许',
    cal: 420,
    protein: 42,
    fat: 12,
    carb: 18,
    reason: '高蛋白低脂，适合减脂与增肌。',
    tags: ['低脂', '高蛋白', '少油'],
    types: ['午餐', '晚餐']
  },
  {
    name: '番茄豆腐煲',
    desc: '嫩豆腐、番茄、菌菇少盐炖煮',
    cal: 360,
    protein: 20,
    fat: 10,
    carb: 40,
    reason: '植物蛋白与番茄红素，少盐清淡。',
    tags: ['少盐', '素食', '低脂'],
    types: ['午餐', '晚餐']
  },
  {
    name: '三文鱼藜麦饭',
    desc: '煎三文鱼、藜麦、西兰花',
    cal: 520,
    protein: 38,
    fat: 22,
    carb: 48,
    reason: 'Omega-3 与完整蛋白，利于增肌恢复。',
    tags: ['高蛋白', '低脂'],
    types: ['午餐', '晚餐']
  },
  {
    name: '青椒牛肉糙米饭',
    desc: '瘦牛肉、青椒、糙米',
    cal: 580,
    protein: 36,
    fat: 18,
    carb: 62,
    reason: '铁与蛋白补充，适合力量训练日午餐。',
    tags: ['高蛋白', '少油'],
    types: ['午餐']
  },
  {
    name: '冬瓜虾仁汤面（荞麦）',
    desc: '荞麦面、冬瓜、虾仁、少盐汤底',
    cal: 440,
    protein: 28,
    fat: 8,
    carb: 68,
    reason: '低脂清爽，钠可控。',
    tags: ['低脂', '少盐', '高蛋白'],
    types: ['午餐', '晚餐']
  },
  {
    name: '蒜蓉西兰花鸡胸',
    desc: '西兰花、鸡胸丁、蒜末少油快炒',
    cal: 400,
    protein: 40,
    fat: 12,
    carb: 22,
    reason: '高纤维蔬菜配优质蛋白。',
    tags: ['高纤维', '高蛋白', '低脂'],
    types: ['晚餐']
  },
  {
    name: '紫菜蛋花汤配杂粮饭',
    desc: '杂粮饭小碗、紫菜蛋花汤',
    cal: 450,
    protein: 18,
    fat: 10,
    carb: 72,
    reason: '暖胃清淡，适合晚间轻负担。',
    tags: ['少油', '少盐'],
    types: ['晚餐']
  },
  {
    name: '蔬菜鸡肉卷饼',
    desc: '全麦卷饼、生菜、黄瓜、鸡胸条',
    cal: 480,
    protein: 35,
    fat: 14,
    carb: 55,
    reason: '便携均衡，午餐外带也合适。',
    tags: ['低脂', '高蛋白', '高纤维'],
    types: ['午餐']
  },
  {
    name: '菌菇豆腐煲',
    desc: '多种菌菇、豆腐、青菜',
    cal: 340,
    protein: 22,
    fat: 12,
    carb: 38,
    reason: '素食友好，多膳食纤维。',
    tags: ['素食', '高纤维', '低脂'],
    types: ['午餐', '晚餐']
  }
];

const MEAL_TYPE_LABEL = { breakfast: '早餐', lunch: '午餐', dinner: '晚餐' };

function shufflePick(arr, n) {
  const copy = arr.slice();
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const t = copy[i];
    copy[i] = copy[j];
    copy[j] = t;
  }
  return copy.slice(0, n);
}

Page({
  data: {
    tags: TAGS,
    selectedTags: [],
    mealType: 'breakfast',
    mealTypeLabel: '早餐',
    cards: [],
    loading: false,
    profile: {},
    hasProfile: true,
    goalHint: '',
    tabBarHidden: false,
    scrollViewHeight: 667
  },

  onLoad() {
    scrollHost.initPageScrollHeight(this);
  },

  syncTabBar() {
    tabBarAutoHide.reset(this);
    const tb = typeof this.getTabBar === 'function' && this.getTabBar();
    if (tb) tb.setData({ selected: 2 });
  },

  onTabPageScroll(e) {
    tabBarAutoHide.onScroll(e, this);
  },

  onTabPageScrollToUpper() {
    tabBarAutoHide.onScrollToUpper(this);
  },

  onShow() {
    scrollHost.initPageScrollHeight(this);
    this.syncTabBar();
    const profile = wx.getStorageSync('profile') || {};
    const hasGoal = !!profile.goal;
    this.setData({
      profile,
      hasProfile: hasGoal,
      goalHint: hasGoal
        ? `当前目标：${profile.goal} · 推荐热量约 ${goalNutrition(profile.goal).cal} kcal/日`
        : '请先在「我的」中填写资料并选择健康目标，推荐会更准确。'
    });
    if (hasGoal) {
      this.runRecommend(false);
    } else {
      this.setData({ cards: [] });
    }
  },

  toggleTag(e) {
    const tag = e.currentTarget.dataset.tag;
    const set = new Set(this.data.selectedTags);
    if (set.has(tag)) set.delete(tag);
    else set.add(tag);
    this.setData({ selectedTags: Array.from(set) });
  },

  setMealType(e) {
    const mealType = e.currentTarget.dataset.type;
    this.setData({
      mealType,
      mealTypeLabel: MEAL_TYPE_LABEL[mealType] || '早餐'
    });
  },

  filterPool(profile, selectedTags, mealType) {
    const label = MEAL_TYPE_LABEL[mealType];
    let pool = MEAL_POOL.filter((m) => m.types.indexOf(label) >= 0);

    if (profile.vegetarian) {
      pool = pool.filter((m) => m.tags.indexOf('素食') >= 0);
    }

    if (profile.lactoseFree) {
      pool = pool.filter((m) => !/奶|芝士|奶酪|酸奶|乳酪/.test(m.name + m.desc));
    }

    if (selectedTags.length) {
      pool = pool.filter((m) =>
        selectedTags.every((t) => m.tags.indexOf(t) >= 0)
      );
    }

    if (profile.goal === '减脂') {
      pool = pool.filter((m) => m.cal <= 520);
    }
    if (profile.goal === '增肌') {
      pool = pool.filter((m) => m.protein >= 25);
    }

    if (!pool.length) pool = MEAL_POOL.filter((m) => m.types.indexOf(label) >= 0);
    if (!pool.length) pool = MEAL_POOL.slice();
    return pool;
  },

  runRecommend(showLoading) {
    const profile = wx.getStorageSync('profile') || {};
    if (!profile.goal) {
      this.setData({ cards: [], loading: false });
      return;
    }
    if (showLoading) this.setData({ loading: true });
    const pool = this.filterPool(profile, this.data.selectedTags, this.data.mealType);
    setTimeout(() => {
      const cards = shufflePick(pool, 3);
      this.setData({ cards, loading: false });
    }, showLoading ? 600 : 0);
  },

  onGetRecommend() {
    this.runRecommend(true);
  },

  onShuffle() {
    this.runRecommend(true);
  },

  goProfile() {
    wx.switchTab({ url: '/pages/profile/profile' });
  }
});

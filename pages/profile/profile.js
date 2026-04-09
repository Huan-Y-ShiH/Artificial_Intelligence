const tabBarAutoHide = require('../../utils/tabBarAutoHide.js');
const scrollHost = require('../../utils/scrollHost.js');

Page({
  data: {
    userInfo: null,
    profile: {
      gender: '',
      age: null,
      height: null,
      weight: null,
      exerciseFreq: '',
      goal: '',
      vegetarian: false,
      lactoseFree: false,
      targetWeight: null
    },
    exerciseOptions: ['几乎不运动', '每周1-2次', '每周3-5次', '几乎每天'],
    goalOptions: [
      { key: '维持', title: '维持健康', emoji: '❤️' },
      { key: '减脂', title: '减脂瘦身', emoji: '⚖️' },
      { key: '增肌', title: '增肌塑形', emoji: '💪' },
      { key: '疾病调理', title: '疾病调理', emoji: '🏥' }
    ],
    bmiText: '--',
    bmiBadge: '',
    bmiAdvice: '请填写身高、体重以计算 BMI。',
    trendBars: [],
    tabBarHidden: false,
    scrollViewHeight: 667
  },

  onLoad() {
    scrollHost.initPageScrollHeight(this);
  },

  syncTabBar() {
    tabBarAutoHide.reset(this);
    const tb = typeof this.getTabBar === 'function' && this.getTabBar();
    if (tb) tb.setData({ selected: 3 });
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
    const savedProfile = wx.getStorageSync('profile') || {};
    const savedUserInfo = wx.getStorageSync('userInfo');
    const profile = {
      gender: '',
      age: null,
      height: null,
      weight: null,
      exerciseFreq: '',
      goal: '',
      vegetarian: false,
      lactoseFree: false,
      targetWeight: null,
      ...savedProfile
    };
    this.setData({ profile, userInfo: savedUserInfo || null });
    this.refreshBmiAndTrend(profile);
  },

  persistProfile(partial) {
    const profile = { ...this.data.profile, ...partial };
    wx.setStorageSync('profile', profile);
    this.setData({ profile }, () => this.refreshBmiAndTrend(profile));
  },

  refreshBmiAndTrend(profileIn) {
    const profile = profileIn || this.data.profile;
    const h = Number(profile.height);
    const w = Number(profile.weight);
    let bmiText = '--';
    let bmiBadge = '';
    let bmiAdvice = '';

    if (h > 0 && w > 0) {
      const hm = h / 100;
      const bmi = w / (hm * hm);
      const fixed = bmi.toFixed(1);
      bmiText = fixed;
      if (bmi < 18.5) {
        bmiBadge = '偏瘦';
        bmiAdvice =
          'BMI 偏低，注意均衡营养与力量训练，避免过度节食；可增加优质蛋白与健康脂肪。';
      } else if (bmi < 24) {
        bmiBadge = '正常';
        bmiAdvice =
          'BMI 处于正常范围，建议继续保持多样化饮食与规律运动，关注体脂率与肌肉量。';
      } else if (bmi < 28) {
        bmiBadge = '超重';
        bmiAdvice =
          'BMI 略高，可适当控制总热量、减少含糖饮料与夜宵，并循序渐进增加有氧与抗阻训练。';
      } else {
        bmiBadge = '肥胖';
        bmiAdvice =
          'BMI 较高，建议在医生或营养师指导下制定减重计划，从饮食结构与日常步数开始调整。';
      }
    } else {
      bmiAdvice = '请填写身高、体重以计算 BMI。';
    }

    const trendBars = this.buildTrendBars(profile);
    this.setData({ bmiText, bmiBadge, bmiAdvice, trendBars });
  },

  buildTrendBars(profile) {
    const w = Number(profile.weight);
    if (!w || w <= 0) return [];
    const goal = profile.goal;
    let target = Number(profile.targetWeight);
    if (!target || target <= 0) {
      if (goal === '减脂') target = Math.round(w * 0.9 * 10) / 10;
      else if (goal === '增肌') target = Math.round(w * 1.04 * 10) / 10;
      else target = w;
    }
    const labels = ['当前', '1月', '2月', '目标'];
    const pts = [0, 1 / 3, 2 / 3, 1].map((t) =>
      Math.round((w + (target - w) * t) * 10) / 10
    );
    const max = Math.max(...pts, 1);
    const min = Math.min(...pts);
    const span = Math.max(max - min, 0.01);
    return labels.map((label, i) => ({
      label,
      val: pts[i],
      h: Math.round(((pts[i] - min) / span) * 100)
    }));
  },

  onExerciseChange(e) {
    const idx = e.detail.value;
    this.persistProfile({ exerciseFreq: this.data.exerciseOptions[idx] });
  },

  selectGoal(e) {
    const goal = e.currentTarget.dataset.goal;
    this.persistProfile({ goal });
  },

  toggleVege() {
    this.persistProfile({ vegetarian: !this.data.profile.vegetarian });
  },

  toggleLactose() {
    this.persistProfile({ lactoseFree: !this.data.profile.lactoseFree });
  },

  onProfileFieldInput(e) {
    const f = e.currentTarget.dataset.f;
    if (!f) return;
    this.setData({ [`profile.${f}`]: e.detail.value });
  },

  onGenderChange(e) {
    this.setData({ 'profile.gender': e.detail.value || '' });
  },

  onTargetWeightInput(e) {
    const v = e.detail.value;
    this.setData({ 'profile.targetWeight': v === '' ? '' : v });
  },

  saveProfile() {
    const raw = { ...this.data.profile };
    const profile = {
      ...raw,
      age: raw.age === '' || raw.age == null ? null : Number(raw.age),
      height: raw.height === '' || raw.height == null ? null : Number(raw.height),
      weight: raw.weight === '' || raw.weight == null ? null : Number(raw.weight),
      targetWeight:
        raw.targetWeight === '' || raw.targetWeight == null || raw.targetWeight === undefined
          ? null
          : Number(raw.targetWeight)
    };
    if (Number(profile.height) > 0 && Number(profile.weight) > 0) {
      const hm = Number(profile.height) / 100;
      const w = Number(profile.weight);
      profile.BMI = (w / (hm * hm)).toFixed(1);
    } else {
      delete profile.BMI;
    }
    wx.setStorageSync('profile', profile);
    this.setData({ profile }, () => this.refreshBmiAndTrend(profile));
    wx.showToast({ title: '资料已保存', icon: 'success' });
  }
});

const {
  nutritionForAmount,
  goalNutrition,
  sumDayNutrients,
  migrateRecord
} = require('../../utils/nutrition.js');
const tabBarAutoHide = require('../../utils/tabBarAutoHide.js');
const scrollHost = require('../../utils/scrollHost.js');

const DEV_MOCK_USER = {
  nickName: '微信用户',
  avatarUrl:
    'https://mmbiz.qpic.cn/mmbiz/icTdbqWNOwNRna42FI242Lcia07jQodd2FJGIYQfG0LAJGFxM4FbnQP6yfMxBgJ0F3EaOiasW7vbMgoDBpRKhGBPJw/0'
};

Page({
  data: {
    isDev: false,
    showAuthModal: false,
    showGoalModal: false,
    userInfo: null,
    inputMode: 'manual',
    foodWeightGram: 100,
    pending: null,
    foodList: [],
    waterMl: 0,
    totalCal: 0,
    totals: { protein: 0, fat: 0, carb: 0 },
    waterInput: '',
    calGoal: 2000,
    waterGoal: 2000,
    lastFoodSummary: '',
    tabBarHidden: false,
    scrollViewHeight: 667
  },

  noop() {},

  syncTabBar() {
    tabBarAutoHide.reset(this);
    const tb = typeof this.getTabBar === 'function' && this.getTabBar();
    if (tb) tb.setData({ selected: 0 });
  },

  onTabPageScroll(e) {
    tabBarAutoHide.onScroll(e, this);
  },

  onTabPageScrollToUpper() {
    tabBarAutoHide.onScrollToUpper(this);
  },

  getToday() {
    const d = new Date();
    return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
  },

  loadDay() {
    const key = 'record-' + this.getToday();
    const raw = wx.getStorageSync(key);
    const saved = migrateRecord(raw);
    const totals = sumDayNutrients(saved.foodList);
    const last = saved.foodList.length
      ? saved.foodList[saved.foodList.length - 1]
      : null;
    const lastFoodSummary = last
      ? `${last.name} ${last.weight}g · ${last.calorie}千卡 · 蛋${last.protein}g 脂${last.fat}g 碳${last.carb}g`
      : '';
    this.setData({
      foodList: saved.foodList,
      waterMl: saved.waterMl,
      totalCal: totals.cal,
      totals,
      lastFoodSummary
    });
  },

  applyGoalsFromProfile() {
    const profile = wx.getStorageSync('profile') || {};
    const g = goalNutrition(profile.goal);
    this.setData({ calGoal: g.cal, waterGoal: g.water });
  },

  saveTodayData() {
    const { foodList, waterMl } = this.data;
    const totals = sumDayNutrients(foodList);
    wx.setStorageSync('record-' + this.getToday(), {
      foodList,
      waterMl,
      totalCal: totals.cal
    });
    this.setData({ totalCal: totals.cal, totals });
  },

  refreshAuthModals() {
    const userInfo = wx.getStorageSync('userInfo');
    const authDeclined = wx.getStorageSync('authDeclined');
    const profile = wx.getStorageSync('profile') || {};
    const goalDismissed = wx.getStorageSync('goalPromptDismissed');
    const showAuthModal = !userInfo && !authDeclined;
    const showGoalModal =
      !!userInfo &&
      !showAuthModal &&
      !profile.goal &&
      !goalDismissed;
    this.setData({
      userInfo: userInfo || null,
      showAuthModal,
      showGoalModal
    });
  },

  onLoad() {
    scrollHost.initPageScrollHeight(this);
    try {
      const env = wx.getAccountInfoSync().miniProgram.envVersion;
      this.setData({ isDev: env === 'develop' });
    } catch (e) {
      this.setData({ isDev: false });
    }
    this.applyGoalsFromProfile();
    this.loadDay();
    this.refreshAuthModals();
  },

  onShow() {
    scrollHost.initPageScrollHeight(this);
    this.syncTabBar();
    this.applyGoalsFromProfile();
    this.loadDay();
    this.refreshAuthModals();
  },

  onAuthAgree() {
    wx.getUserProfile({
      desc: '我们需要获取您的微信头像与昵称以完善资料',
      success: (res) => {
        wx.setStorageSync('userInfo', res.userInfo);
        this.setData({
          userInfo: res.userInfo,
          showAuthModal: false
        });
        this.refreshAuthModals();
      },
      fail: () => {
        wx.showToast({ title: '可稍后在模拟器使用开发模拟', icon: 'none' });
      }
    });
  },

  onAuthDecline() {
    wx.setStorageSync('authDeclined', true);
    this.setData({ showAuthModal: false });
    this.refreshAuthModals();
  },

  onDevMockLogin() {
    wx.setStorageSync('userInfo', DEV_MOCK_USER);
    wx.removeStorageSync('authDeclined');
    this.setData({ userInfo: DEV_MOCK_USER, showAuthModal: false });
    this.refreshAuthModals();
    wx.showToast({ title: '已模拟登录', icon: 'none' });
  },

  onGoalLater() {
    wx.setStorageSync('goalPromptDismissed', true);
    this.setData({ showGoalModal: false });
  },

  onGoalNow() {
    wx.setStorageSync('goalPromptDismissed', true);
    this.setData({ showGoalModal: false });
    wx.switchTab({ url: '/pages/profile/profile' });
  },

  setInputMode(e) {
    const mode = e.currentTarget.dataset.mode;
    this.setData({ inputMode: mode, pending: null });
  },

  onWeightInput(e) {
    const v = e.detail.value;
    this.setData({ foodWeightGram: v === '' ? '' : Number(v) });
  },

  chooseImage() {
    wx.chooseMedia({
      count: 1,
      mediaType: ['image'],
      sourceType: ['album', 'camera'],
      camera: 'back',
      success: () => {
        wx.showLoading({ title: '识别中...' });
        setTimeout(() => {
          wx.hideLoading();
          const g = Number(this.data.foodWeightGram) || 100;
          const n = nutritionForAmount('苹果', g);
          this.setData({
            pending: {
              ...n,
              note: '图像识别（本地模拟）'
            }
          });
          wx.showToast({ title: '识别完成', icon: 'none' });
        }, 800);
      }
    });
  },

  manualAdd() {
    const g = Number(this.data.foodWeightGram) || 100;
    wx.showModal({
      title: '手动选择食物',
      editable: true,
      placeholderText: '如：苹果、米饭、鸡胸肉',
      success: (res) => {
        if (res.confirm && res.content) {
          const n = nutritionForAmount(res.content, g);
          this.setData({
            pending: {
              ...n,
              note: '手动录入'
            }
          });
        }
      }
    });
  },

  confirmPending() {
    const p = this.data.pending;
    if (!p) return;
    const item = {
      id: 'f-' + Date.now(),
      name: p.name,
      weight: p.weight,
      calorie: p.calorie,
      protein: p.protein,
      fat: p.fat,
      carb: p.carb,
      note: p.note || ''
    };
    const foodList = [...this.data.foodList, item];
    const totals = sumDayNutrients(foodList);
    const lastFoodSummary = `${item.name} ${item.weight}g · ${item.calorie}千卡 · 蛋${item.protein}g 脂${item.fat}g 碳${item.carb}g`;
    this.setData({
      foodList,
      pending: null,
      totalCal: totals.cal,
      totals,
      lastFoodSummary
    });
    this.saveTodayData();
    wx.showToast({ title: '已添加', icon: 'success' });
  },

  cancelPending() {
    this.setData({ pending: null });
  },

  voiceInput() {
    wx.showModal({
      title: '语音输入',
      content: '本地开发未接入语音识别。可将语音内容手动转成文字，在「手动选择」中输入食物名称。',
      confirmText: '去手动录入',
      success: (res) => {
        if (res.confirm) this.manualAdd();
      }
    });
  },

  addWaterPreset(e) {
    const ml = Number(e.currentTarget.dataset.ml) || 0;
    const waterMl = this.data.waterMl + ml;
    this.setData({ waterMl });
    this.saveTodayData();
  },

  onWaterInput(e) {
    this.setData({ waterInput: e.detail.value });
  },

  addWaterManual() {
    const ml = Number(this.data.waterInput);
    if (!ml || ml <= 0) {
      wx.showToast({ title: '请输入有效毫升数', icon: 'none' });
      return;
    }
    this.setData({
      waterMl: this.data.waterMl + ml,
      waterInput: ''
    });
    this.saveTodayData();
  },

  resetWater() {
    this.setData({ waterMl: 0 });
    this.saveTodayData();
  }
});

Page({
    data: {
      // 用户偏好设置（素食、乳糖不耐）
      preference: {
        vegetarian: false,
        lactoseFree: false
      },
      // 今日推荐餐饮方案，将生成 {breakfast: '...', lunch: '...', dinner: '...', note: '...'}
      todayMeals: {},
      // 存储profile数据用于显示健康目标
      profile: {}
    },
    onLoad() {
      // 从缓存读取用户资料
      const profile = wx.getStorageSync('profile');
      if (profile) {
        this.setData({
          profile: profile,
          preference: {
            vegetarian: profile.vegetarian || false,
            lactoseFree: profile.lactoseFree || false
          }
        });
        this.generateRecommendation(profile.goal);
      } else {
        // 若无profile则跳转到资料填写页面
        wx.navigateTo({ url: '/pages/profile/profile' });
      }
    },
    // 根据健康目标生成推荐方案
    generateRecommendation(goal) {
      // 复制模板数据，避免直接修改模板
      const base = JSON.parse(JSON.stringify(this.mealTemplates[goal] || {}));
      // 根据偏好设置进行替换调整
      if (this.data.preference.vegetarian) {
        // 将常见肉类替换为豆制品
        base.breakfast = base.breakfast.replace(/鸡蛋白|鸡胸肉|牛肉|鱼/g, '豆腐');
        base.lunch = base.lunch.replace(/鸡蛋白|鸡胸肉|牛肉|鱼/g, '豆腐');
        base.dinner = base.dinner.replace(/鸡蛋白|鸡胸肉|牛肉|鱼/g, '豆腐');
        base.note += '（已根据素食偏好调整，用豆制品替代肉类）';
      }
      if (this.data.preference.lactoseFree) {
        base.breakfast = base.breakfast.replace(/牛奶|奶酪|酸奶/g, '豆浆');
        base.lunch = base.lunch.replace(/牛奶|奶酪|芝士/g, '');
        base.dinner = base.dinner.replace(/牛奶|奶酪|芝士/g, '');
        base.note += '（已根据乳糖不耐调整，去除乳制品）';
      }
      this.setData({ todayMeals: base });
    },
    // 推荐模板数据
    mealTemplates: {
      '减脂': {
        breakfast: "燕麦粥 + 水煮蛋",
        lunch: "清蒸鸡胸肉 + 时蔬 + 糙米饭",
        dinner: "西兰花 + 烤鱼",
        note: "低热量，高纤维，蛋白质适量"
      },
      '增肌': {
        breakfast: "蛋白质奶昔 + 全麦面包",
        lunch: "牛肉炒彩椒 + 米饭",
        dinner: "鸡胸肉沙拉 + 土豆",
        note: "高蛋白，高热量，辅助增肌"
      },
      '维持': {
        breakfast: "牛奶燕麦 + 水果",
        lunch: "番茄炒蛋 + 青菜 + 米饭",
        dinner: "豆腐汤 + 时蔬 + 米饭",
        note: "营养均衡，维持体重"
      },
      '疾病调理': {
        breakfast: "清粥小菜",
        lunch: "水煮鱼片 + 烫青菜",
        dinner: "全麦馒头 + 清炒蔬菜",
        note: "低油低盐，清淡饮食"
      }
    }
  });
  
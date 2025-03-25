Page({
    data: {
      userInfo: null,
      profile: {
        gender: '',   // 男 or 女
        age: null,
        height: null,
        weight: null,
        exerciseFreq: '',
        goal: ''
      },
      exerciseOptions: ['几乎不运动', '每周1-2次', '每周3-5次', '几乎每天'],
      goalOptions: ['减脂', '增肌', '维持', '疾病调理']
    },
    onLoad() {
      // 读取本地缓存的个人信息
      const savedProfile = wx.getStorageSync('profile');
      const savedUserInfo = wx.getStorageSync('userInfo');
      if (savedProfile) {
        this.setData({ profile: savedProfile });
      }
      if (savedUserInfo) {
        this.setData({ userInfo: savedUserInfo });
      }
    },
    onExerciseChange(e) {
      // picker返回选中索引，通过索引取选项值
      const idx = e.detail.value;
      this.setData({
        'profile.exerciseFreq': this.data.exerciseOptions[idx]
      });
    },
    saveProfile() {
      const profile = this.data.profile;
      // 计算BMI = 体重(kg)/[身高(m)]^2
      if (profile.height && profile.weight) {
        const h = Number(profile.height) / 100;
        const w = Number(profile.weight);
        profile.BMI = (w / (h * h)).toFixed(1);
      }
      // 保存到本地存储
      wx.setStorageSync('profile', profile);
      wx.showToast({ title: '资料已保存', icon: 'success' });
    }
  });
  
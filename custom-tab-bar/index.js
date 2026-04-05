Component({
  data: {
    selected: 0,
    hidden: false,
    safeBottom: 0,
    list: [
      { pagePath: '/pages/record/record', text: '记录', icon: '＋' },
      { pagePath: '/pages/analysis/analysis', text: '分析', icon: '⌁' },
      { pagePath: '/pages/recommend/recommend', text: '推荐', icon: '☺' },
      { pagePath: '/pages/profile/profile', text: '我的', icon: '◎' }
    ]
  },
  lifetimes: {
    attached() {
      let bottom = 0;
      try {
        if (wx.getWindowInfo) {
          bottom = wx.getWindowInfo().safeAreaInsets.bottom || 0;
        } else {
          const s = wx.getSystemInfoSync();
          bottom = (s.safeArea && s.screenHeight - s.safeArea.bottom) || 0;
        }
      } catch (e) {
        bottom = 0;
      }
      this.setData({ safeBottom: bottom });
    }
  },
  methods: {
    switchTab(e) {
      const i = Number(e.currentTarget.dataset.index);
      const path = this.data.list[i].pagePath;
      wx.switchTab({ url: path });
    }
  }
});

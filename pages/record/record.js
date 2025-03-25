Page({
    data: {
      foodList: [],       // 当天记录的食物列表 {name, calorie, note}
      waterCount: 0,      // 饮水杯数
      totalCal: 0         // 总热量
    },
    onLoad() {
      // 每次进入页面，初始化今天的数据（从缓存或全局取）
      const today = this.getToday();
      // 尝试从本地缓存获取当天记录
      const saved = wx.getStorageSync('record-' + today);
      if (saved) {
        this.setData({
          foodList: saved.foodList || [],
          waterCount: saved.waterCount || 0,
          totalCal: saved.totalCal || 0
        });
      }
    },
    // 获取当天日期字符串
    getToday() {
      const d = new Date();
      return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
    },
    // 保存当前记录数据到本地缓存
    saveTodayData() {
      const data = {
        foodList: this.data.foodList,
        waterCount: this.data.waterCount,
        totalCal: this.data.totalCal
      };
      wx.setStorageSync('record-' + this.getToday(), data);
    },
    // 更新总热量
    updateTotalCal() {
      let total = 0;
      this.data.foodList.forEach(item => {
        total += Number(item.calorie || 0);
      });
      this.setData({ totalCal: total });
    },
    // 添加食物记录通用函数
    addFoodItem(name, calorie, note = '') {
      const newItem = { name, calorie: calorie || 0, note };
      this.setData({
        foodList: [...this.data.foodList, newItem]
      });
      this.updateTotalCal();
      this.saveTodayData();
    },
    // 拍照或选图识别
    chooseImage() {
      wx.chooseMedia({
        count: 1,
        mediaType: ['image'],
        sourceType: ['album', 'camera'],
        camera: 'back',
        success: res => {
          const tempFilePath = res.tempFiles[0].tempFilePath;
          wx.showLoading({ title: '识别中...' });
          // 模拟调用图像识别API
          setTimeout(() => {
            wx.hideLoading();
            // 假设识别出苹果，热量52千卡
            this.addFoodItem('苹果', 52, '图像识别结果');
            wx.showToast({ title: '识别完成: 苹果', icon: 'none' });
          }, 1000);
          // 实际开发中，这里应将图片上传到AI识别接口，获取返回的食物名称及营养数据，再调用 addFoodItem
        }
      });
    },
    // 手动添加：简单实现为弹出输入框
    manualInput() {
      const that = this;
      wx.showModal({
        title: '手动添加食物',
        editable: true,
        placeholderText: '输入食物名称和数量，如“米饭100g”',
        success(res) {
          if (res.confirm && res.content) {
            // 简单假设每100g米饭 116 kcal，如有数据库可查询
            let foodName = res.content;
            let cal = 100; // 默认热量占位
            that.addFoodItem(foodName, cal, '手动输入');
          }
        }
      });
    },
    // 语音输入（可选实现）
    voiceInput() {
      wx.showToast({ title: '语音输入功能待实现', icon: 'none' });
      // 实际可考虑接入语音识别插件，将语音转文字再解析成食物项
    },
    // 增加饮水记录
    addWater() {
      this.setData({
        waterCount: this.data.waterCount + 1
      });
      this.saveTodayData();
    },
    // 重置饮水记录
    resetWater() {
      this.setData({ waterCount: 0 });
      this.saveTodayData();
    }
  });
  
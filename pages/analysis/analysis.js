Page({
    data: {
      last7days: [],    // 存放最近7天的营养摄入数据
      alerts: [],       // 异常提醒列表
      suggestion: ''    // 给用户的总体建议
    },
    onLoad() {
      this.loadRecentData(7);    // 加载最近7天数据
      this.analyzeData();
    },
    // 加载最近N天记录
    loadRecentData(days) {
      const result = [];
      const today = new Date();
      for (let i = 0; i < days; i++) {
        let date = new Date(today.getTime() - i * 24 * 60 * 60 * 1000);
        let key = `record-${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
        const record = wx.getStorageSync(key);
        if (record) {
          result.unshift({ 
            date: `${date.getMonth() + 1}/${date.getDate()}`, 
            calorie: record.totalCal || 0 
          });
        } else {
          result.unshift({ date: `${date.getMonth() + 1}/${date.getDate()}`, calorie: 0 });
        }
      }
      this.setData({ last7days: result });
    },
    // 分析数据，找出连续3天异常
    analyzeData() {
      const data = this.data.last7days;
      const alerts = [];
      // 简单示例：如果连续3天总热量为0，则提醒未记录饮食；如果连续3天超过2500 kcal则提醒热量偏高
      for (let i = 0; i < data.length - 2; i++) {
        const c1 = data[i].calorie, c2 = data[i + 1].calorie, c3 = data[i + 2].calorie;
        if (c1 === 0 && c2 === 0 && c3 === 0) {
          alerts.push('最近三天没有记录饮食，请及时记录保持追踪。');
        }
        if (c1 > 2500 && c2 > 2500 && c3 > 2500) {
          alerts.push('您最近三天热量摄入偏高，请注意控制饮食。');
        }
        // 可根据需求添加更多判断条件
      }
      // 根据用户健康目标生成总体建议
      const profile = wx.getStorageSync('profile');
      let suggestion = '';
      if (profile) {
        switch (profile.goal) {
          case '减脂':
            suggestion = '建议适当减少热量摄入，选择低脂高纤维食物，搭配有氧运动。';
            break;
          case '增肌':
            suggestion = '建议增加优质蛋白质摄入，如鸡蛋清、鸡胸肉，并配合力量训练。';
            break;
          case '维持':
            suggestion = '当前饮食基本符合维持体重需求，继续保持均衡饮食习惯。';
            break;
          case '疾病调理':
            suggestion = '请根据医生或营养师建议控制饮食，并定期监测相关营养素摄入。';
            break;
        }
      }
      // 补充一般健康饮食建议（参考中国膳食指南）
      suggestion += ' 多吃蔬菜水果、适量搭配鱼禽蛋肉，少油少盐少糖。';
      this.setData({ alerts, suggestion });
    }
  });
  
// index.js
Page({
    data: {
      userInfo: null
    },
    onGetUserProfile() {
      wx.getUserProfile({
        desc: '用于完善用户资料',
        success: (res) => {
          this.setData({
            userInfo: res.userInfo  // 包含昵称、头像等
          });
          // 可将 userInfo 保存到全局或storage
          wx.setStorageSync('userInfo', res.userInfo);
        },
        fail: (err) => {
          console.log("用户拒绝授权", err);
        }
      });
    },
    onLoad() {
      // 尝试读取缓存的用户信息
      const info = wx.getStorageSync('userInfo');
      if (info) {
        this.setData({ userInfo: info });
      }
    }
  });
  

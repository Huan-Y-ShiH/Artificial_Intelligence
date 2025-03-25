Component({
    properties: {
      // 导航栏标题
      title: {
        type: String,
        value: '首页'
      },
      // 是否显示左侧图标（如返回按钮）
      showLeftIcon: {
        type: Boolean,
        value: false
      },
      // 左侧图标的路径
      leftIcon: {
        type: String,
        value: '/assets/icon-back.png'
      },
      // 是否显示右侧图标（如菜单按钮）
      showRightIcon: {
        type: Boolean,
        value: false
      },
      // 右侧图标的路径
      rightIcon: {
        type: String,
        value: '/assets/icon-menu.png'
      }
    },
    methods: {
      // 左侧图标点击事件，触发 lefttap 自定义事件
      onLeftTap() {
        this.triggerEvent('lefttap');
      },
      // 右侧图标点击事件，触发 righttap 自定义事件
      onRightTap() {
        this.triggerEvent('righttap');
      }
    }
  });
  
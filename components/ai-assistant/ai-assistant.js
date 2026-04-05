const deepseek = require('../../config/deepseek.js');

const SYSTEM_PROMPT =
  '你是「营养健康助手」微信小程序里的 AI 助手。用户会咨询饮食记录、热量、营养素、减重增肌、饮水等问题。请用简洁、口语化的中文回答；不做医疗诊断，涉及疾病请建议遵医嘱；若信息不足可主动追问。回答尽量控制在 200 字以内，除非用户要求详细。';

Component({
  properties: {
    tabBarHidden: {
      type: Boolean,
      value: false
    }
  },

  data: {
    open: false,
    fabBottom: 112,
    messages: [
      {
        id: 'm0',
        role: 'assistant',
        content: '你好，我是营养 AI 助手。可以问我饮食搭配、热量估算、减脂增肌建议等，我会尽量简明回答。'
      }
    ],
    inputValue: '',
    sending: false,
    scrollTo: ''
  },

  observers: {
    tabBarHidden() {
      this.updateFabBottom();
    }
  },

  lifetimes: {
    attached() {
      this._msgSeq = 1;
      this.updateFabBottom();
    }
  },

  methods: {
    updateFabBottom() {
      let safeBottom = 0;
      try {
        if (wx.getWindowInfo) {
          safeBottom = wx.getWindowInfo().safeAreaInsets.bottom || 0;
        } else {
          const s = wx.getSystemInfoSync();
          safeBottom = (s.safeArea && s.screenHeight - s.safeArea.bottom) || 0;
        }
      } catch (e) {
        safeBottom = 0;
      }
      let tabBarPx = 0;
      if (!this.properties.tabBarHidden) {
        try {
          const w = wx.getSystemInfoSync().windowWidth || 375;
          tabBarPx = (120 / 750) * w;
        } catch (e) {
          tabBarPx = 60;
        }
      }
      this.setData({
        fabBottom: tabBarPx + safeBottom + 12
      });
    },

    noop() {},

    togglePanel() {
      this.setData({ open: !this.data.open });
      if (this.data.open) {
        wx.nextTick(() => this.scrollToBottom());
      }
    },

    closePanel() {
      this.setData({ open: false });
    },

    onInput(e) {
      this.setData({ inputValue: e.detail.value });
    },

    scrollToBottom() {
      const list = this.data.messages;
      if (!list.length) return;
      const last = list[list.length - 1];
      this.setData({ scrollTo: 'msg-' + last.id });
    },

    send() {
      const text = (this.data.inputValue || '').trim();
      if (!text || this.data.sending) return;

      if (!deepseek.apiKey) {
        wx.showModal({
          title: '未配置 API Key',
          content:
            '请在本项目 config 目录下复制 deepseek.secret.example.js 为 deepseek.secret.js，并填写 DeepSeek 的 apiKey（参见 https://api-docs.deepseek.com/zh-cn/ ）。',
          showCancel: false
        });
        return;
      }

      const userId = 'm' + Date.now() + '-' + this._msgSeq++;
      const nextMessages = [
        ...this.data.messages,
        { id: userId, role: 'user', content: text }
      ];
      this.setData({
        messages: nextMessages,
        inputValue: '',
        sending: true
      });
      wx.nextTick(() => this.scrollToBottom());

      const apiMessages = [
        { role: 'system', content: SYSTEM_PROMPT },
        ...nextMessages.map((m) => ({ role: m.role, content: m.content }))
      ];

      const url = deepseek.baseUrl.replace(/\/$/, '') + deepseek.chatPath;

      wx.request({
        url,
        method: 'POST',
        header: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer ' + deepseek.apiKey
        },
        data: {
          model: deepseek.model,
          messages: apiMessages,
          stream: false
        },
        success: (res) => {
          this.setData({ sending: false });
          if (res.statusCode === 200 && res.data && res.data.choices && res.data.choices[0]) {
            const reply = res.data.choices[0].message.content || '（无内容）';
            const aid = 'm' + Date.now() + '-' + this._msgSeq++;
            this.setData({
              messages: [...this.data.messages, { id: aid, role: 'assistant', content: reply }]
            });
            wx.nextTick(() => this.scrollToBottom());
          } else {
            const errMsg =
              (res.data && res.data.error && res.data.error.message) ||
              '服务暂时不可用（' + (res.statusCode || '?') + '）';
            wx.showToast({ title: errMsg.slice(0, 20), icon: 'none' });
          }
        },
        fail: () => {
          this.setData({ sending: false });
          wx.showToast({
            title: '网络错误，请检查域名白名单',
            icon: 'none'
          });
        }
      });
    }
  }
});

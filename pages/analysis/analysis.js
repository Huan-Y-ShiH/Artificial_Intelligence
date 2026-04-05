const { goalNutrition, sumDayNutrients, migrateRecord } = require('../../utils/nutrition.js');
const tabBarAutoHide = require('../../utils/tabBarAutoHide.js');
const scrollHost = require('../../utils/scrollHost.js');

function padPickerDate(y, m, d) {
  const mm = m < 10 ? '0' + m : '' + m;
  const dd = d < 10 ? '0' + d : '' + d;
  return `${y}-${mm}-${dd}`;
}

function storageKeyFromPicker(iso) {
  if (!iso) return '';
  const parts = iso.split('-');
  const y = Number(parts[0]);
  const m = Number(parts[1]);
  const d = Number(parts[2]);
  return `record-${y}-${m}-${d}`;
}

Page({
  data: {
    pickerDate: '',
    displayDate: '',
    bars: [],
    trendMode: 7,
    trendPoints: [],
    trendLabels: [],
    trendMax: 1800,
    recCal: 1800,
    smartText: '',
    alerts: [],
    suggestion: '',
    tabBarHidden: false,
    scrollViewHeight: 667
  },

  canvasReady: false,

  onLoad() {
    scrollHost.initPageScrollHeight(this);
  },

  syncTabBar() {
    tabBarAutoHide.reset(this);
    const tb = typeof this.getTabBar === 'function' && this.getTabBar();
    if (tb) tb.setData({ selected: 1 });
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
    this.refreshAll();
  },

  onReady() {
    this.canvasReady = true;
    wx.nextTick(() => this.drawTrendCanvas());
  },

  refreshAll() {
    const d = new Date();
    const iso = padPickerDate(d.getFullYear(), d.getMonth() + 1, d.getDate());
    const pick = this.data.pickerDate || iso;
    if (!this.data.pickerDate) {
      this.setData({ pickerDate: iso });
    }
    this.loadDayBars(pick);
    this.loadTrend();
    this.analyzeRules();
  },

  onDateChange(e) {
    const iso = e.detail.value;
    this.setData({ pickerDate: iso });
    this.loadDayBars(iso);
    this.analyzeRules();
    this.buildSmartTextForSelected(iso);
  },

  setTrendMode(e) {
    const mode = Number(e.currentTarget.dataset.mode) || 7;
    this.setData({ trendMode: mode });
    this.loadTrend();
    wx.nextTick(() => this.drawTrendCanvas());
  },

  loadDayBars(iso) {
    const key = storageKeyFromPicker(iso);
    const raw = wx.getStorageSync(key);
    const saved = migrateRecord(raw);
    const totals = sumDayNutrients(saved.foodList);
    const profile = wx.getStorageSync('profile') || {};
    const rec = goalNutrition(profile.goal);

    const bars = [
      {
        name: '热量',
        inVal: totals.cal,
        recVal: rec.cal,
        unit: 'kcal'
      },
      {
        name: '蛋白质',
        inVal: totals.protein,
        recVal: rec.protein,
        unit: 'g'
      },
      {
        name: '脂肪',
        inVal: totals.fat,
        recVal: rec.fat,
        unit: 'g'
      },
      {
        name: '碳水',
        inVal: totals.carb,
        recVal: rec.carb,
        unit: 'g'
      }
    ];

    const parts = iso.split('-');
    const displayDate = `${parts[0]}年${Number(parts[1])}月${Number(parts[2])}日`;

    this.setData({
      bars,
      displayDate,
      recCal: rec.cal
    });
    this.buildSmartTextForSelected(iso, totals, rec);
    wx.nextTick(() => this.drawTrendCanvas());
  },

  loadTrend() {
    const days = this.data.trendMode;
    const profile = wx.getStorageSync('profile') || {};
    const rec = goalNutrition(profile.goal);
    const today = new Date();
    const points = [];
    const labels = [];
    let maxVal = rec.cal;

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(today.getTime() - i * 86400000);
      const y = date.getFullYear();
      const m = date.getMonth() + 1;
      const d = date.getDate();
      const key = `record-${y}-${m}-${d}`;
      const raw = wx.getStorageSync(key);
      const saved = migrateRecord(raw);
      const totals = sumDayNutrients(saved.foodList);
      const cal = totals.cal;
      if (cal > maxVal) maxVal = cal;
      if (rec.cal > maxVal) maxVal = rec.cal;
      points.push({ cal, rec: rec.cal });
      labels.push(`${m}/${d}`);
    }

    maxVal = Math.max(maxVal * 1.1, 100);
    this.setData({
      trendPoints: points,
      trendLabels: labels,
      trendMax: maxVal
    });
    wx.nextTick(() => this.drawTrendCanvas());
  },

  drawTrendCanvas() {
    if (!this.canvasReady) return;
    const points = this.data.trendPoints;
    if (!points || !points.length) return;

    const query = wx.createSelectorQuery().in(this);
    query
      .select('#trendCanvas')
      .fields({ node: true, size: true })
      .exec((res) => {
        if (!res[0] || !res[0].node) return;
        const canvas = res[0].node;
        const ctx = canvas.getContext('2d');
        const sys = wx.getSystemInfoSync();
        const dpr = sys.pixelRatio || 2;
        const w = res[0].width;
        const h = res[0].height;
        canvas.width = w * dpr;
        canvas.height = h * dpr;
        ctx.scale(dpr, dpr);

        ctx.clearRect(0, 0, w, h);
        ctx.fillStyle = '#f7faf6';
        ctx.fillRect(0, 0, w, h);

        const padL = 44;
        const padR = 16;
        const padT = 20;
        const padB = 36;
        const gw = w - padL - padR;
        const gh = h - padT - padB;
        const maxY = this.data.trendMax || 1800;
        const n = points.length;

        ctx.strokeStyle = '#e8e8e8';
        ctx.lineWidth = 1;
        for (let g = 0; g <= 4; g++) {
          const y = padT + (gh * g) / 4;
          ctx.beginPath();
          ctx.moveTo(padL, y);
          ctx.lineTo(padL + gw, y);
          ctx.stroke();
        }

        function xAt(i) {
          if (n <= 1) return padL + gw / 2;
          return padL + (gw * i) / (n - 1);
        }
        function yAt(val) {
          const t = val / maxY;
          return padT + gh * (1 - Math.min(1, Math.max(0, t)));
        }

        ctx.strokeStyle = '#f5c542';
        ctx.lineWidth = 2;
        ctx.beginPath();
        points.forEach((p, i) => {
          const x = xAt(i);
          const y = yAt(p.rec);
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        });
        ctx.stroke();

        ctx.strokeStyle = '#4a9eff';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        points.forEach((p, i) => {
          const x = xAt(i);
          const y = yAt(p.cal);
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        });
        ctx.stroke();

        points.forEach((p, i) => {
          const x = xAt(i);
          ctx.fillStyle = '#4a9eff';
          ctx.beginPath();
          ctx.arc(x, yAt(p.cal), 4, 0, Math.PI * 2);
          ctx.fill();
        });

        ctx.fillStyle = '#888';
        ctx.font = '10px sans-serif';
        ctx.textAlign = 'center';
        this.data.trendLabels.forEach((lb, i) => {
          ctx.fillText(lb, xAt(i), h - 10);
        });
      });
  },

  buildSmartTextForSelected(iso, totals, rec) {
    const profile = wx.getStorageSync('profile') || {};
    if (!rec) rec = goalNutrition(profile.goal);
    if (!totals) {
      const key = storageKeyFromPicker(iso);
      const saved = migrateRecord(wx.getStorageSync(key));
      totals = sumDayNutrients(saved.foodList);
    }
    const parts = [];
    if (totals.cal < rec.cal * 0.65) {
      parts.push('当日热量摄入明显低于推荐值，可适当增加主食与健康零食，避免过度节食。');
    }
    if (totals.protein < rec.protein * 0.65) {
      parts.push('蛋白质偏低，建议补充鸡蛋、瘦肉、豆制品或鱼类。');
    }
    if (totals.fat > rec.fat * 1.35) {
      parts.push('脂肪摄入偏高，可减少油炸与肥肉，多选蒸煮炖。');
    }
    if (totals.carb > rec.carb * 1.35) {
      parts.push('碳水偏高时可减少精制米面，增加蔬菜比例。');
    }
    if (!parts.length) {
      parts.push('当日营养结构相对均衡，可继续保持记录习惯，并注意饮水与睡眠。');
    }
    parts.push('建议每日饮水约 1500–2000ml，配合适度运动。');
    this.setData({ smartText: parts.join('') });
  },

  analyzeRules() {
    const today = new Date();
    const data = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(today.getTime() - i * 86400000);
      const y = date.getFullYear();
      const m = date.getMonth() + 1;
      const d = date.getDate();
      const key = `record-${y}-${m}-${d}`;
      const saved = migrateRecord(wx.getStorageSync(key));
      const totals = sumDayNutrients(saved.foodList);
      data.unshift({ calorie: totals.cal });
    }

    const alerts = [];
    for (let i = 0; i < data.length - 2; i++) {
      const c1 = data[i].calorie;
      const c2 = data[i + 1].calorie;
      const c3 = data[i + 2].calorie;
      if (c1 === 0 && c2 === 0 && c3 === 0) {
        alerts.push('最近三天没有有效饮食记录，请及时记录以便分析。');
        break;
      }
      if (c1 > 2500 && c2 > 2500 && c3 > 2500) {
        alerts.push('最近三天热量持续偏高，建议适当控制总能量。');
        break;
      }
    }

    const profile = wx.getStorageSync('profile') || {};
    let suggestion = '';
    switch (profile.goal) {
      case '减脂':
        suggestion = '目标减脂：可适当控制油脂与添加糖，增加蔬菜和优质蛋白。';
        break;
      case '增肌':
        suggestion = '目标增肌：保证蛋白质与训练后补充，热量可略盈余。';
        break;
      case '维持':
        suggestion = '维持体重：保持当前均衡模式，定期回顾记录。';
        break;
      case '疾病调理':
        suggestion = '疾病调理：请遵医嘱，本分析仅供参考。';
        break;
      default:
        suggestion = '先在「我的」中设置健康目标，可获得更贴合的建议。';
    }
    suggestion += ' 参考膳食指南：食物多样、谷类为主、少油少盐。';

    this.setData({ alerts, suggestion });
  }
});

/**
 * scroll-view 必须设置固定高度才会在内部滚动并持续触发 bindscroll。
 * 使用窗口可视高度（与微信 navigationBar 配合，一般为页面可用区域高度）。
 */
function initPageScrollHeight(page) {
  if (!page || typeof page.setData !== 'function') return;
  try {
    const s = wx.getWindowInfo ? wx.getWindowInfo() : wx.getSystemInfoSync();
    const h = s.windowHeight || 667;
    page.setData({ scrollViewHeight: h });
  } catch (e) {
    page.setData({ scrollViewHeight: 667 });
  }
}

module.exports = {
  initPageScrollHeight
};

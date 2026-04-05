/**
 * 与「固定高度」的 scroll-view 配合：
 * - 向下滚动（scrollTop 增大）→ 隐藏 TabBar
 * - 向上滚动（scrollTop 减小）或回到顶部附近 → 显示 TabBar
 */

function setHidden(page, hidden) {
  if (!page || typeof page.setData !== 'function') return;
  const tb = typeof page.getTabBar === 'function' && page.getTabBar();
  if (page.data.tabBarHidden === hidden) {
    if (tb && tb.data.hidden !== hidden) tb.setData({ hidden });
    return;
  }
  page.setData({ tabBarHidden: hidden });
  if (tb) tb.setData({ hidden });
}

/**
 * @param {WechatMiniprogram.ScrollViewScroll} e
 * @param {WechatMiniprogram.Page.TrivialInstance} page
 */
function onScroll(e, page) {
  if (!e || !e.detail) return;
  const st = Math.max(0, e.detail.scrollTop);
  if (typeof page._tabLastScrollTop !== 'number') page._tabLastScrollTop = 0;
  const delta = st - page._tabLastScrollTop;
  page._tabLastScrollTop = st;

  // 接近顶部：显示 Tab（阈值略放宽，便于预览时一拉就回）
  if (st <= 48) {
    setHidden(page, false);
    return;
  }
  // 明显向下滚：藏 Tab
  if (delta > 6) {
    setHidden(page, true);
  } else if (delta < -6) {
    setHidden(page, false);
  }
}

function onScrollToUpper(page) {
  setHidden(page, false);
}

function reset(page) {
  if (page && typeof page._tabLastScrollTop === 'number') {
    page._tabLastScrollTop = 0;
  }
  setHidden(page, false);
}

module.exports = {
  onScroll,
  onScrollToUpper,
  reset
};

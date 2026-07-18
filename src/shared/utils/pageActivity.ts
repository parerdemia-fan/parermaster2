/**
 * ページが「見られている」状態かどうかの判定と監視。
 *
 * タブが隠れている（document.hidden）だけでなく、ウィンドウのフォーカスが
 * 他アプリ・他ウィンドウに移っている場合も非アクティブとみなす。
 * 常時動き続ける演出（桜の花びら・紙吹雪リピート等）の一時停止に使う。
 */
export function isPageActive(): boolean {
  return !document.hidden && document.hasFocus()
}

/**
 * アクティブ状態の変化を監視する。状態が実際に切り替わったときだけ
 * callback が呼ばれる。戻り値は監視解除関数。
 */
export function onPageActiveChange(callback: (active: boolean) => void): () => void {
  let last = isPageActive()
  const handler = () => {
    const active = isPageActive()
    if (active === last) return
    last = active
    callback(active)
  }
  document.addEventListener('visibilitychange', handler)
  window.addEventListener('focus', handler)
  window.addEventListener('blur', handler)
  return () => {
    document.removeEventListener('visibilitychange', handler)
    window.removeEventListener('focus', handler)
    window.removeEventListener('blur', handler)
  }
}

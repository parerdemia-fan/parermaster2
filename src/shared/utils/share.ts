/** ローカル環境かどうか */
function isLocal(): boolean {
  const host = window.location.hostname
  return host === 'localhost' || host === '127.0.0.1'
}

/** Xでシェアする。ローカル環境ではダイアログで文言を表示 */
export function shareOnX(text: string): void {
  if (isLocal()) {
    alert(text)
    return
  }
  const url = `https://x.com/intent/tweet?text=${encodeURIComponent(text)}`
  window.open(url, '_blank', 'noopener,noreferrer')
}

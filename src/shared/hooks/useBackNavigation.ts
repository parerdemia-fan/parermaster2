import { useEffect } from 'react'
import { useSettingsStore } from '../../stores/settingsStore.ts'

/**
 * ブラウザバック（popstate）をアプリ内の「戻る」動作にマッピングする。
 * モバイルの画面端スワイプによる意図しないページ離脱を防ぐ。
 *
 * - title: 確認ダイアログ → OK なら離脱、キャンセルなら留まる
 * - quiz: store.requestBack() → QuizScreen 側で確認ダイアログを表示
 * - diagnosis-result: → diagnosis
 * - その他: → title
 */
export function useBackNavigation() {
  useEffect(() => {
    history.pushState({ app: true }, '')

    const handlePopState = () => {
      const { screen, goToTitle, goToDiagnosis, requestBack } = useSettingsStore.getState()

      if (screen === 'title') {
        if (window.confirm('ページを離れますか？')) {
          history.go(-1)
        } else {
          history.pushState({ app: true }, '')
        }
        return
      }

      // title 以外は履歴を補充してからアプリ内遷移
      history.pushState({ app: true }, '')

      if (screen === 'quiz') {
        requestBack()
        return
      }

      if (screen === 'diagnosis-result') {
        goToDiagnosis()
        return
      }

      goToTitle()
    }

    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [])
}

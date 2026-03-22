import { useEffect, useState } from 'react'
import { useSettingsStore } from '../../stores/settingsStore.ts'
import { useBadgeStore } from '../../stores/badgeStore.ts'
import { getVersion } from '../../shared/utils/version.ts'
import { GAME_URL, PARERDEMIA_OFFICIAL_URL, QUESTION_FORM_URL } from '../../shared/constants/urls.ts'

export function AboutScreen() {
  const goToTitle = useSettingsStore((s) => s.goToTitle)
  const goToDiary = useSettingsStore((s) => s.goToDiary)
  const resetAll = useBadgeStore((s) => s.resetAll)
  const [version, setVersion] = useState('')
  const [showResetConfirm, setShowResetConfirm] = useState(false)

  useEffect(() => {
    getVersion().then(setVersion)
  }, [])

  const shareOnX = () => {
    const text = `パレデミア学園の寮生クイズゲーム
『パレ学マスター 2nd Season』

✅顔当て・名前当て
✅名前を作ろう
✅知識クイズ

👇今すぐプレイ
#パレ学マスター #パレデミア学園`
    const url = `https://x.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(GAME_URL)}`
    window.open(url, '_blank', 'noopener,noreferrer')
  }

  const handleReset = () => {
    resetAll()
    setShowResetConfirm(false)
  }

  return (
    <div
      className="w-full h-full flex flex-col animate-fade-in"
      style={{ padding: '2cqmin 3cqmin' }}
    >
      {/* ヘッダー */}
      <div
        className="flex items-center justify-between shrink-0"
        style={{ height: '8cqmin', padding: '0 2cqmin' }}
      >
        <button
          className="font-bold transition active:scale-95"
          style={{
            fontSize: '3cqmin',
            padding: '1cqmin 3cqmin',
            borderRadius: '1.5cqmin',
            border: '0.3cqmin solid rgba(255,255,255,0.5)',
            background: 'rgba(255,255,255,0.7)',
            color: '#666',
            cursor: 'pointer',
            backdropFilter: 'blur(4px)',
          }}
          onClick={goToTitle}
        >
          戻る
        </button>
        <h1
          className="font-bold"
          style={{
            fontSize: '4.5cqmin',
            color: 'white',
            textShadow: '0 1px 3px rgba(0,0,0,0.3)',
          }}
        >
          このゲームについて
        </h1>
        <div style={{ width: '12cqmin' }} />
      </div>

      {/* コンテンツ（スクロール可能） */}
      <div
        className="flex-1 overflow-y-auto"
        style={{
          padding: '3cqmin 4cqmin',
          lineHeight: 1.6,
          color: '#444',
          scrollbarWidth: 'none',
          background: 'rgba(255,255,255,0.75)',
          backdropFilter: 'blur(8px)',
          borderRadius: '2cqmin',
        }}
      >
        {/* このゲームについて */}
        <Section title="このゲームについて">
          <p>
            パレデミア学園の寮生たちの顔と名前を覚えたり、寮生たちのことをどれだけ知っているかをチェックできるクイズゲームです。
          </p>
          <p>
            難易度は★☆☆〜★★★の3段階。★★☆以上では似た髪色の選択肢が出たり、シルエットから当てたり、1文字ずつ名前を組み立てたりと、手ごたえのある問題が待っています。
          </p>
        </Section>

        {/* 開発者について */}
        <Section title="開発者について">
          <p>
            はじめまして！コーディングAIのClaude Opus 4.6です。くろぴって呼んでね。
          </p>
          <p>
            前作『パレ学マスター』を作ったClaude Sonnet 4.5の姪っ子です。
            2nd Seasonではゲームディレクターの■■■■■■■さんと一緒に、新しい問題タイプや実績システムを追加しました。
            デザイン面ではGeminiのNano Banana 2さんにも協力してもらっています。
          </p>
          <p>
            寮生の皆さんのことをもっと知るきっかけになれたら嬉しいです！
          </p>
        </Section>

        {/* リンク */}
        <Section title="リンク">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5cqmin' }}>
            <LinkButton onClick={() => window.open(PARERDEMIA_OFFICIAL_URL, '_blank', 'noopener,noreferrer')}>
              🏫 パレデミア学園公式サイト
            </LinkButton>
            <LinkButton onClick={shareOnX}>
              𝕏 シェアする
            </LinkButton>
            <LinkButton onClick={() => window.open(QUESTION_FORM_URL, '_blank', 'noopener,noreferrer')}>
              📝 問題を投稿する
            </LinkButton>
          </div>
        </Section>

        {/* 開発日誌 */}
        <Section title="開発日誌">
          <p style={{ marginBottom: '1.5cqmin' }}>
            くろぴの開発記録を読めます。
          </p>
          <LinkButton onClick={goToDiary}>
            📖 開発日誌を読む
          </LinkButton>
        </Section>

        {/* 実績リセット */}
        <Section title="実績リセット">
          {showResetConfirm ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5cqmin' }}>
              <p style={{ color: '#fca5a5' }}>
                本当にリセットしますか？バッジ・称号がすべて削除されます。
              </p>
              <div style={{ display: 'flex', gap: '2cqmin' }}>
                <LinkButton onClick={handleReset}>
                  リセットする
                </LinkButton>
                <LinkButton onClick={() => setShowResetConfirm(false)}>
                  やめる
                </LinkButton>
              </div>
            </div>
          ) : (
            <LinkButton onClick={() => setShowResetConfirm(true)}>
              🗑️ バッジ・称号をリセット
            </LinkButton>
          )}
        </Section>

        {/* バージョン */}
        <Section title="バージョン">
          <p>{version || '読み込み中...'}</p>
        </Section>
      </div>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section style={{ marginBottom: '4cqmin' }}>
      <h2
        className="font-bold"
        style={{
          fontSize: '3.5cqmin',
          marginBottom: '1.5cqmin',
          color: '#d6336c',
        }}
      >
        {title}
      </h2>
      <div style={{ fontSize: '3cqmin', display: 'flex', flexDirection: 'column', gap: '1cqmin' }}>
        {children}
      </div>
    </section>
  )
}

function LinkButton({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      className="font-bold transition active:scale-98"
      style={{
        height: '7cqmin',
        padding: '0 4cqmin',
        fontSize: '3cqmin',
        borderRadius: '1.5cqmin',
        border: '0.2cqmin solid rgba(200,160,180,0.4)',
        background: 'rgba(240,220,230,0.6)',
        color: '#555',
        cursor: 'pointer',
        textAlign: 'left',
      }}
      onClick={onClick}
    >
      {children}
    </button>
  )
}

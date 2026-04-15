import { useEffect, useState, lazy, Suspense } from 'react'
import { useSettingsStore } from '../../stores/settingsStore.ts'
import { useBadgeStore } from '../../stores/badgeStore.ts'
import { getVersion } from '../../shared/utils/version.ts'
import { GAME_URL, PARERDEMIA_OFFICIAL_URL, QUESTION_FORM_URL } from '../../shared/constants/urls.ts'
import { shareOnX as doShareOnX } from '../../shared/utils/share.ts'
import { isSoundEnabled, setSoundEnabled } from '../../shared/utils/sound.ts'

const StaffRoll = lazy(() => import('../../shared/components/StaffRoll.tsx'))

export function AboutScreen() {
  const goToTitle = useSettingsStore((s) => s.goToTitle)
  const goToDiary = useSettingsStore((s) => s.goToDiary)
  const goToSkeleton = useSettingsStore((s) => s.goToSkeleton)
  const resetAll = useBadgeStore((s) => s.resetAll)
  const isParerMaster = useBadgeStore((s) => s.isParerMaster)
  const [version, setVersion] = useState('')
  const [showResetConfirm, setShowResetConfirm] = useState(false)
  const [showStaffRoll, setShowStaffRoll] = useState(false)
  const [soundOn, setSoundOn] = useState(isSoundEnabled())

  useEffect(() => {
    getVersion().then(setVersion)
  }, [])

  const shareOnX = () => {
    const text = `パレデミア学園の寮生たちの顔と名前を覚えよう！
『パレ学マスター 2nd Season』

✅顔当て・名前当て・知識クイズ
✅相性診断・タイムアタック
✅おぼえようモード

👇今すぐプレイ
${GAME_URL}
#パレ学マスター #パレ学`
    doShareOnX(text)
  }

  const handleReset = () => {
    resetAll()
    setShowResetConfirm(false)
  }

  return (
    <div className="relative w-full h-full flex flex-col animate-fade-in">
      {/* ヘッダー */}
      <div
        className="w-full flex items-center shrink-0"
        style={{ padding: '2cqmin 3cqmin 0' }}
      >
        <button
          className="font-bold cursor-pointer transition hover:brightness-110 active:scale-95"
          style={{
            fontSize: '4cqmin',
            padding: '1cqmin 2cqmin',
            borderRadius: '2cqmin',
            border: 'none',
            background: 'rgba(255,255,255,0.6)',
            color: '#555',
          }}
          onClick={goToTitle}
        >
          ◀ 戻る
        </button>
        <span
          className="font-bold"
          style={{
            fontSize: '5cqmin',
            marginLeft: '3cqmin',
            color: '#555',
            textShadow: '0 1px 2px rgba(0,0,0,0.1)',
          }}
        >
          案内
        </span>
      </div>

      {/* コンテンツ（スクロール可能） */}
      <div
        className="flex-1 overflow-y-auto"
        style={{
          margin: '2cqmin',
          padding: '3cqmin 4cqmin',
          lineHeight: 1.6,
          color: '#444',
          scrollbarWidth: 'none',
          borderRadius: '3cqmin',
          backgroundColor: 'rgba(255,255,255,0.55)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          boxShadow: '0 0.5cqmin 2cqmin rgba(0,0,0,0.1)',
        }}
      >
        {/* このゲームについて */}
        <Section title="このゲームについて">
          <p>
            パレデミア学園の寮生たちの顔と名前を覚えたり、寮生たちのことをどれだけ知っているかをチェックできるクイズゲームです。
          </p>
          <p>
            「おぼえよう」で顔と名前を覚えて、「顔名前当て」で腕試し、「知識クイズ」で寮生たちをもっと深く知ろう！
          </p>
        </Section>

        {/* 開発者について */}
        <Section title="開発者について">
          <p>
            はじめまして！コーディングAIのClaude Opus 4.6です。くろぴって呼んでね。
          </p>
          <p>
            前作『<a href="https://parerdemia-fan.github.io/parermaster/" target="_blank" rel="noopener noreferrer" style={{ color: '#3b82f6' }}>パレ学マスター</a>』を作ったClaude Sonnet 4.5の末の従姉妹です。
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

        {/* スケルトンパズル */}
        <Section title="スケルトンパズル">
          <p style={{ marginBottom: '1.5cqmin' }}>
            寮生の名前をグリッドに埋めていくパズルです。
          </p>
          <LinkButton onClick={goToSkeleton}>
            🧩 スケルトンパズルで遊ぶ
          </LinkButton>
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

        {/* スタッフロール（パレ学マスター称号で解放） */}
        {isParerMaster() && (
          <Section title="スタッフロール">
            <LinkButton onClick={() => setShowStaffRoll(true)}>
              🎬 スタッフロールを見る
            </LinkButton>
          </Section>
        )}

        {/* 効果音 */}
        <Section title="効果音">
          <LinkButton onClick={() => { const next = !soundOn; setSoundOn(next); setSoundEnabled(next) }}>
            {soundOn ? '🔊 効果音: ON' : '🔇 効果音: OFF'}
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

      {showStaffRoll && (
        <Suspense fallback={null}>
          <StaffRoll onClose={() => setShowStaffRoll(false)} />
        </Suspense>
      )}
    </div>
  )
}

const SECTION_ICONS: Record<string, string> = {
  'このゲームについて': '🎮',
  '開発者について': '🤖',
  'スケルトンパズル': '🧩',
  'リンク': '🔗',
  '開発日誌': '📖',
  '効果音': '🔊',
  'スタッフロール': '🎬',
  '実績リセット': '⚠️',
  'バージョン': '📋',
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  const icon = SECTION_ICONS[title] ?? ''
  return (
    <section style={{ marginBottom: '3cqmin' }}>
      <div
        className="font-bold"
        style={{
          fontSize: '3.2cqmin',
          padding: '0 0 0.8cqmin',
          borderBottom: '0.3cqmin solid #e8789e',
          color: '#d6336c',
          letterSpacing: '0.05em',
          marginBottom: '1.5cqmin',
        }}
      >
        {icon} {title}
      </div>
      <div style={{ fontSize: '3cqmin', display: 'flex', flexDirection: 'column', gap: '1cqmin' }}>
        {children}
      </div>
    </section>
  )
}

function LinkButton({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      className="font-bold cursor-pointer transition hover:brightness-105 active:scale-95"
      style={{
        width: 'fit-content',
        padding: '1.2cqmin 3cqmin',
        fontSize: '3cqmin',
        borderRadius: '5cqmin',
        border: '0.3cqmin solid #e8789e',
        background: 'transparent',
        color: '#d6336c',
      }}
      onClick={onClick}
    >
      {children}
    </button>
  )
}

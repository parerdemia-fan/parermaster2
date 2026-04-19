import { useSettingsStore } from '../../stores/settingsStore.ts'
import { useTalents } from '../../shared/hooks/useTalents.ts'
import { getTalentImagePath } from '../../shared/utils/talent.ts'
import { shareOnX } from '../../shared/utils/share.ts'
import { GAME_URL } from '../../shared/constants/urls.ts'
import { DORM_LABELS } from '../../shared/constants/dorm.ts'
import { getDiagnosisResult, GEN_LABELS, toDiagnosisGenKey } from '../../shared/hooks/useDiagnosis.ts'
import type { Talent } from '../../shared/types/talent.ts'

const RANK_STYLES = [
  { emoji: '🥇', border: 'linear-gradient(135deg, #ffd700, #ffb700)', shadow: 'rgba(200,150,0,0.5)', size: '28cqmin' },
  { emoji: '🥈', border: 'linear-gradient(135deg, #c0c0c0, #a0a0a0)', shadow: 'rgba(120,120,120,0.5)', size: '22cqmin' },
  { emoji: '🥉', border: 'linear-gradient(135deg, #cd7f32, #b06820)', shadow: 'rgba(160,100,30,0.5)', size: '22cqmin' },
]


export function DiagnosisResultScreen() {
  const goToTitle = useSettingsStore((s) => s.goToTitle)
  const goToDiagnosisIntro = useSettingsStore((s) => s.goToDiagnosisIntro)
  const diagnosisGeneration = useSettingsStore((s) => s.diagnosisGeneration)
  const genLabel = GEN_LABELS[toDiagnosisGenKey(diagnosisGeneration)]
  const { talents } = useTalents()

  const result = getDiagnosisResult()

  if (!result || talents.length === 0) {
    return (
      <div className="w-full h-full flex items-center justify-center" style={{ color: '#666', fontSize: '4cqmin' }}>
        読み込み中...
      </div>
    )
  }

  const talentMap = new Map(talents.map((t) => [t.id, t]))
  const top3 = result.top3.map((r) => ({
    talent: talentMap.get(r.talentId),
    similarity: r.similarity,
  })).filter((r): r is { talent: Talent; similarity: number } => r.talent !== undefined)

  const handleShare = () => {
    const lines = top3.map((r, i) =>
      `${RANK_STYLES[i].emoji} ${r.talent.name}（${DORM_LABELS[r.talent.dormitory] ?? ''}）${Math.round(r.similarity * 100)}%`,
    )
    const text = `パレ学マスター 2nd Season 相性診断✨（${genLabel}）
相性の良い寮生は…
${lines.join('\n')}

あなたは誰と相性がいい？
${GAME_URL}
#パレ学マスター #パレ学`
    shareOnX(text)
  }

  return (
    <div className="relative w-full h-full flex flex-col items-center animate-fade-in">
      {/* ヘッダー */}
      <div
        className="font-bold"
        style={{
          marginTop: '4cqmin',
          fontSize: '7cqmin',
          color: '#d6336c',
          textShadow: '0 1px 3px rgba(0,0,0,0.1)',
          letterSpacing: '0.05em',
        }}
      >
        あなたと相性の良い寮生
      </div>

      {/* 結果カード */}
      <div
        className="flex items-center justify-center"
        style={{ gap: '3cqmin', flex: 1 }}
      >
        {/* 2位(左) → 1位(中央) → 3位(右) の表彰台順 */}
        {[1, 0, 2].map((rank) => {
          const entry = top3[rank]
          if (!entry) return null
          const style = RANK_STYLES[rank]
          const pct = Math.round(entry.similarity * 100)
          return (
            <div
              key={rank}
              className="flex flex-col items-center"
              style={{
                marginBottom: rank === 0 ? '2cqmin' : 0,
              }}
            >
              <span style={{ fontSize: rank === 0 ? '5cqmin' : '4cqmin', marginBottom: '1cqmin' }}>
                {style.emoji}
              </span>
              <div
                style={{
                  width: style.size,
                  height: style.size,
                  borderRadius: '2cqmin',
                  overflow: 'hidden',
                  border: '0.5cqmin solid rgba(255,255,255,0.8)',
                  boxShadow: `0 0.5cqmin 2cqmin ${style.shadow}`,
                }}
              >
                <img
                  src={getTalentImagePath(entry.talent)}
                  alt={entry.talent.name}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  draggable={false}
                />
              </div>
              <span
                className="font-bold"
                style={{
                  marginTop: '1cqmin',
                  fontSize: rank === 0 ? '4cqmin' : '3.5cqmin',
                  color: '#444',
                  textShadow: '0 1px 2px rgba(0,0,0,0.1)',
                }}
              >
                {entry.talent.name}
              </span>
              <span
                style={{
                  fontSize: '2.5cqmin',
                  color: '#888',
                }}
              >
                {DORM_LABELS[entry.talent.dormitory] ?? ''}
              </span>
              <span
                className="font-bold"
                style={{
                  marginTop: '0.5cqmin',
                  fontSize: '3cqmin',
                  color: '#d6336c',
                }}
              >
                {pct}%
              </span>
            </div>
          )
        })}
      </div>

      {/* ボタン */}
      <div
        className="flex items-center justify-center"
        style={{ gap: '3cqmin', padding: '3cqmin' }}
      >
        <ActionButton
          label="◀ タイトルに戻る"
          bg="rgba(255,255,255,0.7)"
          color="#555"
          border="0.3cqmin solid #ddd"
          onClick={goToTitle}
        />
        <ActionButton
          label="🔄 もう一度"
          bg="linear-gradient(180deg, #b8d4e8, #7aabc4)"
          color="white"
          border="0.3cqmin solid rgba(255,255,255,0.5)"
          onClick={goToDiagnosisIntro}
        />
        <ActionButton
          label="𝕏 シェアする"
          bg="linear-gradient(180deg, #fcc4dc, #e8789e)"
          color="white"
          border="0.3cqmin solid rgba(255,255,255,0.5)"
          onClick={handleShare}
        />
      </div>
    </div>
  )
}

function ActionButton({
  label,
  bg,
  color,
  border,
  onClick,
}: {
  label: string
  bg: string
  color: string
  border: string
  onClick: () => void
}) {
  return (
    <button
      className="font-bold cursor-pointer transition hover:brightness-105 active:scale-95"
      style={{
        fontSize: '3cqmin',
        padding: '1.5cqmin 3cqmin',
        borderRadius: '5cqmin',
        border,
        background: bg,
        color,
        textShadow: color === 'white' ? '0 1px 2px rgba(0,0,0,0.2)' : undefined,
      }}
      onClick={onClick}
    >
      {label}
    </button>
  )
}

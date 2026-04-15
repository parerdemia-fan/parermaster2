import { getTalentImagePath } from '../utils/talent.ts'
import { CHOICE_PALETTES, NAME_GUESS_ZONES, generatePattern } from '../utils/choiceStyle.ts'
import { useGameStore } from '../../stores/gameStore.ts'
import { useTalents } from '../hooks/useTalents.ts'

interface TalentChoiceButtonsProps {
  answers: string[]
  answerTalentIds: string[]
  correctIndex: number
  isAnswered: boolean
  selected: number | null
  onSelect: (index: number) => void
  /** 回答前から顔画像を表示するか（デフォルト: false = 回答後のみ表示） */
  showIconBeforeAnswer?: boolean
}

/**
 * タレント名4択の共通ボタンコンポーネント
 * 左に顔画像（回答後に表示）、中央に名前テキスト
 * name-guess, blur, spotlight, text-quiz(タレント名選択肢) で共通利用
 */
export function TalentChoiceButtons({
  answers,
  answerTalentIds,
  correctIndex,
  isAnswered,
  selected,
  onSelect,
  showIconBeforeAnswer = false,
}: TalentChoiceButtonsProps) {
  const { talents } = useTalents()
  const currentIndex = useGameStore((s) => s.currentIndex)

  const answerTalents = answerTalentIds.map((id) => talents.find((t) => t.id === id))

  return (
    <>
      {answers.map((answer, i) => {
        const answerTalent = answerTalents[i]
        const faceImagePath = answerTalent ? getTalentImagePath(answerTalent) : undefined
        const showIcon = showIconBeforeAnswer || isAnswered

        const palette = CHOICE_PALETTES[i % CHOICE_PALETTES.length]
        const patternSvg = generatePattern(palette.motif, palette.motifFill, i * 1000 + currentIndex * 7, NAME_GUESS_ZONES)
        let bg = `url("data:image/svg+xml,${patternSvg}") center / 100% auto no-repeat, ${palette.gradient}`
        let borderColor = 'rgba(255,255,255,0.7)'
        let color = '#333'
        let opacity = 1
        let boxShadow = `0 0.5cqmin 1.5cqmin ${palette.outerShadow}, inset 0 1cqmin 3cqmin ${palette.insetShadow}`
        let textShadow = '0 0.1cqmin 0.3cqmin rgba(0,0,0,0.15)'

        if (isAnswered) {
          if (i === correctIndex) {
            bg = 'linear-gradient(135deg, rgba(34,197,94,0.92), rgba(22,163,74,0.92))'
            borderColor = 'rgba(255,255,255,0.8)'
            color = 'white'
            boxShadow = '0 0.4cqmin 1.2cqmin rgba(22,163,74,0.4), inset 0 0.8cqmin 2cqmin rgba(0,80,30,0.2)'
            textShadow = '0 1px 3px rgba(0,0,0,0.3)'
          } else if (i === selected) {
            bg = 'linear-gradient(135deg, rgba(239,68,68,0.92), rgba(220,38,38,0.92))'
            borderColor = 'rgba(255,255,255,0.8)'
            color = 'white'
            boxShadow = '0 0.4cqmin 1.2cqmin rgba(220,38,38,0.4), inset 0 0.8cqmin 2cqmin rgba(100,0,0,0.2)'
            textShadow = '0 1px 3px rgba(0,0,0,0.3)'
          } else {
            opacity = 0.4
          }
        }

        return (
          <button
            key={i}
            className="font-bold transition active:scale-98"
            style={{
              position: 'relative',
              height: '13cqmin',
              fontSize: answer.length <= 8 ? '5cqmin'
                : answer.length <= 9 ? '4.5cqmin'
                : '3.8cqmin',
              padding: 0,
              borderRadius: '2cqmin',
              border: `0.5cqmin solid ${borderColor}`,
              background: bg,
              color,
              opacity,
              cursor: isAnswered ? 'default' : 'pointer',
              boxShadow,
              textShadow,
              overflow: 'hidden',
            }}
            disabled={isAnswered}
            onClick={() => onSelect(i)}
          >
            {/* 顔画像 */}
            <div
              style={{
                position: 'absolute',
                left: 0,
                top: 0,
                width: '13cqmin',
                height: '100%',
                overflow: 'hidden',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: showIcon ? 'transparent' : 'rgba(0,0,0,0.06)',
              }}
            >
              {showIcon && faceImagePath ? (
                <img
                  src={faceImagePath}
                  alt=""
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  draggable={false}
                />
              ) : (
                <span style={{ fontSize: '7cqmin', opacity: 0.25 }}>👤</span>
              )}
            </div>
            {/* テキスト */}
            <span
              style={{
                position: 'absolute',
                inset: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '0 2cqmin 0 7cqmin',
                pointerEvents: 'none',
              }}
            >
              {answer}
            </span>
          </button>
        )
      })}
    </>
  )
}

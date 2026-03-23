import { useState } from 'react'
import { SILHOUETTE_FILTER } from '../../../shared/utils/style.ts'
import { useTalents } from '../../../shared/hooks/useTalents.ts'
import { useGameStore } from '../../../stores/gameStore.ts'
import { getTalentImagePath } from '../../../shared/utils/talent.ts'
import type { NameGuessQuestion } from './types.ts'

const BASE = import.meta.env.BASE_URL
const COMMENT_IMAGE = `${BASE}data/images/kv/sq/25ME006.png`
const COMMENT_NAME = '灯野ぺけ。'
const COMMENT_BEFORE = 'この子の名前、わかる〜？'
const COMMENT_CORRECT = 'すごい！正解だよ〜！'
const COMMENT_WRONG = 'あちゃ〜、残念！'

const LEAF_PATH = 'M0,0 Q-7,-2 -6,-8 Q-6,-13 0,-10 Q6,-13 6,-8 Q7,-2 0,0Z'

/** シード付き簡易乱数（同じシードなら同じ値列） */
function seededRandom(seed: number) {
  let s = seed
  return () => { s = (s * 16807) % 2147483647; return s / 2147483647 }
}

/** モチーフSVG要素を生成 */
function motifSvg(type: 'drop' | 'sakura' | 'clover' | 'sparkle', scale: number, rot: number) {
  const s = scale
  switch (type) {
    case 'drop':
      return `<path d='M0,${-17*s} Q${5*s},${-7*s} ${7*s},0 A${7*s},${7*s} 0 1,1 ${-7*s},0 Q${-5*s},${-7*s} 0,${-17*s}Z' transform='rotate(${rot})'/>`
    case 'sakura':
      return [0,72,144,216,288].map(a => `<ellipse cx='0' cy='${-7*s}' rx='${4.5*s}' ry='${7*s}' transform='rotate(${a + rot})'/>`).join('')
    case 'clover':
      return [0,90,180,270].map(a => `<path d='${LEAF_PATH}' transform='rotate(${a + rot}) scale(${s})'/>`).join('')
    case 'sparkle': {
      const r = 9 * s, ri = 3 * s
      return `<path d='M0,${-r} L${ri*0.38},${-ri*0.38} L${r},0 L${ri*0.38},${ri*0.38} L0,${r} L${-ri*0.38},${ri*0.38} L${-r},0 L${-ri*0.38},${-ri*0.38}Z' transform='rotate(${rot})'/>`
    }
  }
}

// 各装飾の配置エリア（ボタン右半分、互いに被らない矩形、余白込み）
// SVGは500x100、左端〜200は画像+テキスト領域なので装飾は220〜480に配置
const MOTIF_ZONES = [
  { x: 220, y: 20, w: 60, h: 50 },   // 左
  { x: 320, y: 15, w: 60, h: 50 },   // 中央
  { x: 420, y: 20, w: 50, h: 50 },   // 右
]

/** ランダム配置の装飾SVGパターンを生成 */
function generatePattern(type: 'drop' | 'sakura' | 'clover' | 'sparkle', fill: string, seed: number) {
  const rand = seededRandom(seed)
  const items: string[] = []
  const noRotate = type === 'drop' || type === 'sparkle'
  for (const zone of MOTIF_ZONES) {
    const x = zone.x + rand() * zone.w
    const y = zone.y + rand() * zone.h
    const baseScale = type === 'sparkle' ? 2.2 : 1.7
    const scale = baseScale + rand() * 1.0
    const rot = noRotate ? 0 : rand() * 40 - 20
    items.push(`<g transform='translate(${x.toFixed(1)},${y.toFixed(1)})'>${motifSvg(type, scale, rot)}</g>`)
  }
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='500' height='100'><g fill='${fill}'>${items.join('')}</g></svg>`
  return encodeURIComponent(svg)
}

/** 選択肢ボタンのパステルカラーパレット（暖色寒色交互: 水色→薄ピンク→ミントグリーン→薄紫） */
const CHOICE_PALETTES = [
  { // 水色
    gradient: 'linear-gradient(160deg, rgba(215,238,252,0.95) 0%, rgba(170,215,242,0.95) 100%)',
    outerShadow: 'rgba(60,120,170,0.5)',
    insetShadow: 'rgba(50,100,160,0.3)',
    motif: 'drop' as const,
    motifFill: 'rgba(80,150,210,0.18)',
  },
  { // 薄ピンク（サクラ）
    gradient: 'linear-gradient(160deg, rgba(252,218,228,0.95) 0%, rgba(242,180,200,0.95) 100%)',
    outerShadow: 'rgba(170,80,110,0.5)',
    insetShadow: 'rgba(160,70,100,0.3)',
    motif: 'sakura' as const,
    motifFill: 'rgba(200,80,120,0.16)',
  },
  { // ミントグリーン
    gradient: 'linear-gradient(160deg, rgba(210,242,220,0.95) 0%, rgba(170,228,190,0.95) 100%)',
    outerShadow: 'rgba(60,150,90,0.5)',
    insetShadow: 'rgba(50,140,80,0.3)',
    motif: 'clover' as const,
    motifFill: 'rgba(40,150,80,0.16)',
  },
  { // 薄紫（ラベンダー）
    gradient: 'linear-gradient(160deg, rgba(228,215,248,0.95) 0%, rgba(195,175,235,0.95) 100%)',
    outerShadow: 'rgba(100,70,160,0.5)',
    insetShadow: 'rgba(90,60,150,0.3)',
    motif: 'sparkle' as const,
    motifFill: 'rgba(120,80,190,0.18)',
  },
]

interface NameGuessLayoutProps {
  question: NameGuessQuestion
  isAnswered: boolean
  onAnswer: (isCorrect: boolean) => void
}

export function NameGuessLayout({
  question,
  isAnswered,
  onAnswer,
}: NameGuessLayoutProps) {
  return (
    <NameGuessLayoutInner
      key={question.talentId}
      question={question}
      isAnswered={isAnswered}
      onAnswer={onAnswer}
    />
  )
}

function NameGuessLayoutInner({
  question,
  isAnswered,
  onAnswer,
}: NameGuessLayoutProps) {
  const [selected, setSelected] = useState<number | null>(null)
  const { talents } = useTalents()
  const currentIndex = useGameStore((s) => s.currentIndex)
  const questions = useGameStore((s) => s.questions)

  const handleSelect = (index: number) => {
    if (isAnswered) return
    setSelected(index)
    onAnswer(index === question.correctIndex)
  }

  const isCorrect = selected !== null && selected === question.correctIndex
  const talent = talents.find((t) => t.id === question.talentId)
  const total = questions.length
  const progress = total > 0 ? ((currentIndex + 1) / total) * 100 : 0

  const standingImagePath = talent
    ? talent.generation === 2
      ? `${BASE}data/images/face/${talent.id}.png`
      : `${BASE}data/images/kv/orig/${talent.id}.png`
    : question.talentImagePath

  const isStanding = talent ? talent.generation === 1 : false

  // 選択肢のタレント画像パス
  const answerTalents = question.answerTalentIds.map((id) => talents.find((t) => t.id === id))

  return (
    <div
      className="relative"
      style={{ flex: 1, width: '100%', overflow: 'hidden' }}
    >
      {/* 最上部左: シャープラベル */}
      <div
        className="font-bold"
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          zIndex: 10,
          fontSize: '3.2cqmin',
          padding: '1cqmin 3.5cqmin 1cqmin 2.5cqmin',
          background: 'linear-gradient(135deg, #d6336c 0%, #e8789e 100%)',
          color: 'white',
          clipPath: 'polygon(0 0, 100% 0, calc(100% - 1.5cqmin) 100%, 0 100%)',
          textShadow: '0 1px 3px rgba(0,0,0,0.3)',
          letterSpacing: '0.05em',
          whiteSpace: 'nowrap',
        }}
      >
        🔍 名前当て
      </div>

      {/* 最上部中央: 問題文 */}
      <div
        className="font-bold"
        style={{
          position: 'absolute',
          top: 0,
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 10,
          fontSize: '3.8cqmin',
          padding: '0.8cqmin 5cqmin',
          background: 'rgba(255,255,255,0.92)',
          borderRadius: '0 0 1.2cqmin 1.2cqmin',
          color: '#333',
          boxShadow: '0 0.3cqmin 1.2cqmin rgba(0,0,0,0.12)',
          border: '0.15cqmin solid rgba(0,0,0,0.06)',
          whiteSpace: 'nowrap',
        }}
      >
        この生徒の名前は？
      </div>

      {/* 進捗バー（中央） */}
      <div
        style={{
          position: 'absolute',
          top: '9cqmin',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '30%',
          zIndex: 10,
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: '0.3cqmin' }}>
          <span style={{
            fontSize: '2.2cqmin',
            color: 'white',
            textShadow: '0 1px 3px rgba(0,0,0,0.5), 0 0 6px rgba(0,0,0,0.2)',
            fontWeight: 'bold',
          }}>
            達成度: {currentIndex + 1}/{total}
          </span>
        </div>
        <div
          style={{
            height: '1.5cqmin',
            background: 'rgba(255,255,255,0.4)',
            borderRadius: '1cqmin',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              height: '100%',
              width: `${progress}%`,
              background: 'linear-gradient(90deg, #4ade80, #22c55e)',
              borderRadius: '1cqmin',
              transition: 'width 0.3s',
            }}
          />
        </div>
      </div>

      {/* アシスタント（右上） */}
      <div
        style={{
          position: 'absolute',
          top: '5cqmin',
          right: '2cqmin',
          zIndex: 10,
        }}
      >
        {/* カード + はみ出し画像の基準 */}
        <div style={{ position: 'relative' }}>
          {/* 角丸長方形カード（テキスト左 + 画像背景右） */}
          <div
            style={{
              display: 'flex',
              alignItems: 'stretch',
              height: '10cqmin',
              borderRadius: '1.5cqmin',
              overflow: 'hidden',
              border: '0.3cqmin double rgba(150,150,150,0.6)',
              boxShadow: '0 0.3cqmin 1cqmin rgba(0,0,0,0.12)',
            }}
          >
            {/* テキスト部分（白背景 + 吹き出し尖り） */}
            <div
              style={{
                position: 'relative',
                padding: '1.8cqmin 1.5cqmin 1.8cqmin 2cqmin',
                fontSize: '1.9cqmin',
                color: '#444',
                lineHeight: 1.5,
                maxWidth: '18cqmin',
                background: 'white',
                display: 'flex',
                alignItems: 'center',
              }}
            >
              {!isAnswered
                ? COMMENT_BEFORE
                : isCorrect
                  ? COMMENT_CORRECT
                  : COMMENT_WRONG}
              {/* 吹き出しの尖り（右向き三角） */}
              <div
                style={{
                  position: 'absolute',
                  top: '50%',
                  right: '-0.8cqmin',
                  transform: 'translateY(-50%)',
                  width: 0,
                  height: 0,
                  borderTop: '1.2cqmin solid transparent',
                  borderBottom: '1.2cqmin solid transparent',
                  borderLeft: '1.2cqmin solid white',
                }}
              />
            </div>
            {/* 画像背景部分（薄暖色） */}
            <div
              style={{
                width: '13cqmin',
                flexShrink: 0,
                background: 'rgba(255, 225, 200, 0.6)',
              }}
            />
          </div>
          {/* タレント画像（上にはみ出し、下はカード下辺で見切れ） */}
          <img
            src={COMMENT_IMAGE}
            alt={COMMENT_NAME}
            style={{
              position: 'absolute',
              right: '-0.5cqmin',
              bottom: 0,
              width: '14cqmin',
              clipPath: 'inset(-999px -999px 0 -999px)',
              pointerEvents: 'none',
            }}
            draggable={false}
          />
        </div>
        {/* タレント名ラベル（下辺に重なるオレンジ角丸ラベル） */}
        <div
          style={{
            position: 'relative',
            zIndex: 1,
            marginTop: '-1.5cqmin',
            display: 'flex',
            justifyContent: 'flex-end',
            paddingRight: '0.5cqmin',
          }}
        >
          <div
            style={{
              padding: '0.3cqmin 2cqmin',
              fontSize: '1.6cqmin',
              color: 'white',
              background: 'linear-gradient(135deg, #f0a050, #e08830)',
              borderRadius: '1cqmin',
              fontWeight: 'bold',
              textShadow: '0 1px 2px rgba(0,0,0,0.2)',
              whiteSpace: 'nowrap',
            }}
          >
            {COMMENT_NAME}
          </div>
        </div>
      </div>

      {/* 立ち絵（大きく表示、下ははみ出し） */}
      <img
        src={standingImagePath}
        alt="誰でしょう？"
        style={{
          position: 'absolute',
          left: isStanding ? '-2%' : '3%',
          top: isStanding ? '0cqmin' : '5cqmin',
          height: isStanding ? '150cqmin' : '75cqmin',
          width: 'auto',
          objectFit: 'contain',
          zIndex: 2,
          filter: question.isSilhouette && !isAnswered
            ? SILHOUETTE_FILTER
            : undefined,
          transition: 'filter 0.3s',
          borderRadius: isStanding ? undefined : '3cqmin',
        }}
        draggable={false}
      />

      {/* プロフィール（左、立ち絵の腰あたりに重なる） */}
      {talent && (
        <div
          style={{
            position: 'absolute',
            bottom: '12cqmin',
            left: '10cqmin',
            width: '34%',
            padding: '1.5cqmin 2.5cqmin',
            background: 'rgba(255,255,255,0.6)',
            backdropFilter: 'blur(12px)',
            borderRadius: '1.5cqmin',
            border: '0.15cqmin solid rgba(0,0,0,0.06)',
            boxShadow: '0 0.3cqmin 1.2cqmin rgba(0,0,0,0.1)',
            fontSize: '2.3cqmin',
            lineHeight: 1.6,
            color: '#444',
            zIndex: 3,
            maxHeight: '28cqmin',
            overflowY: 'auto',
            scrollbarWidth: 'none' as const,
          }}
        >
          {talent.dream && <div>夢：{talent.dream}</div>}
          {talent.hobbies.length > 0 && (
            <div>趣味：{talent.hobbies.join('、')}</div>
          )}
          {talent.favorites.length > 0 && (
            <div>好き：{talent.favorites.join('、')}</div>
          )}
          {talent.skills.length > 0 && (
            <div>特技：{talent.skills.join('、')}</div>
          )}
        </div>
      )}

      {/* 選択肢（右半分） */}
      <div
        className="flex flex-col justify-center"
        style={{
          position: 'absolute',
          top: '12cqmin',
          right: '2.5cqmin',
          bottom: '2cqmin',
          width: '48%',
          gap: '2cqmin',
          zIndex: 3,
        }}
      >
        {question.answers.map((answer, i) => {
          const answerTalent = answerTalents[i]
          const faceImagePath = answerTalent ? getTalentImagePath(answerTalent) : undefined

          const palette = CHOICE_PALETTES[i % CHOICE_PALETTES.length]
          const patternSvg = generatePattern(palette.motif, palette.motifFill, i * 1000 + currentIndex * 7)
          let bg = `url("data:image/svg+xml,${patternSvg}") center / 100% auto no-repeat, ${palette.gradient}`
          let borderColor = 'rgba(255,255,255,0.7)'
          let color = '#333'
          let opacity = 1
          let boxShadow = `0 0.5cqmin 1.5cqmin ${palette.outerShadow}, inset 0 1cqmin 3cqmin ${palette.insetShadow}`
          let textShadow = '0 0.1cqmin 0.3cqmin rgba(0,0,0,0.15)'

          if (isAnswered) {
            if (i === question.correctIndex) {
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
                height: '13cqmin',
                fontSize: answer.length <= 6 ? '4.5cqmin'
                  : answer.length <= 8 ? '4.2cqmin'
                  : '3.8cqmin',
                padding: '0 3cqmin 0 0',
                borderRadius: '2cqmin',
                border: `0.5cqmin solid ${borderColor}`,
                background: bg,
                color,
                opacity,
                cursor: isAnswered ? 'default' : 'pointer',
                textAlign: 'left',
                boxShadow,
                textShadow,
                display: 'flex',
                alignItems: 'center',
                gap: '2cqmin',
                overflow: 'hidden',
              }}
              disabled={isAnswered}
              onClick={() => handleSelect(i)}
            >
              {/* 顔画像: 回答前はシルエット、回答後は実画像 */}
              <div
                style={{
                  width: '13cqmin',
                  height: '100%',
                  overflow: 'hidden',
                  flexShrink: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: isAnswered ? 'transparent' : 'rgba(0,0,0,0.06)',
                }}
              >
                {isAnswered && faceImagePath ? (
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
              <span style={{ flex: 1 }}>{answer}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

import { useState, useCallback, useMemo, useEffect } from 'react'
import { useSettingsStore } from '../../stores/settingsStore.ts'
import { useTalents } from '../../shared/hooks/useTalents.ts'
import { getTalentImagePath } from '../../shared/utils/talent.ts'
import { playSound } from '../../shared/utils/sound.ts'
import { AnswerFeedbackLabel } from '../../shared/components/AnswerFeedbackLabel.tsx'
import { shuffleArray } from '../../shared/utils/array.ts'
import type { Talent } from '../../shared/types/talent.ts'

type Phase = 'memorize' | 'test' | 'complete'

/** テスト1問分のデータ */
interface TestQuestion {
  target: Talent
  choices: Talent[] // シャッフル済みの3択
}

export function LearningScreen() {
  const { modeCategory, generation, scope } = useSettingsStore()
  const goToTitle = useSettingsStore((s) => s.goToTitle)
  const { talents } = useTalents()

  const allTargets = useMemo(() => {
    const isDormMode = modeCategory === 'dorm'
    const gen = generation === 'gen2' ? 2 : 1
    const filtered = isDormMode
      ? talents.filter((t) => t.dormitory === scope)
      : talents.filter((t) => t.generation === gen)
    return shuffleArray(filtered)
  }, [talents, modeCategory, generation, scope])

  const totalCount = allTargets.length

  const [queue, setQueue] = useState<Talent[]>([])
  const [learnedSet, setLearnedSet] = useState<Set<string>>(new Set())
  const [phase, setPhase] = useState<Phase>('memorize')
  const [currentGroup, setCurrentGroup] = useState<Talent[]>([])
  // テスト用: シャッフルされた出題順と各問の選択肢
  const [testQuestions, setTestQuestions] = useState<TestQuestion[]>([])
  const [testIndex, setTestIndex] = useState(0)
  const [selected, setSelected] = useState<number | null>(null)
  const [initialized, setInitialized] = useState(false)
  // カードのフェードアウト/イン制御
  const [cardsVisible, setCardsVisible] = useState(true)
  // 直前の回答の正誤（ポップアップ表示用）
  const [lastCorrect, setLastCorrect] = useState<boolean | null>(null)

  // 3人組を取り出す
  const pickNextGroup = useCallback((q: Talent[], learned: Set<string>) => {
    const group: Talent[] = []
    const remaining = [...q]

    while (group.length < 3 && remaining.length > 0) {
      group.push(remaining.shift()!)
    }

    if (group.length < 3 && learned.size > 0) {
      const learnedTalents = allTargets.filter((t) => learned.has(t.id) && !group.some((g) => g.id === t.id))
      const shuffled = shuffleArray(learnedTalents)
      while (group.length < 3 && shuffled.length > 0) {
        group.push(shuffled.shift()!)
      }
    }

    setQueue(remaining)
    setCurrentGroup(shuffleArray(group))
    setPhase('memorize')
    setTestIndex(0)
    setSelected(null)
    setTestQuestions([])
  }, [allTargets])

  // 初回
  useEffect(() => {
    if (allTargets.length > 0 && !initialized) {
      setInitialized(true)
      const q = [...allTargets]
      setQueue(q)
      pickNextGroup(q, new Set())
    }
  }, [allTargets, initialized, pickNextGroup])

  // フェードアウト→データ切替→フェードインのヘルパー
  const fadeTransition = useCallback((action: () => void) => {
    setLastCorrect(null)
    setCardsVisible(false)
    setTimeout(() => {
      action()
      setCardsVisible(true)
    }, 750)
  }, [])

  // 暗記→テストに移る時にテスト問題を生成
  const startTest = useCallback(() => {
    playSound('tap')
    fadeTransition(() => {
      const questions: TestQuestion[] = shuffleArray([...currentGroup]).map((target) => ({
        target,
        choices: shuffleArray([...currentGroup]),
      }))
      setTestQuestions(questions)
      setTestIndex(0)
      setSelected(null)
      setPhase('test')
    })
  }, [currentGroup, fadeTransition])

  const handleTestSelect = useCallback((choiceIndex: number) => {
    if (selected !== null || testQuestions.length === 0) return
    playSound('tap')
    setSelected(choiceIndex)

    const q = testQuestions[testIndex]
    const isCorrect = q.choices[choiceIndex].id === q.target.id

    setLastCorrect(isCorrect)
    playSound(isCorrect ? 'correct' : 'incorrect')

    // 正解/不正解表示後、フェードで次へ（不正解時は正解を確認する時間を長めに）
    const delay = isCorrect ? 1000 : 1800
    setTimeout(() => {
      const newLearnedSet = new Set(learnedSet)
      let newQueue = [...queue]

      if (isCorrect) {
        newLearnedSet.add(q.target.id)
      } else {
        if (!newQueue.some((t) => t.id === q.target.id)) {
          newQueue.push(q.target)
        }
      }

      setLearnedSet(newLearnedSet)

      const nextTestIndex = testIndex + 1
      if (nextTestIndex < testQuestions.length) {
        // 中間問題でもキューを永続化（不正解の人がキューに戻るようにする）
        setQueue(newQueue)
        // 次のテスト問題へフェード遷移
        fadeTransition(() => {
          setTestIndex(nextTestIndex)
          setSelected(null)
        })
      } else {
        newQueue = newQueue.filter((t) => !newLearnedSet.has(t.id))
        setQueue(newQueue)

        if (newQueue.length === 0 && newLearnedSet.size >= totalCount) {
          setPhase('complete')
          playSound('perfect')
        } else {
          // 次のグループへフェード遷移
          fadeTransition(() => {
            pickNextGroup(newQueue, newLearnedSet)
          })
        }
      }
    }, delay)
  }, [selected, testQuestions, testIndex, learnedSet, queue, totalCount, pickNextGroup, fadeTransition])

  if (talents.length === 0 || totalCount === 0) {
    return (
      <div className="w-full h-full flex items-center justify-center" style={{ color: '#666', fontSize: '4cqmin' }}>
        読み込み中...
      </div>
    )
  }

  const learnedCount = learnedSet.size
  const currentTestQ = testQuestions[testIndex]

  return (
    <div className="relative w-full h-full flex flex-col animate-fade-in">
      {/* ヘッダー */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 30,
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'stretch',
            height: '14cqmin',
            background: 'rgba(0,0,0,0.35)',
            backdropFilter: 'blur(8px)',
            color: 'white',
          }}
        >
          {/* 左: タイプラベル */}
          <div style={{ flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
            <div
              className="font-bold"
              style={{
                fontSize: '3cqmin',
                padding: '0.8cqmin 3.5cqmin 0.8cqmin 2.5cqmin',
                background: 'linear-gradient(135deg, #e8789e 0%, #f49aba 100%)',
                clipPath: 'polygon(0 0, 100% 0, calc(100% - 1.5cqmin) 100%, 0 100%)',
                letterSpacing: '0.05em',
                whiteSpace: 'nowrap',
              }}
            >
              📖 おぼえよう
            </div>
          </div>

          {/* 中央: モード名 */}
          <div
            className="font-bold"
            style={{
              flex: 1,
              minWidth: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '5cqmin',
              textShadow: '0 1px 3px rgba(0,0,0,0.5)',
            }}
          >
            {phase === 'memorize' && 'この3人をおぼえよう！'}
            {phase === 'test' && currentTestQ && `${currentTestQ.target.name} はどれ？`}
            {phase === 'complete' && '全員おぼえたね！'}
          </div>

          {/* 右: プログレスリング */}
          <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center', paddingRight: '2cqmin' }}>
            <ProgressRing learned={learnedCount} total={totalCount} />
          </div>
        </div>
      </div>

      {/* 左下: やめるボタン */}
      <button
        className="font-bold cursor-pointer transition hover:brightness-110 active:scale-95"
        style={{
          position: 'absolute',
          left: '2cqmin',
          bottom: '2cqmin',
          fontSize: '2.5cqmin',
          padding: '1cqmin 2.5cqmin',
          borderRadius: '5cqmin',
          border: 'none',
          background: 'rgba(255,255,255,0.7)',
          color: '#666',
          zIndex: 20,
          boxShadow: '0 0.2cqmin 0.8cqmin rgba(0,0,0,0.1)',
          backdropFilter: 'blur(6px)',
        }}
        onClick={() => { playSound('tap'); goToTitle() }}
      >
        やめる
      </button>

      {/* メインコンテンツ */}
      {phase === 'memorize' && (
        <MemorizePhase group={currentGroup} onMemorized={startTest} cardsVisible={cardsVisible} />
      )}

      {phase === 'test' && currentTestQ && (
        <>
          {lastCorrect !== null && (
            <div style={{
              position: 'absolute',
              top: '17cqmin',
              left: 0,
              right: 0,
              height: '10cqmin',
              zIndex: 40,
            }}>
              <div style={{ position: 'relative', width: '100%', height: '100%' }}>
                <AnswerFeedbackLabel
                  key={`feedback-${testIndex}-${lastCorrect}`}
                  isCorrect={lastCorrect}
                  isTimeAttack={false}
                />
              </div>
            </div>
          )}
          <TestPhase
            question={currentTestQ}
            selected={selected}
            onSelect={handleTestSelect}
            cardsVisible={cardsVisible}
          />
        </>
      )}

      {phase === 'complete' && (
        <CompletePhase learnedCount={learnedCount} onBack={goToTitle} />
      )}
    </div>
  )
}

/* ── 暗記フェーズ ── */

const IMG_SIZE = '40cqmin'

function talentNameFontSize(name: string): string {
  if (name.length <= 5) return '4.5cqmin'
  if (name.length <= 7) return '3.8cqmin'
  return '3.2cqmin'
}

/* ── 3人のカード表示（暗記・テスト共通） ── */

function TalentCards({
  group,
  showNames,
  visible = true,
  interactive,
  correctId,
  selected,
  isAnswered,
  onSelect,
}: {
  group: Talent[]
  showNames: boolean
  visible?: boolean
  interactive?: boolean
  correctId?: string
  selected?: number | null
  isAnswered?: boolean
  onSelect?: (index: number) => void
}) {
  return (
    <div
      className="flex items-center justify-center"
      style={{
        position: 'absolute',
        top: '16cqmin',
        bottom: '3cqmin',
        left: 0,
        right: 0,
        zIndex: 3,
        gap: '3cqmin',
        opacity: visible ? 1 : 0,
        transition: 'opacity 0.375s ease',
      }}
    >
      {group.map((talent, i) => {
        const isCorrect = correctId ? talent.id === correctId : false
        const isSelected = selected === i
        const answered = isAnswered ?? false

        let borderColor = 'rgba(255,255,255,0.8)'
        let opacity = 1
        let shadow = '0 0.5cqmin 2cqmin rgba(0,0,0,0.15)'

        if (interactive && answered) {
          if (isCorrect) {
            borderColor = 'rgba(34,197,94,0.9)'
            shadow = '0 0.5cqmin 2cqmin rgba(34,197,94,0.4)'
          } else if (isSelected) {
            borderColor = 'rgba(239,68,68,0.9)'
            shadow = '0 0.5cqmin 2cqmin rgba(239,68,68,0.4)'
          } else {
            opacity = 0.4
          }
        }

        const nameVisible = showNames || (interactive && answered)

        return (
          <button
            key={talent.id}
            className="flex flex-col items-center transition"
            style={{
              background: 'none',
              border: 'none',
              padding: 0,
              cursor: interactive && !answered ? 'pointer' : 'default',
              opacity,
              gap: '1.5cqmin',
            }}
            disabled={!interactive || answered}
            onClick={() => onSelect?.(i)}
          >
            <div
              style={{
                width: IMG_SIZE,
                height: IMG_SIZE,
                borderRadius: '2cqmin',
                overflow: 'hidden',
                border: `0.5cqmin solid ${borderColor}`,
                boxShadow: shadow,
                transition: 'border-color 0.3s, box-shadow 0.3s',
              }}
            >
              <img
                src={getTalentImagePath(talent)}
                alt={showNames ? talent.name : ''}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                draggable={false}
              />
            </div>
            <TalentNameLabel name={talent.name} visible={nameVisible} />
          </button>
        )
      })}
    </div>
  )
}

function TalentNameLabel({ name, visible = true }: { name: string; visible?: boolean }) {
  return (
    <span
      className="font-bold"
      style={{
        fontSize: talentNameFontSize(name),
        color: 'white',
        padding: '0.5cqmin 2cqmin',
        borderRadius: '1cqmin',
        background: 'rgba(0,0,0,0.45)',
        visibility: visible ? 'visible' : 'hidden',
      }}
    >
      {name}
    </span>
  )
}

function MemorizePhase({ group, onMemorized, cardsVisible }: { group: Talent[]; onMemorized: () => void; cardsVisible: boolean }) {
  return (
    <>
      <TalentCards group={group} showNames visible={cardsVisible} />
      {/* 覚えた！ボタン（下部固定） */}
      <button
        className="font-bold cursor-pointer transition hover:brightness-105 active:scale-95"
        style={{
          position: 'absolute',
          bottom: '3cqmin',
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 10,
          fontSize: '5cqmin',
          padding: '2cqmin 8cqmin',
          borderRadius: '5cqmin',
          border: '0.3cqmin solid rgba(255,255,255,0.5)',
          background: 'linear-gradient(180deg, #fcc4dc 0%, #f49aba 40%, #e8789e 100%)',
          color: 'white',
          boxShadow: 'inset 0 0.4cqmin 0.6cqmin rgba(255,255,255,0.3), 0 0.4cqmin 1cqmin rgba(192,90,122,0.4)',
          textShadow: '0 1px 2px rgba(0,0,0,0.2)',
        }}
        onClick={onMemorized}
      >
        覚えた！
      </button>
    </>
  )
}

/* ── テストフェーズ ── */

function TestPhase({
  question,
  selected,
  onSelect,
  cardsVisible,
}: {
  question: TestQuestion
  selected: number | null
  onSelect: (index: number) => void
  cardsVisible: boolean
}) {
  const { target, choices } = question
  const isAnswered = selected !== null

  return (
    <TalentCards
      group={choices}
      showNames={false}
      visible={cardsVisible}
      interactive
      correctId={target.id}
      selected={selected}
      isAnswered={isAnswered}
      onSelect={onSelect}
    />
  )
}

/* ── クリア画面 ── */

function CompletePhase({ learnedCount, onBack }: { learnedCount: number; onBack: () => void }) {
  return (
    <div
      className="flex flex-col items-center justify-center"
      style={{
        position: 'absolute',
        top: '16cqmin',
        bottom: '3cqmin',
        left: 0,
        right: 0,
        zIndex: 3,
        gap: '3cqmin',
      }}
    >
      <span
        className="font-bold"
        style={{
          fontSize: '8cqmin',
          color: '#d6336c',
          textShadow: '0 1px 3px rgba(0,0,0,0.1)',
        }}
      >
        🎉 おめでとう！
      </span>
      <span
        className="font-bold"
        style={{
          fontSize: '5cqmin',
          color: '#444',
          textShadow: '0 1px 2px rgba(0,0,0,0.1)',
        }}
      >
        {learnedCount}人 全員おぼえました！
      </span>
      <button
        className="font-bold cursor-pointer transition hover:brightness-105 active:scale-95"
        style={{
          marginTop: '3cqmin',
          fontSize: '4cqmin',
          padding: '1.5cqmin 5cqmin',
          borderRadius: '5cqmin',
          border: '0.3cqmin solid rgba(255,255,255,0.5)',
          background: 'linear-gradient(180deg, #fcc4dc 0%, #f49aba 40%, #e8789e 100%)',
          color: 'white',
          boxShadow: 'inset 0 0.4cqmin 0.6cqmin rgba(255,255,255,0.3), 0 0.4cqmin 1cqmin rgba(192,90,122,0.4)',
          textShadow: '0 1px 2px rgba(0,0,0,0.2)',
        }}
        onClick={() => { playSound('tap'); onBack() }}
      >
        タイトルに戻る
      </button>
    </div>
  )
}

/* ── プログレスリング ── */

function ProgressRing({ learned, total }: { learned: number; total: number }) {
  const progress = total > 0 ? (learned / total) * 100 : 0
  const r = 16
  const stroke = 3
  const circumference = 2 * Math.PI * r
  const dashoffset = circumference * (1 - progress / 100)

  return (
    <div style={{ position: 'relative', width: '10cqmin', height: '10cqmin' }}>
      <svg viewBox="0 0 40 40" style={{ width: '100%', height: '100%', transform: 'rotate(-90deg)' }}>
        <circle cx="20" cy="20" r={r} fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth={stroke} />
        <circle
          cx="20"
          cy="20"
          r={r}
          fill="none"
          stroke="rgba(255,255,255,0.8)"
          strokeWidth={stroke}
          strokeDasharray={circumference}
          strokeDashoffset={dashoffset}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 0.4s ease' }}
        />
      </svg>
      <span
        className="font-bold"
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '2.5cqmin',
          color: 'white',
          textShadow: '0 1px 3px rgba(0,0,0,0.5)',
          whiteSpace: 'nowrap',
        }}
      >
        {learned}/{total}
      </span>
    </div>
  )
}

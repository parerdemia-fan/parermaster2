import { useState, useCallback, useMemo, useEffect } from 'react'
import { useSettingsStore } from '../../stores/settingsStore.ts'
import { useTalents } from '../../shared/hooks/useTalents.ts'
import { getTalentImagePath } from '../../shared/utils/talent.ts'
import { playSound } from '../../shared/utils/sound.ts'
import { shuffleArray } from '../../shared/utils/array.ts'
import type { Talent } from '../../shared/types/talent.ts'

type Phase = 'memorize' | 'test' | 'complete'

export function LearningScreen() {
  const { modeCategory, generation, scope } = useSettingsStore()
  const goToTitle = useSettingsStore((s) => s.goToTitle)
  const { talents } = useTalents()

  // 出題対象のタレントをフィルタリング＆シャッフル（初回のみ）
  const allTargets = useMemo(() => {
    const isDormMode = modeCategory === 'dorm'
    const gen = generation === 'gen2' ? 2 : 1
    const filtered = isDormMode
      ? talents.filter((t) => t.dormitory === scope)
      : talents.filter((t) => t.generation === gen)
    return shuffleArray(filtered)
  }, [talents, modeCategory, generation, scope])

  const totalCount = allTargets.length

  // 出題リスト（まだ覚えていない人）と覚えたリスト
  const [queue, setQueue] = useState<Talent[]>(() => [...allTargets])
  const [learnedSet, setLearnedSet] = useState<Set<string>>(() => new Set())

  // 現在のフェーズ
  const [phase, setPhase] = useState<Phase>('memorize')

  // 現在の3人組
  const [currentGroup, setCurrentGroup] = useState<Talent[]>(() => [])
  // テストフェーズ: 何人目をテスト中か
  const [testIndex, setTestIndex] = useState(0)
  // テストフェーズ: 選択状態
  const [selected, setSelected] = useState<number | null>(null)

  // 3人組を取り出す
  const pickNextGroup = useCallback((q: Talent[], learned: Set<string>) => {
    const group: Talent[] = []
    const remaining = [...q]

    // キューから最大3人取り出す
    while (group.length < 3 && remaining.length > 0) {
      group.push(remaining.shift()!)
    }

    // 足りない場合、覚えたリストからランダムに補充
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
  }, [allTargets])

  // 初回（またはtalentsロード完了後）に3人組を取り出す
  useEffect(() => {
    if (allTargets.length > 0 && currentGroup.length === 0) {
      setQueue([...allTargets])
      pickNextGroup([...allTargets], new Set())
    }
  }, [allTargets]) // eslint-disable-line react-hooks/exhaustive-deps

  // 「覚えた！」ボタン
  const handleMemorized = useCallback(() => {
    playSound('tap')
    setPhase('test')
    setTestIndex(0)
    setSelected(null)
  }, [])

  // テストフェーズで選択肢をタップ
  const handleTestSelect = useCallback((choiceIndex: number) => {
    if (selected !== null) return
    setSelected(choiceIndex)

    const target = currentGroup[testIndex]
    const isCorrect = currentGroup[choiceIndex].id === target.id

    if (isCorrect) {
      playSound('correct')
    } else {
      playSound('incorrect')
    }

    // 遅延して次へ
    setTimeout(() => {
      const newLearnedSet = new Set(learnedSet)
      let newQueue = [...queue]

      if (isCorrect) {
        newLearnedSet.add(target.id)
      } else {
        // 不正解: キューの末尾に戻す（既にキューにいなければ）
        if (!newQueue.some((t) => t.id === target.id)) {
          newQueue.push(target)
        }
      }

      setLearnedSet(newLearnedSet)

      const nextTestIndex = testIndex + 1
      if (nextTestIndex < currentGroup.length) {
        // 次のテスト
        setTestIndex(nextTestIndex)
        setSelected(null)
      } else {
        // 3人全員テスト完了
        // キューから覚えた人を除外
        newQueue = newQueue.filter((t) => !newLearnedSet.has(t.id))
        setQueue(newQueue)

        if (newQueue.length === 0 && newLearnedSet.size >= totalCount) {
          // 全員覚えた！
          setPhase('complete')
          playSound('perfect')
        } else {
          // 次の3人組
          pickNextGroup(newQueue, newLearnedSet)
        }
      }
    }, 1000)
  }, [selected, currentGroup, testIndex, learnedSet, queue, totalCount, pickNextGroup])

  if (talents.length === 0 || totalCount === 0) {
    return (
      <div className="w-full h-full flex items-center justify-center" style={{ color: '#666', fontSize: '4cqmin' }}>
        読み込み中...
      </div>
    )
  }

  const learnedCount = learnedSet.size

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

          {/* 中央: フェーズ表示 */}
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
            {phase === 'test' && `${currentGroup[testIndex]?.name} はどれ？`}
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
        <MemorizePhase
          group={currentGroup}
          onMemorized={handleMemorized}
        />
      )}

      {phase === 'test' && (
        <TestPhase
          group={currentGroup}
          targetIndex={testIndex}
          selected={selected}
          onSelect={handleTestSelect}
        />
      )}

      {phase === 'complete' && (
        <CompletePhase
          learnedCount={learnedCount}
          onBack={goToTitle}
        />
      )}
    </div>
  )
}

/* ── 暗記フェーズ ── */

function MemorizePhase({ group, onMemorized }: { group: Talent[]; onMemorized: () => void }) {
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
      }}
    >
      {/* 3人の顔と名前 */}
      <div className="flex items-center justify-center" style={{ gap: '4cqmin', flex: 1 }}>
        {group.map((talent) => (
          <div key={talent.id} className="flex flex-col items-center" style={{ gap: '1.5cqmin' }}>
            <div
              style={{
                width: '22cqmin',
                height: '22cqmin',
                borderRadius: '2cqmin',
                overflow: 'hidden',
                border: '0.5cqmin solid rgba(255,255,255,0.8)',
                boxShadow: '0 0.5cqmin 2cqmin rgba(0,0,0,0.15)',
              }}
            >
              <img
                src={getTalentImagePath(talent)}
                alt={talent.name}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                draggable={false}
              />
            </div>
            <span
              className="font-bold"
              style={{
                fontSize: '4cqmin',
                color: 'white',
                textShadow: '0 1px 4px rgba(0,0,0,0.6)',
              }}
            >
              {talent.name}
            </span>
          </div>
        ))}
      </div>

      {/* 覚えた！ボタン */}
      <button
        className="font-bold cursor-pointer transition hover:brightness-105 active:scale-95"
        style={{
          marginBottom: '2cqmin',
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
    </div>
  )
}

/* ── テストフェーズ ── */

function TestPhase({
  group,
  targetIndex,
  selected,
  onSelect,
}: {
  group: Talent[]
  targetIndex: number
  selected: number | null
  onSelect: (index: number) => void
}) {
  const target = group[targetIndex]
  const isAnswered = selected !== null

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
      }}
    >
      {/* 顔画像3枚 */}
      <div className="flex items-center justify-center" style={{ gap: '4cqmin', flex: 1 }}>
        {group.map((talent, i) => {
          const isCorrect = talent.id === target.id
          const isSelected = selected === i

          let borderColor = 'rgba(255,255,255,0.8)'
          let opacity = 1
          let shadow = '0 0.5cqmin 2cqmin rgba(0,0,0,0.15)'

          if (isAnswered) {
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

          return (
            <button
              key={talent.id}
              className="flex flex-col items-center transition"
              style={{
                background: 'none',
                border: 'none',
                padding: 0,
                cursor: isAnswered ? 'default' : 'pointer',
                opacity,
                gap: '1.5cqmin',
              }}
              disabled={isAnswered}
              onClick={() => onSelect(i)}
            >
              <div
                style={{
                  width: '22cqmin',
                  height: '22cqmin',
                  borderRadius: '2cqmin',
                  overflow: 'hidden',
                  border: `0.5cqmin solid ${borderColor}`,
                  boxShadow: shadow,
                  transition: 'border-color 0.3s, box-shadow 0.3s',
                }}
              >
                <img
                  src={getTalentImagePath(talent)}
                  alt=""
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  draggable={false}
                />
              </div>
              {/* 回答後に名前を表示 */}
              <span
                className="font-bold"
                style={{
                  fontSize: '3.5cqmin',
                  color: 'white',
                  textShadow: '0 1px 4px rgba(0,0,0,0.6)',
                  visibility: isAnswered ? 'visible' : 'hidden',
                }}
              >
                {talent.name}
              </span>
            </button>
          )
        })}
      </div>
    </div>
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

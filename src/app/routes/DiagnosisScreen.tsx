import { useState, useCallback, useMemo } from 'react'
import { useSettingsStore } from '../../stores/settingsStore.ts'
import { useDiagnosisData, cosineSimilarity, profileToVector, setDiagnosisResult, PERSONALITY_AXES } from '../../shared/hooks/useDiagnosis.ts'
import { useTalents } from '../../shared/hooks/useTalents.ts'
import { getTalentImagePath, pickTalentDisplayName } from '../../shared/utils/talent.ts'
import { playSound } from '../../shared/utils/sound.ts'
import { CHOICE_PALETTES, NAME_GUESS_ZONES, generatePattern } from '../../shared/utils/choiceStyle.ts'


const ASSISTANT_COMMENTS = [
  'どっちかな〜？',
  '気になる〜！',
  'むむっ、迷うね〜',
  'どれも良さそう〜！',
  'ワクワク〜！',
  '正解はないよ〜',
  'うんうん、なるほど〜',
  '素直に選んでね〜！',
  'あなたらしさが出るよ〜',
  'いい感じ〜！',
]

export function DiagnosisScreen() {
  const goToTitle = useSettingsStore((s) => s.goToTitle)
  const goToDiagnosisResult = useSettingsStore((s) => s.goToDiagnosisResult)
  const { questions, profiles, loading } = useDiagnosisData()
  const { talents } = useTalents()

  const [currentIndex, setCurrentIndex] = useState(0)
  const [scores, setScores] = useState<Record<string, number>>(
    Object.fromEntries(PERSONALITY_AXES.map((a) => [a, 0])),
  )
  const [selected, setSelected] = useState<number | null>(null)
  const [transitioning, setTransitioning] = useState(false)

  // 1問ごとにランダムな1期生をアシスタントとして選出
  const assistant = useMemo(() => {
    const gen1 = talents.filter((t) => t.generation === 1)
    if (gen1.length === 0) return null
    const picked = gen1[Math.floor(Math.random() * gen1.length)]
    const comment = ASSISTANT_COMMENTS[Math.floor(Math.random() * ASSISTANT_COMMENTS.length)]
    return {
      name: pickTalentDisplayName(picked),
      image: getTalentImagePath(picked),
      comment,
    }
  }, [talents, currentIndex]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleSelect = useCallback(
    (choiceIndex: number) => {
      if (selected !== null || transitioning) return
      playSound('tap')
      const choice = questions[currentIndex].choices[choiceIndex]
      const newScores = { ...scores }
      for (const [axis, val] of Object.entries(choice.scores)) {
        newScores[axis] = (newScores[axis] ?? 0) + val
      }
      setScores(newScores)
      setSelected(choiceIndex)

      setTimeout(() => {
        setTransitioning(true)
        setTimeout(() => {
          if (currentIndex + 1 >= questions.length) {
            const playerVec = PERSONALITY_AXES.map((a) => newScores[a])
            const results: { talentId: string; rawSim: number }[] = []
            for (const [talentId, profile] of Object.entries(profiles)) {
              const talentVec = profileToVector(profile)
              const sim = cosineSimilarity(playerVec, talentVec)
              results.push({ talentId, rawSim: sim })
            }
            results.sort((a, b) => b.rawSim - a.rawSim)
            const simMin = results[results.length - 1].rawSim
            const simRange = 1.0 - simMin || 1
            const top3 = results.slice(0, 3).map((r) => ({
              talentId: r.talentId,
              similarity: (r.rawSim - simMin) / simRange,
            }))

            setDiagnosisResult({ scores: newScores, top3 })
            goToDiagnosisResult()
          } else {
            setCurrentIndex(currentIndex + 1)
            setSelected(null)
            setTransitioning(false)
          }
        }, 300)
      }, 600)
    },
    [selected, transitioning, scores, currentIndex, questions, profiles, goToDiagnosisResult],
  )

  if (loading || questions.length === 0 || talents.length === 0) {
    return (
      <div className="w-full h-full flex items-center justify-center" style={{ color: '#666', fontSize: '4cqmin' }}>
        読み込み中...
      </div>
    )
  }

  const q = questions[currentIndex]
  const total = questions.length

  return (
    <div
      className="relative w-full h-full animate-fade-in"
      style={{ opacity: transitioning ? 0 : 1, transition: 'opacity 0.3s' }}
    >
      {/* ヘッダー（QuizHeader風） */}
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
            position: 'relative',
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
                background: 'linear-gradient(135deg, #9b59b6 0%, #b87fd4 100%)',
                clipPath: 'polygon(0 0, 100% 0, calc(100% - 1.5cqmin) 100%, 0 100%)',
                letterSpacing: '0.05em',
                whiteSpace: 'nowrap',
              }}
            >
              💫 相性診断
            </div>
          </div>

          {/* 中央: 問題テーマ */}
          <div
            className="font-bold"
            style={{
              flex: 1,
              minWidth: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '5.5cqmin',
              marginLeft: '4cqmin',
              textShadow: '0 1px 3px rgba(0,0,0,0.5)',
            }}
          >
            あなたはどのタイプ？
          </div>

          {/* 右: プログレスリング + アシスタント */}
          <div style={{ flexShrink: 0, display: 'flex', alignItems: 'flex-end', gap: '1cqmin' }}>
            <ProgressRing current={currentIndex + 1} total={total} />
            {assistant && (
              <div style={{ position: 'relative' }}>
                {/* 名前ラベル */}
                <div
                  style={{
                    position: 'absolute',
                    top: '-1.8cqmin',
                    left: '0.5cqmin',
                    zIndex: 2,
                    padding: '0.3cqmin 2cqmin',
                    fontSize: '1.9cqmin',
                    color: 'white',
                    background: 'linear-gradient(135deg, #9b59b6, #8e44ad)',
                    borderRadius: '1cqmin',
                    fontWeight: 'bold',
                    textShadow: '0 1px 2px rgba(0,0,0,0.2)',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {assistant.name}
                </div>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'stretch',
                    height: '10cqmin',
                    borderRadius: '1.5cqmin 0 0 0',
                    overflow: 'hidden',
                    border: '0.3cqmin double rgba(255,255,255,0.3)',
                    borderRight: 'none',
                    borderBottom: 'none',
                    boxShadow: '0 0.3cqmin 1cqmin rgba(0,0,0,0.12)',
                  }}
                >
                  <div
                    style={{
                      position: 'relative',
                      padding: '2.5cqmin 1cqmin 1.5cqmin 1.2cqmin',
                      fontSize: '2.2cqmin',
                      fontWeight: 'bold',
                      color: '#444',
                      lineHeight: 1.5,
                      width: '21.6cqmin',
                      background: 'rgba(255,255,255,0.85)',
                      display: 'flex',
                      alignItems: 'center',
                    }}
                  >
                    {assistant.comment}
                    <div
                      style={{
                        position: 'absolute',
                        top: '40%',
                        right: '-1.1cqmin',
                        transform: 'translateY(-50%)',
                        width: 0,
                        height: 0,
                        borderTop: '1.2cqmin solid transparent',
                        borderBottom: '1.2cqmin solid transparent',
                        borderLeft: '1.2cqmin solid rgba(255,255,255,0.85)',
                      }}
                    />
                  </div>
                  <div
                    style={{
                      width: '13cqmin',
                      flexShrink: 0,
                      background: 'rgba(230, 210, 245, 0.5)',
                    }}
                  />
                </div>
                <img
                  src={assistant.image}
                  alt={assistant.name}
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
            )}
          </div>
        </div>
      </div>

      {/* 左下: やめるボタン（QuizScreenと同じ位置・スタイル） */}
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
        onClick={goToTitle}
      >
        やめる
      </button>

      {/* 左パネル: 質問文（TextQuizLayout風ダーク半透明） */}
      <div
        style={{
          position: 'absolute',
          left: '2cqmin',
          width: '45%',
          top: '15cqmin',
          bottom: '3cqmin',
          zIndex: 3,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          pointerEvents: 'none',
        }}
      >
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            borderRadius: '2cqmin',
            background: 'rgba(0,0,0,0.45)',
            backdropFilter: 'blur(8px)',
            padding: '3cqmin 2.5cqmin',
            pointerEvents: 'auto',
          }}
        >
          <span
            className="font-bold text-center"
            style={{
              fontSize: '4.5cqmin',
              color: 'white',
              lineHeight: 1.5,
              textShadow: '0 1px 3px rgba(0,0,0,0.4)',
            }}
          >
            {q.question}
          </span>
        </div>
      </div>

      {/* 右パネル: 選択肢 */}
      <div
        className="flex flex-col justify-center"
        style={{
          position: 'absolute',
          top: '16cqmin',
          right: '2.5cqmin',
          bottom: '3cqmin',
          width: '48%',
          gap: '2cqmin',
          zIndex: 3,
        }}
      >
        {q.choices.map((choice, i) => {
          const palette = CHOICE_PALETTES[i % CHOICE_PALETTES.length]
          const patternSvg = generatePattern(palette.motif, palette.motifFill, i * 1000 + currentIndex * 7, NAME_GUESS_ZONES)
          const isSelected = selected === i
          const isAnswered = selected !== null

          let bg = `url("data:image/svg+xml,${patternSvg}") center / 100% auto no-repeat, ${palette.gradient}`
          let borderColor = 'rgba(255,255,255,0.7)'
          let opacity = 1
          const boxShadow = `0 0.5cqmin 1.5cqmin ${palette.outerShadow}, inset 0 1cqmin 3cqmin ${palette.insetShadow}`

          if (isAnswered) {
            if (isSelected) {
              bg = 'linear-gradient(135deg, rgba(130,100,220,0.92), rgba(100,70,190,0.92))'
              borderColor = 'rgba(255,255,255,0.8)'
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
                fontSize: choice.text.length <= 12 ? '4.5cqmin' : '3.8cqmin',
                padding: '0 3cqmin',
                borderRadius: '2cqmin',
                border: `0.5cqmin solid ${borderColor}`,
                background: bg,
                color: isSelected && isAnswered ? 'white' : '#333',
                opacity,
                cursor: isAnswered ? 'default' : 'pointer',
                boxShadow,
                textShadow: isSelected && isAnswered ? '0 1px 3px rgba(0,0,0,0.3)' : '0 0.1cqmin 0.3cqmin rgba(0,0,0,0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
              disabled={isAnswered}
              onClick={() => handleSelect(i)}
            >
              {choice.text}
            </button>
          )
        })}
      </div>
    </div>
  )
}

/** プログレスリング（QuizHeaderから流用） */
function ProgressRing({ current, total }: { current: number; total: number }) {
  const progress = total > 0 ? (current / total) * 100 : 0
  const r = 16
  const stroke = 3
  const circumference = 2 * Math.PI * r
  const dashoffset = circumference * (1 - progress / 100)

  return (
    <div
      style={{
        position: 'relative',
        width: '10cqmin',
        height: '10cqmin',
        alignSelf: 'center',
      }}
    >
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
          fontSize: '2.8cqmin',
          color: 'white',
          textShadow: '0 1px 3px rgba(0,0,0,0.5)',
          whiteSpace: 'nowrap',
        }}
      >
        {current}/{total}
      </span>
    </div>
  )
}

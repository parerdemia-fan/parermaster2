import { useGameStore } from '../../stores/gameStore.ts'
import { useSettingsStore } from '../../stores/settingsStore.ts'

export function QuizScreen() {
  const { questions, currentIndex, quizState, selectedAnswer, correctCount, selectAnswer, nextQuestion, isLastQuestion } = useGameStore()
  const { goToResult, goToTitle } = useSettingsStore()

  const current = questions[currentIndex]
  if (!current) return null

  const isAnswered = quizState === 'answered'
  const isCorrect = selectedAnswer !== null && selectedAnswer === current.correctIndex
  const total = questions.length

  return (
    <div className="relative w-full h-full flex flex-col items-center overflow-hidden animate-fade-in">
      {/* ヘッダー: 進捗 */}
      <div
        className="w-full flex items-center justify-between"
        style={{ padding: '1.5cqmin 3cqmin' }}
      >
        <button
          className="font-bold cursor-pointer transition hover:brightness-110 active:scale-95"
          style={{
            fontSize: '3cqmin',
            padding: '0.8cqmin 1.5cqmin',
            borderRadius: '2cqmin',
            border: 'none',
            background: 'rgba(255,255,255,0.6)',
            color: '#555',
          }}
          onClick={goToTitle}
        >
          ✕ やめる
        </button>
        <span
          className="font-bold"
          style={{
            fontSize: '3.5cqmin',
            color: 'white',
            textShadow: '0 1px 3px rgba(0,0,0,0.3)',
          }}
        >
          {currentIndex + 1} / {total}
        </span>
        <span
          style={{
            fontSize: '3cqmin',
            color: 'white',
            textShadow: '0 1px 3px rgba(0,0,0,0.3)',
          }}
        >
          正解: {correctCount}
        </span>
      </div>

      {/* メインエリア */}
      <div
        className="flex items-center justify-center"
        style={{
          flex: 1,
          width: '100%',
          padding: '0 3cqmin',
          gap: '4cqmin',
        }}
      >
        {/* 左: 顔画像 */}
        <div
          className="flex flex-col items-center"
          style={{ flex: '0 0 auto' }}
        >
          <img
            src={current.talentImagePath}
            alt="誰でしょう？"
            style={{
              width: '30cqmin',
              height: '30cqmin',
              objectFit: 'cover',
              borderRadius: '3cqmin',
              border: '0.4cqmin solid rgba(255,255,255,0.8)',
              boxShadow: '0 0.5cqmin 2cqmin rgba(0,0,0,0.2)',
            }}
            draggable={false}
          />
          {isAnswered && (
            <div
              className="font-bold"
              style={{
                marginTop: '2cqmin',
                fontSize: '5cqmin',
                color: isCorrect ? '#22c55e' : '#ef4444',
                textShadow: '0 1px 3px rgba(0,0,0,0.2)',
              }}
            >
              {isCorrect ? '正解！' : '不正解..'}
            </div>
          )}
        </div>

        {/* 右: 選択肢 */}
        <div
          className="flex flex-col"
          style={{ gap: '2cqmin', flex: '1 1 auto', maxWidth: '55cqmin' }}
        >
          {current.answers.map((answer, i) => {
            let bg = 'rgba(255,255,255,0.85)'
            let borderColor = 'rgba(255,255,255,0.5)'
            let color = '#333'
            let opacity = 1

            if (isAnswered) {
              if (i === current.correctIndex) {
                bg = 'rgba(34,197,94,0.85)'
                borderColor = '#22c55e'
                color = 'white'
              } else if (i === selectedAnswer) {
                bg = 'rgba(239,68,68,0.85)'
                borderColor = '#ef4444'
                color = 'white'
              } else {
                opacity = 0.5
              }
            }

            return (
              <button
                key={i}
                className="font-bold transition active:scale-98"
                style={{
                  height: '9cqmin',
                  fontSize: '3.5cqmin',
                  padding: '0 3cqmin',
                  borderRadius: '2cqmin',
                  border: `0.3cqmin solid ${borderColor}`,
                  background: bg,
                  color,
                  opacity,
                  cursor: isAnswered ? 'default' : 'pointer',
                  textAlign: 'left',
                  backdropFilter: 'blur(4px)',
                  boxShadow: '0 0.2cqmin 0.5cqmin rgba(0,0,0,0.1)',
                }}
                disabled={isAnswered}
                onClick={() => selectAnswer(i)}
              >
                {answer}
              </button>
            )
          })}
        </div>
      </div>

      {/* フッター: 次へボタン（回答後のみ） */}
      {isAnswered && (
        <div
          className="w-full flex justify-center"
          style={{ padding: '2cqmin 0 3cqmin' }}
        >
          <button
            className="font-bold cursor-pointer transition hover:brightness-105 active:scale-95"
            style={{
              fontSize: '4cqmin',
              padding: '1.5cqmin 6cqmin',
              borderRadius: '5cqmin',
              border: 'none',
              background: 'linear-gradient(180deg, #fcc4dc 0%, #f49aba 40%, #e8789e 100%)',
              color: 'white',
              boxShadow:
                'inset 0 0.4cqmin 0.6cqmin rgba(255,255,255,0.3), 0 0.4cqmin 1cqmin rgba(0,0,0,0.15)',
              textShadow: '0 1px 2px rgba(0,0,0,0.2)',
            }}
            onClick={() => {
              if (isLastQuestion()) {
                goToResult()
              } else {
                nextQuestion()
              }
            }}
          >
            {isLastQuestion() ? '結果を見る' : '次へ →'}
          </button>
        </div>
      )}
    </div>
  )
}

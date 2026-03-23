import { useGameStore } from '../../stores/gameStore.ts'
import { useSettingsStore } from '../../stores/settingsStore.ts'
import { NameGuessLayout } from '../../features/question-types/name-guess/NameGuessLayout.tsx'
import type { NameGuessQuestion } from '../../features/question-types/name-guess/types.ts'
import { FaceGuessLayout } from '../../features/question-types/face-guess/FaceGuessLayout.tsx'
import type { FaceGuessQuestion } from '../../features/question-types/face-guess/types.ts'
import { NameBuildLayout } from '../../features/question-types/name-build/NameBuildLayout.tsx'
import type { NameBuildQuestion } from '../../features/question-types/name-build/types.ts'
import { TextQuizLayout } from '../../features/question-types/text-quiz/TextQuizLayout.tsx'
import type { TextQuizQuestion } from '../../features/question-types/text-quiz/types.ts'

export function QuizScreen() {
  const { questions, currentIndex, quizState, answerRecords, recordAnswer, nextQuestion, prevQuestion, isLastQuestion } = useGameStore()
  const { goToResult, goToTitle } = useSettingsStore()

  const current = questions[currentIndex]
  if (!current) return null

  const isAnswered = quizState === 'answered'
  const isTextQuiz = current.typeId === 'text-quiz'
  const canGoBack = isTextQuiz && currentIndex > 0
  const lastRecord = answerRecords[currentIndex]

  return (
    <div className="relative w-full h-full flex flex-col items-center overflow-hidden animate-fade-in">
      {/* 正解/不正解フローティング表示（全問題タイプ共通） */}
      {isAnswered && lastRecord && (
        <div
          className="font-bold animate-fade-in"
          style={{
            position: 'absolute',
            top: '20%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            zIndex: 30,
            fontSize: '5cqmin',
            color: 'white',
            background: lastRecord.isCorrect
              ? 'rgba(34,197,94,0.85)'
              : 'rgba(239,68,68,0.85)',
            padding: '1cqmin 4cqmin',
            borderRadius: '1.5cqmin',
            boxShadow: '0 0.5cqmin 2cqmin rgba(0,0,0,0.4)',
            textShadow: '0 1px 3px rgba(0,0,0,0.5)',
            WebkitTextStroke: '0.5px rgba(0,0,0,0.3)',
            border: '0.3cqmin solid rgba(255,255,255,0.4)',
            pointerEvents: 'none',
            whiteSpace: 'nowrap',
          }}
        >
          {lastRecord.isCorrect ? '🎉 正解！' : '😢 不正解..'}
        </div>
      )}
      {/* 左下: やめるボタン */}
      <button
        className="font-bold cursor-pointer transition hover:brightness-110 active:scale-95"
        style={{
          position: 'absolute',
          left: '2cqmin',
          bottom: '2cqmin',
          fontSize: '2.5cqmin',
          padding: '1cqmin 2cqmin',
          borderRadius: '50%',
          border: 'none',
          background: 'rgba(255,255,255,0.7)',
          color: '#666',
          zIndex: 20,
          width: '7cqmin',
          height: '7cqmin',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 0.2cqmin 0.8cqmin rgba(0,0,0,0.1)',
          backdropFilter: 'blur(6px)',
        }}
        onClick={goToTitle}
      >
        ←
      </button>

      {/* 問題タイプ別レイアウト */}
      {current.typeId === 'name-guess' && (
        <NameGuessLayout
          question={current as NameGuessQuestion}
          isAnswered={isAnswered}
          onAnswer={recordAnswer}
        />
      )}
      {current.typeId === 'face-guess' && (
        <FaceGuessLayout
          question={current as FaceGuessQuestion}
          isAnswered={isAnswered}
          onAnswer={recordAnswer}
        />
      )}
      {current.typeId === 'name-build' && (
        <NameBuildLayout
          question={current as NameBuildQuestion}
          isAnswered={isAnswered}
          onAnswer={recordAnswer}
        />
      )}
      {current.typeId === 'text-quiz' && (
        <TextQuizLayout
          question={current as TextQuizQuestion}
          isAnswered={isAnswered}
          onAnswer={recordAnswer}
          restoredSelectedIndex={answerRecords[currentIndex]?.selectedIndex}
        />
      )}

      {/* フッター: 戻る/次へボタン（絶対配置でレイアウトに影響しない） */}
      {(isAnswered || canGoBack) && (
        <div
          className="flex items-center"
          style={{
            position: 'absolute',
            bottom: '2cqmin',
            right: '3cqmin',
            gap: '3cqmin',
            zIndex: 20,
          }}
        >
          {canGoBack && (
            <button
              className="font-bold cursor-pointer transition hover:brightness-105 active:scale-95"
              style={{
                fontSize: '3cqmin',
                padding: '1.2cqmin 3cqmin',
                borderRadius: '5cqmin',
                border: 'none',
                background: 'rgba(255,255,255,0.7)',
                color: '#777',
                boxShadow: '0 0.2cqmin 0.5cqmin rgba(0,0,0,0.1)',
              }}
              onClick={prevQuestion}
            >
              ← 前へ
            </button>
          )}
          {isAnswered && <button
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
          </button>}
        </div>
      )}
    </div>
  )
}

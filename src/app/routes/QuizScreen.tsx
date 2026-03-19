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
  const { questions, currentIndex, quizState, correctCount, answerRecords, recordAnswer, nextQuestion, prevQuestion, isLastQuestion } = useGameStore()
  const { goToResult, goToTitle } = useSettingsStore()

  const current = questions[currentIndex]
  if (!current) return null

  const isAnswered = quizState === 'answered'
  const total = questions.length
  const isTextQuiz = current.typeId === 'text-quiz'
  const canGoBack = isTextQuiz && currentIndex > 0

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

      {/* フッター: 戻る/次へボタン */}
      {(isAnswered || canGoBack) && (
        <div
          className="w-full flex justify-center items-center"
          style={{ padding: '2cqmin 0 3cqmin', gap: '3cqmin' }}
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

import { useSettingsStore, type Difficulty } from '../../stores/settingsStore.ts'
import { useGameStore } from '../../stores/gameStore.ts'
import { useTalents } from '../../shared/hooks/useTalents.ts'
import { useQuestions } from '../../shared/hooks/useQuestions.ts'
import { generateFaceGuessQuestions } from '../../features/question-types/face-guess/generator.ts'
import { generateNameGuessQuestions } from '../../features/question-types/name-guess/generator.ts'
import { generateNameBuildQuestions } from '../../features/question-types/name-build/generator.ts'
import { generateTextQuizQuestions } from '../../features/question-types/text-quiz/generator.ts'
import { generateBlurQuestions } from '../../features/question-types/blur/generator.ts'
import { generateSpotlightQuestions } from '../../features/question-types/spotlight/generator.ts'
import { shuffleArray } from '../../shared/utils/array.ts'

type QuestionTypeId = 'face-guess' | 'name-guess' | 'name-build' | 'text-quiz' | 'blur' | 'spotlight'

/** 難易度1〜3のある問題タイプ */
const MULTI_DIFFICULTY_TYPES: { typeId: QuestionTypeId; label: string }[] = [
  { typeId: 'face-guess', label: '顔当て' },
  { typeId: 'name-guess', label: '名前当て' },
  { typeId: 'name-build', label: '名前を作ろう' },
  { typeId: 'text-quiz', label: 'テキストクイズ' },
]

/** 難易度固定の問題タイプ */
const SINGLE_DIFFICULTY_TYPES: { typeId: QuestionTypeId; label: string }[] = [
  { typeId: 'blur', label: 'ぼかし' },
  { typeId: 'spotlight', label: 'スポットライト' },
]

const DIFFICULTIES: Difficulty[] = [1, 2, 3]

const DEBUG_QUESTION_COUNT = 5

export function DebugScreen() {
  const goToTitle = useSettingsStore((s) => s.goToTitle)
  const goToQuiz = useSettingsStore((s) => s.goToQuiz)
  const startQuiz = useGameStore((s) => s.startQuiz)
  const { talents, loading: talentsLoading } = useTalents()
  const { questions: questionPool, answerSets, loading: questionsLoading } = useQuestions()
  const loading = talentsLoading || questionsLoading

  const handleStart = (typeId: QuestionTypeId, difficulty: Difficulty) => {
    if (loading || talents.length === 0) return

    const isFaceName = typeId !== 'text-quiz'

    // settingsStore の状態をセット（ResultScreen 等が正しく動作するために必要）
    useSettingsStore.setState({
      generation: 'gen1',
      modeCategory: 'gen1',
      gameMode: isFaceName ? 'face-name' : 'knowledge',
      scope: 'all',
      difficulty,
    })

    if (typeId === 'text-quiz') {
      const maxDifficulty = difficulty === 1 ? 2 : difficulty === 2 ? 4 : 8
      const pool = questionPool.filter(
        (q) => q.difficulty <= maxDifficulty && (q.generation === 0 || q.generation === 1),
      )
      if (pool.length === 0) return
      const questions = generateTextQuizQuestions(pool, DEBUG_QUESTION_COUNT, difficulty, talents, answerSets)
      startQuiz(questions)
      goToQuiz()
      return
    }

    // 顔名前系
    const filtered = talents.filter((t) => t.generation === 1)
    if (filtered.length < DEBUG_QUESTION_COUNT) return

    const targets = shuffleArray(filtered).slice(0, DEBUG_QUESTION_COUNT)
    const pool = filtered
    const generationPool = difficulty === 3 ? filtered : undefined

    let questions
    switch (typeId) {
      case 'face-guess':
        questions = generateFaceGuessQuestions(targets, pool, difficulty, generationPool)
        break
      case 'name-guess':
        questions = generateNameGuessQuestions(targets, pool, difficulty)
        break
      case 'name-build':
        questions = generateNameBuildQuestions(targets, pool, difficulty)
        break
      case 'blur':
        questions = generateBlurQuestions(targets, pool, difficulty)
        break
      case 'spotlight':
        questions = generateSpotlightQuestions(targets, pool, difficulty)
        break
    }

    startQuiz(questions)
    goToQuiz()
  }

  return (
    <div className="relative w-full h-full flex flex-col items-center overflow-hidden animate-fade-in">
      {/* ヘッダー */}
      <div
        className="w-full flex items-center"
        style={{ padding: '2cqmin 3cqmin' }}
      >
        <button
          className="cursor-pointer font-bold"
          style={{
            fontSize: '3.5cqmin',
            background: 'rgba(0,0,0,0.4)',
            color: 'white',
            border: 'none',
            borderRadius: '1cqmin',
            padding: '0.5cqmin 2cqmin',
          }}
          onClick={goToTitle}
        >
          ← 戻る
        </button>
        <span
          className="font-bold"
          style={{
            fontSize: '4cqmin',
            color: '#0f0',
            marginLeft: '3cqmin',
            textShadow: '0 1px 3px rgba(0,0,0,0.5)',
          }}
        >
          Debug Menu
        </span>
      </div>

      {loading ? (
        <div style={{ fontSize: '3cqmin', color: 'white', marginTop: '10cqmin' }}>
          Loading...
        </div>
      ) : (
        <div
          className="flex flex-col items-center"
          style={{ gap: '2cqmin', marginTop: '2cqmin' }}
        >
          {/* 難易度ヘッダー */}
          <div className="grid" style={{ gridTemplateColumns: '25cqmin repeat(3, 18cqmin)', gap: '1.5cqmin' }}>
            <div />
            {DIFFICULTIES.map((d) => (
              <div
                key={d}
                className="text-center font-bold"
                style={{ fontSize: '3cqmin', color: 'white', textShadow: '0 1px 2px rgba(0,0,0,0.5)' }}
              >
                難易度 {d}
              </div>
            ))}
          </div>

          {/* タイプ × 難易度ボタン */}
          {MULTI_DIFFICULTY_TYPES.map(({ typeId, label }) => (
            <div
              key={typeId}
              className="grid items-center"
              style={{ gridTemplateColumns: '25cqmin repeat(3, 18cqmin)', gap: '1.5cqmin' }}
            >
              <div
                className="font-bold text-right"
                style={{
                  fontSize: '3cqmin',
                  color: 'white',
                  textShadow: '0 1px 2px rgba(0,0,0,0.5)',
                  paddingRight: '1cqmin',
                }}
              >
                {label}
              </div>
              {DIFFICULTIES.map((d) => (
                <button
                  key={d}
                  className="cursor-pointer font-bold transition hover:brightness-110 active:scale-95"
                  style={{
                    fontSize: '3cqmin',
                    padding: '1.5cqmin 0',
                    borderRadius: '1.5cqmin',
                    border: '0.2cqmin solid rgba(255,255,255,0.4)',
                    background: 'linear-gradient(180deg, #555 0%, #333 100%)',
                    color: 'white',
                    boxShadow: '0 0.3cqmin 0.6cqmin rgba(0,0,0,0.3)',
                  }}
                  onClick={() => handleStart(typeId, d)}
                >
                  {label} {d}
                </button>
              ))}
            </div>
          ))}

          {/* 難易度固定の問題タイプ */}
          {SINGLE_DIFFICULTY_TYPES.map(({ typeId, label }) => (
            <div
              key={typeId}
              className="grid items-center"
              style={{ gridTemplateColumns: '25cqmin repeat(3, 18cqmin)', gap: '1.5cqmin' }}
            >
              <div
                className="font-bold text-right"
                style={{
                  fontSize: '3cqmin',
                  color: 'white',
                  textShadow: '0 1px 2px rgba(0,0,0,0.5)',
                  paddingRight: '1cqmin',
                }}
              >
                {label}
              </div>
              <button
                className="cursor-pointer font-bold transition hover:brightness-110 active:scale-95"
                style={{
                  gridColumn: 'span 3',
                  fontSize: '3cqmin',
                  padding: '1.5cqmin 0',
                  borderRadius: '1.5cqmin',
                  border: '0.2cqmin solid rgba(255,255,255,0.4)',
                  background: 'linear-gradient(180deg, #555 0%, #333 100%)',
                  color: 'white',
                  boxShadow: '0 0.3cqmin 0.6cqmin rgba(0,0,0,0.3)',
                }}
                onClick={() => handleStart(typeId, 3)}
              >
                {label}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

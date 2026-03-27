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
import { generateWordSearchQuestions } from '../../features/question-types/word-search/generator.ts'
import { shuffleArray } from '../../shared/utils/array.ts'

type FaceNameTypeId = 'face-guess' | 'name-guess' | 'name-build' | 'blur' | 'spotlight' | 'word-search'

/** 難易度1〜3のある問題タイプ */
const MULTI_DIFFICULTY_TYPES: { typeId: FaceNameTypeId; label: string }[] = [
  { typeId: 'face-guess', label: '顔当て' },
  { typeId: 'name-guess', label: '名前当て' },
  { typeId: 'name-build', label: '名前を作ろう' },
]

/** 難易度固定の問題タイプ */
const SINGLE_DIFFICULTY_TYPES: { typeId: FaceNameTypeId; label: string }[] = [
  { typeId: 'blur', label: 'ぼかし' },
  { typeId: 'spotlight', label: 'スポットライト' },
  { typeId: 'word-search', label: '名前はどこ？' },
]

const DIFFICULTIES: Difficulty[] = [1, 2, 3]
const TEXT_QUIZ_LEVELS = [1, 2, 3, 4, 5, 6, 7]

const DEBUG_QUESTION_COUNT = 5

export function DebugScreen() {
  const goToTitle = useSettingsStore((s) => s.goToTitle)
  const goToQuiz = useSettingsStore((s) => s.goToQuiz)
  const startQuiz = useGameStore((s) => s.startQuiz)
  const { talents, loading: talentsLoading } = useTalents()
  const { questions: questionPool, answerSets, loading: questionsLoading } = useQuestions()
  const loading = talentsLoading || questionsLoading

  const handleFaceNameStart = (typeId: FaceNameTypeId, difficulty: Difficulty) => {
    if (loading || talents.length === 0) return

    useSettingsStore.setState({
      generation: 'gen1',
      modeCategory: 'gen1',
      gameMode: 'face-name',
      scope: 'all',
      difficulty,
    })

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
      case 'word-search':
        questions = generateWordSearchQuestions(targets, pool, difficulty)
        break
    }

    startQuiz(questions)
    goToQuiz()
  }

  const handleTextQuizStart = (level: number) => {
    if (loading || talents.length === 0) return

    useSettingsStore.setState({
      generation: 'gen1',
      modeCategory: 'gen1',
      gameMode: 'knowledge',
      scope: 'all',
      difficulty: 1,
    })

    const pool = questionPool.filter(
      (q) => q.generation === 0 || q.generation === 1,
    )
    if (pool.length === 0) return

    const segments = [{ level, count: DEBUG_QUESTION_COUNT, ordered: false }]
    const questions = generateTextQuizQuestions(pool, segments, 1, talents, answerSets)
    startQuiz(questions)
    goToQuiz()
  }

  const btnStyle = {
    fontSize: '3cqmin',
    padding: '1.5cqmin 0',
    borderRadius: '1.5cqmin',
    border: '0.2cqmin solid rgba(255,255,255,0.4)',
    background: 'linear-gradient(180deg, #555 0%, #333 100%)',
    color: 'white',
    boxShadow: '0 0.3cqmin 0.6cqmin rgba(0,0,0,0.3)',
  } as const

  const labelStyle = {
    fontSize: '3cqmin',
    color: 'white',
    textShadow: '0 1px 2px rgba(0,0,0,0.5)',
    paddingRight: '1cqmin',
  } as const

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
          style={{ gap: '1.5cqmin', marginTop: '1cqmin' }}
        >
          {/* 難易度ヘッダー */}
          <div className="grid" style={{ gridTemplateColumns: '20cqmin repeat(3, 18cqmin)', gap: '1.5cqmin' }}>
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

          {/* 顔名前系 × 難易度1〜3 */}
          {MULTI_DIFFICULTY_TYPES.map(({ typeId, label }) => (
            <div
              key={typeId}
              className="grid items-center"
              style={{ gridTemplateColumns: '20cqmin repeat(3, 18cqmin)', gap: '1.5cqmin' }}
            >
              <div className="font-bold text-right" style={labelStyle}>
                {label}
              </div>
              {DIFFICULTIES.map((d) => (
                <button
                  key={d}
                  className="cursor-pointer font-bold transition hover:brightness-110 active:scale-95"
                  style={btnStyle}
                  onClick={() => handleFaceNameStart(typeId, d)}
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
              style={{ gridTemplateColumns: '20cqmin repeat(3, 18cqmin)', gap: '1.5cqmin' }}
            >
              <div className="font-bold text-right" style={labelStyle}>
                {label}
              </div>
              <button
                className="cursor-pointer font-bold transition hover:brightness-110 active:scale-95"
                style={{ ...btnStyle, gridColumn: 'span 3' }}
                onClick={() => handleFaceNameStart(typeId, 3)}
              >
                {label}
              </button>
            </div>
          ))}

          {/* テキストクイズ1〜7 */}
          <div
            className="grid items-center"
            style={{ gridTemplateColumns: '20cqmin repeat(7, 7.5cqmin)', gap: '1cqmin', marginTop: '1cqmin' }}
          >
            <div className="font-bold text-right" style={labelStyle}>
              テキストクイズ
            </div>
            {TEXT_QUIZ_LEVELS.map((level) => (
              <button
                key={level}
                className="cursor-pointer font-bold transition hover:brightness-110 active:scale-95"
                style={{ ...btnStyle, fontSize: '2.5cqmin', padding: '1.2cqmin 0' }}
                onClick={() => handleTextQuizStart(level)}
              >
                TQ{level}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

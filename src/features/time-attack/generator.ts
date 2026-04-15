import type { Talent } from '../../shared/types/talent.ts'
import type { QuestionData } from '../../shared/types/question.ts'
import type { BaseQuestion } from '../quiz/types.ts'
import { shuffleArray } from '../../shared/utils/array.ts'
import { generateFaceGuessQuestions } from '../question-types/face-guess/generator.ts'
import { generateNameGuessQuestions } from '../question-types/name-guess/generator.ts'
import { generateNameBuildQuestions } from '../question-types/name-build/generator.ts'
import { generateTextQuizQuestions, type QuizSegment } from '../question-types/text-quiz/generator.ts'
import { generateBlurQuestions } from '../question-types/blur/generator.ts'
import { generateSpotlightQuestions } from '../question-types/spotlight/generator.ts'
import { generateWordSearchQuestions } from '../question-types/word-search/generator.ts'
import { TIME_ATTACK_SECTIONS } from './constants.ts'

/** 顔名前系の問題タイプID */
const TALENT_TYPE_IDS = new Set(['face-guess', 'name-guess', 'name-build', 'blur', 'spotlight', 'word-search'])

/**
 * タイムアタック用の100問を生成する
 * 顔名前系: 全タレント（1期+2期 = 70名）をシャッフルし、各タレントが1回だけ出題される
 * テキストクイズ: 該当レベルからランダム選出
 */
export function generateTimeAttackQuestions(
  talents: Talent[],
  questionPool: QuestionData[],
  answerSets: Record<string, string[]>,
): BaseQuestion[] {
  const allQuestions: BaseQuestion[] = []
  const pool = talents

  // 顔名前系セクションの必要数を計算し、全タレントをシャッフルして重複なく割り当てる
  const shuffledTalents = shuffleArray([...talents])
  let talentOffset = 0

  for (const section of TIME_ATTACK_SECTIONS) {
    let sectionQuestions: BaseQuestion[]

    if (TALENT_TYPE_IDS.has(section.typeId)) {
      // 顔名前系: シャッフル済みタレントから重複なく取得
      const targets = shuffledTalents.slice(talentOffset, talentOffset + section.count)
      talentOffset += section.count

      switch (section.typeId) {
        case 'face-guess': {
          const generationPool = section.difficulty === 3 ? pool : undefined
          sectionQuestions = generateFaceGuessQuestions(targets, pool, section.difficulty, generationPool)
          break
        }
        case 'name-guess':
          sectionQuestions = generateNameGuessQuestions(targets, pool, section.difficulty)
          break
        case 'name-build':
          sectionQuestions = generateNameBuildQuestions(targets, pool, section.difficulty)
          break
        case 'blur':
          sectionQuestions = generateBlurQuestions(targets, pool, section.difficulty)
          break
        case 'spotlight':
          sectionQuestions = generateSpotlightQuestions(targets, pool, section.difficulty)
          break
        case 'word-search':
          sectionQuestions = generateWordSearchQuestions(targets, pool, section.difficulty)
          break
        default:
          continue
      }
    } else {
      // テキストクイズ
      const segments: QuizSegment[] = [{ level: section.level!, count: section.count, ordered: false }]
      sectionQuestions = generateTextQuizQuestions(questionPool, segments, section.difficulty, talents, answerSets)
    }

    // 各問題に displayStars を設定
    for (const q of sectionQuestions) {
      q.displayStars = section.displayStars
    }

    allQuestions.push(...sectionQuestions)
  }

  return allQuestions
}

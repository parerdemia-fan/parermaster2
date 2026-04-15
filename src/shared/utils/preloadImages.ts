import type { BaseQuestion } from '../../features/quiz/types.ts'
import type { FaceGuessQuestion } from '../../features/question-types/face-guess/types.ts'
import type { NameGuessQuestion } from '../../features/question-types/name-guess/types.ts'
import type { NameBuildQuestion } from '../../features/question-types/name-build/types.ts'
import type { BlurQuestion } from '../../features/question-types/blur/types.ts'
import type { SpotlightQuestion } from '../../features/question-types/spotlight/types.ts'
import type { TextQuizQuestion } from '../../features/question-types/text-quiz/types.ts'
import type { Talent } from '../types/talent.ts'
import { getTalentImagePath } from './talent.ts'

const BASE = import.meta.env.BASE_URL

/** 問題で使用される画像パスを抽出する */
function extractImagePaths(question: BaseQuestion, talents: Talent[]): string[] {
  const paths: string[] = []

  switch (question.typeId) {
    case 'face-guess': {
      const q = question as FaceGuessQuestion
      paths.push(...q.answerImages)
      break
    }
    case 'name-guess': {
      const q = question as NameGuessQuestion
      paths.push(q.talentImagePath)
      break
    }
    case 'name-build': {
      const q = question as NameBuildQuestion
      paths.push(q.talentImagePath)
      break
    }
    case 'blur': {
      const q = question as BlurQuestion
      paths.push(q.talentImagePath)
      break
    }
    case 'spotlight': {
      const q = question as SpotlightQuestion
      paths.push(q.talentImagePath)
      break
    }
    case 'text-quiz': {
      const q = question as TextQuizQuestion
      if (q.questionImage) paths.push(`${BASE}data/images/questions/${q.questionImage}`)
      if (q.commentImage) paths.push(`${BASE}data/images/questions/${q.commentImage}`)
      if (q.answerTalentIds) {
        for (const id of q.answerTalentIds) {
          const talent = talents.find((t) => t.id === id)
          if (talent) paths.push(getTalentImagePath(talent))
        }
      }
      break
    }
    // word-search: 画像なし
  }

  return paths
}

/** 画像1枚をプリロードし、完了時に resolve する */
function loadImage(src: string): Promise<void> {
  return new Promise((resolve) => {
    const img = new Image()
    img.onload = () => resolve()
    img.onerror = () => resolve() // エラーでもブロックしない
    img.src = src
  })
}

/**
 * 全問題の画像をプリロードする。
 * 1問目の画像が読み込み完了した時点で firstReady を resolve し、
 * 全画像の読み込み完了で allDone を resolve する。
 */
export function preloadQuestionImages(
  questions: BaseQuestion[],
  talents: Talent[],
): { firstReady: Promise<void>; allDone: Promise<void> } {
  if (questions.length === 0) {
    return { firstReady: Promise.resolve(), allDone: Promise.resolve() }
  }

  // 1問目の画像パス
  const firstPaths = new Set(extractImagePaths(questions[0], talents))
  // 全問題の画像パス（重複除去）
  const allPaths = new Set<string>()
  for (const q of questions) {
    for (const p of extractImagePaths(q, talents)) {
      allPaths.add(p)
    }
  }

  const firstReady = firstPaths.size > 0
    ? Promise.all([...firstPaths].map(loadImage)).then(() => {})
    : Promise.resolve()

  const allDone = allPaths.size > 0
    ? Promise.all([...allPaths].map(loadImage)).then(() => {})
    : Promise.resolve()

  return { firstReady, allDone }
}

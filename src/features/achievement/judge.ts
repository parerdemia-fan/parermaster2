import type { BadgeRank, BadgeSlotId } from './types.ts'
import { difficultyToRank, toSlotId } from './constants.ts'
import type { GameMode, Generation, Scope, Difficulty } from '../../stores/settingsStore.ts'

export interface JudgeInput {
  gameMode: GameMode
  generation: Generation
  scope: Scope
  difficulty: Difficulty
  correctCount: number
  totalCount: number
  /** 顔名前当てで有効にした問題タイプ（'face-guess','name-guess','name-build'） */
  enabledTypes: string[]
}

export interface JudgeResult {
  eligible: boolean
  slotId: BadgeSlotId | null
  rank: BadgeRank | null
  reason?: string
}

const ALL_FACE_NAME_TYPES = ['face-guess', 'name-guess', 'name-build']

export function judgeBadge(input: JudgeInput): JudgeResult {
  const { gameMode, generation, scope, difficulty, correctCount, totalCount, enabledTypes } = input

  // 全問正解でなければ対象外
  if (correctCount < totalCount || totalCount === 0) {
    return { eligible: false, slotId: null, rank: null, reason: '全問正解ではない' }
  }

  if (gameMode === 'face-name') {
    // 顔名前当て: 全問題タイプONでなければ対象外
    const allTypesEnabled = ALL_FACE_NAME_TYPES.every((t) => enabledTypes.includes(t))
    if (!allTypesEnabled) {
      return { eligible: false, slotId: null, rank: null, reason: '全問題タイプがONではない' }
    }

    const slotId = toSlotId(gameMode, generation, scope)
    const rank = difficultyToRank(difficulty)
    return { eligible: true, slotId, rank }
  }

  if (gameMode === 'knowledge') {
    const slotId = toSlotId(gameMode, generation, scope)
    // 2期生知識クイズは常にブロンズ
    const rank: BadgeRank = generation === 'gen2' ? 'bronze' : difficultyToRank(difficulty)
    return { eligible: true, slotId, rank }
  }

  return { eligible: false, slotId: null, rank: null, reason: '不明なゲームモード' }
}

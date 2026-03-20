import { describe, expect, it } from 'vitest'
import { generateNameBuildQuestions } from '../generator.ts'
import type { Talent } from '../../../../shared/types/talent.ts'

const makeTalent = (id: string, familyName: string, givenName: string): Talent =>
  ({
    id,
    familyName,
    givenName,
    generation: 1,
    dormitory: 'A',
    hairColor: 'black',
    hairStyle: 'short',
  }) as Talent

const talents = [
  makeTalent('1', '山田', '太郎'),
  makeTalent('2', '佐藤', '花子'),
  makeTalent('3', '鈴木', '一郎'),
  makeTalent('4', '高橋', '美咲'),
  makeTalent('5', '田中', '健太'),
  makeTalent('6', '伊藤', '由美'),
]

describe('generateNameBuildQuestions', () => {
  describe('★☆☆（苗字・名前ペア選択）', () => {
    it('8個の選択肢を生成する', () => {
      const questions = generateNameBuildQuestions([talents[0]], talents, 1)
      expect(questions).toHaveLength(1)
      expect(questions[0].choices).toHaveLength(8)
    })

    it('正解の苗字・名前を含む', () => {
      const questions = generateNameBuildQuestions([talents[0]], talents, 1)
      const q = questions[0]
      expect(q.choices).toContain('山田')
      expect(q.choices).toContain('太郎')
    })
  })

  describe('★★☆（1文字ずつ選択）', () => {
    it('15文字の選択肢を生成する', () => {
      const questions = generateNameBuildQuestions([talents[0]], talents, 2)
      expect(questions).toHaveLength(1)
      expect(questions[0].choices).toHaveLength(15)
    })

    it('正解の全文字を含む', () => {
      const questions = generateNameBuildQuestions([talents[0]], talents, 2)
      const q = questions[0]
      const correctChars = [...q.correctFamilyName, ...q.correctGivenName]
      for (const char of correctChars) {
        expect(q.choices).toContain(char)
      }
    })

    it('各選択肢は1文字', () => {
      const questions = generateNameBuildQuestions([talents[0]], talents, 2)
      for (const choice of questions[0].choices) {
        expect(choice).toHaveLength(1)
      }
    })

    it('difficulty を正しく設定する', () => {
      const questions = generateNameBuildQuestions([talents[0]], talents, 2)
      expect(questions[0].difficulty).toBe(2)
    })
  })
})

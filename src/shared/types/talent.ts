export interface Talent {
  id: string
  generation: number
  dormitory: string
  name: string
  kana: string
  familyName: string
  givenName: string
  familyKana: string
  givenKana: string
}

export interface TalentsJson {
  version: number
  talents: Talent[]
}

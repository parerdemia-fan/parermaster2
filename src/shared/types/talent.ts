export interface TalentLink {
  type: string
  url: string
}

export interface TalentHashtag {
  tag: string
  usage: string
}

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
  nicknames: string[]
  firstPerson: string
  intro: string
  dream: string
  birthday: string
  height: number
  bloodType: string
  hairColor: string
  hairStyle: string
  eyeColorLeft: string
  eyeColorRight: string
  mbti: string
  tone: string
  fanName: string
  fanMark: string
  hashtags: TalentHashtag[]
  hobbies: string[]
  skills: string[]
  favorites: string[]
  links: TalentLink[]
}

export interface TalentsJson {
  version: number
  talents: Talent[]
}

export interface Award {
  id: string
  eventDate: string
  eventName: string
  result: string
  talentId: string
}

export interface AwardsJson {
  version: number
  awards: Award[]
}

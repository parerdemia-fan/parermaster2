import type { DormId } from '../../stores/settingsStore.ts'

export const DORM_LABELS: Record<DormId, string> & Record<string, string> = {
  wa: 'バゥ寮',
  me: 'ミュゥ寮',
  co: 'クゥ寮',
  wh: 'ウィニー寮',
}

const BASE = import.meta.env.BASE_URL

/** 季節テーマ。タイトル背景・ロゴなど季節で差し替えるアセットの切り替えに使う。 */
export type Season = 'spring' | 'summer'

/**
 * 現在の季節テーマ。
 * 季節替わりのときはこの定数だけを変更する（アセットは別途 public/data/images/ui/ に配置）。
 */
export const CURRENT_SEASON: Season = 'summer'

type SeasonTheme = {
  /** タイトル／設定画面などの既定背景 */
  titleBg: string
  /** タイトルロゴ（横画面用） */
  titleLogo: string
  /** 舞い散る花びら演出（SakuraPetals / ClickPetalEffect）を表示するか。春テーマの演出 */
  petals: boolean
}

const SEASON_THEMES: Record<Season, SeasonTheme> = {
  spring: {
    titleBg: `${BASE}data/images/ui/bg_title.png`,
    titleLogo: `${BASE}data/images/ui/logo_title_landscape.png`,
    petals: true,
  },
  summer: {
    titleBg: `${BASE}data/images/ui/bg_title_summer.png`,
    titleLogo: `${BASE}data/images/ui/logo_title_landscape_summer.png`,
    petals: false,
  },
}

const theme = SEASON_THEMES[CURRENT_SEASON]

/** 現在の季節のタイトル背景パス */
export const TITLE_BG = theme.titleBg
/** 現在の季節のタイトルロゴパス */
export const TITLE_LOGO = theme.titleLogo
/** 花びら演出（タイトルの舞い散り・クリック時）を表示するか */
export const PETALS_ENABLED = theme.petals

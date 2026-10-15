import type { FallingKind } from '../components/fallingShapes.ts'

const BASE = import.meta.env.BASE_URL

/** 季節テーマ。タイトル背景・ロゴなど季節で差し替えるアセットの切り替えに使う。 */
export type Season = 'spring' | 'summer' | 'autumn'

/**
 * 現在の季節テーマ。
 * 季節替わりのときはこの定数だけを変更する（アセットは別途 public/data/images/ui/ に配置）。
 * → docs/game-design.md「季節テーマ」
 */
export const CURRENT_SEASON: Season = 'autumn'

type SeasonTheme = {
  /** タイトル／設定画面などの既定背景 */
  titleBg: string
  /** タイトルロゴ（横画面用） */
  titleLogo: string
  /** 舞い落ちる演出（タイトルの常時演出・クリック時）の種類。null なら演出なし */
  falling: FallingKind | null
  /** OGP画像のロゴ下の文言 */
  ogpCaption: string
}

export const SEASON_THEMES: Record<Season, SeasonTheme> = {
  spring: {
    titleBg: `${BASE}data/images/ui/bg_title.png`,
    titleLogo: `${BASE}data/images/ui/logo_title_landscape.png`,
    falling: 'sakura',
    ogpCaption: '祝・２期生入学！',
  },
  summer: {
    titleBg: `${BASE}data/images/ui/bg_title_summer.png`,
    titleLogo: `${BASE}data/images/ui/logo_title_landscape_summer.png`,
    falling: null,
    ogpCaption: 'パレ学夏祭り！',
  },
  autumn: {
    titleBg: `${BASE}data/images/ui/bg_title_autumn.png`,
    titleLogo: `${BASE}data/images/ui/logo_title_landscape_autumn.png`,
    falling: 'autumnLeaves',
    ogpCaption: 'パレ学の秋！',
  },
}

const theme = SEASON_THEMES[CURRENT_SEASON]

/** 現在の季節のタイトル背景パス */
export const TITLE_BG = theme.titleBg
/** 現在の季節のタイトルロゴパス */
export const TITLE_LOGO = theme.titleLogo
/** 現在の季節の舞い落ちる演出の種類（null なら演出なし） */
export const FALLING_KIND = theme.falling
/** 現在の季節のOGP文言 */
export const OGP_CAPTION = theme.ogpCaption

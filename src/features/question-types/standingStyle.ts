import type { StandingImageVariant } from '../../shared/utils/talent.ts'

/**
 * クイズ画面（名前当て・名前を作ろう）の立ち絵の縦配置（top基準・cqmin）。
 * バリアントごとに高さ・開始位置を変える理由は features/room/kvScaleStyle.ts と同じ:
 * - kv1（1期生KV）: 画像内上余白 約10% を活かし top:0 / height:150cqmin
 * - kv2（2期生KV）: 横長で顔が大きく写り、画像内上余白が約1%しかない。
 *   高さを 0.8倍（120cqmin）にし、頭位置を kv1 に揃えるため 14cqmin 下げる
 * - live2d: 画像内上余白なし。高さは kv1 並みに大きくして 14cqmin 下げる
 *
 * ※ left（横位置）は画面ごとに異なるため、各レイアウト側で指定する。
 */
export function getQuizStandingTopHeight(
  variant: StandingImageVariant,
): { top: string; height: string } {
  switch (variant) {
    case 'kv2':
      return { top: '14cqmin', height: '120cqmin' }
    case 'live2d':
      return { top: '14cqmin', height: '150cqmin' }
    case 'kv1':
      return { top: '0cqmin', height: '150cqmin' }
  }
}

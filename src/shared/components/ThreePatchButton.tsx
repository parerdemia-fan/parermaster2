import type { ReactNode, CSSProperties } from 'react';
import { ThreePatchImage } from './ThreePatchImage.tsx';

interface ThreePatchButtonProps {
  /** 左端画像のパス */
  leftImage: string;
  /** 中央画像のパス */
  middleImage: string;
  /** 右端画像のパス */
  rightImage: string;
  /** ボタン内のテキスト */
  children: ReactNode;
  /** クリックハンドラー */
  onClick?: () => void;
  /** ボタンの高さ (例: '9cqmin') */
  height: string;
  /** フォントサイズ (例: '4cqmin') */
  fontSize?: string;
  /** テキストカラー */
  textColor?: string;
  /** 選択状態 */
  isSelected?: boolean;
  /** 選択時のbrightness */
  selectedBrightness?: number;
  /** 追加のクラス名 */
  className?: string;
  /** 追加のスタイル */
  style?: CSSProperties;
}

/**
 * 3-Patchボタンコンポーネント
 * 左・中央・右で別々の画像を配置して、中央部分を文字列長に応じて伸縮させるボタン
 */
export function ThreePatchButton({
  leftImage,
  middleImage,
  rightImage,
  children,
  onClick,
  height,
  fontSize = '4cqmin',
  textColor = '#999',
  isSelected = false,
  selectedBrightness = 1.2,
  className = '',
  style = {},
}: ThreePatchButtonProps) {
  const imageBrightness = isSelected ? selectedBrightness : 1;
  const imageFilter = `brightness(${imageBrightness})`;

  return (
    <button
      onClick={onClick}
      className={`
        rounded-lg font-bold cursor-pointer whitespace-nowrap flex items-center
        transition hover:brightness-125
        ${isSelected ? `brightness-[${selectedBrightness}]` : ''}
        ${className}
      `}
      style={{
        padding: 0,
        border: 'none',
        background: 'none',
        fontSize,
        ...style,
      }}
    >
      <ThreePatchImage
        leftImage={leftImage}
        middleImage={middleImage}
        rightImage={rightImage}
        height={height}
        textColor={textColor}
        fontSize={fontSize}
        filter={imageFilter}
      >
        {children}
      </ThreePatchImage>
    </button>
  );
}

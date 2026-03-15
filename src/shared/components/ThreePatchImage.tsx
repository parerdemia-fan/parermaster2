import type { ReactNode } from 'react';

interface ThreePatchImageProps {
  /** 左端画像のパス */
  leftImage: string;
  /** 中央画像のパス */
  middleImage: string;
  /** 右端画像のパス */
  rightImage: string;
  /** 中央に表示する内容 */
  children: ReactNode;
  /** 画像の幅 (例: '9cqmin') */
  width?: string;
  /** 画像の高さ (例: '9cqmin') */
  height: string;
  /** テキストカラー */
  textColor?: string;
  /** フォントサイズ (例: '4cqmin') */
  fontSize?: string;
  /** 画像に適用するfilter */
  filter?: string;
}

/**
 * 3-Patch画像コンポーネント
 * 左・中央・右で別々の画像を配置して、中央部分を内容に応じて伸縮させる
 */
export function ThreePatchImage({
  leftImage,
  middleImage,
  rightImage,
  children,
  width = 'auto',
  height,
  textColor = '#999',
  fontSize = '4cqmin',
  filter,
}: ThreePatchImageProps) {
  return (
    <div className="flex" style={{ width, fontSize: 0, lineHeight: 0 }}>
      {/* 左端 */}
      <img
      src={leftImage}
      alt=""
      style={{
        height,
        width: 'auto',
        display: 'block',
        verticalAlign: 'top',
        margin: 0,
        filter,
      }}
      />
      {/* 中央（内容に合わせて伸縮） */}
      <div
      style={{
        backgroundImage: `url(${middleImage})`,
        backgroundRepeat: 'no-repeat',
        backgroundSize: '100% 100%',
        height,
        display: 'flex',
        alignItems: 'center',
        padding: '0 2.5cqmin',
        color: textColor,
        fontSize,
        fontWeight: 'bold',
        whiteSpace: 'nowrap',
        marginLeft: '-2px',
        marginRight: '-2px',
        filter,
        ...(width !== 'auto' && { flex: 1 }),
      }}
      >
      {children}
      </div>
      {/* 右端 */}
      <img
      src={rightImage}
      alt=""
      style={{
        height,
        width: 'auto',
        display: 'block',
        verticalAlign: 'top',
        margin: 0,
        filter,
      }}
      />
    </div>
  );
}

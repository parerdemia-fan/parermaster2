import type { ReactNode } from 'react';
import { ClickPetalEffect } from './ClickPetalEffect';

interface GameContainerProps {
  children: ReactNode;
}

/**
 * ゲーム画面のメインコンテナ
 *
 * - アスペクト比 4:3（横長）を常に維持
 * - 横長画面: 高さ = 100dvh、幅 = 高さ * 4/3
 * - 縦長画面: 幅 = 100vw、高さ = 幅 * 3/4、上部配置
 * - container-type: size を設定し、子要素で cqmin 単位を使用可能
 */
export function GameContainer({ children }: GameContainerProps) {
  return (
    <div className="relative w-full flex justify-center shrink-0">
      <div
        className="flex flex-col items-center justify-center"
        style={{
          width: 'min(133.33dvh, 100dvw)',
          height: 'min(100dvh, 75dvw)',
          containerType: 'size',
        }}
      >
        {children}
      </div>
      <ClickPetalEffect />
    </div>
  );
}

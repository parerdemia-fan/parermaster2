import type { ReactNode } from 'react';

interface GameContainerProps {
  children: ReactNode;
}

/**
 * ゲーム画面のメインコンテナ
 *
 * - アスペクト比 4:3（横長）を常に維持
 * - 横長画面: 高さ = 100vh、幅 = 高さ * 4/3
 * - 縦長画面: 幅 = 100vw、高さ = 幅 * 3/4、上部配置
 * - container-type: size を設定し、子要素で cqmin 単位を使用可能
 */
export function GameContainer({ children }: GameContainerProps) {
  return (
    <div className="w-full flex justify-center shrink-0">
      <div
        className="flex flex-col items-center justify-center"
        style={{
          // 4:3 アスペクト比を維持
          // 横長画面: 高さ基準（100vh, 幅 = 133.33vh）
          // 縦長画面: 幅基準（100vw, 高さ = 75vw）
          width: 'min(133.33dvh, 100dvw)',
          height: 'min(100dvh, 75dvw)',
          // Container Queries を有効化（子要素で cqmin 単位を使用可能）
          containerType: 'size',
        }}
      >
        {children}
      </div>
    </div>
  );
}

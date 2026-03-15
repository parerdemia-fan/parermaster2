const BASE = import.meta.env.BASE_URL

export function TitleScreen() {
  return (
    <div className="relative w-full h-full flex flex-col items-center overflow-hidden animate-fade-in">
      {/* 横画面推奨表示（縦画面時のみ） */}
      <div
        className="absolute top-0 left-0 right-0 text-center font-bold z-10"
        style={{
          fontSize: '3cqmin',
          padding: '1cqmin',
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          color: 'white',
          display: 'none',
        }}
      >
        <style>{`
          @media (max-aspect-ratio: 4/3) {
            .landscape-hint { display: block !important; }
          }
        `}</style>
        <span className="landscape-hint" style={{ display: 'none' }}>
          📱 横画面推奨
        </span>
      </div>

      {/* ロゴ */}
      <img
        src={`${BASE}data/images/ui/logo_title_landscape.png`}
        alt="パレ学マスター 2nd Season"
        style={{
          marginTop: '3cqmin',
          height: '35cqmin',
          width: 'auto',
          objectFit: 'contain',
        }}
        draggable={false}
      />

      {/* メインボタン */}
      <div
        className="flex flex-col items-center"
        style={{
          gap: '3cqmin',
          marginTop: '5cqmin',
        }}
      >
        {/* 2期生・1期生（横並び） */}
        <div
          className="flex flex-row items-center justify-center"
          style={{ gap: '6cqmin' }}
        >
          <button
            className="font-bold cursor-pointer transition hover:brightness-110 active:scale-95 whitespace-nowrap"
            style={{
              fontSize: '5cqmin',
              padding: '1.5cqmin 5cqmin',
              borderRadius: '2cqmin',
              border: 'none',
              background: 'linear-gradient(180deg, #8ec8a0 0%, #6aaa80 100%)',
              color: 'white',
              boxShadow: '0 0.8cqmin 0 #4a8a60, 0 1cqmin 2cqmin rgba(0,0,0,0.2)',
              textShadow: '0 1px 2px rgba(0,0,0,0.3)',
            }}
          >
            🌙 1期生編
          </button>

          <button
            className="font-bold cursor-pointer transition hover:brightness-110 active:scale-95 whitespace-nowrap"
            style={{
              fontSize: '5cqmin',
              padding: '1.5cqmin 5cqmin',
              borderRadius: '2cqmin',
              border: 'none',
              background: 'linear-gradient(180deg, #f8a4c8 0%, #e8789e 100%)',
              color: 'white',
              boxShadow: '0 0.8cqmin 0 #c05a7a, 0 1cqmin 2cqmin rgba(0,0,0,0.2)',
              textShadow: '0 1px 2px rgba(0,0,0,0.3)',
            }}
          >
            🌸 2期生編
          </button>
        </div>

        {/* タイムアタック（下段） */}
        <button
          className="font-bold cursor-not-allowed whitespace-nowrap"
          style={{
            fontSize: '4cqmin',
            padding: '1.5cqmin 5cqmin',
            borderRadius: '2cqmin',
            border: 'none',
            background: 'linear-gradient(180deg, #c0c0c0 0%, #999 100%)',
            color: 'rgba(255,255,255,0.7)',
            boxShadow: '0 0.6cqmin 0 #777, 0 0.8cqmin 1.5cqmin rgba(0,0,0,0.2)',
            textShadow: '0 1px 2px rgba(0,0,0,0.2)',
            filter: 'grayscale(0.3)',
          }}
          disabled
        >
          🔒 タイムアタック
        </button>
      </div>

      {/* サブメニューアイコン（3つ横並び） */}
      <div
        className="flex items-end justify-center absolute"
        style={{
          gap: '4cqmin',
          bottom: '5%',
        }}
      >
        <button
          className="cursor-pointer transition-transform active:scale-95"
          style={{ background: 'none', border: 'none', padding: 0, width: '9cqmin' }}
        >
          <img
            src={`${BASE}data/images/ui/btn_help.png`}
            alt="ヘルプ"
            className="transition brightness-100 hover:brightness-140"
            style={{ width: '100%', height: 'auto', display: 'block' }}
            draggable={false}
          />
        </button>
        <button
          className="cursor-pointer transition-transform active:scale-95"
          style={{ background: 'none', border: 'none', padding: 0, width: '9cqmin' }}
        >
          <img
            src={`${BASE}data/images/ui/btn_talents.png`}
            alt="タレント一覧"
            className="transition brightness-100 hover:brightness-140"
            style={{ width: '100%', height: 'auto', display: 'block' }}
            draggable={false}
          />
        </button>
        <button
          className="cursor-pointer transition-transform active:scale-95"
          style={{ background: 'none', border: 'none', padding: 0, width: '9cqmin' }}
        >
          <img
            src={`${BASE}data/images/ui/btn_achievement.png`}
            alt="アチーブメント"
            className="transition brightness-100 hover:brightness-140"
            style={{ width: '100%', height: 'auto', display: 'block' }}
            draggable={false}
          />
        </button>
      </div>

      {/* 免責テキスト */}
      <div
        className="absolute bottom-0 left-0 right-0 text-center text-gray-300"
        style={{
          fontSize: '2cqmin',
          filter: 'drop-shadow(1px 1px 1px rgba(0, 0, 0, 1))',
        }}
      >
        ※このゲームは二次創作物であり非公式のものです
      </div>
    </div>
  );
}

const BASE = import.meta.env.BASE_URL

export function OgpScreen() {
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        backgroundImage: `url('${BASE}data/images/ui/bg_title.png')`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
      }}
    >
      <div
        className="absolute inset-0 flex flex-col items-center"
        style={{ zIndex: 1, paddingTop: '2cqmin' }}
      >
        <img
          src={`${BASE}data/images/ui/logo_title_landscape.png`}
          alt="パレ学マスター 2nd Season"
          style={{ height: '60cqmin', width: 'auto', filter: 'drop-shadow(0 0.5cqmin 1.5cqmin rgba(0,0,0,0.3))' }}
        />

        <div
          className="font-bold"
          style={{ fontSize: '8cqmin', color: 'white', textShadow: '0 0.3cqmin 0.6cqmin rgba(0,0,0,0.9), 0 0 2cqmin rgba(0,0,0,0.6), 0 0 4cqmin rgba(0,0,0,0.3)', letterSpacing: '0.1em', whiteSpace: 'nowrap', marginTop: '1cqmin' }}
        >
          祝・２期生入学！
        </div>

        <div className="flex" style={{ gap: '3cqmin', position: 'absolute', bottom: '4cqmin' }}>
          {(['wa', 'me', 'co', 'wh'] as const).map((d) => (
            <img
              key={d}
              src={`${BASE}data/images/ui/emblem_${d}.webp`}
              style={{
                width: '16cqmin',
                height: '16cqmin',
                filter: 'drop-shadow(0 0.3cqmin 0.6cqmin rgba(0,0,0,0.3))',
              }}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

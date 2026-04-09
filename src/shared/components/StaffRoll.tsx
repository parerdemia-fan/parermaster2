import { useEffect, useState, useRef } from 'react'
import { useSettingsStore } from '../../stores/settingsStore.ts'
import { useTalents } from '../hooks/useTalents.ts'
import { DORM_LABELS } from '../constants/dorm.ts'
import type { DormId } from '../../stores/settingsStore.ts'
import type { Talent } from '../types/talent.ts'

const BASE = import.meta.env.BASE_URL
const DORM_ORDER: DormId[] = ['wa', 'me', 'co', 'wh']

interface StaffRole {
  role: string
  members: string[]
}

/**
 * スタッフロール（オーバーレイ表示）
 * パレ学マスター称号で解放。黒背景の上をテキストが下から上へスクロール。
 */
export default function StaffRoll({ onClose }: { onClose: () => void }) {
  const playerName = useSettingsStore((s) => s.playerName)
  const { talents } = useTalents()
  const [staffData, setStaffData] = useState<StaffRole[]>([])
  const [isLoaded, setIsLoaded] = useState(false)
  const [isAnimationReady, setIsAnimationReady] = useState(false)
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)
  const animationRef = useRef<number>(0)
  const onCloseRef = useRef(onClose)
  onCloseRef.current = onClose

  useEffect(() => {
    fetch(`${BASE}data/staff.json`)
      .then((r) => r.json())
      .then((data: StaffRole[]) => { setStaffData(data); setIsLoaded(true) })
      .catch(() => setIsLoaded(true))
  }, [])

  // スクロールアニメーション（delta-time ベースで速度一定）
  useEffect(() => {
    if (!isLoaded || !scrollContainerRef.current || !contentRef.current) return

    const container = scrollContainerRef.current
    const content = contentRef.current
    const containerHeight = container.clientHeight
    const contentHeight = content.scrollHeight

    let pos = containerHeight
    let lastTime = 0
    content.style.transform = `translateY(${pos}px)`
    setIsAnimationReady(true)

    const SCROLL_SPEED = 60 // px/sec

    const animate = (now: number) => {
      if (lastTime === 0) lastTime = now
      const dt = Math.min((now - lastTime) / 1000, 0.05)
      lastTime = now
      pos -= SCROLL_SPEED * dt
      content.style.transform = `translateY(${pos}px)`
      if (pos < -contentHeight) { onCloseRef.current(); return }
      animationRef.current = requestAnimationFrame(animate)
    }

    const timer = setTimeout(() => {
      animationRef.current = requestAnimationFrame(animate)
    }, 500)

    return () => {
      clearTimeout(timer)
      cancelAnimationFrame(animationRef.current)
    }
  }, [isLoaded])

  // タレントを寮別にグループ化
  const talentsByDorm = DORM_ORDER.map((dorm) => ({
    dorm,
    label: DORM_LABELS[dorm],
    talents: talents.filter((t) => t.dormitory === dorm),
  })).filter((g) => g.talents.length > 0)

  const specialThanksName = playerName === 'リスナー' ? 'プレイしてくれたあなた' : playerName

  return (
    <div
      className="absolute inset-0 flex flex-col items-center"
      style={{ backgroundColor: 'rgba(0,0,0,0.95)', zIndex: 60 }}
    >
      <button
        className="absolute font-bold cursor-pointer transition hover:brightness-110 active:scale-95"
        style={{
          top: '3cqmin',
          right: '3cqmin',
          zIndex: 10,
          fontSize: '3cqmin',
          padding: '1cqmin 2.5cqmin',
          borderRadius: '2cqmin',
          border: 'none',
          background: 'rgba(255,255,255,0.15)',
          color: '#ccc',
        }}
        onClick={onClose}
      >
        Skip
      </button>

      <div
        ref={scrollContainerRef}
        className="w-full h-full overflow-hidden relative"
        style={{ padding: '0 10cqmin' }}
      >
        <div
          ref={contentRef}
          className="flex flex-col items-center"
          style={{ paddingBottom: '10cqmin', visibility: isAnimationReady ? 'visible' : 'hidden' }}
        >
          {/* タイトル */}
          <div className="text-center" style={{ marginBottom: '8cqmin' }}>
            <h1
              className="font-bold"
              style={{ fontSize: '6cqmin', color: '#fde68a', textShadow: '0 0 10px rgba(255,215,0,0.8)' }}
            >
              パレ学マスター
            </h1>
            <div style={{ fontSize: '3.5cqmin', color: '#fde68a', marginTop: '1cqmin' }}>
              2nd Season
            </div>
          </div>

          {/* スタッフリスト */}
          {staffData.map((roleData, i) => (
            <div key={i} className="text-center" style={{ marginBottom: '6cqmin' }}>
              <div className="font-bold" style={{ fontSize: '3.5cqmin', color: '#fbbf24', marginBottom: '2cqmin' }}>
                {roleData.role}
              </div>
              {roleData.members.map((member, j) => (
                <div key={j} style={{ fontSize: '3cqmin', color: 'white', marginBottom: '1cqmin' }}>
                  {member}
                </div>
              ))}
            </div>
          ))}

          {/* キャスト（寮別3列グリッド） */}
          {talentsByDorm.length > 0 && (
            <div className="text-center" style={{ marginBottom: '6cqmin', width: '100%' }}>
              <div className="font-bold" style={{ fontSize: '3.5cqmin', color: '#fbbf24', marginBottom: '3cqmin' }}>
                キャスト
              </div>
              {talentsByDorm.map(({ dorm, label, talents: dormTalents }) => (
                <div key={dorm} style={{ marginBottom: '4cqmin' }}>
                  <div className="font-bold" style={{ fontSize: '2.5cqmin', color: '#d1d5db', marginBottom: '1.5cqmin' }}>
                    {label}
                  </div>
                  <div
                    className="grid"
                    style={{ gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5cqmin 2cqmin', justifyItems: 'center' }}
                  >
                    {dormTalents.map((t: Talent) => (
                      <div key={t.id} style={{ fontSize: '2.5cqmin', color: 'white' }}>
                        {t.name}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Special Thanks */}
          <div className="text-center" style={{ marginBottom: '6cqmin' }}>
            <div className="font-bold" style={{ fontSize: '3.5cqmin', color: '#fbbf24', marginBottom: '2cqmin' }}>
              Special Thanks
            </div>
            <div style={{ fontSize: '3cqmin', color: 'white' }}>
              {specialThanksName}
            </div>
          </div>

          {/* ファンメイド注記 + エンディング */}
          <div className="text-center" style={{ marginTop: '8cqmin', marginBottom: '4cqmin' }}>
            <div style={{ fontSize: '2.5cqmin', color: '#9ca3af', lineHeight: 2, marginBottom: '4cqmin' }}>
              このゲームはファンメイド作品です<br />
              パレデミア学園公式とは関係ありません
            </div>
            <div className="font-bold" style={{ fontSize: '3.5cqmin', color: 'white', lineHeight: 1.8 }}>
              Thank you for playing!
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

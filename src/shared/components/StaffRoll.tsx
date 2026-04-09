import { useEffect, useState, useRef } from 'react'
import { useSettingsStore } from '../../stores/settingsStore.ts'
import { useTalents } from '../hooks/useTalents.ts'
import { useQuestions } from '../hooks/useQuestions.ts'
import { shuffleArray } from '../utils/array.ts'
import { DORM_LABELS } from '../constants/dorm.ts'
import type { DormId } from '../../stores/settingsStore.ts'
import type { Talent } from '../types/talent.ts'

const BASE = import.meta.env.BASE_URL
const DORM_ORDER: DormId[] = ['wa', 'me', 'co', 'wh']
const CREDIT_TEXT_SHADOW = '0 1px 4px rgba(0,0,0,0.8)'

interface StaffRole {
  role: string
  members: string[]
}

// 画像表示の4隅ポジション（右下→左上→右上→左下）
const IMAGE_POSITIONS: Record<string, string>[] = [
  { bottom: '8%', right: '5%' },
  { top: '8%', left: '5%' },
  { top: '8%', right: '5%' },
  { bottom: '8%', left: '5%' },
]

const IMAGE_CYCLE_MS = 8000
const IMAGE_FADE_MS = 1000
const LOGO_HOLD_MS = 3000
const SCROLL_SPEED = 60 // px/sec

/**
 * スタッフロール（オーバーレイ表示）
 * パレ学マスター称号で解放。黒背景の上をテキストが下から上へスクロール。
 */
export default function StaffRoll({ onClose }: { onClose: () => void }) {
  const playerName = useSettingsStore((s) => s.playerName)
  const { talents } = useTalents()
  const { questions } = useQuestions()
  const [staffData, setStaffData] = useState<StaffRole[]>([])
  const [isLoaded, setIsLoaded] = useState(false)
  const [isAnimationReady, setIsAnimationReady] = useState(false)
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)
  const animationRef = useRef<number>(0)
  const closeTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined)
  const onCloseRef = useRef(onClose)
  onCloseRef.current = onClose

  const bgWrapperRef = useRef<HTMLDivElement>(null)
  const bgImgRef = useRef<HTMLImageElement>(null)
  const logoRef = useRef<HTMLImageElement>(null)
  const imageListRef = useRef<string[]>([])
  const imageIdxRef = useRef(0)
  const posIdxRef = useRef(0)

  // 質問画像リストを構築
  useEffect(() => {
    if (questions.length === 0) return
    const images = new Set<string>()
    for (const q of questions) {
      if (q.questionImage) images.add(q.questionImage)
      if (q.commentImage) images.add(q.commentImage)
    }
    imageListRef.current = shuffleArray([...images])
  }, [questions])

  useEffect(() => {
    fetch(`${BASE}data/staff.json`)
      .then((r) => r.json())
      .then((data: StaffRole[]) => { setStaffData(data); setIsLoaded(true) })
      .catch(() => setIsLoaded(true))
  }, [])

  // スクロールアニメーション + 画像演出
  useEffect(() => {
    if (!isLoaded || !scrollContainerRef.current || !contentRef.current) return

    const container = scrollContainerRef.current
    const content = contentRef.current
    const containerHeight = container.clientHeight
    const contentHeight = content.scrollHeight

    let pos = containerHeight
    let lastTime = 0
    let imagesStarted = false
    let imagePhaseStart = 0
    let imageVisible = false
    let scrollEnded = false
    let logoPhaseStart = 0
    let logoVisible = false
    content.style.transform = `translateY(${pos}px)`
    setIsAnimationReady(true)

    const showNextImage = (now: number) => {
      const wrapper = bgWrapperRef.current
      const img = bgImgRef.current
      if (!wrapper || !img || imageListRef.current.length === 0) return

      const idx = imageIdxRef.current % imageListRef.current.length
      const posIdx = posIdxRef.current % IMAGE_POSITIONS.length
      const imgFile = imageListRef.current[idx]
      const position = IMAGE_POSITIONS[posIdx]

      img.src = `${BASE}data/images/questions/${imgFile}`
      Object.assign(wrapper.style, { top: '', bottom: '', left: '', right: '', ...position })
      wrapper.style.opacity = '0'
      requestAnimationFrame(() => { wrapper.style.opacity = '0.5' })

      imageIdxRef.current++
      posIdxRef.current++
      imagePhaseStart = now
      imageVisible = true
    }

    const animate = (now: number) => {
      if (lastTime === 0) lastTime = now
      const dt = Math.min((now - lastTime) / 1000, 0.05)
      lastTime = now

      if (scrollEnded) {
        const logo = logoRef.current
        if (logo) {
          const elapsed = now - logoPhaseStart
          if (!logoVisible) {
            logo.style.opacity = '1'
            logoVisible = true
          }
          if (elapsed > LOGO_HOLD_MS) {
            logo.style.opacity = '0'
            closeTimerRef.current = setTimeout(() => onCloseRef.current(), IMAGE_FADE_MS + 300)
            return
          }
        }
        animationRef.current = requestAnimationFrame(animate)
        return
      }

      pos -= SCROLL_SPEED * dt
      content.style.transform = `translateY(${pos}px)`

      if (pos < -contentHeight) {
        scrollEnded = true
        logoPhaseStart = now
        if (bgWrapperRef.current) bgWrapperRef.current.style.opacity = '0'
        animationRef.current = requestAnimationFrame(animate)
        return
      }

      if (!imagesStarted && pos <= 0) {
        imagesStarted = true
        showNextImage(now)
      }

      if (imagesStarted && imageVisible) {
        const elapsed = now - imagePhaseStart
        if (elapsed > IMAGE_CYCLE_MS - IMAGE_FADE_MS && bgWrapperRef.current) {
          bgWrapperRef.current.style.opacity = '0'
        }
        if (elapsed > IMAGE_CYCLE_MS) {
          imageVisible = false
          showNextImage(now)
        }
      }

      animationRef.current = requestAnimationFrame(animate)
    }

    const timer = setTimeout(() => {
      animationRef.current = requestAnimationFrame(animate)
    }, 500)

    return () => {
      clearTimeout(timer)
      cancelAnimationFrame(animationRef.current)
      clearTimeout(closeTimerRef.current)
    }
  }, [isLoaded])

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

      {/* 背景画像（ピンク調オーバーレイ） */}
      <div
        ref={bgWrapperRef}
        style={{
          position: 'absolute',
          maxWidth: '35%',
          maxHeight: '45%',
          opacity: 0,
          transition: `opacity ${IMAGE_FADE_MS}ms ease-in-out`,
          borderRadius: '2cqmin',
          pointerEvents: 'none',
          zIndex: 1,
          overflow: 'hidden',
        }}
      >
        <img
          ref={bgImgRef}
          alt=""
          style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block' }}
          draggable={false}
        />
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(180,100,130,0.45)', mixBlendMode: 'color' }} />
      </div>

      {/* ロゴ画像（最後にフェードイン） */}
      <img
        ref={logoRef}
        src={`${BASE}data/images/ui/logo_title_landscape.png`}
        alt="パレ学マスター 2nd Season"
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '70%',
          maxWidth: '80cqmin',
          objectFit: 'contain',
          opacity: 0,
          transition: `opacity ${IMAGE_FADE_MS}ms ease-in-out`,
          pointerEvents: 'none',
          zIndex: 5,
          filter: 'drop-shadow(0 0 2cqmin rgba(255,215,0,0.5))',
        }}
        draggable={false}
      />

      {/* スクロールコンテナ */}
      <div
        ref={scrollContainerRef}
        className="w-full h-full overflow-hidden relative"
        style={{ padding: '0 10cqmin', zIndex: 2 }}
      >
        <div
          ref={contentRef}
          className="flex flex-col items-center"
          style={{ paddingBottom: '10cqmin', visibility: isAnimationReady ? 'visible' : 'hidden' }}
        >
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

          {staffData.map((roleData, i) => (
            <div key={i} className="text-center" style={{ marginBottom: '6cqmin' }}>
              <div className="font-bold" style={{ fontSize: '3.5cqmin', color: '#fbbf24', marginBottom: '2cqmin' }}>
                {roleData.role}
              </div>
              {roleData.members.map((member, j) => (
                <div key={j} style={{ fontSize: '3cqmin', color: 'white', marginBottom: '1cqmin', textShadow: CREDIT_TEXT_SHADOW }}>
                  {member}
                </div>
              ))}
            </div>
          ))}

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
                  <div className="grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5cqmin 2cqmin', justifyItems: 'center' }}>
                    {dormTalents.map((t: Talent) => (
                      <div key={t.id} style={{ fontSize: '2.5cqmin', color: 'white', textShadow: CREDIT_TEXT_SHADOW }}>
                        {t.name}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="text-center" style={{ marginBottom: '6cqmin' }}>
            <div className="font-bold" style={{ fontSize: '3.5cqmin', color: '#fbbf24', marginBottom: '2cqmin' }}>
              Special Thanks
            </div>
            <div style={{ fontSize: '3cqmin', color: 'white', textShadow: CREDIT_TEXT_SHADOW }}>
              {specialThanksName}
            </div>
          </div>

          <div className="text-center" style={{ marginTop: '8cqmin', marginBottom: '4cqmin' }}>
            <div style={{ fontSize: '2.5cqmin', color: '#9ca3af', lineHeight: 2, marginBottom: '4cqmin' }}>
              このゲームはファンメイド作品です<br />
              パレデミア学園公式とは関係ありません
            </div>
            <div className="font-bold" style={{ fontSize: '3.5cqmin', color: 'white', lineHeight: 1.8, textShadow: CREDIT_TEXT_SHADOW }}>
              Thank you for playing!
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

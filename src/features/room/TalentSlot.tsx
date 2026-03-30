import { useEffect, useRef } from 'react'
import gsap from 'gsap'

interface TalentSlotProps {
  talentId: string | null
  imagePath: string | null
  position: 'left' | 'center' | 'right'
  showSelector: boolean
  onClick: () => void
}

const POSITION_LEFT: Record<string, string> = {
  left: '25%',
  center: '50%',
  right: '75%',
}

const Z_INDEX: Record<string, number> = {
  left: 1,
  center: 2,
  right: 3,
}

export function TalentSlot({ talentId, imagePath, position, showSelector, onClick }: TalentSlotProps) {
  const imgRef = useRef<HTMLImageElement>(null)

  // GSAPゆらゆらアニメーション（前作踏襲）
  useEffect(() => {
    const el = imgRef.current
    if (!el || !talentId) return

    const animations: gsap.core.Tween[] = []
    animations.push(gsap.to(el, { y: '1%', duration: 'random(3, 5)', ease: 'sine.inOut', yoyo: true, repeat: -1 }))
    animations.push(gsap.to(el, { x: '2%', duration: 'random(4, 6)', ease: 'sine.inOut', yoyo: true, repeat: -1 }))
    animations.push(gsap.to(el, { rotation: 'random(-5, 5)', duration: 'random(5, 7)', ease: 'sine.inOut', yoyo: true, repeat: -1 }))
    animations.push(gsap.to(el, { scale: 'random(1, 1.07)', duration: 'random(4, 5)', ease: 'sine.inOut', yoyo: true, repeat: -1 }))

    return () => { animations.forEach((a) => a.kill()) }
  }, [talentId])

  return (
    <div
      style={{
        position: 'absolute',
        left: POSITION_LEFT[position],
        top: 0,
        bottom: 0,
        transform: 'translateX(-50%)',
        zIndex: Z_INDEX[position],
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'flex-end',
      }}
    >
      {talentId && imagePath ? (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            overflow: 'hidden',
            display: 'flex',
            justifyContent: 'center',
            cursor: showSelector ? 'pointer' : 'default',
          }}
          onClick={showSelector ? onClick : undefined}
        >
          <img
            ref={imgRef}
            src={imagePath}
            alt=""
            style={{ height: '200%', width: 'auto', maxWidth: 'none' }}
            draggable={false}
          />
        </div>
      ) : showSelector ? (
        <button
          onClick={onClick}
          style={{
            position: 'absolute',
            top: '20%',
            width: '12dvw',
            height: '12dvw',
            maxWidth: '60px',
            maxHeight: '60px',
            borderRadius: '50%',
            border: '2px dashed rgba(255,255,255,0.4)',
            background: 'rgba(255,255,255,0.1)',
            color: 'rgba(255,255,255,0.5)',
            fontSize: '24px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          ＋
        </button>
      ) : null}
    </div>
  )
}

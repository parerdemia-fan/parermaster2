import { useEffect, useRef } from 'react'
import gsap from 'gsap'

interface TalentSlotProps {
  talentId: string | null
  imagePath: string | null
  isSquare: boolean
  position: 'left' | 'center' | 'right'
  showSelector: boolean
  onClick: () => void
}

/** クリック領域: 画面幅1/3ずつ均等 */
const SLOT_LEFT: Record<string, string> = {
  left: '0%',
  center: '33.33%',
  right: '66.66%',
}

const Z_INDEX: Record<string, number> = {
  left: 1,
  center: 2,
  right: 3,
}

export function TalentSlot({ talentId, imagePath, isSquare, position, showSelector, onClick }: TalentSlotProps) {
  const imgRef = useRef<HTMLImageElement>(null)

  useEffect(() => {
    const el = imgRef.current
    if (!el) return

    const animations: gsap.core.Tween[] = []
    animations.push(gsap.to(el, { y: 8, duration: 'random(3, 5)', ease: 'sine.inOut', yoyo: true, repeat: -1 }))
    animations.push(gsap.to(el, { x: 4, duration: 'random(4, 6)', ease: 'sine.inOut', yoyo: true, repeat: -1 }))
    animations.push(gsap.to(el, { rotation: 'random(-3, 3)', duration: 'random(5, 7)', ease: 'sine.inOut', yoyo: true, repeat: -1 }))
    animations.push(gsap.to(el, { scale: 1.05, duration: 'random(4, 5)', ease: 'sine.inOut', yoyo: true, repeat: -1 }))

    return () => { animations.forEach((a) => a.kill()) }
  }, [talentId, imagePath])

  const hasTalent = talentId && imagePath

  return (
    <div
      style={{
        position: 'absolute',
        left: SLOT_LEFT[position],
        top: 0,
        bottom: 0,
        width: '33.33%',
        zIndex: Z_INDEX[position],
        overflow: 'visible',
        cursor: showSelector ? 'pointer' : 'default',
      }}
      onClick={showSelector ? onClick : undefined}
    >
      {hasTalent ? (
        <div
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            display: 'flex',
            justifyContent: 'center',
            overflow: 'visible',
            pointerEvents: 'none',
            ...(isSquare
              ? { bottom: '25%' }
              : {
                  // 画像高さ150dvwの25%=37.5dvwを下にはみ出す。
                  // 談話室高さ = 100dvh - 75dvw、画像top = 談話室高さ - 画像高さ + 37.5dvw
                  top: `max(0px, calc(100dvh - 187.5dvw))`,
                }),
          }}
        >
          <img
            ref={imgRef}
            src={imagePath}
            alt=""
            style={{
              flexShrink: 0,
              ...(isSquare
                ? { width: '80%', height: 'auto' }
                : { height: '150dvw', width: 'auto', maxWidth: 'none' }),
            }}
            draggable={false}
          />
        </div>
      ) : showSelector ? (
        <button
          onClick={onClick}
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: '14dvw',
            height: '14dvw',
            maxWidth: '72px',
            maxHeight: '72px',
            borderRadius: '50%',
            border: '3px dashed rgba(255,255,255,0.6)',
            background: 'rgba(255,255,255,0.2)',
            color: 'rgba(255,255,255,0.8)',
            fontSize: '28px',
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

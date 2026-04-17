import { useEffect, useRef } from 'react'
import gsap from 'gsap'
import { useKvScale } from './useKvScaleStore.ts'
import { getKvImageStyle } from './kvScaleStyle.ts'

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
  const kvScale = useKvScale(isSquare ? null : talentId)
  const kvStyle = getKvImageStyle(kvScale)

  useEffect(() => {
    const el = imgRef.current
    if (!el) return

    const tweens: gsap.core.Tween[] = []
    tweens.push(gsap.to(el, { y: 8, rotation: 'random(-3, 3)', duration: 'random(3, 5)', ease: 'sine.inOut', yoyo: true, repeat: -1 }))
    tweens.push(gsap.to(el, { x: 4, scale: 1.05, duration: 'random(4, 6)', ease: 'sine.inOut', yoyo: true, repeat: -1 }))

    return () => { tweens.forEach((t) => t.kill()) }
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
              : { top: kvStyle.containerTop }),
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
                : { height: kvStyle.imgHeight, width: 'auto', maxWidth: 'none' }),
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

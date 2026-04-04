import { useEffect, useRef, useState, useCallback } from 'react'
import { useQuotes } from '../../shared/hooks/useQuotes.ts'
import { pickQuote } from '../../shared/utils/pickQuote.ts'
import { useSettingsStore } from '../../stores/settingsStore.ts'
import type { Talent } from '../../shared/types/talent.ts'

const SCENE = '談話室'
const INTERVAL_MIN = 15_000
const INTERVAL_MAX = 30_000
const DISPLAY_DURATION = 4_000
const FADE_DURATION = 400

interface SpeechBubbleProps {
  /** スロット順（left, center, right）で並んだタレント配列 */
  talents: Talent[]
}

function randomInterval(): number {
  return INTERVAL_MIN + Math.random() * (INTERVAL_MAX - INTERVAL_MIN)
}

/** スロット位置の中心x% */
const SLOT_CENTER_X = [16.67, 50, 83.33]

export function SpeechBubble({ talents }: SpeechBubbleProps) {
  const quotes = useQuotes()
  const playerName = useSettingsStore((s) => s.playerName)

  const [bubble, setBubble] = useState<{ text: string; centerX: number } | null>(null)
  const [visible, setVisible] = useState(false)
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([])

  const clearAllTimers = useCallback(() => {
    timersRef.current.forEach(clearTimeout)
    timersRef.current = []
  }, [])

  const addTimer = useCallback((fn: () => void, ms: number) => {
    const id = setTimeout(fn, ms)
    timersRef.current.push(id)
    return id
  }, [])

  useEffect(() => {
    if (!quotes || talents.length === 0) return

    const show = () => {
      const idx = Math.floor(Math.random() * talents.length)
      const talent = talents[idx]
      const centerX = SLOT_CENTER_X[idx] ?? 50

      const text = pickQuote(quotes, talent.tone, talent.name, SCENE, playerName)
      if (!text) {
        addTimer(show, randomInterval())
        return
      }

      setBubble({ text, centerX })
      setVisible(true)

      addTimer(() => {
        setVisible(false)
        addTimer(() => {
          setBubble(null)
          addTimer(show, randomInterval())
        }, FADE_DURATION)
      }, DISPLAY_DURATION)
    }

    addTimer(show, randomInterval())

    return clearAllTimers
  }, [quotes, talents, playerName, addTimer, clearAllTimers])

  if (!bubble) return null

  return (
    <div
      style={{
        position: 'absolute',
        left: `${bubble.centerX}%`,
        top: '50%',
        transform: 'translate(-50%, -50%)',
        zIndex: 20,
        pointerEvents: 'none',
        opacity: visible ? 1 : 0,
        transition: `opacity ${FADE_DURATION}ms ease`,
        maxWidth: 'calc(100% - 16px)',
      }}
    >
      <div
        style={{
          position: 'relative',
          background: 'rgba(255, 255, 255, 0.92)',
          borderRadius: '12px',
          padding: '6px 12px',
          fontSize: '13px',
          lineHeight: 1.4,
          color: '#333',
          whiteSpace: 'nowrap',
          boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
        }}
      >
        {/* 尻尾（上向き三角） */}
        <div
          style={{
            position: 'absolute',
            top: '-8px',
            left: '50%',
            transform: 'translateX(-50%)',
            width: 0,
            height: 0,
            borderLeft: '8px solid transparent',
            borderRight: '8px solid transparent',
            borderBottom: '8px solid rgba(255, 255, 255, 0.92)',
          }}
        />
        {bubble.text}
      </div>
    </div>
  )
}

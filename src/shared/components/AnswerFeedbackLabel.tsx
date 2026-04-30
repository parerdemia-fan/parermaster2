interface AnswerFeedbackLabelProps {
  isCorrect: boolean
  isTimeAttack: boolean
  /** タイムアタック不正解時のペナルティ秒数（タイムアタック以外では未使用） */
  penaltySeconds?: number
}

export function AnswerFeedbackLabel({ isCorrect, isTimeAttack, penaltySeconds = 5 }: AnswerFeedbackLabelProps) {
  const text = isCorrect ? '🎉 正解！' : isTimeAttack ? `😢 不正解.. +${penaltySeconds}秒` : '😢 不正解..'

  return (
    <>
      <style>{`
        @keyframes answer-feedback {
          0% { opacity: 0; transform: translate(-50%, -50%) scale(0.5); }
          15% { opacity: 1; transform: translate(-50%, -50%) scale(1.05); }
          25% { opacity: 1; transform: translate(-50%, -50%) scale(1.0); }
          75% { opacity: 1; transform: translate(-50%, -50%) scale(1.0); }
          100% { opacity: 0; transform: translate(-50%, -60%) scale(0.8); }
        }
      `}</style>
      <div
        className="font-bold"
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          zIndex: 30,
          fontSize: '7cqmin',
          color: 'white',
          background: isCorrect
            ? 'rgba(34,197,94,0.9)'
            : 'rgba(239,68,68,0.9)',
          padding: '1.5cqmin 5cqmin',
          borderRadius: '2cqmin',
          boxShadow: '0 0.5cqmin 3cqmin rgba(0,0,0,0.4)',
          textShadow: '0 1px 3px rgba(0,0,0,0.5)',
          WebkitTextStroke: '0.5px rgba(0,0,0,0.3)',
          border: '0.4cqmin solid rgba(255,255,255,0.4)',
          pointerEvents: 'none',
          whiteSpace: 'nowrap',
          animation: 'answer-feedback 1.3s ease-out forwards',
        }}
      >
        {text}
      </div>
    </>
  )
}

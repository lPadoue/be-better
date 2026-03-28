'use client'

import { useEffect } from 'react'

interface Props {
  phrase: string
  onDone: () => void
}

export default function CompletionToast({ phrase, onDone }: Props) {
  useEffect(() => {
    const timer = setTimeout(onDone, 2500)
    return () => clearTimeout(timer)
  }, [onDone])

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/90 backdrop-blur-sm"
      onClick={onDone}
    >
      <div className="text-center px-8 animate-bounce-in">
        <div className="text-6xl mb-6">✅</div>
        <p className="text-2xl font-semibold text-white max-w-xs">{phrase}</p>
        <p className="text-slate-500 text-sm mt-4">Tape pour continuer</p>
      </div>
    </div>
  )
}

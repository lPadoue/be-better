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
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#0D0B09]/95 backdrop-blur-sm"
      onClick={onDone}
    >
      <div className="text-center px-8 animate-bounce-in">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-[#2E1F05] border border-[#E8A44A]/30 mb-6 text-4xl">
          ✦
        </div>
        <p className="font-[family-name:var(--font-serif)] text-2xl text-[#F2EAE0] max-w-xs leading-snug">{phrase}</p>
        <p className="text-[#4A3F37] text-xs mt-5 uppercase tracking-widest">Toucher pour continuer</p>
      </div>
    </div>
  )
}

'use client'

import { createGroup } from '@/lib/server/groups'

const EMOJIS = ['👨‍👩‍👧', '🐱', '💪', '❤️', '🌱', '🏃', '🍎', '📚', '🎯', '🌟']

export default function CreateGroupForm() {
  return (
    <form action={createGroup} className="space-y-5">
      <div>
        <label className="text-xs text-[#8C7E72] block mb-2 uppercase tracking-widest font-medium">Emoji</label>
        <div className="flex gap-2 flex-wrap">
          {EMOJIS.map(e => (
            <label key={e} className="cursor-pointer">
              <input type="radio" name="emoji" value={e} className="sr-only peer" defaultChecked={e === '🎯'} />
              <span className="text-2xl p-2 rounded-xl bg-[#1E1A16] border border-[#2C2620] peer-checked:border-[#E8A44A]/60 peer-checked:bg-[#2E1F05] block transition-all duration-150 hover:border-[#3C3228]">
                {e}
              </span>
            </label>
          ))}
        </div>
      </div>

      <div>
        <label className="text-xs text-[#8C7E72] block mb-1.5 uppercase tracking-widest font-medium">
          Nom du groupe <span className="text-[#E8A44A]">*</span>
        </label>
        <input
          name="name"
          required
          placeholder="Be better son"
          className="w-full bg-[#1E1A16] border border-[#2C2620] text-[#F2EAE0] placeholder:text-[#4A3F37] rounded-xl py-3 px-4 focus:outline-none focus:border-[#E8A44A] focus:ring-1 focus:ring-[#E8A44A]/20 transition-all duration-200 text-sm"
        />
      </div>

      <div>
        <label className="text-xs text-[#8C7E72] block mb-1.5 uppercase tracking-widest font-medium">Description</label>
        <input
          name="description"
          placeholder="Optionnel"
          className="w-full bg-[#1E1A16] border border-[#2C2620] text-[#F2EAE0] placeholder:text-[#4A3F37] rounded-xl py-3 px-4 focus:outline-none focus:border-[#E8A44A] focus:ring-1 focus:ring-[#E8A44A]/20 transition-all duration-200 text-sm"
        />
      </div>

      <button
        type="submit"
        className="w-full bg-[#E8A44A] hover:bg-[#F0B55E] text-[#0D0B09] font-semibold py-3.5 px-4 rounded-xl transition-all duration-200"
      >
        Créer le groupe
      </button>
    </form>
  )
}

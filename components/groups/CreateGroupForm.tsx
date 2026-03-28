'use client'

import { createGroup } from '@/lib/server/groups'

const EMOJIS = ['👨‍👩‍👧', '🐱', '💪', '❤️', '🌱', '🏃', '🍎', '📚', '🎯', '🌟']

export default function CreateGroupForm() {
  return (
    <form action={createGroup} className="space-y-4">
      <div>
        <label className="text-sm text-slate-400 block mb-1">Emoji</label>
        <div className="flex gap-2 flex-wrap">
          {EMOJIS.map(e => (
            <label key={e} className="cursor-pointer">
              <input type="radio" name="emoji" value={e} className="sr-only peer" defaultChecked={e === '🎯'} />
              <span className="text-2xl p-2 rounded-xl peer-checked:bg-violet-600/30 peer-checked:ring-2 peer-checked:ring-violet-500 block hover:bg-slate-700 transition">
                {e}
              </span>
            </label>
          ))}
        </div>
      </div>

      <div>
        <label className="text-sm text-slate-400 block mb-1">Nom du groupe *</label>
        <input
          name="name"
          required
          placeholder="Be better son"
          className="w-full bg-slate-800 border border-slate-700 rounded-xl py-3 px-4 focus:outline-none focus:ring-2 focus:ring-violet-500"
        />
      </div>

      <div>
        <label className="text-sm text-slate-400 block mb-1">Description</label>
        <input
          name="description"
          placeholder="Optionnel"
          className="w-full bg-slate-800 border border-slate-700 rounded-xl py-3 px-4 focus:outline-none focus:ring-2 focus:ring-violet-500"
        />
      </div>

      <button
        type="submit"
        className="w-full bg-violet-600 hover:bg-violet-500 text-white font-medium py-3 px-4 rounded-xl transition"
      >
        Créer le groupe
      </button>
    </form>
  )
}

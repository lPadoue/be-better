'use client'

import { useState } from 'react'
import { createAction } from '@/lib/server/actions'

const EMOJIS = ['📞', '🎂', '🍽️', '💊', '🎮', '🏃', '📚', '❤️', '🌱', '✨']

const inputClass = "w-full bg-[#1E1A16] border border-[#2C2620] text-[#F2EAE0] placeholder:text-[#4A3F37] rounded-xl py-2.5 px-3 text-sm focus:outline-none focus:border-[#E8A44A] focus:ring-1 focus:ring-[#E8A44A]/20 transition-all duration-200"
const selectClass = "bg-[#1E1A16] border border-[#2C2620] text-[#F2EAE0] rounded-xl px-3 text-sm focus:outline-none focus:border-[#E8A44A] transition-all duration-200"

export default function CreateActionForm({ groupId }: { groupId: string }) {
  const [recurrenceType, setRecurrenceType] = useState<'relative' | 'fixed'>('relative')
  const [open, setOpen] = useState(false)

  const action = createAction.bind(null, groupId)

  return (
    <div className="mt-2">
      {!open ? (
        <button
          onClick={() => setOpen(true)}
          className="w-full border border-dashed border-[#2C2620] hover:border-[#E8A44A]/30 rounded-2xl p-4 text-[#4A3F37] hover:text-[#8C7E72] transition-all duration-200 text-sm"
        >
          + Ajouter une action
        </button>
      ) : (
        <form
          action={async (formData) => { await action(formData); setOpen(false) }}
          className="bg-[#161310] border border-[#2C2620] rounded-2xl p-4 space-y-4 animate-slide-up"
        >
          <p className="text-xs text-[#8C7E72] uppercase tracking-widest font-medium">Nouvelle action</p>

          <div className="flex gap-2">
            <input
              name="name"
              required
              placeholder="Nom de l'action"
              className={`flex-1 ${inputClass}`}
            />
            <select name="emoji" className={`${selectClass} py-2.5`}>
              {EMOJIS.map(e => <option key={e} value={e}>{e}</option>)}
            </select>
          </div>

          <div>
            <label className="text-xs text-[#8C7E72] block mb-2 uppercase tracking-widest">Récurrence</label>
            <div className="flex gap-2">
              {(['relative', 'fixed'] as const).map(type => (
                <label key={type} className="flex-1">
                  <input
                    type="radio" name="recurrence_type" value={type}
                    checked={recurrenceType === type}
                    onChange={() => setRecurrenceType(type)}
                    className="sr-only peer"
                  />
                  <span className="block text-center text-xs py-2.5 rounded-xl border border-[#2C2620] text-[#8C7E72] peer-checked:border-[#E8A44A]/50 peer-checked:bg-[#2E1F05] peer-checked:text-[#E8A44A] cursor-pointer transition-all duration-200">
                    {type === 'relative' ? 'Intervalle' : 'Date fixe'}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {recurrenceType === 'relative' ? (
            <div className="flex gap-2">
              <input
                name="recurrence_value"
                type="number"
                min="1"
                required
                defaultValue="7"
                className={`w-20 ${inputClass}`}
              />
              <select name="recurrence_unit" className={`flex-1 ${selectClass} py-2.5`}>
                <option value="hours">heures</option>
                <option value="days">jours</option>
                <option value="weeks">semaines</option>
                <option value="months">mois</option>
              </select>
            </div>
          ) : (
            <div className="flex gap-2">
              <input name="fixed_day" type="number" min="1" max="31" placeholder="Jour"
                className={`flex-1 ${inputClass}`} />
              <input name="fixed_month" type="number" min="1" max="12" placeholder="Mois"
                className={`flex-1 ${inputClass}`} />
            </div>
          )}

          <div>
            <label className="text-xs text-[#8C7E72] block mb-2 uppercase tracking-widest">Partage</label>
            <select name="sync_mode" className={`w-full ${selectClass} py-2.5`}>
              <option value="individual">Individuel — chacun son compteur</option>
              <option value="shared">Commun — un compteur pour tous</option>
            </select>
          </div>

          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="flex-1 py-2.5 rounded-xl border border-[#2C2620] hover:border-[#3C3228] text-sm text-[#8C7E72] hover:text-[#F2EAE0] transition-all duration-200"
            >
              Annuler
            </button>
            <button
              type="submit"
              className="flex-1 bg-[#E8A44A] hover:bg-[#F0B55E] text-[#0D0B09] text-sm font-semibold py-2.5 rounded-xl transition-all duration-200"
            >
              Ajouter
            </button>
          </div>
        </form>
      )}
    </div>
  )
}

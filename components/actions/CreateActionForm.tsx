'use client'

import { useState } from 'react'
import { createAction } from '@/lib/server/actions'

const EMOJIS = ['📞', '🎂', '🍽️', '💊', '🎮', '🏃', '📚', '❤️', '🌱', '✨']

export default function CreateActionForm({ groupId }: { groupId: string }) {
  const [recurrenceType, setRecurrenceType] = useState<'relative' | 'fixed'>('relative')
  const [open, setOpen] = useState(false)

  const action = createAction.bind(null, groupId)

  return (
    <div>
      {!open ? (
        <button
          onClick={() => setOpen(true)}
          className="w-full border border-dashed border-slate-700 rounded-2xl p-4 text-slate-500 hover:border-slate-500 hover:text-slate-400 transition text-sm"
        >
          + Ajouter une action
        </button>
      ) : (
        <form
          action={async (formData) => { await action(formData); setOpen(false) }}
          className="bg-slate-800/50 border border-slate-700 rounded-2xl p-4 space-y-3"
        >
          <div className="flex gap-2">
            <div className="flex-1">
              <input
                name="name"
                required
                placeholder="Nom de l'action"
                className="w-full bg-slate-900 border border-slate-700 rounded-xl py-2.5 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
              />
            </div>
            <select
              name="emoji"
              className="bg-slate-900 border border-slate-700 rounded-xl px-2 text-lg focus:outline-none"
            >
              {EMOJIS.map(e => <option key={e} value={e}>{e}</option>)}
            </select>
          </div>

          <div>
            <label className="text-xs text-slate-400 block mb-1">Type de récurrence</label>
            <div className="flex gap-2">
              <label className="flex-1">
                <input type="radio" name="recurrence_type" value="relative"
                  checked={recurrenceType === 'relative'}
                  onChange={() => setRecurrenceType('relative')} className="sr-only peer" />
                <span className="block text-center text-sm py-2 rounded-xl border border-slate-700 peer-checked:border-violet-500 peer-checked:bg-violet-600/20 cursor-pointer">
                  Intervalle
                </span>
              </label>
              <label className="flex-1">
                <input type="radio" name="recurrence_type" value="fixed"
                  checked={recurrenceType === 'fixed'}
                  onChange={() => setRecurrenceType('fixed')} className="sr-only peer" />
                <span className="block text-center text-sm py-2 rounded-xl border border-slate-700 peer-checked:border-violet-500 peer-checked:bg-violet-600/20 cursor-pointer">
                  Date fixe
                </span>
              </label>
            </div>
          </div>

          {recurrenceType === 'relative' ? (
            <div className="flex gap-2">
              <input
                name="recurrence_value"
                type="number"
                min="1"
                defaultValue="7"
                className="w-20 bg-slate-900 border border-slate-700 rounded-xl py-2 px-3 text-sm focus:outline-none"
              />
              <select name="recurrence_unit" className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-3 text-sm focus:outline-none">
                <option value="hours">heures</option>
                <option value="days">jours</option>
                <option value="weeks">semaines</option>
                <option value="months">mois</option>
              </select>
            </div>
          ) : (
            <div className="flex gap-2">
              <input name="fixed_day" type="number" min="1" max="31" placeholder="Jour"
                className="flex-1 bg-slate-900 border border-slate-700 rounded-xl py-2 px-3 text-sm focus:outline-none" />
              <input name="fixed_month" type="number" min="1" max="12" placeholder="Mois"
                className="flex-1 bg-slate-900 border border-slate-700 rounded-xl py-2 px-3 text-sm focus:outline-none" />
            </div>
          )}

          <div>
            <label className="text-xs text-slate-400 block mb-1">Partage</label>
            <select name="sync_mode" className="w-full bg-slate-900 border border-slate-700 rounded-xl py-2.5 px-3 text-sm focus:outline-none">
              <option value="individual">Individuel (chacun son compteur)</option>
              <option value="shared">Commun (un compteur pour tous)</option>
            </select>
          </div>

          <div className="flex gap-2">
            <button type="button" onClick={() => setOpen(false)}
              className="flex-1 py-2.5 rounded-xl border border-slate-700 text-sm text-slate-400 hover:text-white transition">
              Annuler
            </button>
            <button type="submit"
              className="flex-1 bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium py-2.5 rounded-xl transition">
              Ajouter
            </button>
          </div>
        </form>
      )}
    </div>
  )
}

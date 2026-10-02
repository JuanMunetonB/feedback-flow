'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useVoteStore } from '@/store/useVoteStore'
import { useRouter } from 'next/navigation'

export default function VoteButton({ ideaId, initialCount }: { ideaId: string, initialCount: number }) {
  const [loading, setLoading] = useState(false)
  
  // 1. Usamos un estado local para el número que ve el usuario en pantalla
  const [displayCount, setDisplayCount] = useState(initialCount)
  const router = useRouter()
  
  // Usamos Zustand solo para recordar que en esta sesión ya presionamos el botón
  const optimisticVotes = useVoteStore((state) => state.optimisticVotes)
  const addLocalVote = useVoteStore((state) => state.addLocalVote)
  const hasVotedOptimistically = optimisticVotes[ideaId] === 1

  // 2. EL FIX (La magia de React): 
  // Cuando router.refresh() termina, Next.js nos envía un nuevo 'initialCount'.
  // Este useEffect lo detecta y sobreescribe nuestra pantalla con la VERDAD de la base de datos.
  useEffect(() => {
    setDisplayCount(initialCount)
  }, [initialCount])

  const handleVote = async () => {
    if (hasVotedOptimistically || loading) return
    setLoading(true)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      alert("Debes iniciar sesión para votar")
      setLoading(false)
      return
    }

    // 3. OPTIMISTIC UI: Actualizamos la pantalla y bloqueamos el botón INMEDIATAMENTE
    addLocalVote(ideaId)
    setDisplayCount((prev) => prev + 1)

    // 4. Enviamos a la base de datos en segundo plano
    const { error } = await supabase.from('votes').insert([
      { idea_id: ideaId, user_id: user.id }
    ])

    if (error) {
      console.error("No se pudo registrar el voto:", error.message)
      // Si la base de datos rechaza el voto (ej. ya habías votado), revertimos la suma
      setDisplayCount((prev) => prev - 1) 
    }
    
    // Le pedimos a Next.js que traiga los datos frescos
    router.refresh() 
    setLoading(false)
  }

  return (
    <button 
      onClick={handleVote}
      disabled={hasVotedOptimistically || loading}
      className={`flex items-center gap-2 px-3 py-1 rounded border transition-colors ${
        hasVotedOptimistically 
          ? 'bg-blue-50 border-blue-200 text-blue-700 cursor-default' 
          : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
      }`}
    >
      <span>▲</span>
      <span className="font-semibold">{displayCount}</span>
    </button>
  )
}
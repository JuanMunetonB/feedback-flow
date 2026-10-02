'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function IdeaForm() {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    // 1. Verificamos quién es el usuario actual usando la sesión del navegador
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      setError('Debes iniciar sesión para publicar una idea.')
      setLoading(false)
      return
    }

    // 2. Insertamos la idea. El RLS en Supabase verificará que 'author_id' coincida con 'user.id'
    const { error: insertError } = await supabase.from('ideas').insert([
      { 
        title, 
        description, 
        author_id: user.id 
      }
    ])

    if (insertError) {
      setError(`Error al publicar: ${insertError.message}`)
    } else {
      // Limpiamos el formulario y recargamos los datos del servidor para ver la nueva idea
      setTitle('')
      setDescription('')
      router.refresh() 
    }
    
    setLoading(false)
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 mb-8">
      <h3 className="text-lg font-semibold mb-4">Proponer una nueva idea</h3>
      
      <div className="space-y-4">
        <div>
          <input
            type="text"
            placeholder="Título corto y descriptivo (ej. Modo Oscuro)"
            className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 outline-none"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            maxLength={100}
          />
        </div>
        <div>
          <textarea
            placeholder="Explica por qué esta idea es útil..."
            className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 outline-none min-h-[100px]"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
          />
        </div>

        {error && <p className="text-red-600 text-sm">{error}</p>}

        <button
          type="submit"
          disabled={loading || !title || !description}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
          {loading ? 'Publicando...' : 'Publicar Idea'}
        </button>
      </div>
    </form>
  )
}
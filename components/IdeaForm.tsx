'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function IdeaForm() {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [categories, setCategories] = useState<any[]>([])
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const router = useRouter()

  useEffect(() => {
    const loadInitialData = async () => {
      // 1. Obtener usuario
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)

      // 2. Obtener categorías
      const { data: catData } = await supabase
        .from('categories')
        .select('*')
        .order('name')
      if (catData) setCategories(catData)
    }
    
    loadInitialData()
  }, [])

  const handleCreateIdea = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) {
      setMessage('Debes iniciar sesión para publicar una idea.')
      return
    }
    
    setLoading(true)
    setMessage('')

    const { error } = await supabase.from('ideas').insert([
      { 
        title, 
        description, 
        author_id: user.id, // Usamos author_id como lo tenías en tu código original
        category_id: categoryId ? parseInt(categoryId) : null
      }
    ])

    if (error) {
      setMessage(`Error: ${error.message}`)
    } else {
      setMessage('¡Idea publicada con éxito!')
      setTitle('')
      setDescription('')
      setCategoryId('')
      // Refrescamos la página para que el componente de servidor (Home) vuelva a consultar la BD
      router.refresh() 
    }
    setLoading(false)
  }

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 mb-8">
      <h2 className="text-xl font-bold mb-4 text-gray-800">Compartir una nueva idea</h2>
      
      {user ? (
        <form onSubmit={handleCreateIdea} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Título</label>
            <input 
              type="text" 
              className="input-primario" 
              value={title} 
              onChange={(e) => setTitle(e.target.value)} 
              required 
              placeholder="Ej. Modo oscuro para la aplicación"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Categoría</label>
            {/* Aplicamos input-primario también al select */}
            <select 
              className="input-primario" 
              value={categoryId} 
              onChange={(e) => setCategoryId(e.target.value)}
              required
            >
              <option value="">Selecciona una categoría...</option>
              {categories.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
            {/* Aplicamos input-primario al textarea y ajustamos la altura mínima */}
            <textarea 
              className="input-primario min-h-[100px]" 
              value={description} 
              onChange={(e) => setDescription(e.target.value)} 
              required 
              placeholder="Detalla tu idea aquí..."
            />
          </div>

          {message && (
            <div className={`p-3 text-sm font-medium rounded-md ${message.includes('Error') ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-green-50 text-green-700 border border-green-200'}`}>
              {message}
            </div>
          )}

          <div className="pt-2">
            <button 
              type="submit" 
              disabled={loading}
              className="w-full sm:w-auto bg-purple-600 text-white font-medium py-2 px-6 rounded-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 disabled:opacity-50 transition-colors"
            >
              {loading ? 'Publicando...' : 'Publicar Idea'}
            </button>
          </div>
        </form>
      ) : (
        <div className="text-center py-6 bg-gray-50 rounded-lg border border-gray-200">
          <p className="text-gray-600 mb-3">Inicia sesión para compartir tus ideas con la comunidad.</p>
          <Link href="/login" className="inline-block bg-purple-600 text-white font-medium py-2 px-6 rounded-md hover:bg-purple-700 transition-colors">
            Iniciar Sesión
          </Link>
        </div>
      )}
    </div>
  )
}
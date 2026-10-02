'use client' // Le decimos a Next.js que este componente usa interactividad del navegador (React State)

import { useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('') // Necesario para nuestra tabla custom 'users'
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  // Función para Registrarse
  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage('')

    // 1. Supabase crea la cuenta en su sistema de Auth seguro
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
    })

    if (authError) {
      setMessage(`Error: ${authError.message}`)
      setLoading(false)
      return
    }

    // 2. Si el registro fue exitoso, guardamos el perfil en nuestra tabla 'users'
    if (authData.user) {
      const { error: dbError } = await supabase.from('users').insert([
        { 
          id: authData.user.id, // Usamos el mismo ID seguro de Supabase Auth
          email: email, 
          name: name || 'Usuario Anónimo' 
        }
      ])

      if (dbError) {
        setMessage(`Error guardando perfil: ${dbError.message}`)
      } else {
        setMessage('¡Registro exitoso! Ya puedes iniciar sesión.')
      }
    }
    setLoading(false)
  }

  // Función para Iniciar Sesión
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage('')

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      setMessage(`Error: ${error.message}`)
    } else {
      setMessage('¡Login exitoso! (Pronto te redirigiremos)')
      // Aquí en el futuro redireccionaremos al dashboard
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white p-8 rounded-lg shadow-md w-96">
        <h2 className="text-2xl font-bold mb-6 text-center text-gray-800">Bienvenido a FeedbackFlow</h2>
        
        <form className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Nombre (Solo para registro)</label>
            <input 
              type="text" 
              className="mt-1 w-full p-2 border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500" 
              value={name} 
              onChange={(e) => setName(e.target.value)} 
              placeholder="Ej. Juan Pérez" 
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Email</label>
            <input 
              type="email" 
              className="mt-1 w-full p-2 border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500" 
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
              required 
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Contraseña</label>
            <input 
              type="password" 
              className="mt-1 w-full p-2 border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              required 
            />
          </div>

          {message && (
            <div className={`p-3 text-sm rounded ${message.includes('Error') ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
              {message}
            </div>
          )}

          <div className="flex gap-4 pt-4">
            <button 
              onClick={handleLogin} 
              disabled={loading}
              className="w-full bg-blue-600 text-white p-2 rounded hover:bg-blue-700 disabled:opacity-50"
            >
              Iniciar Sesión
            </button>
            <button 
              onClick={handleSignUp} 
              disabled={loading}
              className="w-full bg-gray-200 text-gray-800 p-2 rounded hover:bg-gray-300 disabled:opacity-50"
            >
              Registrarse
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
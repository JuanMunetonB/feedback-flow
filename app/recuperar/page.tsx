'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'

export default function RecoverPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [isSuccess, setIsSuccess] = useState(false)

  const handleRecover = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage('')

    // Supabase envía automáticamente un correo con el enlace mágico
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/actualizar-password`,
    })

    if (error) {
      setMessage(`Error: ${error.message}`)
      setIsSuccess(false)
    } else {
      setMessage('Te hemos enviado un correo con las instrucciones para recuperar tu contraseña.')
      setIsSuccess(true)
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
        <h2 className="text-2xl font-bold mb-2 text-center text-gray-800">Recuperar Contraseña</h2>
        <p className="text-sm text-gray-600 text-center mb-6">
          Ingresa tu correo electrónico y te enviaremos un enlace para restablecerla.
        </p>
        
        <form onSubmit={handleRecover} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input 
              type="email"
              placeholder="correo@ejemplo.com"
              className="input-primario"
              value={email}
              onChange={(e) => setEmail(e.target.value)} 
              required
              disabled={isSuccess}
            />
          </div>

          {message && (
            <div className={`p-3 text-sm rounded ${isSuccess ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
              {message}
            </div>
          )}

          {!isSuccess && (
            <div className="pt-4">
              <button 
                type="submit" 
                disabled={loading}
                className="w-full bg-purple-600 text-white font-medium py-2 px-4 rounded hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:opacity-50 transition-colors"
              >
                {loading ? 'Enviando...' : 'Enviar enlace de recuperación'}
              </button>
            </div>
          )}
        </form>

        <div className="mt-6 text-center text-sm text-gray-600">
          <Link href="/login" className="text-purple-600 hover:text-purple-800 font-semibold hover:underline">
            Volver a Iniciar Sesión
          </Link>
        </div>
      </div>
    </div>
  )
}
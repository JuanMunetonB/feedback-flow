'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function UpdatePasswordPage() {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false) // Estado para la nueva contraseña
  const [showConfirmPassword, setShowConfirmPassword] = useState(false) // Estado para confirmar contraseña
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [isSuccess, setIsSuccess] = useState(false)
  const router = useRouter()

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (password !== confirmPassword) {
      setMessage('Error: Las contraseñas no coinciden.')
      return
    }

    if (password.length < 6) {
      setMessage('Error: La contraseña debe tener al menos 6 caracteres.')
      return
    }

    setLoading(true)
    setMessage('')

    const { error } = await supabase.auth.updateUser({
      password: password
    })

    if (error) {
      setMessage(`Error al actualizar: ${error.message}`)
      setIsSuccess(false)
    } else {
      setMessage('¡Contraseña actualizada con éxito! Entrando a tu cuenta...')
      setIsSuccess(true)
      
      setTimeout(() => {
        router.push('/')
        router.refresh()
      }, 2000)
    }
    setLoading(false)
  }

  // Componente reutilizable para el ícono del ojo
  const EyeIcon = ({ show }: { show: boolean }) => {
    return show ? (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0l-3.41-3.41" />
      </svg>
    ) : (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
      </svg>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
        <h2 className="text-2xl font-bold mb-2 text-center text-gray-800">Nueva Contraseña</h2>
        <p className="text-sm text-gray-600 text-center mb-6">
          Ingresa tu nueva contraseña para recuperar el acceso a tu cuenta.
        </p>
        
        <form onSubmit={handleUpdate} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nueva Contraseña</label>
            <div className="relative">
              <input 
                type={showPassword ? "text" : "password"}
                placeholder="Mínimo 6 caracteres"
                className="input-primario pr-10"
                value={password}
                onChange={(e) => setPassword(e.target.value)} 
                required
                disabled={isSuccess}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-500 hover:text-purple-700 focus:outline-none"
                disabled={isSuccess}
              >
                <EyeIcon show={showPassword} />
              </button>
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Confirmar Contraseña</label>
            <div className="relative">
              <input 
                type={showConfirmPassword ? "text" : "password"}
                placeholder="Repite tu nueva contraseña"
                className="input-primario pr-10"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)} 
                required
                disabled={isSuccess}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-500 hover:text-purple-700 focus:outline-none"
                disabled={isSuccess}
              >
                <EyeIcon show={showConfirmPassword} />
              </button>
            </div>
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
                {loading ? 'Guardando...' : 'Actualizar Contraseña'}
              </button>
            </div>
          )}
        </form>
      </div>
    </div>
  )
}
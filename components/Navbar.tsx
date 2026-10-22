'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false)
  const [user, setUser] = useState<any>(null)
  const router = useRouter()

  useEffect(() => {
    // 1. Revisar si hay sesión al cargar la página
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user)
    })

    // 2. Escuchar si el usuario inicia o cierra sesión en otra pestaña
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user || null)
    })

    return () => authListener.subscription.unsubscribe()
  }, [])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    setIsOpen(false)
    router.refresh() // Recarga la página para aplicar los cambios visuales
  }

  return (
    <nav className="bg-purple-800 text-white sticky top-0 z-50 shadow-md">
      <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
        
        {/* Título Permanente */}
        <Link href="/" className="text-xl font-bold flex items-center gap-3">
          FeedbackFlow 🚀
          <span className="bg-white text-purple-800 text-xs font-bold px-2 py-0.5 rounded">
            Beta
          </span>
        </Link>

        {/* Menú Hamburguesa */}
        <div className="relative">
          <button 
            onClick={() => setIsOpen(!isOpen)} 
            className="p-2 hover:bg-purple-700 rounded-lg transition-colors focus:outline-none flex items-center"
          >
            {/* Ícono SVG de 3 rayitas */}
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>

          {/* Menú Desplegable */}
          {isOpen && (
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-xl py-1 text-sm text-gray-700 border border-gray-100 overflow-hidden">
              {user ? (
                // Opciones con Sesión Activa
                <>
                  <div className="px-4 py-2 border-b border-gray-100 bg-gray-50 text-xs text-gray-500 truncate">
                    Hola, {user.email}
                  </div>
                  <Link 
                    href="/perfil" 
                    onClick={() => setIsOpen(false)} 
                    className="block px-4 py-2 hover:bg-gray-100 transition-colors"
                  >
                    Ver perfil
                  </Link>
                  <button 
                    onClick={handleLogout} 
                    className="block w-full text-left px-4 py-2 hover:bg-red-50 text-red-600 transition-colors"
                  >
                    Cerrar sesión
                  </button>
                </>
              ) : (
                // Opciones sin Sesión
                <>
                  <Link 
                    href="/login" 
                    onClick={() => setIsOpen(false)} 
                    className="block px-4 py-2 hover:bg-gray-100 transition-colors"
                  >
                    Iniciar sesión
                  </Link>
                  <Link 
                    href="/registro" 
                    onClick={() => setIsOpen(false)} 
                    className="block px-4 py-2 hover:bg-gray-100 transition-colors"
                  >
                    Registrarse
                  </Link>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </nav>
  )
}
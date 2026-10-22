'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { clearIdeasCache } from '@/app/actions'

export default function IdeaControls({ idea }: { idea: any }) {
  const [showHistory, setShowHistory] = useState(false)
  const [history, setHistory] = useState<any[]>([])
  const [isEditing, setIsEditing] = useState(false)
  const [editForm, setEditForm] = useState({ title: idea.title, description: idea.description })
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  
  // Estados para el Panel Admin
  const [isAdmin, setIsAdmin] = useState(false)
  const [status, setStatus] = useState(idea.status || 'Pendiente')
  const [loadingStatus, setLoadingStatus] = useState(false)

  const router = useRouter()

  useEffect(() => {
    const checkUserAndRole = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setCurrentUserId(user.id)
        
        // Consultamos en la BD si este usuario tiene is_admin = true
        const { data } = await supabase
          .from('users')
          .select('is_admin')
          .eq('id', user.id)
          .single()

        if (data?.is_admin) {
          setIsAdmin(true)
        }
      }
    }

    checkUserAndRole()
  }, [])

  const isAuthor = currentUserId === idea.author_id

  const loadHistory = async () => {
    const { data } = await supabase
      .from('idea_edits')
      .select('*')
      .eq('idea_id', idea.id)
      .order('edited_at', { ascending: false })
    setHistory(data || [])
    setShowHistory(true)
  }

  const handleDelete = async () => {
    if (!confirm('¿Seguro que deseas borrar esta idea? Esta acción es irreversible.')) return
    await supabase.from('ideas').delete().eq('id', idea.id)
    await clearIdeasCache()
    router.refresh()
  }

  const handleUpdate = async () => {
    const { data, error } = await supabase
      .from('ideas')
      .update({ title: editForm.title, description: editForm.description })
      .eq('id', idea.id)
      .select()

    if (error || !data || data.length === 0) {
      alert('Error: No tienes permisos o la base de datos bloqueó la acción.')
      return
    }

    setIsEditing(false)
    await clearIdeasCache()
    router.refresh()
  }

  // Función para que el Admin cambie el estado
  const handleStatusChange = async (newStatus: string) => {
    setLoadingStatus(true)
    setStatus(newStatus)

    const { error } = await supabase
      .from('ideas')
      .update({ status: newStatus })
      .eq('id', idea.id)

    if (error) {
      alert(`Error al actualizar el estado: ${error.message}`)
    } else {
      await clearIdeasCache() // Limpiamos Redis para reflejar el cambio de estado de inmediato
      router.refresh()
    }
    setLoadingStatus(false)
  }

  if (isEditing) {
    return (
      <div className="mt-4 pt-4 border-t border-gray-100 flex flex-col gap-3">
        <input 
          value={editForm.title} 
          onChange={e => setEditForm({...editForm, title: e.target.value})} 
          className="input-primario font-semibold" 
        />
        <textarea 
          value={editForm.description} 
          onChange={e => setEditForm({...editForm, description: e.target.value})} 
          className="input-primario w-full min-h-[80px]" 
        />
        <div className="flex gap-2">
          <button onClick={handleUpdate} className="text-sm bg-purple-600 hover:bg-purple-700 text-white font-medium px-4 py-1.5 rounded-md transition-colors">
            Guardar Cambios
          </button>
          <button onClick={() => setIsEditing(false)} className="text-sm text-gray-500 hover:text-gray-700 font-medium px-2 py-1.5">
            Cancelar
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="mt-4 pt-4 border-t border-gray-100 flex flex-col gap-3">
      {/* Barra de Acciones Estándar (Historial, Editar, Borrar) */}
      <div className="flex items-center justify-between text-sm">
        <button onClick={loadHistory} className="text-gray-400 hover:text-gray-600 underline underline-offset-4 decoration-gray-300 transition-colors">
          Ver historial de ediciones
        </button>
        
        {isAuthor && (
          <div className="flex gap-4">
            <button onClick={() => setIsEditing(true)} className="text-purple-600 hover:text-purple-800 font-medium transition-colors">
              Editar
            </button>
            <button onClick={handleDelete} className="text-red-600 hover:text-red-800 font-medium transition-colors">
              Borrar
            </button>
          </div>
        )}
      </div>

      {/* Contenido Exclusivo para Administradores */}
      {isAdmin && (
        <div className="mt-2 pt-3 border-t border-gray-100 flex items-center justify-between bg-purple-50/50 -mx-6 -mb-6 p-4 rounded-b-lg border-purple-100">
          <span className="text-xs font-bold text-purple-700 uppercase tracking-wider flex items-center gap-1">
            ⚡ Panel Admin
          </span>
          
          <div className="flex items-center gap-2">
            <label htmlFor={`status-${idea.id}`} className="text-xs text-gray-600 font-medium">
              Estado:
            </label>
            <select
              id={`status-${idea.id}`}
              value={status}
              disabled={loadingStatus}
              onChange={(e) => handleStatusChange(e.target.value)}
              className="text-xs bg-white border border-purple-200 rounded-md px-2 py-1 font-semibold text-gray-800 focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:opacity-50 cursor-pointer shadow-sm"
            >
              <option value="Pendiente">🟡 Pendiente</option>
              <option value="En Desarrollo">🔵 En Desarrollo</option>
              <option value="Completado">🟢 Completado</option>
              <option value="Rechazado">🔴 Rechazado</option>
            </select>
          </div>
        </div>
      )}

      {/* Modal Historial de Ediciones */}
      {showHistory && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
          <div className="bg-white p-6 rounded-xl shadow-lg max-w-lg w-full max-h-[80vh] overflow-y-auto relative border border-gray-100">
            <div className="flex justify-between items-center mb-6 border-b pb-2">
              <h3 className="text-xl font-bold text-gray-800">Versiones Anteriores</h3>
              <button onClick={() => setShowHistory(false)} className="text-gray-400 hover:text-gray-700 text-lg">✕</button>
            </div>
            
            {history.length === 0 ? (
              <p className="text-gray-500 text-center py-4">Esta idea no ha sido editada.</p>
            ) : (
              <div className="space-y-4">
                {history.map((edit) => (
                  <div key={edit.id} className="p-4 bg-gray-50 rounded-lg border border-gray-100">
                    <p className="text-xs text-gray-400 mb-2 font-mono">{new Date(edit.edited_at).toLocaleString()}</p>
                    <p className="font-bold text-gray-700 line-through decoration-red-300">{edit.old_title}</p>
                    <p className="text-gray-600 mt-2 text-sm">{edit.old_description}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
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
  const [currentUserId, setCurrentUserId] = useState<string | null>(null) // Nuevo estado
  const router = useRouter()

  // El navegador verifica quién es el usuario apenas se carga el componente
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setCurrentUserId(data.user?.id || null)
    })
  }, [])

  // Calculamos si el usuario actual es el autor
  const isAuthor = currentUserId === idea.author_id

  const loadHistory = async () => {
    const { data } = await supabase.from('idea_edits').select('*').eq('idea_id', idea.id).order('edited_at', { ascending: false })
    setHistory(data || [])
    setShowHistory(true)
  }



  const handleDelete = async () => {
  if (!confirm('¿Seguro que deseas borrar esta idea? Esta acción es irreversible.')) return
  await supabase.from('ideas').delete().eq('id', idea.id)
  await clearIdeasCache() // Destruimos el caché de Redis
  router.refresh() // Recargamos la pantalla
}
  

  const handleUpdate = async () => {
    // 1. Capturamos el error
    const { data, error } = await supabase
        .from('ideas')
        .update({ title: editForm.title, description: editForm.description })
        .eq('id', idea.id)
        .select() 

        if (error || !data || data.length === 0) {
        alert('Error: No tienes permisos o la base de datos bloqueó la acción.')
        return
        }

    // 3. Si todo sale bien
    setIsEditing(false)
    alert('Guardado en la base de datos. (Puede tardar 60s en verse por Redis)')
    await clearIdeasCache() // Destruimos el caché de Redis
    router.refresh()
  }


  if (isEditing) {
    return (
      <div className="mt-4 pt-4 border-t border-gray-100 flex flex-col gap-3">
        <input 
          value={editForm.title} onChange={e => setEditForm({...editForm, title: e.target.value})} 
          className="border border-gray-300 p-2 rounded focus:outline-blue-500 font-semibold" 
        />
        <textarea 
          value={editForm.description} onChange={e => setEditForm({...editForm, description: e.target.value})} 
          className="border border-gray-300 p-2 rounded focus:outline-blue-500 w-full min-h-[80px]" 
        />
        <div className="flex gap-2">
          <button onClick={handleUpdate} className="text-sm bg-blue-600 text-white px-3 py-1 rounded">Guardar Cambios</button>
          <button onClick={() => setIsEditing(false)} className="text-sm text-gray-500 hover:text-gray-700">Cancelar</button>
        </div>
      </div>
    )
  }

  return (
    <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between text-sm">
      <button onClick={loadHistory} className="text-gray-400 hover:text-gray-600 underline underline-offset-4 decoration-gray-300">
        Ver historial de ediciones
      </button>
      
      {/* Ahora isAuthor se calcula en el cliente y mostrará los botones correctamente */}
      {isAuthor && (
        <div className="flex gap-4">
          <button onClick={() => setIsEditing(true)} className="text-blue-600 hover:text-blue-800 font-medium">Editar</button>
          <button onClick={handleDelete} className="text-red-600 hover:text-red-800 font-medium">Borrar</button>
        </div>
      )}

      {showHistory && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
          <div className="bg-white p-6 rounded-xl shadow-lg max-w-lg w-full max-h-[80vh] overflow-y-auto relative">
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
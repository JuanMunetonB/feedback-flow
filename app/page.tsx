import { supabase } from '@/lib/supabase'
import { redis } from '@/lib/redis' // Importamos redis
import IdeaForm from '@/components/IdeaForm'
import VoteButton from '@/components/VoteButton'

export const dynamic = 'force-dynamic'

export default async function Home() {
  const CACHE_KEY = 'ideas_list'
  
  // 1. Declaramos las variables globales al principio de la función
  let ideas: any[] = []
  let error: any = null // <-- FIX: Ahora 'error' existe en todo el componente
  let source = 'Redis' 

  // 2. INTENTAMOS LEER DESDE REDIS PRIMERO
  const cachedIdeas = await redis.get(CACHE_KEY)

  if (cachedIdeas) {
    ideas = cachedIdeas as any[]
  } else {
    // 3. SI NO ESTÁN EN CACHÉ, VAMOS A POSTGRESQL
    source = 'PostgreSQL'
    
    // IMPORTANTE: Ya no usamos 'const' aquí, solo reasignamos las variables globales
    const result = await supabase
      .from('ideas')
      .select(`
        id, title, description, status, created_at,
        users ( name ), votes ( id ) 
      `)
      .order('created_at', { ascending: false })
      
    // Asignamos los resultados a nuestras variables globales
    if (result.data) {
      ideas = result.data
      await redis.set(CACHE_KEY, JSON.stringify(ideas), { ex: 60 })
    }
    
    // Si hubo un error en Supabase, lo guardamos para mostrarlo en el HTML
    if (result.error) {
      error = result.error
    }
  }

  return (
    <main className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-3xl mx-auto">
        <header className="mb-8 flex justify-between items-center">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold text-gray-900">FeedbackFlow 🚀</h1>
              <span className="bg-purple-100 text-purple-800 text-xs font-semibold px-2.5 py-0.5 rounded border border-purple-200">
                Beta
              </span>
            </div>
            <p className="text-gray-600">Construyendo el producto juntos</p>
          </div>
          <div className="flex flex-col items-end gap-2">
            <a href="/login" className="text-blue-600 hover:underline text-sm font-medium">
              Login / Registro
            </a>
            {/* Un pequeño indicador para saber de dónde vinieron los datos */}
            <span className={`text-xs px-2 py-1 rounded-full text-white font-bold ${
              source === 'Redis' ? 'bg-green-500' : 'bg-blue-500'
            }`}>
              Datos desde: {source}
            </span>
          </div>
        </header>

        {/* Formulario Cliente */}
        <IdeaForm />

        {/* Lista de Ideas Renderizada en el Servidor */}
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Sugerencias Recientes</h2>
          
          {error && (
            <div className="bg-red-50 text-red-600 p-4 rounded">Error cargando ideas: {error.message}</div>
          )}

          {ideas?.length === 0 && (
            <p className="text-gray-500 italic text-center py-8">Aún no hay ideas. ¡Sé el primero en proponer una!</p>
          )}

          {ideas?.map((idea) => (
            <article key={idea.id} className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <div className="flex-shrink-0">
                <VoteButton 
                  ideaId={idea.id} 
                  initialCount={idea.votes?.length || 0} 
                />
              </div>

              <div className="flex-grow">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="text-lg font-semibold text-gray-900">{idea.title}</h3>
                  <span className="px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 rounded-full">
                    {idea.status}
                  </span>
                </div>
                <p className="text-gray-600 mb-4 whitespace-pre-wrap">{idea.description}</p>
                
                <div className="flex items-center justify-between text-sm text-gray-500">
                  <span>
                    Propuesto por: <strong>{(idea.users as any)?.name || 'Usuario Anónimo'}</strong>
                  </span>
                  <span>
                    {new Date(idea.created_at).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </main>
  )
}
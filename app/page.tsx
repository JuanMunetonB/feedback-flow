import { supabase } from '@/lib/supabase'
import { redis } from '@/lib/redis'
import IdeaForm from '@/components/IdeaForm'
import VoteButton from '@/components/VoteButton'
import IdeaControls from '@/components/IdeaControls'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default async function Home({ 
  searchParams 
}: { 
  searchParams: Promise<{ category?: string, sort?: string }> 
}) {
  const CACHE_KEY = 'ideas_list'
  
  // 1. Desenvolvemos la promesa y capturamos AMBOS parámetros
  const resolvedSearchParams = await searchParams
  const activeCategory = resolvedSearchParams.category 
  const activeSort = resolvedSearchParams.sort || 'recent' // 'recent' por defecto
  
  let ideas: any[] = []
  let categories: any[] = []
  let error: any = null

  // 2. Obtenemos categorías
  const { data: catData } = await supabase.from('categories').select('*').order('name')
  if (catData) categories = catData

  // 3. Obtenemos ideas (Redis o BD)
  const cachedIdeas = await redis.get(CACHE_KEY)

  if (cachedIdeas) {
    ideas = cachedIdeas as any[]
  } else {
    const result = await supabase
      .from('ideas')
      .select(`
        id, title, description, status, created_at, author_id,
        users ( name ), 
        votes ( id ),
        categories ( name, color_classes )
      `)
      .order('created_at', { ascending: false })
      
    if (result.data) {
      ideas = result.data
      await redis.set(CACHE_KEY, JSON.stringify(ideas), { ex: 60 })
    }
    if (result.error) error = result.error
  }

  // 4. FILTRO EN MEMORIA
  let processedIdeas = activeCategory 
    ? ideas.filter(idea => idea.categories?.name === activeCategory)
    : [...ideas] // Clonamos el array para no mutar el original de la caché

  // 5. ORDENAMIENTO EN MEMORIA
  if (activeSort === 'voted') {
    // Ordenar por cantidad de votos (de mayor a menor)
    processedIdeas.sort((a, b) => (b.votes?.length || 0) - (a.votes?.length || 0))
  } else {
    // Ordenar por fecha de creación (más recientes primero)
    processedIdeas.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
  }

  // Helper para construir la URL preservando los parámetros actuales
  const buildUrl = (newCategory?: string | null, newSort?: string | null) => {
    const params = new URLSearchParams()
    
    // Lógica para la categoría
    if (typeof newCategory === 'string') {
      params.set('category', newCategory)
    } else if (newCategory === undefined && activeCategory) {
      params.set('category', activeCategory)
    }
    // Si es null, simplemente no hace nada y el parámetro se elimina
    
    // Lógica para el ordenamiento
    if (typeof newSort === 'string') {
      params.set('sort', newSort)
    } else if (newSort === undefined && activeSort) {
      params.set('sort', activeSort)
    }
    
    return `/?${params.toString()}`
  }

  return (
    <main className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-3xl mx-auto">
        
        <IdeaForm />

        <div className="space-y-4 mt-8">
          <h2 className="text-xl font-bold text-gray-800 mb-2">Sugerencias de la Comunidad</h2>
          
          {/* CONTROLES DE FILTRO Y ORDENAMIENTO */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            
            {/* Categorías */}
            {categories.length > 0 && (
              <div className="flex flex-wrap gap-2">
                <Link 
                  href={buildUrl(null, activeSort)} // null limpia la categoría, pero mantiene el orden
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                    !activeCategory 
                      ? 'bg-gray-800 text-white shadow-sm' 
                      : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-100'
                  }`}
                >
                  Todas
                </Link>
                {categories.map(cat => (
                  <Link 
                    key={cat.id}
                    href={buildUrl(cat.name, activeSort)}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-colors border ${
                      activeCategory === cat.name
                        ? cat.color_classes 
                        : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-100'
                    }`}
                  >
                    {cat.name}
                  </Link>
                ))}
              </div>
            )}

            {/* Ordenamiento (Toggle) */}
            <div className="flex bg-gray-200 p-1 rounded-lg border border-gray-300 shadow-inner flex-shrink-0">
              <Link 
                href={buildUrl(activeCategory, 'recent')}
                className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${
                  activeSort === 'recent' 
                    ? 'bg-white text-gray-800 shadow-sm' 
                    : 'text-gray-500 hover:text-gray-800'
                }`}
              >
                Recientes
              </Link>
              <Link 
                href={buildUrl(activeCategory, 'voted')}
                className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${
                  activeSort === 'voted' 
                    ? 'bg-white text-gray-800 shadow-sm' 
                    : 'text-gray-500 hover:text-gray-800'
                }`}
              >
                Más Votadas
              </Link>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 text-red-600 p-4 rounded">Error cargando ideas: {error.message}</div>
          )}

          {processedIdeas?.length === 0 && (
            <p className="text-gray-500 italic text-center py-8">
              {activeCategory 
                ? `No hay ideas en la categoría "${activeCategory}".` 
                : 'Aún no hay ideas. ¡Sé el primero en proponer una!'}
            </p>
          )}

          {processedIdeas?.map((idea) => (
            <article key={idea.id} className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <div className="flex gap-4">
                <div className="flex-shrink-0">
                  <VoteButton 
                    ideaId={idea.id} 
                    initialCount={idea.votes?.length || 0} 
                  />
                </div>

                <div className="flex-grow">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="text-lg font-semibold text-gray-900">{idea.title}</h3>
                    
                    <div className="flex gap-2">
                      {idea.categories && (
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full border ${idea.categories.color_classes}`}>
                          {idea.categories.name}
                        </span>
                      )}
                      <span className="px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 rounded-full">
                        {idea.status}
                      </span>
                    </div>
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
              </div>
              <IdeaControls idea={idea}/>
            </article>
          ))}
        </div>
      </div>
    </main>
  )
}
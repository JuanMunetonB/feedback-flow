'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function ProfilePage() {
  // Datos personales
  const [firstName, setFirstName] = useState('')
  const [middleName, setMiddleName] = useState('')
  const [lastName, setLastName] = useState('')
  const [secondLastName, setSecondLastName] = useState('')
  
  // Contacto
  const [email, setEmail] = useState('')
  const [alternateEmail, setAlternateEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [address, setAddress] = useState('')
  
  // Ubicación
  const [countryId, setCountryId] = useState('')
  const [departmentId, setDepartmentId] = useState('')
  const [municipalityId, setMunicipalityId] = useState('')
  
  // Listas de BD
  const [countries, setCountries] = useState<any[]>([])
  const [departments, setDepartments] = useState<any[]>([])
  const [municipalities, setMunicipalities] = useState<any[]>([])

  // Dashboard de Ideas del Usuario
  const [myIdeas, setMyIdeas] = useState<any[]>([])

  // UI y Autenticación
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [userId, setUserId] = useState<string | null>(null)
  const router = useRouter()

  // 1. Cargar Perfil Inicial, Países e Ideas Creadas por el Usuario
  useEffect(() => {
    const loadInitialData = async () => {
      // Cargar países
      const { data: countriesData } = await supabase.from('countries').select('*').order('name')
      if (countriesData) setCountries(countriesData)

      // Cargar usuario
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }

      setUserId(user.id)
      setEmail(user.email || '')

      // Consultar datos del perfil
      const { data: profile } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single()

      if (profile) {
        setFirstName(profile.first_name || '')
        setMiddleName(profile.middle_name || '')
        setLastName(profile.last_name || '')
        setSecondLastName(profile.second_last_name || '')
        setAlternateEmail(profile.alternate_email || '')
        setPhone(profile.phone || '')
        setAddress(profile.address || '')
        
        if (profile.country_id) setCountryId(profile.country_id.toString())
        if (profile.department_id) setDepartmentId(profile.department_id.toString())
        if (profile.municipality_id) setMunicipalityId(profile.municipality_id.toString())
      }

      // Consultar las ideas creadas por este usuario específico
      const { data: userIdeas } = await supabase
        .from('ideas')
        .select(`
          id, title, description, status, created_at,
          votes ( id ),
          categories ( name, color_classes )
        `)
        .eq('author_id', user.id)
        .order('created_at', { ascending: false })

      if (userIdeas) {
        setMyIdeas(userIdeas)
      }

      setLoading(false)
    }

    loadInitialData()
  }, [router])

  // 2. Cargar Departamentos (Se dispara al cambiar el país)
  useEffect(() => {
    if (!countryId) {
      setDepartments([])
      return
    }
    const fetchDepartments = async () => {
      const { data } = await supabase.from('departments').select('*').eq('country_id', countryId).order('name')
      if (data) setDepartments(data)
    }
    fetchDepartments()
  }, [countryId])

  // 3. Cargar Municipios (Se dispara al cambiar el departamento)
  useEffect(() => {
    if (!departmentId) {
      setMunicipalities([])
      return
    }
    const fetchMunicipalities = async () => {
      const { data } = await supabase.from('municipalities').select('*').eq('department_id', departmentId).order('name')
      if (data) setMunicipalities(data)
    }
    fetchMunicipalities()
  }, [departmentId])

  // Manejar cambios en los selectores limpiando los hijos
  const handleCountryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setCountryId(e.target.value)
    setDepartmentId('')
    setMunicipalityId('')
  }

  const handleDepartmentChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setDepartmentId(e.target.value)
    setMunicipalityId('')
  }

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setMessage('')

    if (!userId) return

    const fullName = `${firstName} ${lastName}`.trim()

    const { error, data } = await supabase
      .from('users')
      .update({ 
        name: fullName,
        first_name: firstName,
        middle_name: middleName,
        last_name: lastName,
        second_last_name: secondLastName,
        country_id: countryId ? parseInt(countryId) : null,
        department_id: departmentId ? parseInt(departmentId) : null,
        municipality_id: municipalityId ? parseInt(municipalityId) : null,
        address: address,
        phone: phone,
        alternate_email: alternateEmail
      })
      .eq('id', userId)
      .select()

    console.log("🔍 Diagnóstico de Supabase:", error)
    
    if (error || !data || data.length === 0) {
      setMessage('Error al actualizar el perfil. Verifica tus permisos.')
    } else {
      setMessage('¡Perfil actualizado con éxito!')
      router.refresh()
    }
    setSaving(false)
  }

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center bg-gray-50">
        <p className="text-gray-500 font-medium">Cargando perfil...</p>
      </div>
    )
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gray-50 py-10 px-4">
      <div className="max-w-3xl mx-auto space-y-8">
        
        {/* FORMULARIO DE PERFIL */}
        <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100">
          <h2 className="text-2xl font-bold mb-6 text-gray-800 border-b pb-4">Mi Perfil</h2>
          
          <form onSubmit={handleUpdateProfile} className="space-y-8">
            
            {/* SECCIÓN 1: Datos Personales */}
            <div>
              <h3 className="text-lg font-medium text-purple-700 mb-4">Datos Personales</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Primer Nombre *</label>
                  <input type="text" className="input-primario" value={firstName} onChange={(e) => setFirstName(e.target.value)} required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Segundo Nombre</label>
                  <input type="text" className="input-primario" value={middleName} onChange={(e) => setMiddleName(e.target.value)} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Primer Apellido *</label>
                  <input type="text" className="input-primario" value={lastName} onChange={(e) => setLastName(e.target.value)} required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Segundo Apellido</label>
                  <input type="text" className="input-primario" value={secondLastName} onChange={(e) => setSecondLastName(e.target.value)} />
                </div>
              </div>
            </div>

            {/* SECCIÓN 2: Ubicación */}
            <div>
              <h3 className="text-lg font-medium text-purple-700 mb-4">Ubicación</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">País</label>
                  <select className="input-primario" value={countryId} onChange={handleCountryChange}>
                    <option value="">Seleccione...</option>
                    {countries.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Departamento</label>
                  <select className="input-primario" value={departmentId} onChange={handleDepartmentChange} disabled={!countryId}>
                    <option value="">Seleccione...</option>
                    {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Municipio</label>
                  <select className="input-primario" value={municipalityId} onChange={(e) => setMunicipalityId(e.target.value)} disabled={!departmentId}>
                    <option value="">Seleccione...</option>
                    {municipalities.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                  </select>
                </div>
              </div>
            </div>

            {/* SECCIÓN 3: Contacto */}
            <div>
              <h3 className="text-lg font-medium text-purple-700 mb-4">Contacto</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Dirección</label>
                  <input type="text" className="input-primario" value={address} onChange={(e) => setAddress(e.target.value)} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono</label>
                  <input type="tel" className="input-primario" value={phone} onChange={(e) => setPhone(e.target.value)} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Correo Alterno</label>
                  <input type="email" className="input-primario" value={alternateEmail} onChange={(e) => setAlternateEmail(e.target.value)} />
                </div>
                <div className="md:col-span-2 mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Correo Principal (Cuenta)</label>
                  <input type="email" className="input-primario bg-gray-100 text-gray-500 cursor-not-allowed" value={email} disabled title="El correo de la cuenta no se puede cambiar aquí" />
                </div>
              </div>
            </div>

            {message && (
              <div className={`p-4 text-sm rounded-md font-medium ${message.includes('Error') ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-green-50 text-green-700 border border-green-200'}`}>
                {message}
              </div>
            )}

            <div className="pt-4 border-t border-gray-100">
              <button type="submit" disabled={saving} className="w-full bg-blue-600 text-white font-medium py-3 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 transition-colors">
                {saving ? 'Guardando cambios...' : 'Guardar Perfil'}
              </button>
            </div>
          </form>
        </div>

        {/* DASHBOARD DE MIS IDEAS PUBLICADAS */}
        <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100">
          <h2 className="text-xl font-bold text-gray-800 border-b pb-4 mb-6">Mis Ideas Publicadas</h2>

          {myIdeas.length === 0 ? (
            <div className="text-center py-8 bg-gray-50 rounded-xl border border-dashed border-gray-300">
              <p className="text-gray-500 text-sm">Aún no has publicado ninguna propuesta.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {myIdeas.map((idea) => (
                <div key={idea.id} className="p-5 bg-gray-50/50 rounded-xl border border-gray-200 hover:border-purple-200 transition-colors flex items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className={`text-xs px-2.5 py-0.5 rounded-full font-semibold ${idea.categories?.color_classes || 'bg-gray-100 text-gray-700'}`}>
                        {idea.categories?.name || 'General'}
                      </span>
                      <span className="text-xs text-gray-500 font-medium">
                        • {idea.status || 'Pendiente'}
                      </span>
                    </div>
                    <h3 className="font-bold text-gray-800 text-base">{idea.title}</h3>
                    <p className="text-xs text-gray-500 line-clamp-1">{idea.description}</p>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <div className="text-center bg-purple-50 px-3 py-1.5 rounded-lg border border-purple-100">
                      <span className="block text-xs font-semibold text-purple-700">Votos</span>
                      <span className="text-sm font-bold text-purple-900">{idea.votes?.length || 0}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  )
}
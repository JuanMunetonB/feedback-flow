'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function RegisterPage() {
  // Estados para datos personales
  const [firstName, setFirstName] = useState('')
  const [middleName, setMiddleName] = useState('')
  const [lastName, setLastName] = useState('')
  const [secondLastName, setSecondLastName] = useState('')
  
  // Estados para datos de contacto
  const [address, setAddress] = useState('')
  const [phone, setPhone] = useState('')
  const [alternateEmail, setAlternateEmail] = useState('')
  
  // Estados para ubicación
  const [countryId, setCountryId] = useState('')
  const [departmentId, setDepartmentId] = useState('')
  const [municipalityId, setMunicipalityId] = useState('')
  
  // Listas de opciones desde la BD
  const [countries, setCountries] = useState<any[]>([])
  const [departments, setDepartments] = useState<any[]>([])
  const [municipalities, setMunicipalities] = useState<any[]>([])

  // Estados de autenticación y UI
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const router = useRouter()

  // 1. Cargar Países al inicio
  useEffect(() => {
    const fetchCountries = async () => {
      const { data } = await supabase.from('countries').select('*').order('name')
      if (data) setCountries(data)
    }
    fetchCountries()
  }, [])

  // 2. Cargar Departamentos cuando cambia el País
  useEffect(() => {
    setDepartmentId('') // Reiniciar selecciones hijas
    setMunicipalityId('')
    setDepartments([])
    
    if (!countryId) return
    const fetchDepartments = async () => {
      const { data } = await supabase.from('departments').select('*').eq('country_id', countryId).order('name')
      if (data) setDepartments(data)
    }
    fetchDepartments()
  }, [countryId])

  // 3. Cargar Municipios cuando cambia el Departamento
  useEffect(() => {
    setMunicipalityId('') // Reiniciar selección hija
    setMunicipalities([])

    if (!departmentId) return
    const fetchMunicipalities = async () => {
      const { data } = await supabase.from('municipalities').select('*').eq('department_id', departmentId).order('name')
      if (data) setMunicipalities(data)
    }
    fetchMunicipalities()
  }, [departmentId])

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage('')

    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
    })

    if (authError) {
      setMessage(`Error: ${authError.message}`)
      setLoading(false)
      return
    }

    if (authData.user) {
      const fullName = `${firstName} ${lastName}`.trim()

      const { error: dbError } = await supabase.from('users').insert([
        { 
          id: authData.user.id,
          name: fullName,
          email: email, 
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
        }
      ])

      if (dbError) {
        setMessage(`Error guardando perfil: ${dbError.message}`)
      } else {
        setMessage('¡Registro exitoso! Redirigiendo al inicio de sesión...')
        setTimeout(() => router.push('/login'), 2000)
      }
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-2xl">
        <h2 className="text-2xl font-bold mb-6 text-center text-gray-800">Crear Cuenta</h2>
        
        <form onSubmit={handleSignUp} className="space-y-6">
          
          {/* SECCIÓN 1: Datos Personales */}
          <div>
            <h3 className="text-lg font-medium text-purple-700 border-b pb-2 mb-4">Datos Personales</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
            <h3 className="text-lg font-medium text-purple-700 border-b pb-2 mb-4">Ubicación</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">País</label>
                <select className="input-primario" value={countryId} onChange={(e) => setCountryId(e.target.value)}>
                  <option value="">Seleccione...</option>
                  {countries.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Departamento</label>
                <select className="input-primario" value={departmentId} onChange={(e) => setDepartmentId(e.target.value)} disabled={!countryId}>
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

          {/* SECCIÓN 3: Contacto y Acceso */}
          <div>
            <h3 className="text-lg font-medium text-purple-700 border-b pb-2 mb-4">Contacto y Cuenta</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
              <div className="sm:col-span-2">
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
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email Principal *</label>
                <input type="email" placeholder="correo@ejemplo.com" className="input-primario" value={email} onChange={(e) => setEmail(e.target.value)} required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Contraseña *</label>
                <input type="password" placeholder="Mínimo 6 caracteres" className="input-primario" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} />
              </div>
            </div>
          </div>

          {message && (
            <div className={`p-3 text-sm rounded ${message.includes('Error') ? 'bg-red-50 text-red-600 border border-red-200' : 'bg-green-50 text-green-600 border border-green-200'}`}>
              {message}
            </div>
          )}

          <div className="pt-4">
            <button type="submit" disabled={loading} className="w-full bg-purple-600 text-white font-medium py-3 px-4 rounded hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:opacity-50 transition-colors">
              {loading ? 'Creando cuenta...' : 'Registrarse'}
            </button>
          </div>
        </form>

        <div className="mt-6 text-center text-sm text-gray-600">
          ¿Ya tienes una cuenta? <Link href="/login" className="text-purple-600 hover:text-purple-800 font-semibold hover:underline">Inicia sesión aquí</Link>
        </div>
      </div>
    </div>
  )
}
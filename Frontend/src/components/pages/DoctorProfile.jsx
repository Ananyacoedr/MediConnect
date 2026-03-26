import { useEffect, useRef, useState } from 'react'
import { useProfile } from '@/hooks/useProfile'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Camera, Loader2, CheckCircle2 } from 'lucide-react'

const TITLES       = ['Dr.', 'Prof.', 'Mr.', 'Ms.', 'Mrs.']
const DESIGNATIONS = ['General Physician', 'Senior Consultant', 'Consultant', 'Resident Doctor', 'Specialist', 'Surgeon', 'Intern']
const SPECIALTIES  = ['Cardiology', 'Dermatology', 'Endocrinology', 'Gastroenterology', 'General Medicine',
                      'Neurology', 'Oncology', 'Ophthalmology', 'Orthopedics', 'Pediatrics',
                      'Psychiatry', 'Pulmonology', 'Radiology', 'Urology']
const EXPERIENCE   = Array.from({ length: 40 }, (_, i) => i + 1)

const Field = ({ label, children }) => (
  <div className="flex flex-col gap-1.5">
    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">{label}</label>
    {children}
  </div>
)

const inputCls = 'w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100'

export const ProfileSection = () => {
  const { profile, loading, saving, error, success, updateProfile } = useProfile()
  const fileRef = useRef()

  const [form, setForm] = useState({
    firstName: '', lastName: '', title: '', designation: '',
    specialty: '', experience: '', location: '', phone: '', bio: '', profileImage: '',
  })

  useEffect(() => {
    if (profile) setForm(f => ({ ...f, ...profile }))
  }, [profile])

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }))

  const handleImage = (e) => {
    const file = e.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onloadend = () => setForm(f => ({ ...f, profileImage: reader.result }))
    reader.readAsDataURL(file)
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    updateProfile(form)
  }

  if (loading) return (
    <div className="flex items-center justify-center py-16">
      <Loader2 size={28} className="animate-spin text-blue-600" />
    </div>
  )

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Edit Profile</h2>

      {/* Photo */}
      <Card>
        <CardHeader><CardTitle>Profile Photo</CardTitle></CardHeader>
        <CardContent>
          <div className="flex items-center gap-6">
            <div className="relative">
              {form.profileImage
                ? <img src={form.profileImage} alt="Profile" className="w-20 h-20 rounded-full object-cover border-2 border-blue-200" />
                : <div className="w-20 h-20 rounded-full bg-blue-50 border-2 border-blue-200 flex items-center justify-center text-blue-400 text-2xl font-bold">
                    {form.firstName?.[0]}{form.lastName?.[0]}
                  </div>
              }
              <button type="button" onClick={() => fileRef.current.click()}
                className="absolute bottom-0 right-0 bg-blue-600 text-white rounded-full p-1.5 hover:bg-blue-700">
                <Camera size={13} />
              </button>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Upload a photo</p>
              <p className="text-xs text-gray-400 mt-0.5">JPG, PNG up to 5MB</p>
              <Button type="button" variant="outline" size="sm" className="mt-2" onClick={() => fileRef.current.click()}>Choose File</Button>
            </div>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleImage} />
          </div>
        </CardContent>
      </Card>

      {/* Personal */}
      <Card>
        <CardHeader><CardTitle>Personal Information</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Title">
            <select value={form.title} onChange={set('title')} className={inputCls}>
              <option value="">Select title</option>
              {TITLES.map(t => <option key={t}>{t}</option>)}
            </select>
          </Field>
          <Field label="First Name"><input value={form.firstName} onChange={set('firstName')} className={inputCls} placeholder="First name" required /></Field>
          <Field label="Last Name"><input value={form.lastName} onChange={set('lastName')} className={inputCls} placeholder="Last name" required /></Field>
          <Field label="Phone"><input value={form.phone} onChange={set('phone')} className={inputCls} placeholder="+1 555-0000" /></Field>
        </CardContent>
      </Card>

      {/* Professional */}
      <Card>
        <CardHeader><CardTitle>Professional Information</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Designation">
            <select value={form.designation} onChange={set('designation')} className={inputCls}>
              <option value="">Select designation</option>
              {DESIGNATIONS.map(d => <option key={d}>{d}</option>)}
            </select>
          </Field>
          <Field label="Specialization">
            <select value={form.specialty} onChange={set('specialty')} className={inputCls}>
              <option value="">Select specialization</option>
              {SPECIALTIES.map(s => <option key={s}>{s}</option>)}
            </select>
          </Field>
          <Field label="Years of Experience">
            <select value={form.experience} onChange={set('experience')} className={inputCls}>
              <option value="">Select experience</option>
              {EXPERIENCE.map(y => <option key={y} value={y}>{y} {y === 1 ? 'year' : 'years'}</option>)}
            </select>
          </Field>
          <Field label="Location"><input value={form.location} onChange={set('location')} className={inputCls} placeholder="City, Country" /></Field>
        </CardContent>
      </Card>

      {/* Bio */}
      <Card>
        <CardHeader><CardTitle>About Me</CardTitle></CardHeader>
        <CardContent>
          <Field label="Description">
            <textarea value={form.bio} onChange={set('bio')} rows={4} className={inputCls}
              placeholder="Write a short description about yourself..." />
          </Field>
        </CardContent>
      </Card>

      {error   && <p className="text-sm text-red-600 bg-red-50 border border-red-200 px-4 py-2 rounded-lg">{error}</p>}
      {success && <div className="flex items-center gap-2 text-green-700 bg-green-50 border border-green-200 px-4 py-2 rounded-lg text-sm"><CheckCircle2 size={15} /> Profile updated successfully!</div>}

      <Button type="submit" className="w-full" disabled={saving}>
        {saving ? <><Loader2 size={15} className="animate-spin" /> Updating...</> : 'Update Profile'}
      </Button>
    </form>
  )
}

const DoctorProfile = () => (
  <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col">
    <div className="flex-1 px-6 py-8 max-w-3xl mx-auto w-full">
      <ProfileSection />
    </div>
  </div>
)

export default DoctorProfile

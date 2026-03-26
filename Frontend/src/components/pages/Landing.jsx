import { useState, useRef } from 'react'
import { useNavigate, Navigate } from 'react-router-dom'
import { useAuth } from '@clerk/clerk-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import ThemeToggle from '@/components/ThemeToggle'
import {
  HeartPulse, Stethoscope, UserRound, Video, Brain,
  ShieldCheck, CalendarCheck, ClipboardList, MessageSquare,
  Heart, Eye, Bone, Baby, Pill, Activity, Wind, Syringe,
  Microscope, Smile, Zap, Ear, Users, Star, Clock, Lock,
  ChevronRight, X, Mail, Search, Phone, MapPin
} from 'lucide-react'

const FEATURES = [
  { icon: Video,         title: 'Real-time Consultations', desc: 'Connect with verified doctors via HD video, audio, or chat — from anywhere, anytime.',               color: 'bg-blue-50 dark:bg-blue-900 text-blue-600 dark:text-blue-300'    },
  { icon: Brain,         title: 'AI Symptom Checker',      desc: 'Describe your symptoms and get instant specialist recommendations powered by smart analysis.',         color: 'bg-purple-50 dark:bg-purple-900 text-purple-600 dark:text-purple-300'},
  { icon: ShieldCheck,   title: 'Secure Prescriptions',    desc: 'Receive digital prescriptions directly from your doctor, stored safely in your profile.',              color: 'bg-green-50 dark:bg-green-900 text-green-600 dark:text-green-300'  },
  { icon: CalendarCheck, title: 'Easy Scheduling',         desc: 'Book appointments in seconds. View doctor availability and pick a time that works for you.',           color: 'bg-orange-50 dark:bg-orange-900 text-orange-600 dark:text-orange-300'},
  { icon: ClipboardList, title: 'Medical Records',         desc: 'Upload and manage your health reports, prescriptions, and history in one secure place.',               color: 'bg-pink-50 dark:bg-pink-900 text-pink-600 dark:text-pink-300'      },
  { icon: MessageSquare, title: '24/7 Support',            desc: 'Our support team and on-call doctors are available around the clock for urgent needs.',                color: 'bg-teal-50 dark:bg-teal-900 text-teal-600 dark:text-teal-300'     },
]

const SPECIALTIES = [
  { icon: Heart,       name: 'Cardiology'       },
  { icon: Brain,       name: 'Neurology'        },
  { icon: Bone,        name: 'Orthopedics'      },
  { icon: Eye,         name: 'Ophthalmology'    },
  { icon: Ear,         name: 'ENT Specialist'   },
  { icon: Baby,        name: 'Pediatrics'       },
  { icon: Stethoscope, name: 'General Medicine' },
  { icon: Microscope,  name: 'Dermatology'      },
  { icon: Activity,    name: 'Endocrinology'    },
  { icon: Wind,        name: 'Pulmonology'      },
  { icon: Pill,        name: 'Psychiatry'       },
  { icon: Syringe,     name: 'Oncology'         },
  { icon: Smile,       name: 'Dentistry'        },
  { icon: Zap,         name: 'Urology'          },
]

const STEPS = [
  { num: '01', title: 'Create Your Account',  desc: 'Register as a patient in seconds using your email or Google account.' },
  { num: '02', title: 'Find & Book a Doctor', desc: 'Browse verified specialists, check availability, and book your slot instantly.' },
  { num: '03', title: 'Consult & Get Better', desc: 'Join your video or audio consultation, receive prescriptions, and track your health.' },
]

const STATS = [
  { icon: Users, value: '500+', label: 'Verified Doctors', color: 'bg-blue-50 dark:bg-blue-900 text-blue-600 dark:text-blue-300'     },
  { icon: Star,  value: '4.9★', label: 'Average Rating',   color: 'bg-yellow-50 dark:bg-yellow-900 text-yellow-600 dark:text-yellow-300'},
  { icon: Clock, value: '24/7', label: 'Always Available', color: 'bg-green-50 dark:bg-green-900 text-green-600 dark:text-green-300'   },
  { icon: Lock,  value: '100%', label: 'Secure & Private', color: 'bg-purple-50 dark:bg-purple-900 text-purple-600 dark:text-purple-300'},
]

const FAQ_ITEMS = [
  { q: 'How do I book an appointment?',         a: 'Register as a patient, browse doctors by specialty, select a time slot, and confirm your booking in seconds.' },
  { q: 'Is my medical data secure?',            a: 'Yes. All data is encrypted and stored securely. We are fully HIPAA compliant and never share your data.' },
  { q: 'Can I consult without video?',          a: 'Absolutely. You can choose video, audio-only, or chat consultations based on your preference.' },
  { q: 'How do doctors receive prescriptions?', a: 'Doctors issue digital prescriptions directly through the platform, which are saved to your profile instantly.' },
  { q: 'Is there a fee to register?',           a: 'Registration is completely free for patients. Consultation fees are set by individual doctors.' },
  { q: 'Can I cancel an appointment?',          a: 'Yes, you can cancel or reschedule appointments from your dashboard before the scheduled time.' },
]

// ── FAQ Accordion ─────────────────────────────────────────────────────────
const FAQ = () => {
  const [open, setOpen] = useState(null)
  return (
    <div className="space-y-2">
      {FAQ_ITEMS.map((item, i) => (
        <div key={i} className="border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
          <button
            onClick={() => setOpen(open === i ? null : i)}
            className="w-full flex items-center justify-between px-5 py-4 text-left bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors"
          >
            <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{item.q}</span>
            <ChevronRight size={16} className={`text-gray-400 transition-transform shrink-0 ml-3 ${open === i ? 'rotate-90' : ''}`} />
          </button>
          {open === i && (
            <div className="px-5 py-3 bg-gray-50 dark:bg-gray-800 border-t border-gray-100 dark:border-gray-700">
              <p className="text-sm text-gray-600 dark:text-gray-400">{item.a}</p>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

// ── Sections refs for scroll ──────────────────────────────────────────────
const Landing = () => {
  const navigate = useNavigate()
  const { isSignedIn } = useAuth()

  const featuresRef    = useRef(null)
  const specialtiesRef = useRef(null)
  const howItWorksRef  = useRef(null)
  const aboutRef       = useRef(null)
  const faqRef         = useRef(null)
  const contactRef     = useRef(null)

  const scrollTo = (ref) => ref?.current?.scrollIntoView({ behavior: 'smooth' })

  if (isSignedIn) {
    const role = localStorage.getItem('mediconnect_role')
    return <Navigate to={role === 'doctor' ? '/doctor-dashboard' : role === 'patient' ? '/patient-dashboard' : '/redirect'} replace />
  }

  const goRegisterPatient = () => { localStorage.setItem('mediconnect_role', 'patient'); navigate('/signup') }
  const goRegisterDoctor  = () => { localStorage.setItem('mediconnect_role', 'doctor');  navigate('/signup') }
  const goSignIn          = () => navigate('/login')
  const goFindDoctors     = (specialty) => navigate(specialty ? `/find-doctors?specialty=${encodeURIComponent(specialty)}` : '/find-doctors')

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col transition-colors">

      {/* ── HEADER ── */}
      <header className="flex items-center justify-between px-8 py-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm sticky top-0 z-30">
        <div className="flex items-center gap-2 text-blue-600 font-bold text-xl cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
          <HeartPulse size={24} /> MediConnect
        </div>
        <div className="hidden md:flex items-center gap-6 text-sm text-gray-600 dark:text-gray-300">
          <button onClick={() => scrollTo(featuresRef)}    className="hover:text-blue-600 transition-colors">Features</button>
          <button onClick={() => scrollTo(specialtiesRef)} className="hover:text-blue-600 transition-colors">Specialties</button>
          <button onClick={() => scrollTo(howItWorksRef)}  className="hover:text-blue-600 transition-colors">How It Works</button>
          <button onClick={() => scrollTo(aboutRef)}       className="hover:text-blue-600 transition-colors">About</button>
          <button onClick={() => scrollTo(faqRef)}         className="hover:text-blue-600 transition-colors">FAQs</button>
          <button onClick={() => scrollTo(contactRef)}     className="hover:text-blue-600 transition-colors">Contact</button>
        </div>
        <div className="flex items-center gap-3">
          <ThemeToggle />
          <Button variant="ghost" size="sm" onClick={goSignIn}>Sign In</Button>
          <Button size="sm" onClick={goRegisterPatient}>Register</Button>
          <Button size="sm" variant="outline" onClick={goRegisterDoctor} className="flex items-center gap-1.5">
            <Stethoscope size={14} /> Join as Doctor
          </Button>
        </div>
      </header>

      <main className="flex-1">

        {/* ── HERO ── */}
        <section className="px-6 py-20 max-w-6xl mx-auto w-full">
          <div className="flex flex-col items-center text-center gap-6">
            <span className="text-sm px-3 py-1 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 font-medium flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
              Telemedicine & AI-Powered Healthcare
            </span>
            <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 dark:text-gray-100 tracking-tight max-w-3xl leading-tight">
              Healthcare at Your <span className="text-blue-600">Fingertips.</span>
            </h1>
            <p className="text-gray-500 dark:text-gray-400 text-lg max-w-xl leading-relaxed">
              Connect with verified doctors via video, audio, or chat. Use our AI Symptom Checker to understand your health and book appointments in seconds.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              {/* Find a Doctor — goes directly to public find-doctors page, no login */}
              <Button size="lg" onClick={() => goFindDoctors()} className="flex items-center gap-2">
                <Search size={17} /> Find a Doctor
              </Button>
              {/* Join as Doctor — goes directly to doctor signup */}
              <Button size="lg" variant="outline" onClick={goRegisterDoctor} className="flex items-center gap-2">
                <Stethoscope size={17} /> Join as Doctor
              </Button>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-6 pt-2">
              {[{ icon: ShieldCheck, text: 'HIPAA Compliant' }, { icon: Star, text: '4.9★ Rated' }, { icon: Users, text: '500+ Doctors' }].map(({ icon: Icon, text }) => (
                <div key={text} className="flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400">
                  <Icon size={14} className="text-blue-500" /> {text}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── FEATURES ── */}
        <section ref={featuresRef} className="px-6 py-12 max-w-6xl mx-auto w-full space-y-6">
          <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Why MediConnect</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {FEATURES.map(({ icon: Icon, title, desc, color }) => (
              <Card key={title}>
                <CardContent className="flex gap-4 pt-5 pb-5">
                  <div className={`p-3 rounded-full shrink-0 ${color}`}><Icon size={20} strokeWidth={1.5} /></div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{title}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 leading-relaxed">{desc}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* ── SPECIALTIES — clicking goes to public find-doctors with filter ── */}
        <section ref={specialtiesRef} className="px-6 py-12 max-w-6xl mx-auto w-full space-y-6">
          <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">14+ Specializations Available</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
            {SPECIALTIES.map(({ icon: Icon, name }) => (
              <button
                key={name}
                onClick={() => goFindDoctors(name)}
                className="flex flex-col items-center gap-2.5 p-4 bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 hover:border-blue-400 hover:shadow-md transition-all group"
              >
                <div className="p-2.5 rounded-xl bg-blue-50 dark:bg-blue-900 text-blue-600 dark:text-blue-300 group-hover:bg-blue-100 dark:group-hover:bg-blue-800 transition-colors">
                  <Icon size={18} strokeWidth={1.5} />
                </div>
                <span className="text-xs font-medium text-gray-700 dark:text-gray-300 text-center leading-tight">{name}</span>
              </button>
            ))}
          </div>
        </section>

        {/* ── HOW IT WORKS ── */}
        <section ref={howItWorksRef} className="px-6 py-12 max-w-6xl mx-auto w-full space-y-6">
          <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">How It Works</h2>
          <Card className="bg-gradient-to-r from-blue-600 to-blue-500 border-0">
            <CardContent className="pt-6 pb-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {STEPS.map(({ num, title, desc }) => (
                  <div key={num} className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-xl bg-white/20 border border-white/30 flex items-center justify-center text-white font-bold text-sm shrink-0">{num}</div>
                    <div>
                      <p className="text-white font-semibold text-sm">{title}</p>
                      <p className="text-blue-100 text-xs mt-1 leading-relaxed">{desc}</p>
                    </div>
                  </div>
                ))}
              </div>
              {/* Get Started Free — patient only */}
              <div className="mt-6 flex justify-center">
                <button
                  onClick={goRegisterPatient}
                  className="flex items-center gap-2 bg-white text-blue-600 text-sm font-semibold px-6 py-2.5 rounded-xl hover:bg-blue-50 transition-colors"
                >
                  Get Started Free <ChevronRight size={16} />
                </button>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* ── STATS / ABOUT ── */}
        <section ref={aboutRef} className="px-6 py-12 max-w-6xl mx-auto w-full space-y-6">
          <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Trusted Platform</h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {STATS.map(({ icon: Icon, value, label, color }) => (
              <Card key={label}>
                <CardContent className="flex items-center gap-4 pt-5 pb-5">
                  <div className={`p-3 rounded-full ${color}`}><Icon size={20} strokeWidth={1.5} /></div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{value}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{label}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* ── FAQ ── */}
        <section ref={faqRef} className="px-6 py-12 max-w-6xl mx-auto w-full space-y-6">
          <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Frequently Asked Questions</h2>
          <FAQ />
        </section>

        {/* ── CONTACT ── */}
        <section ref={contactRef} className="px-6 py-12 max-w-6xl mx-auto w-full space-y-6">
          <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Contact Us</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Card>
              <CardContent className="pt-5 pb-5 space-y-4">
                <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">Get in Touch</p>
                <div className="space-y-3">
                  <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-400">
                    <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-900 text-blue-600"><Mail size={16} /></div>
                    <span>mediconnect@global.com</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-400">
                    <div className="p-2 rounded-lg bg-green-50 dark:bg-green-900 text-green-600"><Phone size={16} /></div>
                    <span>+91 7283561789</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-400">
                    <div className="p-2 rounded-lg bg-orange-50 dark:bg-orange-900 text-orange-600"><MapPin size={16} /></div>
                    <span>Available 24/7 — Worldwide</span>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-5 pb-5 space-y-3">
                <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">Send a Message</p>
                <input placeholder="Your name" className="w-full border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-400" />
                <input placeholder="Your email" className="w-full border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-400" />
                <textarea rows={3} placeholder="Your message..." className="w-full border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-400 resize-none" />
                <Button className="w-full">Send Message</Button>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* ── CTA — patient only ── */}
        <section className="px-6 py-12 max-w-6xl mx-auto w-full">
          <Card>
            <CardContent className="flex flex-col sm:flex-row items-center justify-between gap-6 pt-6 pb-6">
              <div>
                <p className="text-base font-semibold text-gray-900 dark:text-gray-100">Ready to take control of your health?</p>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Join thousands of patients on MediConnect today.</p>
              </div>
              <Button onClick={goRegisterPatient} className="shrink-0">Register as Patient</Button>
            </CardContent>
          </Card>
        </section>

      </main>

      {/* ── FOOTER ── */}
      <footer className="border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
        <div className="max-w-6xl mx-auto px-6 py-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">

          <div className="space-y-3">
            <div className="flex items-center gap-2 text-blue-600 font-bold text-base">
              <HeartPulse size={20} /> MediConnect
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
              Bridging the gap between patients and healthcare professionals through technology, trust, and compassion.
            </p>
          </div>

          <div className="space-y-3">
            <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">Quick Links</p>
            <ul className="space-y-1.5 text-xs text-gray-500 dark:text-gray-400">
              <li><button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="hover:text-blue-600 transition-colors">Home</button></li>
              <li><button onClick={() => scrollTo(featuresRef)}    className="hover:text-blue-600 transition-colors">Features</button></li>
              <li><button onClick={() => scrollTo(specialtiesRef)} className="hover:text-blue-600 transition-colors">Specialties</button></li>
              <li><button onClick={() => scrollTo(howItWorksRef)}  className="hover:text-blue-600 transition-colors">How It Works</button></li>
            </ul>
          </div>

          <div className="space-y-3">
            <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">Support</p>
            <ul className="space-y-1.5 text-xs text-gray-500 dark:text-gray-400">
              <li><button onClick={() => scrollTo(faqRef)}     className="hover:text-blue-600 transition-colors">FAQs</button></li>
              <li><button onClick={() => scrollTo(contactRef)} className="hover:text-blue-600 transition-colors">Contact Us</button></li>
              <li><a href="#" className="hover:text-blue-600 transition-colors">Privacy Policy</a></li>
              <li><a href="#" className="hover:text-blue-600 transition-colors">Terms of Service</a></li>
            </ul>
          </div>

          <div className="space-y-3">
            <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">Stay Updated</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">Get health tips and platform updates.</p>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Mail size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input type="email" placeholder="your@email.com"
                  className="w-full pl-8 pr-2 py-2 text-xs border border-gray-200 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <Button size="sm">Subscribe</Button>
            </div>
          </div>

        </div>
        <div className="border-t border-gray-200 dark:border-gray-700 px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-gray-400 dark:text-gray-500">
          <p>© {new Date().getFullYear()} MediConnect. All rights reserved.</p>
          <p>Made with ❤️ for better healthcare</p>
        </div>
      </footer>

    </div>
  )
}

export default Landing

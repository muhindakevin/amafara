import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { 
  Smartphone, TrendingUp, Shield, Users, BarChart, 
  ArrowRight, Check, Zap, MessageCircle, Heart, Globe, Award,
  ChevronDown, Play, ArrowDown
} from 'lucide-react'
import { t } from '../utils/i18n'
import { useLanguage } from '../contexts/LanguageContext'
import LanguageSelector from '../components/LanguageSelector'

function LandingPage() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const { language } = useLanguage()
  const [scrollY, setScrollY] = useState(0)

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const features = [
    { 
      icon: Smartphone, 
      title: t('features.mobileMoney.title', language), 
      desc: t('features.mobileMoney.desc', language),
      color: 'from-blue-400 to-blue-600'
    },
    { 
      icon: TrendingUp, 
      title: t('features.aiCredit.title', language), 
      desc: t('features.aiCredit.desc', language),
      color: 'from-green-400 to-green-600'
    },
    { 
      icon: Shield, 
      title: t('features.secure.title', language), 
      desc: t('features.secure.desc', language),
      color: 'from-purple-400 to-purple-600'
    },
    { 
      icon: Users, 
      title: t('features.groupManagement.title', language), 
      desc: t('features.groupManagement.desc', language),
      color: 'from-orange-400 to-orange-600'
    },
    { 
      icon: BarChart, 
      title: t('features.analytics.title', language), 
      desc: t('features.analytics.desc', language),
      color: 'from-pink-400 to-pink-600'
    },
    { 
      icon: MessageCircle, 
      title: t('features.chat.title', language), 
      desc: t('features.chat.desc', language),
      color: 'from-indigo-400 to-indigo-600'
    },
  ]

  

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="bg-white/95 backdrop-blur-lg shadow-sm fixed top-0 left-0 right-0 z-50 transition-all">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl flex items-center justify-center shadow-lg">
              <span className="text-white font-bold text-lg">UW</span>
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-primary-600 to-blue-600 bg-clip-text text-transparent">
              UMURENGE WALLET
            </span>
          </div>
          <div className="flex items-center gap-4">
            <a 
              href="#about"
              className="hidden md:block text-gray-700 hover:text-primary-600 font-medium transition-colors cursor-pointer"
              onClick={(e) => {
                e.preventDefault()
                document.getElementById('about')?.scrollIntoView({ behavior: 'smooth' })
              }}
            >
              {t('navigation.about', language)}
            </a>
            <a 
              href="#features"
              className="hidden md:block text-gray-700 hover:text-primary-600 font-medium transition-colors cursor-pointer"
              onClick={(e) => {
                e.preventDefault()
                document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })
              }}
            >
              {t('navigation.features', language)}
            </a>
            <LanguageSelector />
            <button
              onClick={() => navigate('/login')}
              className="btn-primary"
            >
              {t('common.login', language)}
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 overflow-hidden">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-primary-50 to-purple-50"></div>
        
        {/* Animated background elements */}
        <div className="absolute top-20 right-10 w-72 h-72 bg-primary-200 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-pulse"></div>
        <div className="absolute bottom-20 left-10 w-72 h-72 bg-purple-200 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-pulse delay-700"></div>
        
        <div className="relative max-w-7xl mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left: Text Content */}
            <div className="text-center lg:text-left animate-slide-in">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/80 backdrop-blur-sm rounded-full text-sm font-semibold text-primary-600 mb-6 shadow-sm">
                <Award size={16} /> {t('landing.heroSubtitle', language)}
              </div>
              
              <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-gray-900 mb-6 leading-tight">
                <span className="block">{t('landing.heroTitle', language).split(' ').slice(0, 3).join(' ')}</span>
                <span className="block bg-gradient-to-r from-primary-600 to-blue-600 bg-clip-text text-transparent">
                  {t('landing.heroTitle', language).split(' ').slice(3).join(' ')}
                </span>
          </h1>
              
              <p className="text-xl md:text-2xl text-gray-600 mb-8 leading-relaxed max-w-2xl">
                {t('landing.heroDescription', language)}
          </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
            <button
              onClick={() => navigate('/login')}
                  className="btn-primary text-lg px-8 py-4 flex items-center justify-center gap-2 group"
            >
                  {t('common.getStarted', language)}
                  <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
            </button>
                <button 
                  onClick={() => navigate('/login')}
                  className="btn-secondary text-lg px-8 py-4"
                >
                  {t('common.joinYourGroup', language)}
            </button>
              </div>

              
            </div>

            {/* Right: Image/Illustration */}
            <div className="relative animate-slide-in">
              <div className="relative">
                {/* Main Image Container */}
                <div className="relative rounded-3xl overflow-hidden shadow-2xl bg-gradient-to-br from-primary-100 to-blue-100 p-8">
                  {/* Community Image */}
                  <div className="aspect-square bg-gradient-to-br from-primary-100 to-blue-100 rounded-2xl flex items-center justify-center relative overflow-hidden">
                    <img 
                      src="https://images.unsplash.com/photo-1521737604893-d14cc237f11d?w=800&h=800&fit=crop&q=80"
                      alt="Rwandan community saving group"
                      className="w-full h-full object-cover rounded-2xl"
                      onError={(e) => {
                        e.target.style.display = 'none'
                        e.target.nextElementSibling.style.display = 'flex'
                      }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-br from-primary-500/20 to-blue-500/20 rounded-2xl"></div>
                    <div className="relative z-10 text-center p-8 hidden flex-col items-center justify-center">
                      <Users className="mx-auto text-white mb-4" size={80} />
                      <p className="text-white font-semibold text-lg mb-2 drop-shadow-lg">Rwandan Community</p>
                      <p className="text-white/90 text-sm drop-shadow-md">Saving together for a better future</p>
                    </div>
                  </div>
                </div>
                
                
              </div>
            </div>
          </div>
        </div>

        {/* Scroll Indicator */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
          <ArrowDown className="text-gray-400" size={24} />
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-gradient-to-b from-white to-gray-50 scroll-mt-20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-3xl mx-auto mb-16 animate-slide-in">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              {t('landing.featuresTitle', language)}
            </h2>
            <p className="text-xl text-gray-600">
              {t('landing.featuresSubtitle', language)}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => {
              const Icon = feature.icon
              return (
                <div 
                  key={index} 
                  className="group card hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 animate-slide-in"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <div className={`w-16 h-16 bg-gradient-to-br ${feature.color} rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                    <Icon className="text-white" size={32} />
                  </div>
                  <h3 className="text-xl font-bold text-gray-800 mb-2">{feature.title}</h3>
                  <p className="text-gray-600 leading-relaxed">{feature.desc}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Community Story Section - About */}
      <section id="about" className="py-20 bg-white relative overflow-hidden scroll-mt-20">
        <div 
          className="absolute inset-0 opacity-30"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M11 18c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm48 25c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm-43-7c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm63 31c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM34 90c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm56-76c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM12 86c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm28-65c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm23-11c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-6 60c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm29 22c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zM32 63c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm57-13c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-9-21c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM60 91c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM35 41c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM12 60c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3z' fill='%23f0f9ff' fill-opacity='0.4' fill-rule='evenodd'/%3E%3C/svg%3E")`
          }}
        ></div>
        
        <div className="relative max-w-7xl mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="relative">
              <div className="relative rounded-3xl overflow-hidden shadow-2xl">
                <div className="aspect-[4/3] bg-gradient-to-br from-primary-200 to-blue-200 relative overflow-hidden">
                  <img 
                    src="https://images.unsplash.com/photo-1582213782179-e0d53f98f2ca?w=800&h=600&fit=crop&q=80"
                    alt="Community savings and financial inclusion"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.target.style.display = 'none'
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-br from-primary-600/40 to-blue-600/40"></div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center p-8">
                      <Users className="mx-auto text-white mb-4 drop-shadow-lg" size={100} />
                      <p className="text-white font-bold text-xl drop-shadow-lg">Community Savings</p>
                      <p className="text-white/90 drop-shadow-md">Rwandan families saving together</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div>
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary-50 rounded-full text-sm font-semibold text-primary-600 mb-6">
                <Heart size={16} /> Our Mission
              </div>
              <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
                Building Financial Freedom Together
              </h2>
              <p className="text-lg text-gray-600 mb-6 leading-relaxed">
                UMURENGE WALLET empowers Rwandan communities by digitizing traditional Ibimina saving groups. 
                We connect rural and urban families with banking services, making savings and loans accessible 
                through simple mobile technology.
              </p>
              <div className="space-y-4">
                {[
                  'Secure digital transactions',
                  'AI-powered credit scoring',
                  'Real-time group management',
                  'Mobile money integration'
                ].map((item, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <div className="w-6 h-6 bg-primary-600 rounded-full flex items-center justify-center flex-shrink-0">
                      <Check className="text-white" size={16} />
                    </div>
                    <span className="text-gray-700">{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-primary-500 via-primary-600 to-blue-600 relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-white/10 rounded-full blur-3xl"></div>
        </div>
        
        <div className="relative max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
            {t('landing.ctaTitle', language)}
          </h2>
          <p className="text-xl md:text-2xl text-blue-100 mb-10">
            {t('landing.ctaDescription', language)}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center max-w-md mx-auto">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              placeholder={t('landing.emailPlaceholder', language)}
              className="flex-1 px-6 py-4 rounded-xl text-gray-800 outline-none focus:ring-4 focus:ring-white/30 transition-all"
              />
            <button className="bg-white text-primary-600 font-semibold px-8 py-4 rounded-xl hover:bg-gray-100 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5">
              {t('common.getStarted', language)}
              </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid md:grid-cols-3 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-gradient-to-br from-primary-400 to-primary-600 rounded-xl flex items-center justify-center">
                <span className="text-white font-bold">UW</span>
              </div>
              <span className="text-xl font-bold">UMURENGE WALLET</span>
            </div>
              <p className="text-gray-400">
                Empowering Rwanda's saving communities through digital innovation.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Quick Links</h3>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">{t('navigation.about', language)}</a></li>
                <li><a href="#" className="hover:text-white transition-colors">{t('navigation.features', language)}</a></li>
                <li><a href="#" className="hover:text-white transition-colors">{t('navigation.contact', language)}</a></li>
                <li><a href="#" className="hover:text-white transition-colors">{t('navigation.help', language)}</a></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Contact</h3>
              <ul className="space-y-2 text-gray-400">
                <li>Email: support@umurengewallet.rw</li>
                <li>Phone: +250 788 123 456</li>
                <li>Kigali, Rwanda</li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 pt-8 text-center text-gray-400">
            <p>{t('landing.footerCopyright', language)}</p>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default LandingPage

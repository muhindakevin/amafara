import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { 
  Smartphone, TrendingUp, Shield, Users, BarChart, 
  ArrowRight, Check, Zap, MessageCircle, Heart, Globe, Award,
  ChevronDown, Play, ArrowDown
} from 'lucide-react'
import { useTranslation } from 'react-i18next'
import LanguageSelector from '../components/LanguageSelector'

function LandingPage() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const { t } = useTranslation('common')
  const { t: tLanding } = useTranslation(['landing', 'common'])
  const { t: tNav } = useTranslation('navigation')
  const [scrollY, setScrollY] = useState(0)

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const features = [
    { 
      icon: Smartphone, 
      title: tLanding('features.mobileMoney.title', { defaultValue: 'Mobile Money Integration' }), 
      desc: tLanding('features.mobileMoney.desc', { defaultValue: 'Seamlessly connect with mobile money services for easy transactions' }),
      color: 'from-blue-400 to-blue-600'
    },
    { 
      icon: TrendingUp, 
      title: tLanding('features.aiCredit.title', { defaultValue: 'AI-Powered Credit Scoring' }), 
      desc: tLanding('features.aiCredit.desc', { defaultValue: 'Get instant credit decisions based on your saving history' }),
      color: 'from-green-400 to-green-600'
    },
    { 
      icon: Shield, 
      title: tLanding('features.secure.title', { defaultValue: 'Bank-Level Security' }), 
      desc: tLanding('features.secure.desc', { defaultValue: 'Your data and money are protected with enterprise-grade security' }),
      color: 'from-purple-400 to-purple-600'
    },
    { 
      icon: Users, 
      title: tLanding('features.groupManagement.title', { defaultValue: 'Group Management' }), 
      desc: tLanding('features.groupManagement.desc', { defaultValue: 'Manage your saving group with powerful admin tools' }),
      color: 'from-orange-400 to-orange-600'
    },
    { 
      icon: BarChart, 
      title: tLanding('features.analytics.title', { defaultValue: 'Real-Time Analytics' }), 
      desc: tLanding('features.analytics.desc', { defaultValue: 'Track your savings and group performance with detailed insights' }),
      color: 'from-pink-400 to-pink-600'
    },
    { 
      icon: MessageCircle, 
      title: tLanding('features.chat.title', { defaultValue: 'Group Chat' }), 
      desc: tLanding('features.chat.desc', { defaultValue: 'Communicate with your group members in real-time' }),
      color: 'from-indigo-400 to-indigo-600'
    },
  ]

  

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="bg-white/95 dark:bg-gray-900/95 backdrop-blur-lg shadow-sm fixed top-0 left-0 right-0 z-50 transition-all">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 py-3 sm:py-4 flex items-center justify-between gap-2 sm:gap-4">
          <div className="flex items-center gap-0.5 min-w-0 flex-1">
            <div className="h-8 w-20 sm:h-10 sm:w-28 overflow-hidden flex items-center justify-center bg-transparent flex-shrink-0">
              <img 
                src="/assets/images/wallet.png" 
                alt="IKIMINA WALLET" 
                className="h-full w-auto object-contain"
                style={{ maxHeight: '100%', height: '100%', transform: 'scale(1.1)', transformOrigin: 'left center' }}
                onError={(e) => {
                  e.target.style.display = 'none';
                  const fallback = e.target.nextElementSibling;
                  if (fallback) fallback.style.display = 'block';
                }}
              />
            </div>
            <span className="text-primary-600 dark:text-primary-400 font-bold text-lg hidden">IKIMINA WALLET</span>
            <span className="text-base sm:text-lg md:text-xl font-bold bg-gradient-to-r from-primary-600 to-blue-600 bg-clip-text text-transparent truncate">
              IKIMINA WALLET
            </span>
          </div>
          <div className="flex items-center gap-2 sm:gap-3 md:gap-4 flex-shrink-0">
            <a 
              href="#about"
              className="hidden md:block text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 font-medium transition-colors cursor-pointer text-sm sm:text-base"
              onClick={(e) => {
                e.preventDefault()
                document.getElementById('about')?.scrollIntoView({ behavior: 'smooth' })
              }}
            >
              {tNav('about', { defaultValue: 'About' })}
            </a>
            <a 
              href="#features"
              className="hidden md:block text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 font-medium transition-colors cursor-pointer text-sm sm:text-base"
              onClick={(e) => {
                e.preventDefault()
                document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })
              }}
            >
              {tNav('features', { defaultValue: 'Features' })}
            </a>
            <div className="hidden sm:block">
              <LanguageSelector />
            </div>
            <button
              onClick={() => navigate('/login')}
              className="btn-primary text-xs sm:text-sm px-3 sm:px-6 py-2 sm:py-3"
            >
              {t('login', { defaultValue: 'Login' })}
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-24 sm:pt-28 md:pt-32 pb-12 sm:pb-16 md:pb-20 overflow-hidden">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-primary-50 to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900"></div>
        
        {/* Animated background elements */}
        <div className="absolute top-20 right-10 w-48 h-48 sm:w-72 sm:h-72 bg-primary-200 dark:bg-primary-800 rounded-full mix-blend-multiply dark:mix-blend-normal filter blur-xl opacity-30 dark:opacity-20 animate-pulse"></div>
        <div className="absolute bottom-20 left-10 w-48 h-48 sm:w-72 sm:h-72 bg-purple-200 dark:bg-purple-800 rounded-full mix-blend-multiply dark:mix-blend-normal filter blur-xl opacity-30 dark:opacity-20 animate-pulse delay-700"></div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid lg:grid-cols-2 gap-8 sm:gap-10 md:gap-12 items-center">
            {/* Left: Text Content */}
            <div className="text-center lg:text-left animate-slide-in">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 sm:px-4 sm:py-2 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-full text-xs sm:text-sm font-semibold text-primary-600 dark:text-primary-400 mb-4 sm:mb-6 shadow-sm">
                <Award size={14} style={{ width: '14px', height: '14px' }} /> <span className="hidden xs:inline">{tLanding('heroSubtitle', { defaultValue: 'Rwanda\'s Leading Digital Savings Platform' })}</span><span className="xs:hidden">Leading Platform</span>
              </div>
              
              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold text-gray-900 dark:text-white mb-4 sm:mb-6 leading-tight">
                <span className="block">{tLanding('heroTitle', { defaultValue: 'Empower Your Community' }).split(' ').slice(0, 3).join(' ')}</span>
                <span className="block bg-gradient-to-r from-primary-600 to-blue-600 bg-clip-text text-transparent">
                  {tLanding('heroTitle', { defaultValue: 'Empower Your Community' }).split(' ').slice(3).join(' ')}
                </span>
          </h1>
              
              <p className="text-base sm:text-lg md:text-xl lg:text-2xl text-gray-600 dark:text-gray-300 mb-6 sm:mb-8 leading-relaxed max-w-2xl mx-auto lg:mx-0">
                {tLanding('heroDescription', { defaultValue: 'Transform traditional saving groups into digital financial communities. Save, borrow, and grow together with IKIMINA WALLET.' })}
          </p>
              
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center lg:justify-start">
            <button
              onClick={() => navigate('/login')}
                  className="btn-primary text-sm sm:text-base md:text-lg px-6 sm:px-8 py-3 sm:py-4 flex items-center justify-center gap-2 group"
            >
                  {t('getStarted', { defaultValue: 'Get Started' })}
                  <ArrowRight size={18} className="sm:w-5 sm:h-5 group-hover:translate-x-1 transition-transform" />
            </button>
                <button 
                  onClick={() => navigate('/login')}
                  className="btn-secondary text-sm sm:text-base md:text-lg px-6 sm:px-8 py-3 sm:py-4"
                >
                  {t('joinYourGroup', { defaultValue: 'Join Your Group' })}
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
                      src="/assets/images/saving.jpg"
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
                      <p className="text-white font-semibold text-lg mb-2 drop-shadow-lg">{tLanding('communityTitle', { defaultValue: 'Rwandan Community' })}</p>
                      <p className="text-white/90 text-sm drop-shadow-md">{tLanding('communitySubtitle', { defaultValue: 'Saving together for a better future' })}</p>
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
      <section id="features" className="py-12 sm:py-16 md:py-20 bg-gradient-to-b from-white to-gray-50 dark:from-gray-900 dark:to-gray-800 scroll-mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center max-w-3xl mx-auto mb-10 sm:mb-12 md:mb-16 animate-slide-in">
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 dark:text-white mb-3 sm:mb-4">
              {tLanding('featuresTitle', { defaultValue: 'Everything You Need to Manage Your Savings' })}
            </h2>
            <p className="text-base sm:text-lg md:text-xl text-gray-600 dark:text-gray-300">
              {tLanding('featuresSubtitle', { defaultValue: 'Powerful features designed for Rwandan saving groups' })}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {features.map((feature, index) => {
              const Icon = feature.icon
              return (
                <div 
                  key={index} 
                  className="group card hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 animate-slide-in"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <div className={`w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br ${feature.color} rounded-xl sm:rounded-2xl flex items-center justify-center mb-3 sm:mb-4 group-hover:scale-110 transition-transform`}>
                    <Icon className="text-white" size={24} style={{ width: '24px', height: '24px' }} />
                  </div>
                  <h3 className="text-lg sm:text-xl font-bold text-gray-800 dark:text-white mb-2">{feature.title}</h3>
                  <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300 leading-relaxed">{feature.desc}</p>
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
                      <p className="text-white font-bold text-xl drop-shadow-lg">{tLanding('communitySavings', { defaultValue: 'Community Savings' })}</p>
                      <p className="text-white/90 drop-shadow-md">{tLanding('rwandanFamilies', { defaultValue: 'Rwandan families saving together' })}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div>
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary-50 rounded-full text-sm font-semibold text-primary-600 mb-6">
                <Heart size={16} /> {tLanding('ourMission', { defaultValue: 'Our Mission' })}
              </div>
              <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
                {tLanding('missionTitle', { defaultValue: 'Building Financial Freedom Together' })}
              </h2>
              <p className="text-lg text-gray-600 mb-6 leading-relaxed">
                {tLanding('missionDescription', { defaultValue: 'IKIMINA WALLET empowers Rwandan communities by digitizing traditional Ibimina saving groups. We connect rural and urban families with banking services, making savings and loans accessible through simple mobile technology.' })}
              </p>
              <div className="space-y-4">
                {[
                  tLanding('feature1', { defaultValue: 'Secure digital transactions' }),
                  tLanding('feature2', { defaultValue: 'AI-powered credit scoring' }),
                  tLanding('feature3', { defaultValue: 'Real-time group management' }),
                  tLanding('feature4', { defaultValue: 'Mobile money integration' })
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
      <section className="py-12 sm:py-16 md:py-20 bg-gradient-to-r from-primary-500 via-primary-600 to-blue-600 relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-0 right-0 w-64 h-64 sm:w-96 sm:h-96 bg-white/10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-64 h-64 sm:w-96 sm:h-96 bg-white/10 rounded-full blur-3xl"></div>
        </div>
        
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 text-center">
          <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-3 sm:mb-4">
            {tLanding('ctaTitle', { defaultValue: 'Ready to Transform Your Savings?' })}
          </h2>
          <p className="text-base sm:text-lg md:text-xl lg:text-2xl text-blue-100 mb-6 sm:mb-8 md:mb-10">
            {tLanding('ctaDescription', { defaultValue: 'Join thousands of Rwandans who are already saving smarter with IKIMINA WALLET.' })}
            </p>
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center max-w-md mx-auto">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              placeholder={tLanding('emailPlaceholder', { defaultValue: 'Enter your email' })}
              className="flex-1 px-4 sm:px-6 py-3 sm:py-4 rounded-xl text-gray-800 dark:text-gray-900 text-sm sm:text-base outline-none focus:ring-4 focus:ring-white/30 transition-all"
              />
            <button className="bg-white text-primary-600 font-semibold px-6 sm:px-8 py-3 sm:py-4 rounded-xl hover:bg-gray-100 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 text-sm sm:text-base">
              {t('getStarted', { defaultValue: 'Get Started' })}
              </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-8 sm:py-10 md:py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 sm:gap-8 mb-6 sm:mb-8">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <img 
                  src="/assets/images/wallet.png" 
                  alt="IKIMINA WALLET" 
                  className="h-10 w-[110px] object-cover"
                />
                <span className="text-xl font-bold">IKIMINA WALLET</span>
              </div>
              <p className="text-gray-400">
                {tLanding('footerDescription', { defaultValue: 'Empowering Rwanda\'s saving communities through digital innovation.' })}
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-4">{tLanding('quickLinks', { defaultValue: 'Quick Links' })}</h3>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">{tNav('about', { defaultValue: 'About' })}</a></li>
                <li><a href="#" className="hover:text-white transition-colors">{tNav('features', { defaultValue: 'Features' })}</a></li>
                <li><a href="#" className="hover:text-white transition-colors">{tNav('contact', { defaultValue: 'Contact' })}</a></li>
                <li><a href="#" className="hover:text-white transition-colors">{tNav('help', { defaultValue: 'Help' })}</a></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">{tLanding('contact', { defaultValue: 'Contact' })}</h3>
              <ul className="space-y-2 text-gray-400">
                <li>{tLanding('email', { defaultValue: 'Email' })}: kevinmuhinda8@gmail.com</li>
                <li>{tLanding('phone', { defaultValue: 'Phone' })}: +250 788 691 938</li>
                <li>Kigali, Rwanda</li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 pt-8 text-center text-gray-400">
            <p>{tLanding('footerCopyright', { defaultValue: '© 2025 IKIMINA WALLET. All rights reserved.' })}</p>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default LandingPage

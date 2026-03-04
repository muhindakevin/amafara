import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { 
  Smartphone, TrendingUp, Shield, Users, BarChart, 
  ArrowRight, Check, Zap, MessageCircle, Heart, Globe, Award,
  ChevronDown, Play, ArrowDown, Info, Settings, User, HelpCircle, Mail,
  Bot, X, Send, Minimize2, Maximize2
} from 'lucide-react'
import { useTranslation } from 'react-i18next'
import LanguageSelector from '../components/LanguageSelector'
import api from '../utils/api'
import { useToast } from '../contexts/ToastContext'

function LandingPage() {
  const navigate = useNavigate()
  const { showSuccess, showError } = useToast()
  const [email, setEmail] = useState('')
  const { t } = useTranslation('common')
  const { t: tLanding } = useTranslation(['landing', 'common'])
  const { t: tNav } = useTranslation('navigation')
  const [scrollY, setScrollY] = useState(0)
  const [newsletterLoading, setNewsletterLoading] = useState(false)
  const [newsletterMessage, setNewsletterMessage] = useState('')
  const [currentSlide, setCurrentSlide] = useState(0)
  const [isAutoPlaying, setIsAutoPlaying] = useState(true)

  const currentYear = new Date().getFullYear()

  // AI Assistant State
  const [isAiOpen, setIsAiOpen] = useState(false)
  const [isMinimized, setIsMinimized] = useState(false)
  const [aiMessage, setAiMessage] = useState('')
  const [aiMessages, setAiMessages] = useState([
    {
      type: 'ai',
      message: '👋 Hello! I\'m your IKIMINA WALLET assistant. I can help you learn about our features, answer questions, and guide you through our platform. How can I assist you today?'
    }
  ])
  const [isTyping, setIsTyping] = useState(false)

  // FAQ State
  const [expandedFaq, setExpandedFaq] = useState(null)

  // Contact Form State
  const [contactForm, setContactForm] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  })
  const [contactLoading, setContactLoading] = useState(false)

  const heroImages = [
    '/assets/images/Hero.png',
    '/assets/images/Hero1.png'
  ]

  useEffect(() => {
    if (!isAutoPlaying) return
    
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % heroImages.length)
    }, 5000) // Change slide every 5 seconds

    return () => clearInterval(interval)
  }, [isAutoPlaying, heroImages.length])

  // Manual slide navigation
  const goToSlide = (index) => {
    setCurrentSlide(index)
    setIsAutoPlaying(false) // Pause auto-play when user manually navigates
    setTimeout(() => setIsAutoPlaying(true), 10000) // Resume auto-play after 10 seconds
  }

  // AI Assistant Functions
  const handleAiMessage = () => {
    if (!aiMessage.trim()) return

    const userMessage = {
      type: 'user',
      message: aiMessage
    }

    setAiMessages(prev => [...prev, userMessage])
    setAiMessage('')
    setIsTyping(true)

    // Simulate AI response
    setTimeout(() => {
      const aiResponse = generateAiResponse(userMessage.message)
      setAiMessages(prev => [...prev, {
        type: 'ai',
        message: aiResponse
      }])
      setIsTyping(false)
    }, 1500)
  }

  const generateAiResponse = (userMessage) => {
    const message = userMessage.toLowerCase()
    
    if (message.includes('feature') || message.includes('what can')) {
      return '🚀 IKIMINA WALLET offers powerful features including:\n\n• 💰 Mobile Money Integration\n• 🤖 AI-Powered Credit Scoring\n• 🔒 Bank-Level Security\n• 👥 Group Management Tools\n• 📊 Real-Time Analytics\n• 💬 Group Chat\n\nWould you like to know more about any specific feature?'
    } else if (message.includes('security') || message.includes('safe')) {
      return '🔒 Your security is our top priority! IKIMINA WALLET uses:\n\n• Bank-level encryption\n• Secure authentication\n• Regular security audits\n• Data protection compliance\n\nYour financial data is always protected with enterprise-grade security.'
    } else if (message.includes('loan') || message.includes('credit')) {
      return '💳 Our AI-powered credit scoring system:\n\n• Instant loan decisions\n• Based on your saving history\n• Fair and transparent scoring\n• Build credit over time\n\nThe more you save consistently, the better your credit score becomes!'
    } else if (message.includes('join') || message.includes('signup') || message.includes('start')) {
      return '🎉 Getting started is easy!\n\n1. Click "Sign Up" to create your account\n2. Join or create a saving group\n3. Start saving and building your credit\n4. Access loans and other features\n\nReady to transform your financial future? Click the Sign Up button!'
    } else if (message.includes('contact') || message.includes('help') || message.includes('support')) {
      return '📞 We\'re here to help!\n\n• Email: kevinmuhinda8@gmail.com\n• Phone: +250 788 691 938\n• Location: Kigali, Rwanda\n\nOur support team is available to assist you with any questions or issues.'
    } else {
      return '🤖 I can help you with information about:\n\n• Our features and benefits\n• Security and privacy\n• How to get started\n• Loan and credit options\n• Contact information\n• Technical support\n\nWhat would you like to know more about?'
    }
  }

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleAiMessage()
    }
  }

  // FAQ Data
  const faqs = [
    {
      id: 1,
      question: "What is IKIMINA WALLET?",
      answer: "IKIMINA WALLET is a digital financial platform designed specifically for Rwandan saving groups. It helps communities manage their savings, access loans, track transactions, and build credit scores through mobile money integration and AI-powered tools."
    },
    {
      id: 2,
      question: "How do I join IKIMINA WALLET?",
      answer: "Getting started is easy: 1) Click 'Sign Up' to create your account, 2) Join an existing saving group or create your own, 3) Start saving and build your credit history, 4) Access loans and other financial services as you save consistently."
    },
    {
      id: 3,
      question: "Is my money safe with IKIMINA WALLET?",
      answer: "Yes! Your security is our top priority. We use bank-level encryption, secure authentication, regular security audits, and comply with data protection regulations. Your financial data and transactions are protected with enterprise-grade security measures."
    },
    {
      id: 4,
      question: "How does the credit scoring system work?",
      answer: "Our AI-powered credit scoring analyzes your saving history, transaction patterns, and group participation. The more consistently you save and participate in your group, the better your credit score becomes, giving you access to better loan terms and higher amounts."
    },
    {
      id: 5,
      question: "Can I use mobile money with IKIMINA WALLET?",
      answer: "Absolutely! IKIMINA WALLET seamlessly integrates with all major mobile money services in Rwanda. You can deposit, withdraw, and transfer money using your preferred mobile money provider, making it convenient to manage your finances."
    },
    {
      id: 6,
      question: "What are the fees for using IKIMINA WALLET?",
      answer: "We offer transparent and affordable pricing. Basic account creation and group management are free. Transaction fees are minimal and competitive. Premium features like advanced analytics and priority loan processing may have additional charges. Contact us for detailed pricing information."
    }
  ]

  // FAQ Toggle Function
  const toggleFaq = (id) => {
    setExpandedFaq(expandedFaq === id ? null : id)
  }

  // Contact Form Handler
  const handleContactSubmit = async (e) => {
    e.preventDefault()
    
    if (!contactForm.name.trim() || !contactForm.email.trim() || !contactForm.message.trim()) {
      showError('Please fill in all required fields')
      return
    }

    setContactLoading(true)

    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:4000'}/api/contact/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(contactForm)
      })
      
      const data = await response.json()
      
      if (data.success) {
        showSuccess(data.message || 'Thank you for your message! We\'ll get back to you within 24 hours.')
        setContactForm({ name: '', email: '', subject: '', message: '' })
      } else {
        showError(data.message || 'Failed to send message. Please try again.')
      }
    } catch (error) {
      console.error('Contact form error:', error)
      showError('Failed to send message. Please try again or contact us directly.')
    } finally {
      setContactLoading(false)
    }
  }

  const handleContactChange = (e) => {
    setContactForm({
      ...contactForm,
      [e.target.name]: e.target.value
    })
  }

  const handleNewsletterSignup = async () => {
    if (!email.trim()) {
      setNewsletterMessage('Please enter your email address')
      return
    }

    setNewsletterLoading(true)
    setNewsletterMessage('')

    try {
      const response = await api.post('/newsletter/subscribe', { email: email.trim() })
      
      if (response.data?.success) {
        setNewsletterMessage('Thank you for subscribing! Check your email for updates.')
        setEmail('')
      } else {
        throw new Error(response.data?.message || 'Failed to subscribe')
      }
    } catch (error) {
      console.error('Newsletter signup error:', error)
      setNewsletterMessage(
        error.response?.data?.message || 
        error.message || 
        'Failed to subscribe. Please try again.'
      )
    } finally {
      setNewsletterLoading(false)
    }
  }

  const features = [
    { 
      icon: Smartphone, 
      title: tLanding('features.mobileMoney.title', { defaultValue: 'Mobile Money Integration' }), 
      desc: tLanding('features.mobileMoney.desc', { defaultValue: 'Connect with mobile money services easily' }),
      color: 'from-amber-600 to-amber-800'
    },
    { 
      icon: TrendingUp, 
      title: tLanding('features.aiCredit.title', { defaultValue: 'AI-Powered Credit Scoring' }), 
      desc: tLanding('features.aiCredit.desc', { defaultValue: 'Instant credit decisions from savings history' }),
      color: 'from-green-400 to-green-600'
    },
    { 
      icon: Shield, 
      title: tLanding('features.secure.title', { defaultValue: 'Bank-Level Security' }), 
      desc: tLanding('features.secure.desc', { defaultValue: 'Enterprise-grade security for data and money' }),
      color: 'from-purple-400 to-purple-600'
    },
    { 
      icon: Users, 
      title: tLanding('features.groupManagement.title', { defaultValue: 'Group Management' }), 
      desc: tLanding('features.groupManagement.desc', { defaultValue: 'Powerful admin tools for group management' }),
      color: 'from-orange-400 to-orange-600'
    },
    { 
      icon: BarChart, 
      title: tLanding('features.analytics.title', { defaultValue: 'Real-Time Analytics' }), 
      desc: tLanding('features.analytics.desc', { defaultValue: 'Detailed insights on savings and performance' }),
      color: 'from-pink-400 to-pink-600'
    },
    { 
      icon: MessageCircle, 
      title: tLanding('features.chat.title', { defaultValue: 'Group Chat' }), 
      desc: tLanding('features.chat.desc', { defaultValue: 'Real-time communication with group members' }),
      color: 'from-indigo-400 to-indigo-600'
    },
  ]

  

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="bg-white/95 dark:bg-gray-900/95 backdrop-blur-lg shadow-sm fixed top-0 left-0 right-0 z-50 transition-all">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 py-3 sm:py-4">
          <div className="flex items-center justify-between gap-2 sm:gap-4">
            {/* Logo */}
            <div className="flex items-center -gap-1 min-w-0 flex-1">
              <img 
                src="/assets/images/wallet.png" 
                alt="IKIMINA WALLET" 
                className="h-8 sm:h-10 w-auto object-contain flex-shrink-0"
                style={{ transform: 'scale(1.1)', transformOrigin: 'left center' }}
                onError={(e) => {
                  e.target.style.display = 'none';
                  const fallback = e.target.nextElementSibling;
                  if (fallback) fallback.style.display = 'block';
                }}
              />
              <div className="logo-fallback hidden text-lg font-bold text-primary-600">IW</div>
              <span className="text-base sm:text-lg md:text-xl font-bold text-yellow-600 truncate">
                Ikimina wallet
              </span>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-6 lg:gap-8">
              <a 
                href="#about"
                className="text-gray-700 dark:text-gray-300 hover:text-yellow-600 dark:hover:text-primary-400 font-medium transition-colors cursor-pointer text-sm lg:text-base"
                onClick={(e) => {
                  e.preventDefault()
                  document.getElementById('about')?.scrollIntoView({ behavior: 'smooth' })
                }}
              >
                {tNav('about', { defaultValue: 'About' })}
              </a>
              <a 
                href="#features"
                className="text-gray-700 dark:text-gray-300 hover:text-yellow-600 dark:hover:text-primary-400 font-medium transition-colors cursor-pointer text-sm lg:text-base"
                onClick={(e) => {
                  e.preventDefault()
                  document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })
                }}
              >
                {tNav('features', { defaultValue: 'Features' })}
              </a>
              <a 
                href="#faq"
                className="text-gray-700 dark:text-gray-300 hover:text-yellow-600 dark:hover:text-primary-400 font-medium transition-colors cursor-pointer text-sm lg:text-base"
                onClick={(e) => {
                  e.preventDefault()
                  document.getElementById('faq')?.scrollIntoView({ behavior: 'smooth' })
                }}
              >
                {tNav('faq', { defaultValue: 'FAQ' })}
              </a>
              <a 
                href="#contact"
                className="text-gray-700 dark:text-gray-300 hover:text-yellow-600 dark:hover:text-primary-400 font-medium transition-colors cursor-pointer text-sm lg:text-base"
                onClick={(e) => {
                  e.preventDefault()
                  document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' })
                }}
              >
                {tNav('contact', { defaultValue: 'Contact' })}
              </a>
            </div>

            {/* Right side actions */}
            <div className="flex items-center gap-2 sm:gap-3 md:gap-4 flex-shrink-0">
              <div className="hidden sm:block">
                <LanguageSelector />
              </div>
              <button
                onClick={() => navigate('/signup')}
                className="btn-primary-transparent text-xs sm:text-sm px-3 sm:px-6 py-2 sm:py-3"
              >
                {t('signup', { defaultValue: 'Sign Up' })}
              </button>
              <button
                onClick={() => navigate('/login')}
                className="btn-primary text-xs sm:text-sm px-3 sm:px-6 py-2 sm:py-3"
              >
                {t('login', { defaultValue: 'Login' })}
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section id="home" className="relative pt-24 sm:pt-28 md:pt-32 pb-16 sm:pb-20 md:pb-24 overflow-hidden min-h-[85vh] flex items-center">
        {/* Background with decorative elements */}
        <div className="absolute inset-0 bg-white">
          {/* Decorative circles - more visible */}
          <div className="absolute top-20 left-10 w-32 h-32 bg-amber-200 rounded-full opacity-60 blur-lg"></div>
          <div className="absolute top-40 right-20 w-48 h-48 bg-amber-600 rounded-full opacity-50 blur-xl"></div>
          <div className="absolute bottom-20 left-1/4 w-40 h-40 bg-green-200 rounded-full opacity-55 blur-lg"></div>
          <div className="absolute bottom-40 right-1/3 w-36 h-36 bg-purple-200 rounded-full opacity-50 blur-lg"></div>
          
          {/* Additional decorative elements */}
          <div className="absolute top-32 right-1/4 w-24 h-24 bg-amber-300 rounded-full opacity-40 blur-md"></div>
          <div className="absolute bottom-32 left-1/3 w-28 h-28 bg-amber-500 rounded-full opacity-35 blur-md"></div>
          
          {/* Decorative dots pattern - more visible */}
          <div className="absolute top-0 left-0 w-full h-full">
            <div className="absolute top-10 left-10 grid grid-cols-3 gap-2">
              <div className="w-3 h-3 bg-amber-500 rounded-full opacity-70"></div>
              <div className="w-3 h-3 bg-amber-500 rounded-full opacity-70"></div>
              <div className="w-3 h-3 bg-amber-500 rounded-full opacity-70"></div>
              <div className="w-3 h-3 bg-amber-500 rounded-full opacity-70"></div>
              <div className="w-3 h-3 bg-amber-500 rounded-full opacity-70"></div>
              <div className="w-3 h-3 bg-amber-500 rounded-full opacity-70"></div>
            </div>
            <div className="absolute bottom-20 right-10 grid grid-cols-3 gap-2">
              <div className="w-3 h-3 bg-amber-700 rounded-full opacity-70"></div>
              <div className="w-3 h-3 bg-amber-700 rounded-full opacity-70"></div>
              <div className="w-3 h-3 bg-amber-700 rounded-full opacity-70"></div>
              <div className="w-3 h-3 bg-amber-700 rounded-full opacity-70"></div>
              <div className="w-3 h-3 bg-amber-700 rounded-full opacity-70"></div>
              <div className="w-3 h-3 bg-amber-700 rounded-full opacity-70"></div>
            </div>
            {/* Additional dot patterns */}
            <div className="absolute top-1/2 left-20 grid grid-cols-2 gap-3">
              <div className="w-2 h-2 bg-green-500 rounded-full opacity-60"></div>
              <div className="w-2 h-2 bg-green-500 rounded-full opacity-60"></div>
              <div className="w-2 h-2 bg-green-500 rounded-full opacity-60"></div>
              <div className="w-2 h-2 bg-green-500 rounded-full opacity-60"></div>
            </div>
            <div className="absolute top-1/3 right-32 grid grid-cols-2 gap-3">
              <div className="w-2 h-2 bg-purple-500 rounded-full opacity-60"></div>
              <div className="w-2 h-2 bg-purple-500 rounded-full opacity-60"></div>
              <div className="w-2 h-2 bg-purple-500 rounded-full opacity-60"></div>
              <div className="w-2 h-2 bg-purple-500 rounded-full opacity-60"></div>
            </div>
          </div>
        </div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 pt-16 sm:pt-20 md:pt-24">
          <div className="grid lg:grid-cols-2 gap-8 sm:gap-10 md:gap-12 items-center">
            {/* Left: Content */}
            <div className="text-center lg:text-left animate-slide-in">
              
              <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl xl:text-5xl font-bold text-gray-900 mb-4 sm:mb-6 leading-tight" style={{ textShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
                Empowering Community Savings and Loans
              </h1>
              
              <p className="text-sm sm:text-base md:text-lg lg:text-xl text-gray-600 mb-6 sm:mb-8 leading-relaxed max-w-2xl mx-auto lg:mx-0">
                Manage your savings, loans, transactions, and strengthen your credit score with IKIMINA WALLET.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center lg:justify-start">
                <button 
                  onClick={() => navigate('/signup')}
                  className="btn-primary shadow-lg text-sm sm:text-base px-4 sm:px-6 py-2 sm:py-3 flex items-center justify-center gap-2 group"
                >
                  Get Started
                  <ArrowRight size={18} className="sm:w-5 sm:h-5 group-hover:translate-x-1 transition-transform" />
                </button>
                <button 
                  onClick={() => navigate('/about')}
                  className="btn-primary-transparent shadow-lg text-sm sm:text-base px-4 sm:px-6 py-2 sm:py-3"
                >
                  Learn More
                </button>
              </div>

              
            </div>

            {/* Right: Modern Sliding Hero Images */}
            <div className="relative animate-slide-in">
              <div className="relative group">
                {/* Main Sliding Image Container */}
                <div className="relative rounded-3xl overflow-hidden shadow-2xl shadow-amber-500/20 bg-gradient-to-br from-amber-500 to-amber-600">
                  {/* Sliding Images */}
                  <div className="relative aspect-video w-full">
                    {heroImages.map((image, index) => (
                      <div
                        key={index}
                        className="absolute inset-0 transition-all duration-1000 ease-in-out"
                        style={{ transform: `scale(${index === currentSlide ? 1 : 1.1})`, opacity: index === currentSlide ? 1 : 0 }}
                      >
                        <img 
                          src={image}
                          alt={`IKIMINA WALLET Hero ${index + 1}`}
                          className="w-full h-full object-cover rounded-3xl"
                          onError={(e) => {
                            if (index === 0) {
                              e.target.style.display = 'none'
                              e.target.nextElementSibling.style.display = 'flex'
                            }
                          }}
                        />
                        {/* Modern gradient overlay */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent rounded-3xl"></div>
                        {/* Modern glass effect on hover */}
                        <div className="absolute inset-0 bg-white/5 backdrop-blur-sm rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                      </div>
                    ))}
                  </div>

                  {/* Modern Slide Indicators */}
                  <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 flex items-center gap-2 bg-black/30 backdrop-blur-md px-4 py-2 rounded-full">
                    {heroImages.map((_, index) => (
                      <button
                        key={index}
                        onClick={() => goToSlide(index)}
                        className={`transition-all duration-300 ${
                          index === currentSlide 
                            ? 'w-8 h-2 bg-white rounded-full' 
                            : 'w-2 h-2 bg-white/50 rounded-full hover:bg-white/70'
                        }`}
                        aria-label={`Go to slide ${index + 1}`}
                      />
                    ))}
                  </div>

                  {/* Modern Navigation Arrows */}
                  <button
                    onClick={() => goToSlide((currentSlide - 1 + heroImages.length) % heroImages.length)}
                    className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-white/20 backdrop-blur-md text-white p-3 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-300 hover:bg-white/30 hover:scale-110"
                    aria-label="Previous slide"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                  <button
                    onClick={() => goToSlide((currentSlide + 1) % heroImages.length)}
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-white/20 backdrop-blur-md text-white p-3 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-300 hover:bg-white/30 hover:scale-110"
                    aria-label="Next slide"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>

                  {/* Fallback */}
                  <div className="hidden absolute inset-0 bg-gradient-to-br from-amber-500 to-amber-600 rounded-3xl p-12 items-center justify-center">
                    <div className="text-center text-white">
                      <Smartphone className="mx-auto mb-4" size={80} />
                      <p className="text-xl font-semibold">IKIMINA WALLET</p>
                      <p className="text-white/90">Digital Financial Platform</p>
                    </div>
                  </div>
                </div>

                {/* Modern floating elements */}
                <div className="absolute -top-4 -right-4 w-20 h-20 bg-yellow-400 rounded-full opacity-20 blur-xl animate-pulse shadow-lg shadow-yellow-400/30"></div>
                <div className="absolute -bottom-4 -left-4 w-16 h-16 bg-blue-400 rounded-full opacity-20 blur-xl animate-pulse delay-75 shadow-lg shadow-blue-400/30"></div>
              </div>
            </div>
          </div>
        </div>

        {/* Scroll Indicator */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
          <ArrowDown className="text-gray-400" size={24} />
        </div>

        {/* Section Separator */}
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-gray-300 dark:via-gray-600 to-transparent"></div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-12 sm:py-16 md:py-20 bg-white dark:bg-gray-900 scroll-mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center max-w-3xl mx-auto mb-10 sm:mb-12 md:mb-16 animate-slide-in">
            <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-gray-900 dark:text-white mb-3 sm:mb-4">
              {tLanding('featuresTitle', { defaultValue: 'Manage Your Savings' })}
            </h2>
            <p className="text-sm sm:text-base md:text-lg text-gray-600 dark:text-gray-300">
              {tLanding('featuresSubtitle', { defaultValue: 'Powerful features designed for Rwandan saving groups' })}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {features.map((feature, index) => {
              const Icon = feature.icon
              return (
                <div 
                  key={index} 
                  className="group card hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 animate-slide-in flex flex-col items-center text-center"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <div className={`w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br ${feature.color} rounded-xl sm:rounded-2xl flex items-center justify-center mb-3 sm:mb-4 group-hover:scale-110 transition-transform`}>
                    <Icon className="text-white" size={24} style={{ width: '24px', height: '24px' }} />
                  </div>
                  <h3 className="text-base sm:text-lg font-bold text-gray-800 dark:text-white mb-2">{feature.title}</h3>
                  <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 leading-relaxed">{feature.desc}</p>
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
                <div className="aspect-[4/3] bg-gradient-to-br from-primary-200 to-amber-600 relative overflow-hidden">
                  <img 
                    src="https://images.unsplash.com/photo-1582213782179-e0d53f98f2ca?w=800&h=600&fit=crop&q=80"
                    alt="Community savings and financial inclusion"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.target.style.display = 'none'
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-br from-primary-600/40 to-amber-600/40"></div>
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
                    <div className="w-6 h-6 bg-amber-600 rounded-full flex items-center justify-center flex-shrink-0">
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
      <section className="relative min-h-[70vh] flex flex-col justify-center bg-gradient-to-b from-amber-600 to-amber-400 pt-16 sm:pt-20 md:pt-24">
        <div className="absolute inset-0">
          <div className="absolute top-0 right-0 w-64 h-64 sm:w-96 sm:h-96 bg-white/10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-64 h-64 sm:w-96 sm:h-96 bg-white/10 rounded-full blur-3xl"></div>
        </div>
        
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 text-center">
          <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-3 sm:mb-4">
            {tLanding('ctaTitle', { defaultValue: 'Ready to Transform Your Savings?' })}
          </h2>
          <p className="text-base sm:text-lg md:text-xl lg:text-2xl text-amber-100 mb-6 sm:mb-8 md:mb-10">
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
            <button className="bg-white text-amber-600 font-semibold px-6 sm:px-8 py-3 sm:py-4 rounded-xl hover:bg-gray-100 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 text-sm sm:text-base">
              {t('getStarted', { defaultValue: 'Get Started' })}
              </button>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="py-16 sm:py-20 bg-gray-50 relative overflow-hidden scroll-mt-20">
        {/* Background decoration */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-20 left-20 w-32 h-32 bg-amber-500 rounded-full blur-2xl"></div>
          <div className="absolute bottom-20 right-20 w-40 h-40 bg-amber-500 rounded-full blur-2xl"></div>
        </div>
        
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Frequently Asked Questions
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Find answers to common questions about IKIMINA WALLET and how we can help you manage your savings and loans.
            </p>
          </div>
          
          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <div 
                key={faq.id} 
                className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden transition-all duration-300 hover:shadow-md animate-slide-in"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <button
                  onClick={() => toggleFaq(faq.id)}
                  className="w-full px-6 py-4 text-left flex items-center justify-between hover:bg-gray-50 transition-colors"
                >
                  <span className="font-semibold text-gray-900 pr-4">{faq.question}</span>
                  <div className={`flex-shrink-0 transition-transform duration-300 ${expandedFaq === faq.id ? 'rotate-180' : ''}`}>
                    <ChevronDown className="text-amber-600" size={20} />
                  </div>
                </button>
                
                <div className={`transition-all duration-300 ${expandedFaq === faq.id ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'} overflow-hidden`}>
                  <div className="px-6 pb-4 text-gray-600 leading-relaxed">
                    {faq.answer}
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          <div className="text-center mt-12">
            <p className="text-gray-600 mb-4">
              Still have questions? We're here to help!
            </p>
            <button
              onClick={() => setIsAiOpen(true)}
              className="inline-flex items-center gap-2 bg-amber-500 text-white px-6 py-3 rounded-lg hover:bg-amber-600 transition-colors"
            >
              <Bot size={20} />
              Ask Our AI Assistant
            </button>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="py-16 sm:py-20 bg-white relative overflow-hidden scroll-mt-20">
        {/* Background decoration */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-10 right-10 w-32 h-32 bg-amber-500 rounded-full blur-2xl"></div>
          <div className="absolute bottom-10 left-10 w-40 h-40 bg-amber-500 rounded-full blur-2xl"></div>
        </div>
        
        <div className="relative max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Get in Touch
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Have questions about IKIMINA WALLET? We're here to help! Reach out to us through any of the channels below.
            </p>
          </div>
          
          <div className="grid lg:grid-cols-2 gap-12">
            {/* Contact Information */}
            <div className="space-y-8">
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-6">Contact Information</h3>
                
                <div className="space-y-4">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Mail className="text-amber-600" size={20} />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900">Email</h4>
                      <p className="text-gray-600">kevinmuhinda8@gmail.com</p>
                      <p className="text-sm text-gray-500">We respond within 24 hours</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Smartphone className="text-amber-600" size={20} />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900">Phone</h4>
                      <p className="text-gray-600">+250 788 691 938</p>
                      <p className="text-sm text-gray-500">Mon-Fri: 9AM-6PM Kigali Time</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Globe className="text-amber-600" size={20} />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900">Office</h4>
                      <p className="text-gray-600">Kigali, Rwanda</p>
                      <p className="text-sm text-gray-500">By appointment only</p>
                    </div>
                  </div>
                </div>
              </div>
              
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-4">Business Hours</h3>
                <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Monday - Friday</span>
                    <span className="font-medium">9:00 AM - 6:00 PM</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Saturday</span>
                    <span className="font-medium">10:00 AM - 2:00 PM</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Sunday</span>
                    <span className="font-medium">Closed</span>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Contact Form */}
            <div>
              <div className="bg-gray-50 rounded-xl p-6 sm:p-8">
                <h3 className="text-xl font-semibold text-gray-900 mb-6">Send us a Message</h3>
                
                <form onSubmit={handleContactSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Name *
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={contactForm.name}
                      onChange={handleContactChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                      placeholder="Your full name"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email *
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={contactForm.email}
                      onChange={handleContactChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                      placeholder="your.email@example.com"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Subject
                    </label>
                    <input
                      type="text"
                      name="subject"
                      value={contactForm.subject}
                      onChange={handleContactChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                      placeholder="How can we help?"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Message *
                    </label>
                    <textarea
                      name="message"
                      value={contactForm.message}
                      onChange={handleContactChange}
                      rows={4}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent resize-none"
                      placeholder="Tell us more about your inquiry..."
                      required
                    />
                  </div>
                  
                  <button
                    type="submit"
                    disabled={contactLoading}
                    className="w-full bg-gradient-to-r from-amber-500 to-amber-600 text-white py-3 px-6 rounded-lg font-medium hover:from-amber-600 hover:to-amber-700 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {contactLoading ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        Sending...
                      </>
                    ) : (
                      <>
                        Send Message
                        <ArrowRight size={18} />
                      </>
                    )}
                  </button>
                </form>
              </div>
            </div>
          </div>
          
          <div className="text-center mt-12">
            <p className="text-gray-600 mb-4">
              Prefer instant answers? Our AI assistant is available 24/7!
            </p>
            <button
              onClick={() => setIsAiOpen(true)}
              className="inline-flex items-center gap-2 bg-amber-500 text-white px-6 py-3 rounded-lg hover:bg-amber-600 transition-colors"
            >
              <Bot size={20} />
              Chat with AI Assistant
            </button>
          </div>
        </div>
      </section>

      {/* Floating AI Assistant */}
      {/* AI Chat Window */}
      <div className={`fixed z-[9999] transition-all duration-300 ${isAiOpen && !isMinimized ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'}`} style={{ bottom: '80px', right: '20px' }}>
        <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 w-80 sm:w-96">
          {/* Header */}
          <div className="bg-gradient-to-r from-amber-500 to-amber-600 text-white p-4 rounded-t-2xl flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bot size={20} />
              <span className="font-semibold">IKIMINA Assistant</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsMinimized(!isMinimized)}
                className="hover:bg-white/20 p-1 rounded transition-colors"
              >
                {isMinimized ? <Maximize2 size={16} /> : <Minimize2 size={16} />}
              </button>
              <button
                onClick={() => setIsAiOpen(false)}
                className="hover:bg-white/20 p-1 rounded transition-colors"
              >
                <X size={16} />
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="h-96 overflow-y-auto p-4 space-y-3">
            {aiMessages.map((msg, index) => (
              <div key={index} className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] p-3 rounded-2xl ${
                  msg.type === 'user' 
                    ? 'bg-amber-500 text-white' 
                    : 'bg-gray-100 text-gray-800'
                }`}>
                  <p className="text-sm whitespace-pre-line">{msg.message}</p>
                </div>
              </div>
            ))}
            {isTyping && (
              <div className="flex justify-start">
                <div className="bg-gray-100 text-gray-800 p-3 rounded-2xl">
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Input */}
          <div className="p-4 border-t border-gray-200">
            <div className="flex gap-2">
              <input
                type="text"
                value={aiMessage}
                onChange={(e) => setAiMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ask me anything about IKIMINA WALLET..."
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm"
              />
              <button
                onClick={handleAiMessage}
                disabled={!aiMessage.trim() || isTyping}
                className="bg-amber-500 text-white p-2 rounded-lg hover:bg-amber-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Send size={16} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* AI Assistant Button - Direct positioning */}
      <button
        onClick={() => {
          setIsAiOpen(!isAiOpen)
          setIsMinimized(false)
        }}
        className="fixed bg-gradient-to-r from-amber-500 to-amber-600 text-white p-5 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 cursor-pointer z-[10000]"
        style={{ bottom: '10px', right: '10px' }}
      >
        <Bot size={28} />
      </button>

      {/* Footer */}
      <footer className="bg-black text-white py-8 sm:py-10 md:py-12">
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
            <p>{tLanding('footerCopyright', { defaultValue: `© ${currentYear} IKIMINA WALLET. All rights reserved.` })}</p>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default LandingPage

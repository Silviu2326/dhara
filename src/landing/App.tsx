import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Calendar,
  Users,
  MessageSquare,
  FileText,
  Star,
  CreditCard,
  Settings,
  Shield,
  BarChart3,
  CheckCircle,
  ArrowRight,
  Menu,
  X,
  Play,
  Zap,
  Heart,
  Award,
  Phone,
  Mail,
  MapPin,
  Sparkles,
  ChevronDown,
  ChevronUp,
  LogIn,
  LayoutDashboard
} from 'lucide-react';
import logoImage from './WhatsApp_Image_2025-08-15_at_13.59.22__1_-removebg-preview.png';
import PoliticaPrivacidad from './PoliticaPrivacidad';
import TerminosCondiciones from './TerminosCondiciones';
import UneteModal from './UneteModal';

function App() {
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
  const [openFaq, setOpenFaq] = React.useState<number | null>(null);
  const [showPrivacidad, setShowPrivacidad] = React.useState(false);
  const [showTerminos, setShowTerminos] = React.useState(false);
  const [showUneteModal, setShowUneteModal] = React.useState(false);

  const features = [
    {
      icon: Calendar,
      title: "Calendario y Horario",
      description: "Crea tu calendario laboral y horario de disponibilidad personalizado. Agenda digital automática.",
      color: "#8CA48F"
    },
    {
      icon: Sparkles,
      title: "Escaparate de Servicios",
      description: "Crea tu escaparate de servicios y packs con nombre, precio y detalle. Todo con imagen profesional.",
      color: "#D58E6E"
    },
    {
      icon: Users,
      title: "Base de Datos Clientes",
      description: "Ten tu propia base de datos de tus clientes y su historial de evolución en tus sesiones.",
      color: "#C9A2A6"
    },
    {
      icon: Star,
      title: "Reseñas Verificadas",
      description: "Permite que te valoren únicamente las personas que han ido a tu sesión, no haters.",
      color: "#A2B2C2"
    },
    {
      icon: MessageSquare,
      title: "Chat Profesional",
      description: "Conversa y atiende a tus clientes por el chat de la plataforma. Horario profesional, aparca WhatsApp.",
      color: "#8CA48F"
    },
    {
      icon: BarChart3,
      title: "Gestión de Ventas",
      description: "Gestiona administrativamente tus ventas dentro de la plataforma. Exporta y manda a tu gestor.",
      color: "#D58E6E"
    },
    {
      icon: FileText,
      title: "Gestión Documental",
      description: "Sube a tu área de documentos aquellos que necesitas compartir con tus clientes.",
      color: "#C9A2A6"
    }
  ];

  const benefits = [
    {
      title: "Porque pone orden al caos",
      description: "Calendario de disponibilidad totalmente personalizable. Agenda digital automática. Gestión clara de citas, clientes y sesiones.",
      result: "Menos mensajes. Menos errores. Más control.",
      icon: Settings,
      color: "#8CA48F"
    },
    {
      title: "Porque profesionaliza tu consulta",
      description: "Creas tus servicios y packs como un escaparate. Gestionas la administración de tus ventas desde un solo lugar. Compartes documentos de forma privada y personalizada.",
      result: "Todo con una imagen profesional y coherente.",
      icon: Award,
      color: "#D58E6E"
    },
    {
      title: "Porque protege tu tiempo y tu energía",
      description: "Chat privado y seguro con tus clientes. Se acabó la inmediatez de WhatsApp. Se acabó mezclar trabajo y vida personal.",
      result: "Tú decides cuándo y cómo atiendes.",
      icon: Shield,
      color: "#A2B2C2"
    },
    {
      title: "Porque te da visibilidad real (sin postureo)",
      description: "Perfil profesional verificado con titulación acreditada. Reseñas reales de tus clientes. Presencia en el mapa nacional de bienestar natural.",
      result: "Te encuentran personas que ya están buscando terapias naturales, no seguidores.",
      icon: MapPin,
      color: "#C9A2A6"
    },
    {
      title: "Porque es accesible desde la primera sesión",
      description: "Suscripción mensual. El coste se cubre con menos de una sesión. Sin comisiones. Sin favoritismos. Sin letra pequeña.",
      result: "Pagas poco. Ganas orden. Y recuperas tiempo.",
      icon: CreditCard,
      color: "#8CA48F"
    }
  ];

  const pricingPlans = [
    {
      name: "Básico",
      price: "14,99€",
      period: "/mes",
      description: "Para empezar a ser visible",
      subtitle: "Ideal si quieres empezar a ser visible y permitir que las personas que ya buscan tu terapia te encuentren.",
      features: [
        "Perfil profesional completo",
        "Visibilidad en la App Dhara con buscador nacional",
        "Presencia en el mapa de bienestar natural",
        "Comunidad profesional sin comisiones"
      ],
      cta: "Quiero empezar por aquí",
      note: "Perfecto si solo necesitas visibilidad y quieres probar Dhara.",
      color: "#A2B2C2",
      popular: false
    },
    {
      name: "Avanzado",
      price: "38,99€",
      period: "/mes",
      description: "El más elegido ⭐",
      subtitle: "Para profesionales que quieren orden y fluidez, no solo visibilidad.",
      features: [
        "Todo lo del plan Básico",
        "Agenda digital con disponibilidad personalizada",
        "Gestión automática de citas y reservas",
        "Creación ilimitada de servicios y packs",
        "Base de datos de clientes y documentos",
        "Chat privado y seguro (adiós WhatsApp)",
        "Reseñas de tus clientes",
        "Registro manual de ventas"
      ],
      cta: "Es justo lo que necesito",
      note: "Con una sola sesión al mes, el plan está cubierto.",
      color: "#8CA48F",
      popular: true
    },
    {
      name: "Avanzado Pro",
      price: "45,99€",
      period: "/mes",
      description: "Para consultas que quieren escalar",
      subtitle: "Pensado para profesionales que quieren profesionalizar y automatizar su consulta.",
      features: [
        "Todo lo del plan Avanzado",
        "Pasarela de pago integrada (Stripe)",
        "Cobros automáticos y seguros",
        "Control financiero automático",
        "Menos gestión manual, más tranquilidad"
      ],
      cta: "Elijo más automatización",
      note: "Más automatización, menos gestión. Más tiempo para acompañar.",
      color: "#D58E6E",
      popular: false
    }
  ];

  const faqs = [
    {
      question: "¿Qué ventajas tengo con los planes de suscripción en Dhara?",
      answer: "Dhara es la única plataforma con posibilidad de Software hecha por y para la comunidad de las terapias naturales. Ganas visibilidad en toda España, simplificas tu gestión administrativa y reduces tiempo para centrarte en lo que amas: tu trabajo terapéutico."
    },
    {
      question: "¿Cómo ayuda Dhara a captar clientes de terapias naturales?",
      answer: "Dhara es la única plataforma con una App buscador para usuarios finales dedicada a las terapias naturales. Por ello te conecta directamente con personas que buscan terapias naturales como la tuya en su zona o en formato online. Gracias a nuestra App con buscador inteligente por ubicación o tipo de terapia, tus servicios se muestran a quienes realmente los necesitan y los buscan."
    },
    {
      question: "¿Hay comisiones por las reservas de clientes?",
      answer: "No. A diferencia de otras plataformas, Dhara no se queda con un porcentaje de tus ingresos. Tu suscripción cubre lo que tú decides y tus honorarios son íntegramente tuyos."
    },
    {
      question: "¿Qué incluye el plan básico y el avanzado?",
      answer: "El plan básico te da visibilidad en el mapa con un perfil completo. Los planes avanzados añaden un software con herramientas de gestión que facilitan tu día a día."
    },
    {
      question: "¿Por qué nuestro software es la mejor opción para profesionales?",
      answer: "Porque está diseñado para ti, para liberarte de la carga administrativa con herramientas de: calendario personalizable y agenda digital, publicación de ilimitados servicios o packs, reservas automáticas, chat, recordatorios, estadísticas y gestión de pagos en un solo lugar."
    },
    {
      question: "¿Si soy un centro con varios profesionales y llevo la gestión, Dhara es para mí?",
      answer: "Sí. Dhara se adapta tanto a profesionales independientes como a centros. Contamos con planes de suscripción diseñados para cubrir ambas necesidades: desde la visibilidad en el mapa y el perfil del centro, hasta la gestión completa con software para todos los profesionales del equipo."
    },
    {
      question: "¿Cómo garantizan la igualdad de visibilidad entre profesionales?",
      answer: "En Dhara no hay favoritismos ni rankings pagados. La visibilidad depende únicamente de la localización y del buscador por necesidades de los clientes."
    },
    {
      question: "¿Puedo tener visibilidad en diferentes ubicaciones si trabajo en varios lugares?",
      answer: "Sí. En tu perfil puedes indicar hasta 4 ubicaciones diferentes donde ofreces tus servicios. Así, quienes busquen terapias en esas zonas podrán encontrarte fácilmente, aumentando tu alcance y tus oportunidades de ser elegido."
    },
    {
      question: "¿Habrá competencia dentro de la plataforma?",
      answer: "En Dhara creemos que hay clientes para todas las personas. Cada profesional tiene su manera única de acompañar, y las personas buscan justamente esa conexión especial. La plataforma no fomenta la competencia desleal, sino la visibilidad igualitaria."
    },
    {
      question: "¿Cómo funcionan las reseñas de clientes?",
      answer: "Las reseñas son una herramienta para fortalecer la confianza y dar valor al trabajo de cada profesional. Todas las reseñas serán revisadas con rigor para asegurar que cumplen con nuestros valores de respeto, ética y veracidad."
    },
    {
      question: "¿Los planes de suscripción tienen permanencia?",
      answer: "No. En Dhara creemos en la libertad y la confianza. Nuestros planes de suscripción no tienen permanencia, puedes cambiar o darte de baja en cualquier momento si así lo decides."
    }
  ];



  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F3EEE9] via-[#F5F1EC] to-[#F8F5F2]" style={{ color: '#2D3A4A' }}>
      {/* Header */}
      <header className="sticky top-0 z-50 backdrop-blur-md bg-white/90 border-b border-stone-200/50 shadow-sm">
        <nav className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="flex h-24 items-center justify-between">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <img src={logoImage} alt="Dhara" className="h-20 w-auto" />
              </div>
            </div>

            <div className="hidden md:block">
              <div className="ml-10 flex items-center space-x-10">
                <a href="#features" className="text-base font-medium hover:text-emerald-600 transition-colors duration-200">
                  Características
                </a>

                <a href="#benefits" className="text-base font-medium hover:text-emerald-600 transition-colors duration-200">
                  Beneficios
                </a>
                <a href="#pricing" className="text-base font-medium hover:text-emerald-600 transition-colors duration-200">
                  Precios
                </a>
                <a href="#faq" className="text-base font-medium hover:text-emerald-600 transition-colors duration-200">
                  FAQ
                </a>
                <button
                  onClick={() => navigate('/login')}
                  className="text-base font-medium hover:text-emerald-600 transition-colors duration-200 flex items-center gap-2"
                >
                  <LogIn size={18} />
                  Iniciar Sesión
                </button>
                <button
                  onClick={() => setShowUneteModal(true)}
                  className="px-8 py-3.5 rounded-full text-white font-semibold hover:shadow-lg hover:scale-105 transition-all duration-200 shadow-md"
                  style={{ backgroundColor: '#8CA48F' }}
                >
                  Únete Hoy
                </button>
              </div>
            </div>

            <div className="md:hidden">
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-3 rounded-lg hover:bg-stone-100 transition-colors"
              >
                {mobileMenuOpen ? <X size={26} /> : <Menu size={26} />}
              </button>
            </div>
          </div>
        </nav>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="md:hidden absolute top-24 left-0 right-0 bg-white/95 backdrop-blur-md shadow-xl border-b border-stone-200 z-50">
            <div className="px-6 py-6 space-y-4">
              <a href="#features" className="block text-base font-medium hover:text-emerald-600 transition-colors py-2">Características</a>
              <a href="#benefits" className="block text-base font-medium hover:text-emerald-600 transition-colors py-2">Beneficios</a>
              <a href="#pricing" className="block text-base font-medium hover:text-emerald-600 transition-colors py-2">Precios</a>
              <a href="#faq" className="block text-base font-medium hover:text-emerald-600 transition-colors py-2">FAQ</a>
              <button
                onClick={() => { setMobileMenuOpen(false); navigate('/login'); }}
                className="w-full px-6 py-3.5 rounded-full font-semibold hover:shadow-lg transition-all duration-200 shadow-md mt-2 border-2 flex items-center justify-center gap-2"
                style={{ borderColor: '#8CA48F', color: '#8CA48F' }}
              >
                <LogIn size={18} />
                Iniciar Sesión
              </button>
              <button
                onClick={() => setShowUneteModal(true)}
                className="w-full px-6 py-3.5 rounded-full text-white font-semibold hover:shadow-lg transition-all duration-200 shadow-md"
                style={{ backgroundColor: '#8CA48F' }}
              >
                Únete Hoy
              </button>
            </div>
          </div>
        )}
      </header>

      {/* Hero Section */}
      <section className="relative px-6 py-32 sm:py-40 lg:px-8 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#F3EEE9]/30 to-[#F8F5F2]/30"></div>
        <div className="relative mx-auto max-w-5xl text-center">


          <h1 className="text-5xl font-bold tracking-tight sm:text-7xl mb-8 leading-tight">
            <span style={{ color: '#8CA48F' }}>Dhara</span> no es otra plataforma más
          </h1>
          <h2 className="text-2xl font-semibold mb-6 text-stone-600">
            Si tu negocio vive en WhatsApp, papeles y notas sueltas… esto es para ti.
          </h2>
          <p className="text-xl leading-8 mb-12 text-stone-500 max-w-4xl mx-auto">
            Una sola plataforma pensada exclusivamente para profesionales de terapias naturales en España.
          </p>

          <div className="flex flex-col sm:flex-row gap-6 justify-center items-center mb-16">
            <button
              onClick={() => setShowUneteModal(true)}
              className="px-10 py-5 rounded-full text-white font-semibold text-lg hover:shadow-xl hover:scale-105 transition-all duration-300 flex items-center justify-center gap-3 shadow-lg"
              style={{ backgroundColor: '#8CA48F' }}
            >
              Soy profesional – Quiero unirme
              <ArrowRight size={20} />
            </button>
            <button
              onClick={() => setShowUneteModal(true)}
              className="px-10 py-5 rounded-full font-semibold text-lg border-2 hover:bg-stone-50 transition-all duration-300 flex items-center justify-center gap-3 group"
              style={{ borderColor: '#A2B2C2', color: '#2D3A4A' }}
            >
              <Play size={20} className="group-hover:scale-110 transition-transform" />
              Soy cliente – Buscar profesional
            </button>
          </div>

          {/* Trust indicators */}
          <div className="flex flex-wrap justify-center items-center gap-8 text-sm text-stone-500">
            <div className="flex items-center gap-2">
              <Shield size={16} style={{ color: '#8CA48F' }} />
              <span>100% Seguro</span>
            </div>
            <div className="flex items-center gap-2">
              <Star size={16} style={{ color: '#8CA48F' }} />
              <span>Sin comisiones</span>
            </div>
          </div>
        </div>
      </section>

      {/* What is Dhara Section */}
      <section className="py-32 px-6 lg:px-8 bg-gradient-to-br from-[#F3EEE9] to-white">
        <div className="mx-auto max-w-7xl">
          <div className="text-center mb-20">
            <h3 className="text-4xl font-bold mb-8">¿Qué es Dhara?</h3>
            <div className="max-w-4xl mx-auto space-y-8 text-lg md:text-xl leading-relaxed text-stone-600">
              <p>
                Dhara es la plataforma que pone orden en tu negocio de terapias naturales. Combinamos visibilidad profesional y software de gestión en una sola herramienta pensada específicamente para profesionales que trabajan en España.
              </p>
              <div className="p-8 rounded-2xl shadow-sm bg-white border border-stone-100 mt-8">
                <p className="text-xl italic text-stone-700">
                  "Es justo lo que llevo años buscando, y además muy accesible, lo necesito."
                </p>
              </div>
              <div className="mt-12">
                <button
                  className="px-8 py-4 rounded-full text-white font-semibold text-lg shadow-md hover:shadow-lg hover:scale-105 transition-all duration-300 inline-flex items-center gap-2"
                  style={{ backgroundColor: '#8CA48F' }}
                >
                  Descubre Dhara <ArrowRight size={20} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-32 px-6 lg:px-8 bg-gradient-to-br from-[#F3EEE9] to-white">
        <div className="mx-auto max-w-7xl">
          <div className="text-center mb-20">
            <h3 className="text-4xl font-bold mb-6">Menos promesas. Más utilidad.</h3>
            <p className="text-xl text-stone-600 max-w-4xl mx-auto leading-relaxed">
              Todo lo que necesitas: tiempo y visibilidad. Simplifica tu gestión y tu negocio desde una sola plataforma.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <div
                  key={index}
                  className="p-8 rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-2 bg-white border border-stone-100 group"
                >
                  <div
                    className="w-16 h-16 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300"
                    style={{ backgroundColor: `${feature.color}15` }}
                  >
                    <Icon size={28} style={{ color: feature.color }} />
                  </div>
                  <h4 className="text-xl font-semibold mb-4">{feature.title}</h4>
                  <p className="text-stone-600 leading-relaxed">{feature.description}</p>
                </div>
              );
            })}
          </div>
          <div className="mt-16 text-center">
            <button
              className="px-8 py-4 rounded-full font-semibold text-lg border-2 hover:bg-stone-50 hover:scale-105 transition-all duration-300 inline-flex items-center gap-2"
              style={{ borderColor: '#D58E6E', color: '#D58E6E' }}
            >
              Empieza a cambiar tu negocio con Dhara <ArrowRight size={20} />
            </button>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section id="benefits" className="py-32 px-6 lg:px-8 bg-white">
        <div className="mx-auto max-w-7xl">
          <div className="text-center mb-20">
            <h3 className="text-4xl font-bold mb-6">¿Por qué elegir Dhara?</h3>
            <p className="text-xl text-stone-600 max-w-4xl mx-auto leading-relaxed">
              Tu consulta visible, tu agenda organizada, tu tiempo de vuelta. Dhara es la plataforma que multiplica tu visibilidad y te libera del peso de la gestión.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {benefits.map((benefit, index) => {
              const Icon = benefit.icon;
              return (
                <div key={index} className="p-8 rounded-2xl shadow-sm hover:shadow-lg transition-all duration-300 bg-white border border-stone-100 group">
                  <div
                    className="w-16 h-16 rounded-full flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg"
                    style={{ backgroundColor: benefit.color }}
                  >
                    <Icon size={28} color="white" />
                  </div>
                  <h4 className="text-xl font-semibold mb-4">{benefit.title}</h4>
                  <p className="text-stone-600 leading-relaxed mb-4">{benefit.description}</p>
                  <p className="font-medium text-sm" style={{ color: benefit.color }}>{benefit.result}</p>
                </div>
              );
            })}
          </div>
          <div className="mt-16 text-center">
            <button
              className="px-8 py-4 rounded-full text-white font-semibold text-lg shadow-md hover:shadow-lg hover:scale-105 transition-all duration-300 inline-flex items-center gap-2"
              style={{ backgroundColor: '#8CA48F' }}
            >
              Empieza hoy con Dhara <ArrowRight size={20} />
            </button>
            <p className="mt-3 text-sm text-stone-500">Pon orden en tu negocio y deja que la plataforma trabaje para ti.</p>
          </div>
        </div>
      </section>


      {/* Target Audience Section */}
      <section className="py-32 px-6 lg:px-8 bg-gradient-to-br from-[#F3EEE9] to-white">
        <div className="mx-auto max-w-7xl">
          <div className="text-center mb-20">
            <h3 className="text-4xl font-bold mb-6">¿Para quién es Dhara?</h3>
            <p className="text-xl text-stone-600 max-w-3xl mx-auto leading-relaxed">
              Descubre si Dhara es la herramienta adecuada para ti.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* NO es para ti */}
            <div className="p-10 rounded-2xl shadow-sm bg-white border border-stone-200 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-1 h-full bg-red-400"></div>
              <h4 className="text-2xl font-semibold mb-8 text-red-500 flex items-center">
                <X size={28} className="mr-3" />
                Esto NO es para ti si...
              </h4>
              <ul className="space-y-4">
                {[
                  "Buscas seguir gestionando tu consulta con WhatsApp, papeles y notas sueltas.",
                  "Sientes comodidad con el caos y no te importa usar tiempo de más cada día.",
                  "No te interesa profesionalizar tu trabajo ni darle más valor.",
                  "Prefieres mezclar tu vida personal con tu consulta y estar disponible a cualquier hora.",
                  "No quieres visibilidad ni nuevos clientes porque con el boca a boca 'te apañas'.",
                  "Esperas resultados sin cambiar absolutamente nada de cómo trabajas ahora."
                ].map((item, i) => (
                  <li key={i} className="flex items-start text-stone-600">
                    <span className="mr-3 text-red-400 mt-1">•</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            {/* SI es para ti */}
            <div className="p-10 rounded-2xl shadow-sm bg-white border border-emerald-200 relative overflow-hidden hover:shadow-lg transition-all duration-300">
              <div className="absolute top-0 left-0 w-1 h-full" style={{ backgroundColor: '#8CA48F' }}></div>
              <h4 className="text-2xl font-semibold mb-8 flex items-center" style={{ color: '#8CA48F' }}>
                <CheckCircle size={28} className="mr-3" />
                Pero SÍ es para ti si...
              </h4>
              <ul className="space-y-4">
                {[
                  "Quieres ordenar tu negocio de una vez por todas.",
                  "Buscas una herramienta pensaba solo para profesionales, no genérica.",
                  "Necesitas visibilidad real sin depender de redes sociales.",
                  "Quieres cobrar y trabajar con una imagen más profesional.",
                  "Te importa tu tiempo, tu energía y el valor de tu consulta."
                ].map((item, i) => (
                  <li key={i} className="flex items-start text-stone-600">
                    <CheckCircle size={18} className="mr-3 mt-1 flex-shrink-0" style={{ color: '#8CA48F' }} />
                    {item}
                  </li>
                ))}
              </ul>
              <div className="mt-10 text-center">
                <button
                  className="w-full py-4 rounded-full text-white font-semibold text-lg shadow-md hover:shadow-lg hover:scale-105 transition-all duration-300"
                  style={{ backgroundColor: '#8CA48F' }}
                >
                  Empieza hoy con Dhara
                </button>
                <p className="mt-3 text-sm text-stone-500">Pon orden en tu negocio y deja que la plataforma trabaje para ti.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* After 30 Days Section */}
      <section className="py-32 px-6 lg:px-8 bg-white">
        <div className="mx-auto max-w-7xl">
          <div className="text-center mb-20">
            <h3 className="text-4xl font-bold mb-6">¿Qué pasa cuando usas Dhara durante más de 30 días?</h3>
            <p className="text-xl text-stone-600 max-w-3xl mx-auto leading-relaxed">
              No pasa magia. Pasa algo mejor: orden y fluidez.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            <div className="space-y-10">
              <div className="flex gap-6 group">
                <div className="w-14 h-14 rounded-2xl bg-orange-50 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                  <Calendar size={28} className="text-orange-600" />
                </div>
                <div>
                  <h4 className="text-xl font-semibold mb-2">Tu agenda deja de dominarte</h4>
                  <p className="text-stone-600 leading-relaxed mb-2">Ya no buscas mensajes antiguos. Todo está en tu agenda, claro y automático.</p>
                  <p className="font-medium text-sm" style={{ color: '#8CA48F' }}>Empiezas el día sabiendo exactamente qué tienes.</p>
                </div>
              </div>

              <div className="flex gap-6 group">
                <div className="w-14 h-14 rounded-2xl bg-emerald-50 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                  <MessageSquare size={28} className="text-emerald-600" />
                </div>
                <div>
                  <h4 className="text-xl font-semibold mb-2">Dejas de vivir pegado al WhatsApp</h4>
                  <p className="text-stone-600 leading-relaxed mb-2">Tus clientes reservan y consultan sin invadir tu vida personal.</p>
                  <p className="font-medium text-sm" style={{ color: '#8CA48F' }}>Sin urgencias absurdas. Tú marcas el ritmo.</p>
                </div>
              </div>

              <div className="flex gap-6 group">
                <div className="w-14 h-14 rounded-2xl bg-blue-50 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                  <Award size={28} className="text-blue-600" />
                </div>
                <div>
                  <h4 className="text-xl font-semibold mb-2">Tu consulta se siente profesional</h4>
                  <p className="text-stone-600 leading-relaxed mb-2">Tus clientes perciben orden y confianza con tus servicios bien definidos.</p>
                  <p className="font-medium text-sm" style={{ color: '#8CA48F' }}>Y eso se nota en cómo te valoran.</p>
                </div>
              </div>
            </div>

            <div className="space-y-10">
              <div className="flex gap-6 group">
                <div className="w-14 h-14 rounded-2xl bg-purple-50 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                  <Users size={28} className="text-purple-600" />
                </div>
                <div>
                  <h4 className="text-xl font-semibold mb-2">Recibes clientes cualificados</h4>
                  <p className="text-stone-600 leading-relaxed mb-2">Personas que buscan terapia por ubicación y valoraciones reales.</p>
                  <p className="font-medium text-sm" style={{ color: '#8CA48F' }}>No seguidores. Más sesiones.</p>
                </div>
              </div>

              <div className="flex gap-6 group">
                <div className="w-14 h-14 rounded-2xl bg-pink-50 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                  <BarChart3 size={28} className="text-pink-600" />
                </div>
                <div>
                  <h4 className="text-xl font-semibold mb-2">Control total de ingresos</h4>
                  <p className="text-stone-600 leading-relaxed mb-2">Sabes qué vendes, cuánto facturas y qué funciona mejor.</p>
                  <p className="font-medium text-sm" style={{ color: '#8CA48F' }}>Sin hojas de Excel ni cálculos mentales.</p>
                </div>
              </div>

              <div className="flex gap-6 group">
                <div className="w-14 h-14 rounded-2xl bg-yellow-50 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                  <Zap size={28} className="text-yellow-600" />
                </div>
                <div>
                  <h4 className="text-xl font-semibold mb-2">Sientes que fluyes</h4>
                  <p className="text-stone-600 leading-relaxed mb-2">Sin caos. Sin improvisar. Todo en un mismo lugar.</p>
                  <p className="font-medium text-sm" style={{ color: '#8CA48F' }}>Recuperas el control de tu negocio.</p>
                </div>
              </div>
            </div>
          </div>
          <div className="mt-16 text-center">
            <button
              className="px-10 py-5 rounded-full text-white font-semibold text-lg shadow-md hover:shadow-lg hover:scale-105 transition-all duration-300 inline-flex items-center gap-3"
              style={{ backgroundColor: '#8CA48F' }}
            >
              Vive el cambio ahora <ArrowRight size={20} />
            </button>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-32 px-6 lg:px-8 bg-gradient-to-br from-[#F3EEE9] to-white">
        <div className="mx-auto max-w-7xl">
          <div className="text-center mb-20">
            <h3 className="text-4xl font-bold mb-6">Planes de suscripción que se adaptan a ti</h3>
            <p className="text-xl text-stone-600 max-w-3xl mx-auto leading-relaxed">
              Elige el plan perfecto para tu práctica. Todos sin permanencia.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {pricingPlans.map((plan, index) => (
              <div
                key={index}
                className={`p-8 rounded-2xl shadow-sm bg-white border relative hover:shadow-xl transition-all duration-300 ${plan.popular ? 'ring-2 ring-emerald-200 border-emerald-200 scale-105' : 'border-stone-200'}`}
              >
                {plan.popular && (
                  <div
                    className="absolute -top-4 left-1/2 transform -translate-x-1/2 px-6 py-2 rounded-full text-sm font-semibold text-white shadow-lg"
                    style={{ backgroundColor: '#8CA48F' }}
                  >
                    Más Popular
                  </div>
                )}

                <div className="text-center mb-8">
                  <h4 className="text-2xl font-bold mb-2">Plan {plan.name}</h4>
                  <p className="text-sm mb-4" style={{ color: plan.color }}>{plan.description}</p>
                  <div className="flex items-baseline justify-center mb-4">
                    <span className="text-4xl font-bold" style={{ color: plan.color }}>
                      {plan.price}
                    </span>
                    <span className="text-lg text-stone-500 ml-1">{plan.period}</span>
                  </div>
                  <p className="text-stone-600 text-sm leading-relaxed">{plan.subtitle}</p>
                </div>

                <p className="text-sm font-semibold mb-4 text-stone-700">Incluye:</p>
                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-start">
                      <CheckCircle size={18} style={{ color: plan.color }} className="mr-3 flex-shrink-0 mt-0.5" />
                      <span className="text-sm text-stone-600">{feature}</span>
                    </li>
                  ))}
                </ul>

                <p className="text-xs text-stone-500 mb-6 text-center">{plan.note}</p>

                <button
                  className={`w-full py-4 rounded-full font-semibold transition-all duration-300 hover:scale-105 ${plan.popular ? 'text-white shadow-lg' : 'border-2'}`}
                  style={plan.popular
                    ? { backgroundColor: plan.color }
                    : { borderColor: plan.color, color: plan.color }
                  }
                >
                  {plan.cta}
                </button>
              </div>
            ))}
          </div>
          <p className="text-center mt-8 text-sm text-stone-500">
            Todos los planes son mensuales, sin permanencia y sin comisiones. Puedes cambiar o cancelar cuando lo necesites.
          </p>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="py-32 px-6 lg:px-8 bg-white">
        <div className="mx-auto max-w-4xl">
          <div className="text-center mb-20">
            <h3 className="text-4xl font-bold mb-6">Preguntas Frecuentes</h3>
            <p className="text-xl text-stone-600">
              Resolvemos las dudas más comunes sobre Dhara
            </p>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <div key={index} className="border border-stone-200 rounded-2xl overflow-hidden bg-white shadow-sm hover:shadow-md transition-all duration-300">
                <button
                  className="w-full px-8 py-6 text-left flex items-center justify-between hover:bg-stone-50 transition-colors"
                  onClick={() => setOpenFaq(openFaq === index ? null : index)}
                >
                  <span className="font-semibold text-lg pr-4">{faq.question}</span>
                  {openFaq === index ? (
                    <ChevronUp size={24} style={{ color: '#8CA48F' }} className="flex-shrink-0" />
                  ) : (
                    <ChevronDown size={24} style={{ color: '#8CA48F' }} className="flex-shrink-0" />
                  )}
                </button>
                {openFaq === index && (
                  <div className="px-8 pb-6">
                    <p className="text-stone-600 leading-relaxed">{faq.answer}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-32 px-6 lg:px-8 bg-gradient-to-br from-[#F3EEE9] to-[#F8F5F2]">
        <div className="mx-auto max-w-5xl text-center">
          <h3 className="text-4xl font-bold mb-8">
            Dhara es el impulso que estabas esperando. Únete hoy.
          </h3>
          <div className="text-lg text-stone-600 mb-12 max-w-4xl mx-auto space-y-6 leading-relaxed">
            <p>
              Sabemos que el mayor reto de quienes trabajan en las terapias naturales no es solo dar lo mejor de sí en cada sesión,
              sino ser reconocidos, valorados y encontrados por las personas que realmente necesitan lo que ofrecen.
            </p>
            <p>
              Dhara nace para cambiar eso: aquí tu talento tiene un espacio propio, sin comisiones injustas ni favoritismos.
            </p>
            <p className="font-semibold text-xl">
              Únete hoy y da el paso hacia una comunidad que reconoce tu valor y te conecta con quienes esperan tu ayuda.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
            <button
              onClick={() => setShowUneteModal(true)}
              className="px-12 py-5 rounded-full text-white font-semibold text-lg hover:shadow-xl hover:scale-105 transition-all duration-300 flex items-center gap-3 shadow-lg"
              style={{ backgroundColor: '#8CA48F' }}
            >
              Únete a Dhara Hoy
              <ArrowRight size={20} />
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-20 px-6 lg:px-8 border-t border-stone-200 bg-white">
        <div className="mx-auto max-w-7xl">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
            <div className="md:col-span-2">
              <h4 className="text-3xl font-bold mb-6" style={{ color: '#8CA48F' }}>Dhara</h4>
              <p className="text-stone-600 leading-relaxed mb-8 max-w-md">
                Dhara es la plataforma líder que conecta personas con profesionales certificados. Tu bienestar es nuestra prioridad.
              </p>
              <div className="space-y-3">
                <div className="flex items-center text-stone-600">
                  <Mail size={18} className="mr-3" />
                  info@dharadimensionhumana.es
                </div>
                <div className="flex items-center text-stone-600">
                  <Phone size={18} className="mr-3" />
                  +34 624071618
                </div>
              </div>
            </div>

            <div>
              <h5 className="font-semibold text-lg mb-6">Plataforma</h5>
              <ul className="space-y-3 text-stone-600">
                <li><a href="#" className="hover:text-emerald-600 transition-colors">Características</a></li>
                <li><a href="#" className="hover:text-emerald-600 transition-colors">Precios</a></li>
                <li><a href="#" className="hover:text-emerald-600 transition-colors">Seguridad</a></li>
                <li><a href="#" className="hover:text-emerald-600 transition-colors">Integraciones</a></li>
              </ul>
            </div>

            <div>
              <h5 className="font-semibold text-lg mb-6">Soporte</h5>
              <ul className="space-y-3 text-stone-600">
                <li><a href="#" className="hover:text-emerald-600 transition-colors">Centro de Ayuda</a></li>
                <li><a href="#" className="hover:text-emerald-600 transition-colors">Contacto</a></li>
                <li><button onClick={() => setShowTerminos(true)} className="hover:text-emerald-600 transition-colors">Términos de Uso</button></li>
                <li><button onClick={() => setShowPrivacidad(true)} className="hover:text-emerald-600 transition-colors">Privacidad</button></li>
              </ul>
            </div>
          </div>

          <div className="pt-8 border-t border-stone-200 flex flex-col md:flex-row justify-between items-center">
            <div className="text-stone-500 mb-4 md:mb-0">
              © 2024 Dhara. Todos los derechos reservados.
            </div>
            <div className="flex items-center space-x-2 text-stone-500">
              <span>Hecho con</span>
              <Heart size={18} style={{ color: '#8CA48F' }} />
              <span>para profesionales</span>
            </div>
          </div>
        </div>
      </footer>

      {/* Modales legales */}
      <PoliticaPrivacidad isOpen={showPrivacidad} onClose={() => setShowPrivacidad(false)} />
      <TerminosCondiciones isOpen={showTerminos} onClose={() => setShowTerminos(false)} />
      <UneteModal isOpen={showUneteModal} onClose={() => setShowUneteModal(false)} />
    </div>
  );
}

export default App;

import Seo from "@/components/seo/Seo";
import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Star, ChevronRight, Clock, MapPin, Truck, CreditCard, Utensils, Play, Pause } from "lucide-react";
import BaseLayout from "@/components/layout/BaseLayout";
import HeroCarousel from "@/components/landing/HeroVideoCarousel";
import BoxValueSection from "@/components/landing/BoxValueSection";
import AnimatedCounter from "@/components/ui/AnimatedCounter";
import RevealOnScroll from "@/components/ui/RevealOnScroll";

// Premium Images
import breakfastImg from "@/assets/imagenes_menu/des_breakfast-in-roma.jpg";
import boxlunchImg from "@/assets/food-boxlunch.jpg";
import lunchboxVideo from "@/assets/lunchbox.mp4.asset.json";
import coffeeAmImg from "@/assets/imagenes_menu/cb_coffee-break-am-cafe.jpg";

// Client logos
import logoAE from "@/assets/logos/clientesBerlioz_AE.png";
import logoAmex from "@/assets/logos/clientesBerlioz_Amex.png";
import logoAxxa from "@/assets/logos/clientesBerlioz_axxa.png";
import logoBalenciaga from "@/assets/logos/clientesBerlioz_balenciaga.png";
import logoBimbo from "@/assets/logos/clientesBerlioz_bimbo.png";
import logoGucci from "@/assets/logos/clientesBerlioz_gucci.png";
import logoHermanMiller from "@/assets/logos/clientesBerlioz_hermanmiller.png";
import logoIos from "@/assets/logos/clientesBerlioz_ios.png";
import logoKavak from "@/assets/logos/clientesBerlioz_kavak.png";
import logoMarriott from "@/assets/logos/clientesBerlioz_marriott.png";
import logoPepsico from "@/assets/logos/clientesBerlioz_pepsico.png";
import logoPrada from "@/assets/logos/clientesBerlioz_prada.png";
import logoShell from "@/assets/logos/clientesBerlioz_shell.png";
import logoWalmart from "@/assets/logos/clientesBerlioz_walmart.png";
import logoWework from "@/assets/logos/clientesBerlioz_wework.png";
import logoZebra from "@/assets/logos/clientesBerlioz_zebra.png";
import logoGrupoMex from "@/assets/logos/grupomex-1.png";

// Testimonial logos
import testimoniosEyAsset from "@/assets/logos/ey.png.asset.json";
import testimoniosPalmolive from "@/assets/logos/testimonios_palmolive.png";
import testimoniosIos from "@/assets/logos/clientesBerlioz_ios.png";
import logoDhl from "@/assets/logos/dhl.svg";

/* ── data ── */
const CLIENT_LOGOS = [
  { src: logoAE, alt: "American Eagle" },
  { src: logoAmex, alt: "American Express" },
  { src: logoAxxa, alt: "AXA" },
  { src: logoBalenciaga, alt: "Balenciaga" },
  { src: logoBimbo, alt: "Bimbo" },
  { src: logoGucci, alt: "Gucci" },
  { src: logoHermanMiller, alt: "Herman Miller" },
  { src: logoIos, alt: "IOS Offices" },
  { src: logoKavak, alt: "Kavak" },
  { src: logoMarriott, alt: "Marriott" },
  { src: logoPepsico, alt: "PepsiCo" },
  { src: logoPrada, alt: "Prada" },
  { src: logoShell, alt: "Shell" },
  { src: logoWalmart, alt: "Walmart" },
  { src: logoWework, alt: "WeWork" },
  { src: logoZebra, alt: "Zebra" },
  { src: logoGrupoMex, alt: "Grupo México" },
];

const OCCASIONS = [
  { category: "Desayuno", name: "DESAYUNO", subtitle: "desde $185 MXN por persona", image: breakfastImg },
  { category: "Coffee Break", name: "COFFEE BREAK", subtitle: "desde $145 MXN por persona", image: coffeeAmImg },
  { category: "Working Lunch", name: "WORKING LUNCH", subtitle: "desde $280 MXN por persona", image: boxlunchImg },
  { category: "Boxes económicas", name: "BOXES ECONÓMICAS", subtitle: <>por <em>menos</em> de $250 MXN por persona</>, image: boxlunchImg },
];

const STATS = [
  { label: "Años teniendo clientes felices", value: 11, prefix: "" },
  { label: "Comidas Entregadas", value: 500000, prefix: "+" },
  { label: "Empresas Internacionales", value: 500, prefix: "+" },
];

const FOOD_OPTIONS = [
  {
    title: "vegetariana",
    description: "Propuestas vegetarianas completas, equilibradas y llenas de sabor para tus reuniones corporativas.",
  },
  {
    title: "sin gluten",
    description: "Opciones sin gluten preparadas con ingredientes seleccionados, sin sacrificar sabor ni presentación.",
  },
  {
    title: "vegana",
    description: "Alternativas veganas frescas y completas, creadas exclusivamente con ingredientes de origen vegetal.",
  },
  {
    title: "keto",
    description: "Menús keto con bajo contenido de carbohidratos, pensados para mantener el sabor y el equilibrio.",
  },
  {
    title: "sin lácteos",
    description: "Preparaciones sin lácteos con ingredientes cuidadosamente elegidos para una experiencia deliciosa.",
  },
];

const TESTIMONIALS = [
  {
    quote: "¡WOW, me encanta! ¡Qué gran iniciativa y CALIDAD! Todo estaba delicioso, salado o dulce, la gente no paraba de comer. ¡Encontré lo que ustedes hacen y me enamoré!",
    name: "Jessica Pons",
    company: "Fundación Grupo México",
    role: "Directora",
    logo: logoGrupoMex,
  },
  {
    quote: "Berlioz nos salvó la junta de directivos — llegó todo perfecto, presentación impecable y la comida estaba increíble. La puntualidad es lo que más valoramos.",
    name: "Rocío Ornelas",
    company: "EY México",
    role: "Executive Assistant",
    logo: testimoniosEyAsset.url,
  },
  {
    quote: "Necesitábamos catering para un evento de última hora y Berlioz entregó en menos de 24 horas. Servicio excepcional y presentación muy profesional.",
    name: "Ana Lucía Torres",
    company: "DHL Logistics",
    role: "Project Manager",
    logo: logoDhl,
  },
];


/* ── Infinite Logo Carousel ── */
const LogoCarousel = () => {
  const renderLogos = (duplicate: boolean) =>
    CLIENT_LOGOS.map((logo, i) => (
      <img
        key={`${logo.alt}-${duplicate ? "dup" : "orig"}-${i}`}
        src={logo.src}
        alt={duplicate ? "" : logo.alt}
        aria-hidden={duplicate ? "true" : undefined}
        style={{ height: 48, width: 'auto', objectFit: 'contain', flexShrink: 0 }}
      />
    ));

  return (
    <div className="relative overflow-hidden" style={{ height: 80 }}>
      <div
        className="flex items-center gap-20 animate-scroll-logos"
        style={{ width: 'max-content' }}
      >
        {renderLogos(false)}
        {renderLogos(true)}
      </div>
    </div>
  );
};

/* ── component ── */
const HomePage = () => {
  const navigate = useNavigate();
  const lunchboxVideoRef = useRef<HTMLVideoElement>(null);
  const [lunchboxPlaying, setLunchboxPlaying] = useState(false);
  const [lunchboxRequested, setLunchboxRequested] = useState(false);
  const [foodOptionIndex, setFoodOptionIndex] = useState(0);
  const [foodOptionVisible, setFoodOptionVisible] = useState(true);

  useEffect(() => {
    const interval = window.setInterval(() => {
      setFoodOptionVisible(false);
      window.setTimeout(() => {
        setFoodOptionIndex((current) => (current + 1) % FOOD_OPTIONS.length);
        setFoodOptionVisible(true);
      }, 500);
    }, 3000);

    return () => window.clearInterval(interval);
  }, []);

  const toggleLunchboxPlay = () => {
    const video = lunchboxVideoRef.current;
    if (!video) return;
    if (video.paused) {
      if (!lunchboxRequested) {
        setLunchboxRequested(true);
        video.src = lunchboxVideo.url;
        video.load();
      }
      video.play().catch(() => {});
      setLunchboxPlaying(true);
    } else {
      video.pause();
      setLunchboxPlaying(false);
    }
  };

  return (
    <BaseLayout>
      <Seo title="Catering corporativo y box lunch en CDMX | Berlioz" description="Desayunos, coffee breaks y working lunch gourmet para empresas en CDMX y Área Metropolitana. Pide antes de las 3 pm para el día siguiente." path="/" jsonLd={{
  "@context": "https://schema.org", "@type": "FoodEstablishment", name: "Berlioz", url: "https://berlioz.mx",
  telephone: "+52 55 8237 5469", email: "hola@berlioz.mx",
  address: { "@type": "PostalAddress", addressLocality: "Miguel Hidalgo", addressRegion: "CDMX", postalCode: "11450", addressCountry: "MX" },
  areaServed: "Ciudad de México y Área Metropolitana",
  sameAs: ["https://www.facebook.com/BerliozMx", "https://www.instagram.com/berliozmx/", "https://mx.linkedin.com/company/berlioz", "https://www.youtube.com/channel/UCSLphReV4_CNOSBaL8Xf7jg"],
}} />
      {/* ═══ SECTION 1 — HERO CAROUSEL ═══ */}
      <div style={{ marginTop: -76 }}>
        <HeroCarousel />
      </div>

      {/* ═══ TRUST BAR ═══ */}
      <section style={{ background: '#014D6F', padding: '20px 0 12px 0' }}>
        <div className="max-w-5xl mx-auto px-6 grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { icon: Clock, title: "Pide antes de las 3pm", desc: "Para entrega al día siguiente" },
            { icon: CreditCard, title: "Paga en línea", desc: "Compra mínima $1,000 MXN" },
            { icon: MapPin, title: "Entrega en CDMX", desc: "Y Área Metropolitana" },
          ].map(({ icon: Icon, title, desc }) => (
            <div key={title} className="flex flex-col items-center text-center" style={{ gap: 8 }}>
              <Icon style={{ width: 28, height: 28, color: 'white' }} />
              <span style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 700, fontSize: 14, color: 'white', textTransform: 'uppercase' as const }}>{title}</span>
              <span style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 400, fontSize: 12, color: 'rgba(255,255,255,0.8)' }}>{desc}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ═══ MENU BY OCCASION ═══ */}
      <section className="py-20 bg-background" aria-labelledby="home-menu-heading">
        <div className="max-w-6xl mx-auto px-6">
          <h2 id="home-menu-heading" className="font-heading text-[36px] text-foreground text-center mb-12">¿Qué vas a pedir hoy?</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {OCCASIONS.map((o) => (
              <a
                key={o.category}
                href={`/menu?categoria=${encodeURIComponent(o.category)}`}
                className="group bg-card rounded-lg border border-border overflow-hidden flex flex-col transition-colors duration-300 hover:bg-primary hover:border-primary focus-visible:bg-primary focus-visible:border-primary"
              >
                <div className="h-44 overflow-hidden">
                  <img src={o.image} alt={o.name} className="w-full h-full object-cover" loading="lazy" decoding="async" />
                </div>
                <div className="p-5 flex flex-col flex-1">
                  <h3 className="font-body font-bold text-foreground text-base group-hover:text-primary-foreground group-focus-visible:text-primary-foreground transition-colors">{o.name}</h3>
                  <p className="font-body text-sm text-secondary mt-1 mb-4 group-hover:text-primary-foreground group-focus-visible:text-primary-foreground transition-colors">{o.subtitle}</p>
                  <span className="mt-auto self-end inline-flex min-h-11 items-center gap-1 rounded-full bg-primary px-4 font-body text-xs font-bold text-primary-foreground group-hover:bg-primary-foreground group-hover:text-primary group-focus-visible:bg-primary-foreground group-focus-visible:text-primary transition-colors">
                    VER MENÚ <ChevronRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </a>
            ))}
          </div>
        </div>
      </section>

      <BoxValueSection />

      {/* ═══ SECTION — BERLIOZ LUNCH BOX ═══ */}
      <section className="relative w-full overflow-hidden py-16 md:py-24" style={{ backgroundColor: '#F2DDD5' }}>
        <div className="max-w-7xl mx-auto px-6 md:px-12">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-16 items-center">
            <RevealOnScroll>
              <div>
                <h2 className="font-heading text-4xl sm:text-5xl md:text-6xl mb-6 tracking-tight leading-[1.05] text-primary">BERLIOZ <br className="hidden sm:block"/> LUNCH BOX</h2>
                <p className="font-body text-lg md:text-xl mb-8 leading-relaxed text-muted-foreground">Berlioz ofrece productos de tipo gourmet para tus reuniones, coffee breaks, desayunos y eventos. Todo servido en empaques biodegradables pero con una calidad y presentación inigualables.</p>
                <p className="font-heading text-xl md:text-2xl italic text-secondary font-medium leading-tight">&ldquo;Crea experiencias en tu oficina con BERLIOZ. Comida fantástica desde 2015.&rdquo;</p>
              </div>
            </RevealOnScroll>

            <RevealOnScroll delay={200}>
              <div className="relative rounded-[32px] overflow-hidden shadow-2xl bg-black/5 group">
                <video
                  ref={lunchboxVideoRef}
                  poster={boxlunchImg}
                  muted
                  loop
                  playsInline
                  preload="none"
                  onClick={toggleLunchboxPlay}
                  onPlay={() => setLunchboxPlaying(true)}
                  onPause={() => setLunchboxPlaying(false)}
                  className="w-full h-full object-cover cursor-pointer"
                />
                {!lunchboxPlaying && (
                  <button
                    type="button"
                    onClick={toggleLunchboxPlay}
                    className="absolute inset-0 flex items-center justify-center bg-black/20 transition-colors hover:bg-black/30"
                    aria-label="Reproducir video"
                  >
                    <span className="w-16 h-16 rounded-full bg-white/90 flex items-center justify-center text-primary shadow-lg">
                      <Play className="w-7 h-7 ml-1" />
                    </span>
                  </button>
                )}
                <div className="absolute bottom-4 left-4 flex items-center gap-2 opacity-0 transition-opacity duration-300 group-hover:opacity-100 focus-within:opacity-100">
                  <button
                    type="button"
                    onClick={toggleLunchboxPlay}
                    className="w-10 h-10 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center text-primary shadow-lg hover:bg-white transition-colors"
                    aria-label={lunchboxPlaying ? "Pausar video" : "Reproducir video"}
                  >
                    {lunchboxPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
                  </button>
                </div>
              </div>
            </RevealOnScroll>
          </div>
        </div>
      </section>

      {/* ═══ SECTION 5 — SOCIAL PROOF ═══ */}
      <section className="py-24 bg-white border-y border-border">
        <div className="max-w-6xl mx-auto px-6">
          <RevealOnScroll>
            <h2 className="font-heading text-4xl md:text-[64px] md:leading-[1.1] text-primary mb-4 min-h-[1.2em]">
              Opción{" "}
              <span className={`text-secondary italic inline-block transition-all duration-500 transform ${foodOptionVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"}`}>
                {FOOD_OPTIONS[foodOptionIndex].title}
              </span>
            </h2>
            <p className={`font-body text-muted-foreground text-lg mb-12 max-w-2xl mx-auto transition-opacity duration-500 ${foodOptionVisible ? "opacity-100" : "opacity-0"}`}>
              {FOOD_OPTIONS[foodOptionIndex].description}
            </p>
          </RevealOnScroll>

          {/* Stats */}
          <div className="flex flex-wrap justify-center gap-12 md:gap-32 mt-16 mb-24 py-16 border-y border-border/40">
            {STATS.map((s, i) => (
              <RevealOnScroll key={s.label} delay={i * 200}>
                <div className="text-center group">
                  <div className="flex justify-center mb-1">
                    <div className="text-[44px] md:text-[68px] font-heading font-black tracking-tighter text-primary">
                      <AnimatedCounter end={s.value} prefix={s.prefix} />
                    </div>
                  </div>
                  <p className="font-body text-[12px] text-muted-foreground uppercase tracking-[0.3em] font-bold group-hover:text-secondary transition-colors duration-300">{s.label}</p>
                </div>
              </RevealOnScroll>
            ))}
          </div>

          {/* Testimonials */}
          <RevealOnScroll delay={600}>
            <h2 className="font-heading text-4xl md:text-5xl text-foreground mb-16 mt-24 text-center">Lo que dicen nuestros clientes</h2>
          </RevealOnScroll>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {TESTIMONIALS.map((t) => (
              <div key={t.name} className="flex flex-col h-full bg-card border border-border/60 shadow-sm rounded-3xl p-8 hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                <div className="flex-1">
                  <div className="flex gap-0.5 mb-6">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-3.5 h-3.5 fill-primary text-primary" />
                    ))}
                  </div>
                  <p className="font-body text-[17px] text-foreground leading-[1.6] mb-10 italic">&ldquo;{t.quote}&rdquo;</p>
                </div>
                <div className="mt-auto flex items-center gap-4">
                  <div
                    className="rounded-full border-2 border-border/40 shadow-sm flex items-center justify-center bg-white"
                    style={{ width: 52, height: 52, flexShrink: 0 }}
                  >
                    <img
                      src={t.logo}
                      alt={t.company}
                      className="object-contain"
                      style={{ width: 32, height: 32 }}
                    />
                  </div>
                  <div>
                    <p className="font-body text-base font-bold text-foreground">{t.name}</p>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <span className="font-body text-sm">{t.company}</span>
                      <span className="w-1 h-1 rounded-full bg-border" />
                      <span className="font-body text-[13px]">{t.role}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Client Logos Carousel */}
           <div className="mt-20 pt-16 border-t border-border/50">
            <p className="text-center font-body text-[11px] text-muted-foreground uppercase tracking-[0.2em] mb-10">
              EMPRESAS QUE HAN PROBADO COMIDA FANTÁSTICA
            </p>
            <LogoCarousel />
          </div>
        </div>
      </section>

    </BaseLayout>
  );
};

export default HomePage;

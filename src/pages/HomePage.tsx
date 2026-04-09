import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Star, ChevronRight, Clock, MapPin, Truck, CreditCard, Utensils } from "lucide-react";
import BaseLayout from "@/components/layout/BaseLayout";
import HeroCarousel from "@/components/landing/HeroCarousel";
import AnimatedCounter from "@/components/ui/AnimatedCounter";
import RevealOnScroll from "@/components/ui/RevealOnScroll";
import WordRotator from "@/components/ui/WordRotator";

// Premium Images
import breakfastImg from "@/assets/imagenes_menu/des_breakfast-in-roma.jpg";
import boxlunchImg from "@/assets/food-boxlunch.jpg";
import coffeeAmImg from "@/assets/imagenes_menu/cb_coffee-break-am-cafe.jpg";
import coffeePmImg from "@/assets/imagenes_menu/cb_coffee-break-pm.jpg";
import juntaImg from "@/assets/imagenes_menu/wl_comedor-berlioz.jpg";
import veganoImg from "@/assets/imagenes_menu/veg_pink-box-vegana.jpg";

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
import testimoniosPepsico from "@/assets/logos/testimonios_pepsico.png";
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

const OCCASIONS: { id: string; name: string; price: number; emoji: string; image?: string }[] = [
  { id: "desayuno", name: "Desayuno de trabajo", price: 185, emoji: "🍳", image: breakfastImg },
  { id: "coffee_am", name: "Coffee Break AM", price: 145, emoji: "☕", image: coffeeAmImg },
  { id: "coffee_pm", name: "Coffee Break PM", price: 145, emoji: "🍪", image: coffeePmImg },
  { id: "working_lunch", name: "Working Lunch", price: 280, emoji: "🍱", image: boxlunchImg },
  { id: "junta", name: "Junta Ejecutiva", price: 350, emoji: "💼", image: juntaImg },
  { id: "vegano", name: "Pedido Vegano", price: 240, emoji: "🌱", image: veganoImg },
];

const STATS = [
  { label: "Clientes Felices", value: 2500 },
  { label: "Comidas Entregadas", value: 500000 },
  { label: "Empresas Internacionales", value: 500 },
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
    logo: testimoniosPepsico,
  },
  {
    quote: "Necesitábamos catering para un evento de última hora y Berlioz entregó en menos de 24 horas. Servicio excepcional y presentación muy profesional.",
    name: "Ana Lucía Torres",
    company: "DHL Logistics",
    role: "Project Manager",
    logo: logoDhl,
  },
];

const STEPS = [
  { icon: Utensils, title: "Elige tu menú", desc: "Explora opciones por tipo de evento o arma tu pedido desde el catálogo completo." },
  { icon: Clock, title: "Selecciona fecha y horario", desc: "Elige cuándo y a qué hora necesitas tu entrega. Disponibilidad en tiempo real." },
  { icon: Truck, title: "Lo entregamos en tu oficina", desc: "Llegamos puntuales con todo listo para servir. Sin complicaciones." },
];

/* ── Infinite Logo Carousel ── */
const LogoCarousel = () => {
  const doubled = [...CLIENT_LOGOS, ...CLIENT_LOGOS];

  return (
    <div className="relative overflow-hidden" style={{ height: 80 }}>
      <div
        className="flex items-center gap-20 animate-scroll-logos"
        style={{ width: 'max-content' }}
      >
        {doubled.map((logo, i) => (
          <img
            key={`${logo.alt}-${i}`}
            src={logo.src}
            alt={logo.alt}
            style={{ height: 48, width: 'auto', objectFit: 'contain', flexShrink: 0 }}
          />
        ))}
      </div>
    </div>
  );
};

/* ── component ── */
const HomePage = () => {
  const navigate = useNavigate();

  return (
    <BaseLayout>
      {/* ═══ SECTION 1 — HERO CAROUSEL ═══ */}
      <div style={{ marginTop: -68 }}>
        <HeroCarousel />
      </div>

      {/* ═══ SECTION 2 — TRUST BAR ═══ */}
      <section style={{ background: '#014D6F', padding: '24px 0' }}>
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

      {/* ═══ SECTION 3 — MENU BY OCCASION ═══ */}
      <section className="py-20 bg-background">
        <div className="max-w-6xl mx-auto px-6">
          <h2 className="font-heading text-[36px] text-foreground text-center mb-2">¿Qué necesitas hoy?</h2>
          <p className="font-body text-muted-foreground text-center mb-12 text-base">Selecciona el tipo de momento</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {OCCASIONS.map((o) => (
              <a
                key={o.id}
                href={`/menu?occasion=${o.id}`}
                className="group relative bg-card rounded-2xl border border-border overflow-hidden flex flex-col transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-primary/10 hover:border-primary/20"
              >
                <span className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-primary to-secondary opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                {o.image ? (
                  <div className="relative h-44 overflow-hidden">
                    <img src={o.image} alt={o.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                    <span className="absolute bottom-3 right-3 w-10 h-10 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center text-2xl shadow">{o.emoji}</span>
                  </div>
                ) : (
                  <div className="h-44 bg-gradient-to-br from-muted/80 to-muted flex items-center justify-center">
                    <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary/10 to-secondary/10 flex items-center justify-center text-5xl shadow-inner transition-transform duration-300 group-hover:scale-110">{o.emoji}</div>
                  </div>
                )}
                <div className="p-5 flex flex-col flex-1">
                  <h3 className="font-body font-semibold text-foreground text-base">{o.name}</h3>
                  <p className="font-body text-sm text-secondary mt-1 mb-4">desde ${o.price} por persona</p>
                  <div className="mt-auto flex items-center justify-between">
                    <span className="inline-flex items-center gap-1 font-body text-xs font-semibold text-primary/80 group-hover:text-primary transition-colors">
                      Ver opciones <ChevronRight className="w-3.5 h-3.5 transition-transform duration-200 group-hover:translate-x-0.5" />
                    </span>
                    <span className="text-[10px] font-mono font-medium text-muted-foreground bg-muted px-2 py-0.5 rounded-full">desde ${o.price}/pp</span>
                  </div>
                </div>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ SECTION — BERLIOZ LUNCH BOX ═══ */}
      <section className="relative w-full overflow-hidden">
        <div className="aspect-[1/1] md:aspect-[16/7] relative w-full overflow-hidden">
          <img src={boxlunchImg} alt="Berlioz Lunch Box Experience" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-black/5" />
          <div className="absolute inset-0 flex items-center">
            <div className="max-w-7xl mx-auto px-6 md:px-12 w-full flex justify-center md:justify-start">
              <RevealOnScroll>
                <div className="bg-white p-8 md:p-14 rounded-[40px] shadow-2xl max-w-xl md:ml-12 backdrop-blur-sm bg-white/95">
                  <span className="inline-block px-4 py-1.5 rounded-full bg-primary/5 text-primary text-[10px] sm:text-xs font-bold tracking-[0.3em] uppercase mb-6">Experiencia Signature</span>
                  <h2 className="font-heading text-4xl sm:text-5xl md:text-6xl mb-6 tracking-tight leading-[1.05] text-primary">BERLIOZ <br className="hidden sm:block"/> LUNCH BOX</h2>
                  <p className="font-body text-lg md:text-xl mb-10 leading-relaxed text-muted-foreground">Para tus juntas y eventos, Berlioz ofrece una comida gourmet de tres tiempos, servida en una elegante caja práctica y sofisticada.</p>
                  <p className="font-heading text-xl md:text-2xl italic text-secondary font-medium leading-tight">&ldquo;Consiente a tus invitados con esta experiencia sensorial.&rdquo;</p>
                </div>
              </RevealOnScroll>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ SECTION 5 — SOCIAL PROOF ═══ */}
      <section className="py-24 bg-white border-y border-border">
        <div className="max-w-6xl mx-auto px-6">
          <RevealOnScroll>
            <h2 className="font-heading text-4xl md:text-[64px] md:leading-[1.1] text-primary mb-4 min-h-[1.2em]">
              Opción <WordRotator words={["vegetariana", "sin glúten", "vegana", "keto", "sin lácteos"]} className="text-secondary italic" duration={3000} />
            </h2>
            <p className="font-body text-muted-foreground text-lg mb-12 max-w-2xl mx-auto">Calidad y sabor que transforman tus reuniones corporativas sin dejar de lado lo saludable</p>
          </RevealOnScroll>

          {/* Stats */}
          <div className="flex flex-wrap justify-center gap-12 md:gap-32 mt-16 mb-24 py-16 border-y border-border/40">
            {STATS.map((s, i) => (
              <RevealOnScroll key={s.label} delay={i * 200}>
                <div className="text-center group">
                  <div className="flex justify-center mb-1">
                    <div className="text-[44px] md:text-[68px] font-heading font-black tracking-tighter text-primary">
                      <AnimatedCounter end={s.value} />
                    </div>
                  </div>
                  <p className="font-body text-[12px] text-muted-foreground uppercase tracking-[0.3em] font-bold group-hover:text-secondary transition-colors duration-300">{s.label}</p>
                </div>
              </RevealOnScroll>
            ))}
          </div>

          {/* Testimonials */}
          <RevealOnScroll delay={600}>
            <h3 className="font-heading text-4xl md:text-5xl text-foreground mb-16 mt-24 text-center">Lo que dicen nuestros clientes</h3>
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
                    <h4 className="font-body text-base font-bold text-foreground">{t.name}</h4>
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
              EMPRESAS QUE HAN DISFRUTADO DE NUESTRO CATERING
            </p>
            <LogoCarousel />
          </div>
        </div>
      </section>

      {/* ═══ SECTION 6 — HOW IT WORKS ═══ */}
      <section className="py-20 bg-background">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="font-heading text-[36px] text-foreground mb-3">Así de fácil</h2>
          <p className="font-body text-muted-foreground text-sm mb-14">Desde tu pantalla hasta tu sala de juntas, en minutos</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
            <div className="hidden md:flex absolute items-center gap-1.5" style={{ top: "1.75rem", left: "33.33%", transform: "translate(-50%, -50%)" }}>
              {[0, 1, 2].map((i) => <span key={i} className="w-1.5 h-1.5 rounded-full bg-primary/25" />)}
            </div>
            <div className="hidden md:flex absolute items-center gap-1.5" style={{ top: "1.75rem", left: "66.66%", transform: "translate(-50%, -50%)" }}>
              {[0, 1, 2].map((i) => <span key={i} className="w-1.5 h-1.5 rounded-full bg-primary/25" />)}
            </div>
            {STEPS.map((s, i) => (
              <div key={i} className="flex flex-col items-center">
                <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mb-4 shadow-[0_0_0_8px_hsl(var(--primary)/0.06)] transition-all duration-300 hover:bg-primary/15 hover:shadow-[0_0_0_10px_hsl(var(--primary)/0.08)]">
                  <s.icon className="w-6 h-6 text-primary" />
                </div>
                <span className="inline-block font-mono text-[10px] font-semibold text-primary-foreground bg-primary px-2.5 py-0.5 rounded-full mb-3">Paso {i + 1}</span>
                <h3 className="font-body font-semibold text-foreground text-base mb-2">{s.title}</h3>
                <p className="font-body text-sm text-muted-foreground leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </BaseLayout>
  );
};

export default HomePage;

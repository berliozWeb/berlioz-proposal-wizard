import { Phone, Mail, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import contactBg from "@/assets/contacto-bg.jpg";
import RevealOnScroll from "@/components/ui/RevealOnScroll";

const ContactSection = () => (
  <section id="contacto" className="relative w-full overflow-hidden">
    <div className="relative w-full" style={{ minHeight: 480 }}>
      {/* Background image */}
      <img
        src={contactBg}
        alt="Oficina Berlioz"
        className="absolute inset-0 w-full h-full object-cover"
      />
      {/* Light warm overlay */}
      <div className="absolute inset-0" style={{ background: 'rgba(0,0,0,0.15)' }} />

      <div className="relative max-w-6xl mx-auto px-6 flex items-center justify-end h-full" style={{ minHeight: 480 }}>
        <RevealOnScroll>
          <div
            className="bg-white/95 backdrop-blur-sm rounded-3xl shadow-2xl"
            style={{ padding: '48px 56px', maxWidth: 420 }}
          >
            <h2
              style={{
                fontFamily: "'Montserrat', sans-serif",
                fontWeight: 300,
                fontSize: 42,
                color: '#014D6F',
                letterSpacing: '0.08em',
                marginBottom: 28,
              }}
            >
              CONTACTO
            </h2>

            <a
              href="tel:5582375469"
              className="block hover:opacity-80 transition-opacity"
              style={{
                fontFamily: "'Montserrat', sans-serif",
                fontWeight: 700,
                fontSize: 28,
                color: '#014D6F',
                textDecoration: 'none',
                marginBottom: 8,
              }}
            >
              55 8237 5469
            </a>

            <a
              href="mailto:hola@berlioz.mx"
              className="block hover:opacity-80 transition-opacity"
              style={{
                fontFamily: "'Montserrat', sans-serif",
                fontWeight: 400,
                fontSize: 20,
                color: '#6B8A99',
                textDecoration: 'none',
                marginBottom: 28,
              }}
            >
              hola@berlioz.mx
            </a>

            <Link
              to="/cotizar"
              className="inline-flex items-center gap-2 transition-all hover:opacity-90"
              style={{
                height: 44,
                padding: '0 32px',
                borderRadius: 6,
                background: '#014D6F',
                color: 'white',
                fontFamily: "'Montserrat', sans-serif",
                fontWeight: 600,
                fontSize: 14,
                letterSpacing: '0.12em',
                textDecoration: 'none',
                textTransform: 'uppercase' as const,
              }}
            >
              COTIZAR
              <ArrowRight style={{ width: 16, height: 16 }} />
            </Link>
          </div>
        </RevealOnScroll>
      </div>
    </div>
  </section>
);

export default ContactSection;

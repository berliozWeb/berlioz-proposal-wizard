import { Link } from "react-router-dom";
import { Phone, Instagram, Mail, ArrowRight } from "lucide-react";

const Footer = () => (
  <footer style={{ background: '#014D6F', color: 'white' }}>
    {/* ── CTA strip ── */}
    <div style={{ borderBottom: '1px solid rgba(255,255,255,0.12)' }}>
      <div className="max-w-7xl mx-auto px-6 py-10 flex flex-col sm:flex-row items-center justify-between gap-6">
        <div>
          <h3 style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 700, fontSize: 24, color: '#EDD9C8', marginBottom: 4 }}>¿Listo para cotizar?</h3>
          <p style={{ fontFamily: "'Montserrat', sans-serif", fontSize: 14, color: 'rgba(255,255,255,0.6)' }}>
            Recibe una propuesta personalizada en minutos, sin compromiso.
          </p>
        </div>
        <Link
          to="/cotizar"
          className="shrink-0 inline-flex items-center gap-2 hover:opacity-90 transition-opacity"
          style={{ height: 44, padding: '0 28px', borderRadius: 6, background: '#EDD9C8', color: '#014D6F', fontFamily: "'Montserrat', sans-serif", fontWeight: 600, fontSize: 14, textDecoration: 'none' }}
        >
          Cotizar ahora
          <ArrowRight style={{ width: 16, height: 16 }} />
        </Link>
      </div>
    </div>

    {/* ── main columns ── */}
    <div className="max-w-7xl mx-auto px-6 py-16">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
        {/* Brand */}
        <div className="md:col-span-1">
          <span style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 700, fontSize: 18, color: '#EDD9C8', letterSpacing: '0.15em', display: 'block', marginBottom: 16 }}>BERLIOZ</span>
          <p style={{ fontFamily: "'Montserrat', sans-serif", fontSize: 14, color: 'rgba(255,255,255,0.6)', lineHeight: 1.7 }}>
            Catering corporativo premium en Ciudad de México. Desayunos, coffee breaks y working lunches.
          </p>
        </div>

        {/* Nav */}
        <div>
          <h4 style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 600, fontSize: 12, color: 'rgba(255,255,255,0.5)', letterSpacing: '0.15em', textTransform: 'uppercase' as const, marginBottom: 16, paddingBottom: 8, borderBottom: '1px solid rgba(255,255,255,0.12)' }}>
            Navegar
          </h4>
          <ul className="space-y-2.5">
            {[
              { to: "/menu", label: "Realizar Pedido" },
              { to: "/cotizar", label: "Cotizar evento" },
              { to: "/#recompensas", label: "Recompensas" },
            ].map((link) => (
              <li key={link.to}>
                <Link to={link.to} className="transition-colors" style={{ fontFamily: "'Montserrat', sans-serif", fontSize: 14, color: 'rgba(255,255,255,0.7)', textDecoration: 'none' }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = '#EDD9C8'; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.7)'; }}
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Company */}
        <div>
          <h4 style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 600, fontSize: 12, color: 'rgba(255,255,255,0.5)', letterSpacing: '0.15em', textTransform: 'uppercase' as const, marginBottom: 16, paddingBottom: 8, borderBottom: '1px solid rgba(255,255,255,0.12)' }}>
            Empresa
          </h4>
          <ul className="space-y-2.5">
            {["Nosotros", "Términos", "Privacidad"].map((label) => (
              <li key={label}>
                <span style={{ fontFamily: "'Montserrat', sans-serif", fontSize: 14, color: 'rgba(255,255,255,0.6)', cursor: 'default' }}>
                  {label}
                </span>
              </li>
            ))}
          </ul>
        </div>

        {/* Contact */}
        <div>
          <h4 style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 600, fontSize: 12, color: 'rgba(255,255,255,0.5)', letterSpacing: '0.15em', textTransform: 'uppercase' as const, marginBottom: 16, paddingBottom: 8, borderBottom: '1px solid rgba(255,255,255,0.12)' }}>
            Contacto
          </h4>
          <ul className="space-y-3">
            <li>
              <a href="tel:5582375469" className="group flex items-center gap-3 transition-colors" style={{ fontFamily: "'Montserrat', sans-serif", fontSize: 14, color: 'rgba(255,255,255,0.7)', textDecoration: 'none' }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = '#EDD9C8'; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.7)'; }}
              >
                <span className="flex items-center justify-center shrink-0" style={{ width: 32, height: 32, borderRadius: '50%', background: 'rgba(255,255,255,0.1)' }}>
                  <Phone style={{ width: 14, height: 14 }} />
                </span>
                55 8237 5469
              </a>
            </li>
            <li>
              <a href="mailto:hola@berlioz.mx" className="group flex items-center gap-3 transition-colors" style={{ fontFamily: "'Montserrat', sans-serif", fontSize: 14, color: 'rgba(255,255,255,0.7)', textDecoration: 'none' }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = '#EDD9C8'; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.7)'; }}
              >
                <span className="flex items-center justify-center shrink-0" style={{ width: 32, height: 32, borderRadius: '50%', background: 'rgba(255,255,255,0.1)' }}>
                  <Mail style={{ width: 14, height: 14 }} />
                </span>
                hola@berlioz.mx
              </a>
            </li>
            <li>
              <a href="https://instagram.com/berlioz.mx" target="_blank" rel="noopener noreferrer" className="group flex items-center gap-3 transition-colors" style={{ fontFamily: "'Montserrat', sans-serif", fontSize: 14, color: 'rgba(255,255,255,0.7)', textDecoration: 'none' }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = '#EDD9C8'; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.7)'; }}
              >
                <span className="flex items-center justify-center shrink-0" style={{ width: 32, height: 32, borderRadius: '50%', background: 'rgba(255,255,255,0.1)' }}>
                  <Instagram style={{ width: 14, height: 14 }} />
                </span>
                @berlioz.mx
              </a>
            </li>
          </ul>
        </div>
      </div>

      <div style={{ marginTop: 48, paddingTop: 24, borderTop: '1px solid rgba(255,255,255,0.12)' }}>
        <p style={{ fontFamily: "'Montserrat', sans-serif", fontSize: 12, color: 'rgba(255,255,255,0.5)', textAlign: 'center' }}>
          © {new Date().getFullYear()} Berlioz. Todos los derechos reservados. Ciudad de México.
        </p>
      </div>
    </div>
  </footer>
);

export default Footer;

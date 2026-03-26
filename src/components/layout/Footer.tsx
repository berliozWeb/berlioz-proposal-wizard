import { Link } from "react-router-dom";
import { Phone, Instagram, Mail, ArrowRight } from "lucide-react";
import berliozLogo from "@/assets/berlioz-logo.png";

const Footer = () => (
  <footer className="bg-primary text-primary-foreground">
    {/* ── CTA strip ── */}
    <div className="border-b border-primary-foreground/10">
      <div className="max-w-7xl mx-auto px-6 py-10 flex flex-col sm:flex-row items-center justify-between gap-6">
        <div>
          <h3 className="font-heading text-2xl text-primary-foreground mb-1">¿Listo para cotizar?</h3>
          <p className="font-body text-sm text-primary-foreground/60">
            Recibe una propuesta personalizada en minutos, sin compromiso.
          </p>
        </div>
        <Link
          to="/cotizar"
          className="shrink-0 inline-flex items-center gap-2 h-11 px-7 rounded-full bg-primary-foreground text-primary font-body font-semibold text-sm hover:bg-primary-foreground/90 hover:shadow-lg transition-all duration-200"
        >
          Cotizar ahora
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </div>

    {/* ── main columns ── */}
    <div className="max-w-7xl mx-auto px-6 py-16">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
        {/* Brand */}
        <div className="md:col-span-1">
          <img src={berliozLogo} alt="Berlioz" className="h-6 brightness-0 invert mb-4" />
          <p className="font-body text-sm text-primary-foreground/60 leading-relaxed">
            Catering corporativo premium en Ciudad de México. Desayunos, coffee breaks y working lunches.
          </p>
        </div>

        {/* Nav */}
        <div>
          <h4 className="font-body font-semibold text-sm mb-4 pb-2 border-b border-primary-foreground/15 tracking-wide uppercase text-primary-foreground/50">
            Navegar
          </h4>
          <ul className="space-y-2.5">
            {[
              { to: "/menu", label: "Menú" },
              { to: "/cotizar", label: "Cotizar evento" },
              { to: "/dashboard/recompensas", label: "Recompensas" },
            ].map((link) => (
              <li key={link.to}>
                <Link
                  to={link.to}
                  className="font-body text-sm text-primary-foreground/60 hover:text-primary-foreground transition-colors"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Company */}
        <div>
          <h4 className="font-body font-semibold text-sm mb-4 pb-2 border-b border-primary-foreground/15 tracking-wide uppercase text-primary-foreground/50">
            Empresa
          </h4>
          <ul className="space-y-2.5">
            {["Nosotros", "Términos", "Privacidad"].map((label) => (
              <li key={label}>
                <span className="font-body text-sm text-primary-foreground/60 cursor-default">
                  {label}
                </span>
              </li>
            ))}
          </ul>
        </div>

        {/* Contact */}
        <div>
          <h4 className="font-body font-semibold text-sm mb-4 pb-2 border-b border-primary-foreground/15 tracking-wide uppercase text-primary-foreground/50">
            Contacto
          </h4>
          <ul className="space-y-3">
            <li>
              <a
                href="tel:5582375469"
                className="group flex items-center gap-3 font-mono text-sm text-primary-foreground/60 hover:text-primary-foreground transition-colors"
              >
                <span className="w-8 h-8 rounded-full bg-primary-foreground/10 flex items-center justify-center group-hover:bg-primary-foreground/20 transition-colors shrink-0">
                  <Phone className="w-3.5 h-3.5" />
                </span>
                55 8237 5469
              </a>
            </li>
            <li>
              <a
                href="mailto:hola@berlioz.mx"
                className="group flex items-center gap-3 font-body text-sm text-primary-foreground/60 hover:text-primary-foreground transition-colors"
              >
                <span className="w-8 h-8 rounded-full bg-primary-foreground/10 flex items-center justify-center group-hover:bg-primary-foreground/20 transition-colors shrink-0">
                  <Mail className="w-3.5 h-3.5" />
                </span>
                hola@berlioz.mx
              </a>
            </li>
            <li>
              <a
                href="https://instagram.com/berlioz.mx"
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-center gap-3 font-body text-sm text-primary-foreground/60 hover:text-primary-foreground transition-colors"
              >
                <span className="w-8 h-8 rounded-full bg-primary-foreground/10 flex items-center justify-center group-hover:bg-primary-foreground/20 transition-colors shrink-0">
                  <Instagram className="w-3.5 h-3.5" />
                </span>
                @berlioz.mx
              </a>
            </li>
          </ul>
        </div>
      </div>

      <div className="mt-12 pt-6 border-t border-primary-foreground/10">
        <p className="font-body text-xs text-primary-foreground/30 text-center">
          © {new Date().getFullYear()} Berlioz. Todos los derechos reservados. Ciudad de México.
        </p>
      </div>
    </div>
  </footer>
);

export default Footer;
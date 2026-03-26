import { Link } from "react-router-dom";
import { Phone, Instagram, Mail } from "lucide-react";
import berliozLogo from "@/assets/berlioz-logo.png";

const Footer = () => (
  <footer className="bg-primary text-primary-foreground">
    <div className="max-w-7xl mx-auto px-6 py-16">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
        {/* Brand */}
        <div className="md:col-span-1">
          <img src={berliozLogo} alt="Berlioz" className="h-6 brightness-0 invert mb-4" />
          <p className="font-body text-sm text-primary-foreground/70 leading-relaxed">
            Catering corporativo premium en Ciudad de México. Desayunos, coffee breaks y working lunches.
          </p>
        </div>

        {/* Nav */}
        <div>
          <h4 className="font-body font-semibold text-sm mb-4 tracking-wide uppercase text-primary-foreground/50">
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
                  className="font-body text-sm text-primary-foreground/70 hover:text-primary-foreground transition-colors"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Company */}
        <div>
          <h4 className="font-body font-semibold text-sm mb-4 tracking-wide uppercase text-primary-foreground/50">
            Empresa
          </h4>
          <ul className="space-y-2.5">
            {["Nosotros", "Términos", "Privacidad"].map((label) => (
              <li key={label}>
                <span className="font-body text-sm text-primary-foreground/70 cursor-default">
                  {label}
                </span>
              </li>
            ))}
          </ul>
        </div>

        {/* Contact */}
        <div>
          <h4 className="font-body font-semibold text-sm mb-4 tracking-wide uppercase text-primary-foreground/50">
            Contacto
          </h4>
          <ul className="space-y-3">
            <li>
              <a
                href="tel:5582375469"
                className="flex items-center gap-2 font-mono text-sm text-primary-foreground/70 hover:text-primary-foreground transition-colors"
              >
                <Phone className="w-4 h-4" />
                55 8237 5469
              </a>
            </li>
            <li>
              <a
                href="mailto:hola@berlioz.mx"
                className="flex items-center gap-2 font-body text-sm text-primary-foreground/70 hover:text-primary-foreground transition-colors"
              >
                <Mail className="w-4 h-4" />
                hola@berlioz.mx
              </a>
            </li>
            <li>
              <a
                href="https://instagram.com/berlioz.mx"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 font-body text-sm text-primary-foreground/70 hover:text-primary-foreground transition-colors"
              >
                <Instagram className="w-4 h-4" />
                @berlioz.mx
              </a>
            </li>
          </ul>
        </div>
      </div>

      <div className="mt-12 pt-6 border-t border-primary-foreground/10">
        <p className="font-body text-xs text-primary-foreground/40 text-center">
          © {new Date().getFullYear()} Berlioz. Todos los derechos reservados. Ciudad de México.
        </p>
      </div>
    </div>
  </footer>
);

export default Footer;
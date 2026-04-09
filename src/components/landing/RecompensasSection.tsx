import { Gift, Heart } from "lucide-react";
import RevealOnScroll from "@/components/ui/RevealOnScroll";

const TIERS = [
  { count: 1, label: "Una box de tu elección", icon: "🎁" },
  { count: 3, label: "Un bouquet de flores a tu oficina", icon: "💐" },
  { count: 5, label: "Un masaje de 90 min con SCAPE", icon: "💆" },
  { count: 7, label: "Un kit de productos de belleza MAKUA", icon: "✨" },
  { count: 10, label: "2 boletos de avión a una playa nacional", icon: "✈️" },
];

const RecompensasSection = () => (
  <section
    id="recompensas"
    className="relative py-24 overflow-hidden"
    style={{
      background: 'linear-gradient(180deg, #E8F2F6 0%, #F0F7FA 50%, #E8F2F6 100%)',
    }}
  >
    {/* Subtle decorative elements */}
    <div className="absolute top-8 right-8 opacity-10">
      <svg width="120" height="120" viewBox="0 0 120 120" fill="none">
        <path d="M60 10C60 10 80 30 80 50C80 70 60 90 60 90C60 90 40 70 40 50C40 30 60 10 60 10Z" stroke="#014D6F" strokeWidth="1" strokeDasharray="4 4" />
        <path d="M90 40L95 30L100 40" stroke="#014D6F" strokeWidth="1" />
        <line x1="97" y1="30" x2="97" y2="15" stroke="#014D6F" strokeWidth="1" strokeDasharray="3 3" />
      </svg>
    </div>

    <div className="max-w-4xl mx-auto px-6 text-center">
      <RevealOnScroll>
        <h2
          style={{
            fontFamily: "'Montserrat', sans-serif",
            fontWeight: 300,
            fontSize: 42,
            color: '#014D6F',
            letterSpacing: '0.08em',
            marginBottom: 8,
          }}
        >
          PROGRAMA DE RECOMPENSAS
        </h2>
        <p
          style={{
            fontFamily: "'Montserrat', sans-serif",
            fontWeight: 700,
            fontSize: 14,
            color: '#014D6F',
            letterSpacing: '0.15em',
            textTransform: 'uppercase' as const,
            marginBottom: 32,
          }}
        >
          BERLIOZ TE LLEVA DE VIAJE
        </p>
      </RevealOnScroll>

      <RevealOnScroll delay={100}>
        <p
          style={{
            fontFamily: "'Montserrat', sans-serif",
            fontSize: 16,
            color: '#4A4A4A',
            lineHeight: 1.8,
            maxWidth: 520,
            margin: '0 auto 48px',
            fontStyle: 'italic',
          }}
        >
          Entre más nos ayudes a crecer nuestra comunidad de Berlioz fan,
          los regalos se volverán cada vez más fantásticos.<br />
          <strong style={{ fontStyle: 'normal' }}>Acumula recomendaciones:</strong>
        </p>
      </RevealOnScroll>

      {/* Tiers */}
      <div className="space-y-6 max-w-lg mx-auto">
        {TIERS.map((tier, i) => (
          <RevealOnScroll key={tier.count} delay={150 + i * 100}>
            <div
              className="flex items-center gap-5 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg"
              style={{
                background: 'white',
                borderRadius: 16,
                padding: '16px 24px',
                border: '1px solid #E2D3CA',
                boxShadow: '0 2px 8px rgba(1,77,111,0.06)',
              }}
            >
              {/* Count badge */}
              <div
                className="shrink-0 flex items-center justify-center"
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: '50%',
                  background: '#EDD9C8',
                  fontFamily: "'Montserrat', sans-serif",
                  fontWeight: 700,
                  fontSize: 18,
                  color: '#014D6F',
                }}
              >
                {tier.count}
              </div>

              {/* People icons */}
              <div className="hidden sm:flex items-end gap-0.5 shrink-0" style={{ minWidth: tier.count * 16 }}>
                {Array.from({ length: tier.count }).map((_, j) => (
                  <Heart
                    key={j}
                    style={{
                      width: 14,
                      height: 14,
                      color: '#014D6F',
                      opacity: 0.6 + j * 0.04,
                    }}
                  />
                ))}
              </div>

              {/* Label */}
              <span
                className="text-left flex-1"
                style={{
                  fontFamily: "'Montserrat', sans-serif",
                  fontSize: 14,
                  color: '#014D6F',
                  fontWeight: 500,
                }}
              >
                = {tier.label}
              </span>

              {/* Emoji */}
              <span className="text-2xl shrink-0">{tier.icon}</span>
            </div>
          </RevealOnScroll>
        ))}
      </div>
    </div>
  </section>
);

export default RecompensasSection;

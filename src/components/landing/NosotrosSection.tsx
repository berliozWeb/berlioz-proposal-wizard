import anneImg from "@/assets/anne-seguy.jpg";
import RevealOnScroll from "@/components/ui/RevealOnScroll";

const NosotrosSection = () => (
  <section className="py-24 bg-white">
    <div className="max-w-6xl mx-auto px-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-start">
        {/* Left — Text */}
        <RevealOnScroll>
          <div>
            <h2
              style={{
                fontFamily: "'Montserrat', sans-serif",
                fontWeight: 300,
                fontSize: 48,
                color: '#014D6F',
                letterSpacing: '0.06em',
                marginBottom: 32,
              }}
            >
              NOSOTROS
            </h2>

            <p
              style={{
                fontFamily: "'Montserrat', sans-serif",
                fontSize: 16,
                color: '#4A4A4A',
                lineHeight: 1.8,
                marginBottom: 24,
              }}
            >
              Quisimos reinventar el concepto del <strong>working lunch</strong> transformándolo en una experiencia agradable, ofreciendo un <strong>producto gourmet</strong>, práctico de comer <strong>en una junta</strong> y muy fácil de pedir.
            </p>

            <p
              style={{
                fontFamily: "'Montserrat', sans-serif",
                fontSize: 15,
                color: '#6B8A99',
                lineHeight: 1.8,
                marginBottom: 24,
                fontStyle: 'italic',
              }}
            >
              "Al llegar a su junta o evento, nuestros clientes quedan sorprendidos por la presentación de la caja, y piensan que se trata de un regalo"
            </p>

            <p
              style={{
                fontFamily: "'Montserrat', sans-serif",
                fontSize: 16,
                color: '#4A4A4A',
                lineHeight: 1.8,
              }}
            >
              Desde el menú personalizado en cada box hasta la flor colocada en la servilleta, el cliente disfruta una experiencia premium, <strong>como si un chef hubiera cocinado para él</strong>.
            </p>
          </div>
        </RevealOnScroll>

        {/* Right — Photo + El Efecto Fantástico */}
        <RevealOnScroll delay={200}>
          <div>
            <img
              src={anneImg}
              alt="Anne Seguy - Fundadora de Berlioz"
              className="w-full rounded-2xl shadow-lg mb-8"
              style={{ maxHeight: 440, objectFit: 'cover' }}
            />

            <h3
              style={{
                fontFamily: "'Montserrat', sans-serif",
                fontWeight: 300,
                fontSize: 38,
                color: '#014D6F',
                letterSpacing: '0.04em',
                lineHeight: 1.1,
                marginBottom: 16,
              }}
            >
              EL EFECTO<br />FANTÁSTICO
            </h3>

            <p
              style={{
                fontFamily: "'Montserrat', sans-serif",
                fontSize: 15,
                color: '#4A4A4A',
                lineHeight: 1.8,
              }}
            >
              Berlioz es también el reflejo de dos culturas. Su dueña, Anne Seguy, es francesa, lleva 18 años en México y su pasión por la buena comida se transmite en las <strong>recetas franco mexicanas</strong> que ofrece la marca.
            </p>
          </div>
        </RevealOnScroll>
      </div>
    </div>
  </section>
);

export default NosotrosSection;

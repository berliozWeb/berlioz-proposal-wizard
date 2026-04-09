import { useState, useEffect, useCallback } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import heroCateringImg from "@/assets/hero-catering-corporativo.png";
import heroIngredientesImg from "@/assets/hero-ingredientes.png";
import heroGreenBoxImg from "@/assets/hero-green-box.png";
import heroLunchBoxImg from "@/assets/hero-lunch-box.png";
import heroPiropoImg from "@/assets/hero-piropo.jpg";
import heroEmpaquesImg from "@/assets/hero-empaques.jpg";

const SLIDES = [
  {
    image: heroCateringImg,
    line1: "DESAYUNO · COFFEE BREAK · WORKING LUNCH",
    line2: "EN TU SALA DE JUNTAS",
    overlay: "rgba(0, 120, 180, 0.18)",
  },
  {
    image: heroIngredientesImg,
    line1: "INGREDIENTES",
    line2: "CUIDADOSAMENTE SELECCIONADOS",
    overlay: "rgba(80, 140, 60, 0.15)",
  },
  {
    image: heroEmpaquesImg,
    line1: "EMPAQUES",
    line2: "BIODEGRADABLES",
    overlay: "rgba(0, 140, 160, 0.16)",
  },
  {
    image: heroGreenBoxImg,
    line1: "GREEN BOX",
    line2: "LIGERA, VERDE, DELICIOSA",
    overlay: "rgba(40, 130, 60, 0.12)",
  },
  {
    image: heroLunchBoxImg,
    line1: "LUNCH BOX",
    line2: "GOURMET",
    overlay: "rgba(180, 100, 20, 0.14)",
  },
  {
    image: heroPiropoImg,
    line1: "PIROPO",
    line2: "TORTAS CON ONDA",
    overlay: "rgba(200, 80, 40, 0.18)",
  },
];

const HeroCarousel = () => {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % SLIDES.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  const go = useCallback((dir: number) => {
    setCurrent((prev) => (prev + dir + SLIDES.length) % SLIDES.length);
  }, []);

  return (
    <div style={{ position: "relative", width: "100%", height: "100vh", overflow: "hidden" }}>
      {SLIDES.map((slide, i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            inset: 0,
            opacity: i === current ? 1 : 0,
            transition: "opacity 0.8s ease",
            pointerEvents: i === current ? "auto" : "none",
          }}
        >
          <img
            src={slide.image}
            alt=""
            style={{
              position: "absolute",
              inset: 0,
              width: "100%",
              height: "100%",
              objectFit: "cover",
              objectPosition: "center",
            }}
          />
          <div style={{ position: "absolute", inset: 0, background: slide.overlay }} />
          <div
            style={{
              position: "absolute",
              inset: 0,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              textAlign: "center",
              padding: "0 40px",
            }}
          >
            <p
              style={{
                fontFamily: "'Montserrat', sans-serif",
                fontSize: "clamp(28px, 5vw, 64px)",
                fontWeight: 700,
                color: "white",
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                lineHeight: 1.2,
                margin: "0 0 16px",
                textShadow: "0 2px 16px rgba(0,0,0,0.45), 0 1px 4px rgba(0,0,0,0.3)",
              }}
            >
              {slide.line1}
            </p>
            <p
              style={{
                fontFamily: "'Montserrat', sans-serif",
                fontSize: "clamp(14px, 2vw, 24px)",
                fontWeight: 300,
                color: "rgba(255,255,255,0.9)",
                letterSpacing: "0.25em",
                textTransform: "uppercase",
                margin: 0,
                textShadow: "0 2px 12px rgba(0,0,0,0.35), 0 1px 3px rgba(0,0,0,0.2)",
              }}
            >
              {slide.line2}
            </p>
          </div>
        </div>
      ))}

      {/* Arrows */}
      <button
        onClick={() => go(-1)}
        aria-label="Previous slide"
        style={{
          position: "absolute",
          left: 16,
          top: "50%",
          transform: "translateY(-50%)",
          width: 40,
          height: 40,
          borderRadius: "50%",
          background: "rgba(255,255,255,0.25)",
          border: "none",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: "pointer",
          zIndex: 10,
          backdropFilter: "blur(4px)",
        }}
      >
        <ChevronLeft size={24} color="white" />
      </button>
      <button
        onClick={() => go(1)}
        aria-label="Next slide"
        style={{
          position: "absolute",
          right: 16,
          top: "50%",
          transform: "translateY(-50%)",
          width: 40,
          height: 40,
          borderRadius: "50%",
          background: "rgba(255,255,255,0.25)",
          border: "none",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: "pointer",
          zIndex: 10,
          backdropFilter: "blur(4px)",
        }}
      >
        <ChevronRight size={24} color="white" />
      </button>

      {/* Dots */}
      <div
        style={{
          position: "absolute",
          bottom: 24,
          left: "50%",
          transform: "translateX(-50%)",
          display: "flex",
          gap: 8,
          zIndex: 10,
        }}
      >
        {SLIDES.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrent(i)}
            aria-label={`Go to slide ${i + 1}`}
            style={{
              width: 8,
              height: 8,
              borderRadius: "50%",
              border: "1.5px solid white",
              background: i === current ? "white" : "rgba(255,255,255,0.4)",
              cursor: "pointer",
              padding: 0,
              transition: "background 0.3s",
            }}
          />
        ))}
      </div>
    </div>
  );
};

export default HeroCarousel;

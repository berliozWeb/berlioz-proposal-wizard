import { useState, useEffect, useCallback, useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const BUCKET = `${SUPABASE_URL}/storage/v1/object/public/hero-videos`;

const SLIDES = [
  {
    video: `${BUCKET}/hero-1-overhead-pan.mp4`,
    line1: "DESAYUNO · COFFEE BREAK · WORKING LUNCH",
    line2: "EN TU SALA DE JUNTAS",
    overlay: "rgba(0, 77, 111, 0.35)",
  },
  {
    video: `${BUCKET}/hero-2-hands-rotating.mp4`,
    line1: "ARTESANAL",
    line2: "HECHO CON LAS MANOS",
    overlay: "rgba(0, 77, 111, 0.30)",
  },
  {
    video: `${BUCKET}/hero-3-cinematic-push.mp4`,
    line1: "CATERING CORPORATIVO",
    line2: "PREMIUM · EDITORIAL · CDMX",
    overlay: "rgba(0, 77, 111, 0.35)",
  },
];

const HeroVideoCarousel = () => {
  const [current, setCurrent] = useState(0);
  const videoRefs = useRef<(HTMLVideoElement | null)[]>([]);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % SLIDES.length);
    }, 7000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    videoRefs.current.forEach((v, i) => {
      if (!v) return;
      if (i === current) {
        v.currentTime = 0;
        v.play().catch(() => {});
      } else {
        v.pause();
      }
    });
  }, [current]);

  const go = useCallback((dir: number) => {
    setCurrent((prev) => (prev + dir + SLIDES.length) % SLIDES.length);
  }, []);

  return (
    <div style={{ position: "relative", width: "100%", height: "100vh", overflow: "hidden", background: "#000" }}>
      {SLIDES.map((slide, i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            inset: 0,
            opacity: i === current ? 1 : 0,
            transition: "opacity 1s ease",
            pointerEvents: i === current ? "auto" : "none",
          }}
        >
          <video
            ref={(el) => (videoRefs.current[i] = el)}
            src={slide.video}
            autoPlay={i === 0}
            muted
            loop
            playsInline
            preload={i === 0 ? "auto" : "metadata"}
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
                textShadow: "0 2px 16px rgba(0,0,0,0.55), 0 1px 4px rgba(0,0,0,0.4)",
              }}
            >
              {slide.line1}
            </p>
            <p
              style={{
                fontFamily: "'Montserrat', sans-serif",
                fontSize: "clamp(14px, 2vw, 24px)",
                fontWeight: 300,
                color: "rgba(255,255,255,0.95)",
                letterSpacing: "0.25em",
                textTransform: "uppercase",
                margin: 0,
                textShadow: "0 2px 12px rgba(0,0,0,0.45), 0 1px 3px rgba(0,0,0,0.3)",
              }}
            >
              {slide.line2}
            </p>
          </div>
        </div>
      ))}

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

export default HeroVideoCarousel;
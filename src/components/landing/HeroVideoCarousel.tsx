import { useState, useEffect, useCallback, useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const BUCKET = `${SUPABASE_URL}/storage/v1/object/public/hero-videos`;

const SLIDES = [
  {
    video: `${BUCKET}/hero-1-overhead-pan.mp4`,
    lines: ["COMIDA FANTÁSTICA", "PARA JUNTAS CON ESTILO"],
    overlay: "rgba(0, 77, 111, 0.35)",
    cta: null as null | { label: string; to: string },
  },
  {
    video: `${BUCKET}/hero-2-hands-rotating.mp4`,
    lines: ["EL WORKING LUNCH", "QUE TU EQUIPO MERECE"],
    overlay: "rgba(0, 77, 111, 0.30)",
    cta: null as null | { label: string; to: string },
  },
  {
    video: `${BUCKET}/hero-3-cinematic-push.mp4`,
    lines: ["FESTEJA EL MUNDIAL", "CON BERLIOZ"],
    overlay: "rgba(0, 77, 111, 0.35)",
    cta: { label: "Ver menú →", to: "/menu" },
  },
];

const HeroVideoCarousel = () => {
  const [current, setCurrent] = useState(0);
  const videoRefs = useRef<(HTMLVideoElement | null)[]>([]);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % SLIDES.length);
    }, 10000);
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
              {slide.lines.map((l, idx) => (
                <span key={idx} style={{ display: "block" }}>{l}</span>
              ))}
            </p>
            {slide.cta && (
              <Link
                to={slide.cta.to}
                style={{
                  marginTop: 32,
                  display: "inline-block",
                  padding: "16px 36px",
                  background: "#EDD9C8",
                  color: "#014D6F",
                  fontFamily: "'Montserrat', sans-serif",
                  fontWeight: 700,
                  fontSize: 15,
                  letterSpacing: "0.12em",
                  textTransform: "uppercase",
                  textDecoration: "none",
                  borderRadius: 999,
                  boxShadow: "0 8px 24px rgba(0,0,0,0.25)",
                  transition: "transform 0.2s ease, box-shadow 0.2s ease",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "translateY(-2px)";
                  e.currentTarget.style.boxShadow = "0 12px 30px rgba(0,0,0,0.3)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow = "0 8px 24px rgba(0,0,0,0.25)";
                }}
              >
                {slide.cta.label}
              </Link>
            )}
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
import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Pause, Play } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import breakfastImg from "@/assets/imagenes_menu/des_breakfast-in-roma.jpg";
import coffeeAmImg from "@/assets/imagenes_menu/cb_coffee-break-am-cafe.jpg";
import coffeeVideo from "@/assets/hero-coffee-break-optimized.mp4.asset.json";
import breakfastVideo from "@/assets/hero-breakfast-optimized.mp4.asset.json";

const SLIDES = [
  { video: coffeeVideo.url, poster: coffeeAmImg, alt: "Coffee break corporativo" },
  { video: breakfastVideo.url, poster: breakfastImg, alt: "Desayuno corporativo Berlioz" },
];

type NavigatorWithConnection = Navigator & {
  connection?: { saveData?: boolean };
};

const HeroVideoCarousel = () => {
  const [current, setCurrent] = useState(0);
  const [paused, setPaused] = useState(false);
  const [useStaticImage, setUseStaticImage] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);
  const currentSlide = SLIDES[current];

  useEffect(() => {
    const mobileQuery = window.matchMedia("(max-width: 767px)");
    const reducedMotionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const updateMediaPreference = () => {
      const saveData = (navigator as NavigatorWithConnection).connection?.saveData === true;
      setUseStaticImage(mobileQuery.matches || reducedMotionQuery.matches || saveData);
      if (reducedMotionQuery.matches) setPaused(true);
    };

    updateMediaPreference();
    mobileQuery.addEventListener("change", updateMediaPreference);
    reducedMotionQuery.addEventListener("change", updateMediaPreference);
    return () => {
      mobileQuery.removeEventListener("change", updateMediaPreference);
      reducedMotionQuery.removeEventListener("change", updateMediaPreference);
    };
  }, []);

  useEffect(() => {
    if (paused) videoRef.current?.pause();
    else if (!useStaticImage) videoRef.current?.play().catch(() => {});
  }, [current, paused, useStaticImage]);

  useEffect(() => {
    if (paused) return;
    const timer = window.setInterval(() => {
      setCurrent((previous) => (previous + 1) % SLIDES.length);
    }, 10000);
    return () => window.clearInterval(timer);
  }, [paused]);

  const go = useCallback((direction: number) => {
    setCurrent((previous) => (previous + direction + SLIDES.length) % SLIDES.length);
  }, []);

  const togglePause = () => {
    setPaused((wasPaused) => !wasPaused);
  };

  return (
    <section className="relative h-[100svh] min-h-[620px] w-full overflow-hidden bg-foreground" aria-label="Berlioz catering corporativo">
      <img
        key={`poster-${current}`}
        src={currentSlide.poster}
        alt={currentSlide.alt}
        className="absolute inset-0 h-full w-full object-cover"
      />

      {!useStaticImage && (
        <video
          key={currentSlide.video}
          ref={videoRef}
          src={currentSlide.video}
          poster={currentSlide.poster}
          autoPlay={!paused}
          muted
          loop
          playsInline
          preload="metadata"
          onCanPlay={() => {
            if (!paused) videoRef.current?.play().catch(() => {});
          }}
          className="absolute inset-0 h-full w-full object-cover"
        />
      )}

      <div className="absolute inset-0 bg-foreground/45" aria-hidden="true" />

      <div className="absolute inset-0 z-10 flex items-center justify-center px-6 pb-12 pt-28 text-center md:px-12">
        <div className="max-w-4xl">
          <h1 className="font-heading text-4xl font-bold leading-tight text-primary-foreground sm:text-5xl md:text-6xl">
            Catering corporativo y box lunch en CDMX
          </h1>
          <p className="mx-auto mt-5 max-w-3xl font-body text-lg leading-relaxed text-primary-foreground sm:text-xl md:text-2xl">
            Desayuno, comida y coffee breaks para tus eventos y juntas de trabajo.
          </p>
          <div className="mt-8 flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:items-center">
            <Button asChild size="lg" variant="outline" className="min-w-44 border-primary-foreground/70 bg-background/10 text-primary-foreground backdrop-blur-sm hover:bg-background/20 hover:text-primary-foreground">
              <Link to="/cotizar">Cotizar evento</Link>
            </Button>
            <Button asChild size="lg" className="min-w-44 bg-accent text-accent-foreground hover:bg-accent/90">
              <Link to="/menu">Hacer pedido</Link>
            </Button>
          </div>
        </div>
      </div>

      <Button
        type="button"
        size="icon"
        variant="ghost"
        onClick={() => go(-1)}
        aria-label="Mostrar imagen anterior"
        className="absolute left-3 top-1/2 z-20 -translate-y-1/2 bg-background/15 text-primary-foreground backdrop-blur-sm hover:bg-background/25 hover:text-primary-foreground md:left-6"
      >
        <ChevronLeft />
      </Button>
      <Button
        type="button"
        size="icon"
        variant="ghost"
        onClick={() => go(1)}
        aria-label="Mostrar imagen siguiente"
        className="absolute right-3 top-1/2 z-20 -translate-y-1/2 bg-background/15 text-primary-foreground backdrop-blur-sm hover:bg-background/25 hover:text-primary-foreground md:right-6"
      >
        <ChevronRight />
      </Button>

      <div className="absolute bottom-5 left-1/2 z-20 flex -translate-x-1/2 items-center gap-2">
        <Button
          type="button"
          size="icon"
          variant="ghost"
          onClick={togglePause}
          aria-label={paused ? "Reanudar carrusel y video" : "Pausar carrusel y video"}
          aria-pressed={paused}
          className="mr-2 bg-background/15 text-primary-foreground backdrop-blur-sm hover:bg-background/25 hover:text-primary-foreground"
        >
          {paused ? <Play /> : <Pause />}
        </Button>
        {SLIDES.map((slide, index) => (
          <Button
            key={slide.video}
            type="button"
            size="icon"
            variant="ghost"
            onClick={() => setCurrent(index)}
            aria-label={`Mostrar fondo ${index + 1}`}
            aria-current={index === current ? "true" : undefined}
            className={`h-2 w-2 rounded-full border border-primary-foreground p-0 transition-colors hover:bg-primary-foreground ${
              index === current ? "bg-primary-foreground" : "bg-primary-foreground/30"
            }`}
          />
        ))}
      </div>
    </section>
  );
};

export default HeroVideoCarousel;
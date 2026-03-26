import { useEffect, useState } from "react";

interface WordRotatorProps {
  words: string[];
  duration?: number;
  className?: string;
}

const WordRotator = ({ words, duration = 2500, className = "" }: WordRotatorProps) => {
  const [index, setIndex] = useState(0);
  const [fade, setFade] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      setFade(false); // Start fading out
      
      setTimeout(() => {
        setIndex((prevIndex) => (prevIndex + 1) % words.length);
        setFade(true); // Start fading in
      }, 500); // Wait for fade-out before changing word
    }, duration);

    return () => clearInterval(interval);
  }, [words.length, duration]);

  return (
    <span
      className={`${className} inline-block transition-all duration-500 transform ${
        fade ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"
      }`}
    >
      {words[index]}
    </span>
  );
};

export default WordRotator;

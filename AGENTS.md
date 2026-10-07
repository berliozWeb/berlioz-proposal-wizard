# Project architecture rules

- The budget-box menu category is derived from active Woo mirror products with Box/Boxes in their name and a positive available starting price below its threshold; this avoids modifying Woo categories or stored data.

- Home-page background videos render one active media element only; mobile, Save-Data, and reduced-motion visitors receive static posters to minimize transfer and motion.
- Hero video delivery uses compressed, audio-free H.264 copies with fast-start metadata stored through the project asset flow; originals remain untouched to preserve source media.
- The Lunch Box video has no source until explicit play and always uses `preload="none"`; this prevents media download before user intent.- Las etiquetas SEO por página se manejan con react-helmet-async en un único componente Seo que agrega noindex fuera de berlioz.mx; por qué: un solo lugar controla indexación por dominio.

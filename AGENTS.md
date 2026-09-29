# Project architecture rules

- Home-page background videos render one active media element only; mobile, Save-Data, and reduced-motion visitors receive static posters to minimize transfer and motion.
- The Lunch Box video has no source until explicit play and always uses `preload="none"`; this prevents media download before user intent.- Las etiquetas SEO por página se manejan con react-helmet-async en un único componente Seo que agrega noindex fuera de berlioz.mx; por qué: un solo lugar controla indexación por dominio.

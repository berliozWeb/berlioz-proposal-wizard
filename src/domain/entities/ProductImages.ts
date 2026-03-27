/**
 * Local image URLs for all Berlioz products.
 * We use local assets from src/assets/imagenes_menu.
 * 
 * RULE: If a product has no match here, use FALLBACK_IMAGE.
 */

const getLocalImg = (name: string) => new URL(`../../assets/imagenes_menu/${name}`, import.meta.url).href;

export const FALLBACK_IMAGE = getLocalImg('cb_coffee-break-am-cafe.jpg');

/** Map of product IDs → Local URLs */
export const PRODUCT_IMAGES: Record<string, string> = {
  // ── COFFEE BREAK PAQUETES ──
  cb_am_cafe: getLocalImg('cb_coffee-break-am-cafe.jpg'),
  cb_am_jugo: getLocalImg('cb_coffee-break-am-jugo.jpg'),
  cb_pm: getLocalImg('cb_coffee-break-pm.jpg'),
  cafe_te_berlioz: getLocalImg('beb_cafe-te-berlioz.jpg'),

  // ── SURTIDOS ──
  surtido_camille: getLocalImg('cb_surtido-camille.jpg'),
  surtido_voltaire: getLocalImg('cb_surtido-voltaire.jpg'),
  surtido_hugo: getLocalImg('cb_surtido-hugo.jpg'),
  surtido_colette: getLocalImg('cb_surtido-colette.jpg'),
  surtido_balzac: getLocalImg('cb_surtido-balzac.jpg'),
  surtido_zadig: getLocalImg('cb_surtido-zadig.jpg'),
  surtido_snacks: getLocalImg('cb_surtido-de-snacks.jpg'),
  surtido_dulces_mexicanos: getLocalImg('cb_surtido-dulces-mexicanos.jpg'),
  mini_surtido_camille: getLocalImg('cb_mini-surtido-camille.jpg'),
  mini_surtido_voltaire: getLocalImg('cb_mini-surtido-voltaire.jpg'),
  mini_surtido_hugo: getLocalImg('cb_mini-surtido-hugo.jpg'),
  mini_surtido_colette: getLocalImg('cb_mini-surtido-colette.jpg'),
  mini_surtido_balzac: getLocalImg('cb_mini-surtido-balzac.jpg'),
  mini_surtido_zadig: getLocalImg('cb_mini-surtido-zadig.jpg'),

  // ── INDIVIDUALES COFFEE BREAK ──
  ensalada_fruta: getLocalImg('cb_ensalada-de-fruta.jpg'),
  crudites: getLocalImg('cb_crudites-con-limon.jpg'),
  yogurt_organico: getLocalImg('cb_yogurt-organico.jpg'),
  pan_dulce_individual: getLocalImg('cb_pan-dulce.jpg'),
  panque_naranja: getLocalImg('cb_panque-de-naranja.jpg'),
  panque_pera: getLocalImg('cb_panque-de-pera.jpg'),
  cookies: getLocalImg('cb_cookies.jpg'),
  paleta_hielo: getLocalImg('cb_paleta-de-hielo.jpg'),
  mix_semillas: getLocalImg('cb_mix-de-semillas.jpg'),
  ensalada_pepino: getLocalImg('cb_ensalada-de-pepino.jpg'),
  ensalada_jicama: getLocalImg('cb_ensalada-de-jicama.jpg'),
  snack_bag: getLocalImg('cb_snack-bag.jpg'),
  snack_individual: getLocalImg('cb_snack.jpg'),

  // ── DESAYUNO ──
  desayuno_berlioz: getLocalImg('des_desayuno-berlioz.jpg'),
  box_chilaquiles_verdes_huevo: getLocalImg('des_box-chilaquiles-verdes-huevo.jpg'),
  box_chilaquiles_verdes_pollo: getLocalImg('des_box-chilaquiles-verdes-pollo.jpg'),
  box_chilaquiles_rojos_huevo: getLocalImg('des_box-chilaquiles-rojos-huevo.jpg'),
  box_chilaquiles_rojos_pollo: getLocalImg('des_box-chilaquiles-rojos-pollo.jpg'),
  breakfast_roma: getLocalImg('des_breakfast-in-roma.jpg'),
  breakfast_london: getLocalImg('des_breakfast-london.jpg'),
  breakfast_montreal: getLocalImg('des_breakfast-in-montreal.jpg'),
  breakfast_madrid: getLocalImg('des_breakfast-in-madrid.jpg'),
  healthy_breakfast: getLocalImg('des_healthy-breakfast.jpg'),
  breakfast_blt: getLocalImg('des_breakfast-blt.jpg'),
  breakfast_bag_pavo: getLocalImg('des_breakfast-bag-pavo.jpg'),
  breakfast_bag_especial: getLocalImg('des_breakfast-bag.jpg'),
  breakfast_roma_vegetariano: getLocalImg('des_breakfast-in-roma-vegetariano.jpg'),
  breakfast_london_vegetariano: getLocalImg('des_breakfast-london-vegetariano.jpg'),
  breakfast_vegano: getLocalImg('des_breakfast-vegano.jpg'),

  // ── WORKING LUNCH PREMIUM ──
  salmon_box: getLocalImg('wl_salmon-box.jpg'),
  pink_box: getLocalImg('wl_pink-box.jpg'),
  black_box: getLocalImg('wl_black-box.jpg'),
  golden_box: getLocalImg('wl_golden-box.jpg'),
  blt_box: getLocalImg('wl_blt-box.jpg'),
  aqua_box: getLocalImg('wl_aqua-box.jpg'),
  green_box: getLocalImg('wl_green-box.jpg'),
  white_box: getLocalImg('wl_white-box.jpg'),
  orzo_pasta_salad_box: getLocalImg('wl_orzo-pasta-salad-box.jpg'),
  salad_box_pollo: getLocalImg('wl_salad-box-pollo.jpg'),
  salad_box_vegetariana: getLocalImg('veg_salad-box-vegetariana.jpg'),
  salad_box_vegana: getLocalImg('veg_salad-box-vegana.jpg'),
  salad_box_pollo_gf: getLocalImg('veg_salad-box-pollo-gluten-free.jpg'),
  pink_box_vegana: getLocalImg('veg_pink-box-vegana.jpg'),
  pink_box_keto: getLocalImg('veg_pink-box-keto-sin-gluten.jpg'),
  pink_box_vegetariana: getLocalImg('veg_pink-box-vegetariana.jpg'),
  orzo_vegetariana: getLocalImg('veg_orzo-pasta-salad-box-vegetariana.jpg'),
  box_oriental: getLocalImg('wl_box-oriental.jpg'),
  box_oriental_vegetariana: getLocalImg('veg_box-oriental-vegetariana.jpg'),
  st_tropez_box_pollo: getLocalImg('ext_box-st-tropez-pollo.jpg'),
  st_tropez_box_veg: getLocalImg('ext_box-st-tropez-vegetariana.jpg'),
  box_mediterranea_pollo: getLocalImg('ext_box-mediterranea-pollo.jpg'),
  box_mediterranea_veg: getLocalImg('ext_box-mediterranea-vegetariana.jpg'),
  box_tex_mex_pollo: getLocalImg('ext_box-tex-mex-pollo.jpg'),
  box_tex_mex_vegana: getLocalImg('ext_box-tex-mex-vegana.jpg'),
  box_tex_mex_gf: getLocalImg('ext_box-tex-mex-gluten-free.jpg'),

  // ── WORKING LUNCH ECONÓMICO ──
  mini_box: getLocalImg('wl_mini-box.jpg'),
  box_economica_1: getLocalImg('wl_box-economica-1-torta.jpg'),
  box_economica_2: getLocalImg('wl_box-economica-2.jpg'),
  box_economica_3: getLocalImg('wl_box-economica-3.jpg'),
  comedor_berlioz: getLocalImg('wl_comedor-berlioz.jpg'),
  lunch_bag_pasta_pollo: getLocalImg('wl_lunch-bag-pasta-pollo.jpg'),
  lunch_bag_pasta_veg: getLocalImg('wl_lunch-bag-pasta-vegetariana.jpg'),
  lunch_bag_ciabatta_pavo: getLocalImg('wl_lunch-bag-ciabatta-pavo.jpg'),
  lunch_bag_ciabatta_veg: getLocalImg('wl_lunch-bag-ciabatta-vegetariana.jpg'),

  // ── TORTAS PIROPO ──
  piropo_cochinita: getLocalImg('tp_piropo-cochinita.jpg'),
  piropo_carnitas: getLocalImg('tp_piropo-carnitas.jpg'),
  piropo_jamon: getLocalImg('tp_piropo-jamon-y-queso.jpg'),
  piropo_tinga: getLocalImg('tp_piropo-tinga.jpg'),
  piropo_camaron: getLocalImg('tp_piropo-camaron.jpg'),
  piropo_veggie: getLocalImg('tp_piropo-veggie.jpg'),
  piropo_surtida: getLocalImg('tp_piropo-surtida.jpg'),

  // ── BEBIDAS ──
  agua_bui_natural: getLocalImg('beb_agua-bui-natural.jpg'),
  agua_bui_mineral: getLocalImg('beb_agua-bui-mineral.jpg'),
  agua_bui_infusionada: getLocalImg('beb_agua-bui-infusionada.jpg'),
  agua_jamaica: getLocalImg('beb_agua-de-jamaica.jpg'),
  agua_limon_menta: getLocalImg('beb_agua-fresca-de-limon-con-menta.jpg'),
  agua_coco: getLocalImg('beb_agua-de-coco.jpg'),
  agua_temporada: getLocalImg('beb_agua-de-temporada.jpg'),
  coca_cola: getLocalImg('beb_coca-cola.jpg'),
  coca_cola_light: getLocalImg('beb_coca-cola-light.jpg'),
  refresco_lata: getLocalImg('beb_refresco-lata.jpg'),
  sanpellegrino_aranciata: getLocalImg('beb_sanpellegrino-aranciata-rossa.jpg'),
  sanpellegrino_melograno: getLocalImg('beb_sanpellegrino-melograno-y-arancia.jpg'),
  jugo_naranja: getLocalImg('beb_jugo-de-naranja.jpg'),
  cafe_frio: getLocalImg('beb_cafe-frio.jpg'),

  // ── SUPABASE SLUGS (FOR CATALOG PAGE) ──
  'box-ejecutiva': getLocalImg('wl_black-box.jpg'),
  'box-clasica': getLocalImg('wl_white-box.jpg'),
  'desayuno-continental': getLocalImg('des_breakfast-in-roma.jpg'),
  'coffee-break-am': getLocalImg('cb_coffee-break-am-cafe.jpg'),
  'coffee-break-pm': getLocalImg('cb_coffee-break-pm.jpg'),
  'box-vegana': getLocalImg('veg_pink-box-vegana.jpg'),
  'box-sin-gluten': getLocalImg('veg_pink-box-keto-sin-gluten.jpg'),
  'junta-ejecutiva-premium': getLocalImg('wl_salmon-box.jpg'),
  'desayuno-saludable': getLocalImg('des_healthy-breakfast.jpg'),
  'box-economica': getLocalImg('wl_comedor-berlioz.jpg'),
};

/** Category images for grids and hero cards */
export const CATEGORY_IMAGES = {
  coffee_break: getLocalImg('cb_coffee-break-pm.jpg'),
  coffee_break_surtido: getLocalImg('cb_surtido-camille.jpg'),
  coffee_break_individual: getLocalImg('cb_yogurt-organico.jpg'),
  desayuno: getLocalImg('des_breakfast-in-roma.jpg'),
  working_lunch: getLocalImg('wl_salmon-box.jpg'),
  working_lunch_economico: getLocalImg('wl_comedor-berlioz.jpg'),
  tortas: getLocalImg('tp_piropo-surtida.jpg'),
  bebidas: getLocalImg('beb_agua-de-temporada.jpg'),
};

/** Hero card images */
export const HERO_IMAGES = {
  cotiza: getLocalImg('wl_salmon-box.jpg'),
  menu: getLocalImg('cb_coffee-break-am-cafe.jpg'),
};

/** Addon images */
export const ADDON_IMAGES: Record<string, string> = {
  cafe_te_berlioz: getLocalImg('beb_cafe-te-berlioz.jpg'),
  snack_bag: getLocalImg('cb_snack-bag.jpg'),
  logo_caja: getLocalImg('ext_mi-logo-en-la-tapa.jpg'),
  sticker: getLocalImg('ext_mi-logo-en-la-tapa-stickers.jpg'),
  aguas_frescas: getLocalImg('beb_agua-de-temporada.jpg'),
};


/** Map of product IDs → Array of Local URLs for gallery */
export const PRODUCT_GALLERIES: Record<string, string[]> = {
  // ── COFFEE BREAK PAQUETES ──
  cb_am_cafe: [
    getLocalImg('cb_coffee-break-am-cafe.jpg'),
    getLocalImg('cb_coffee-break-am-cafe-4-personas.jpg'),
    getLocalImg('cb_coffee-break-am-cafe-6-personas.jpg'),
    getLocalImg('cb_coffee-break-am-cafe-8-personas.jpg'),
    getLocalImg('cb_coffee-break-am-cafe-10-personas.jpg'),
    getLocalImg('cb_coffee-break-am-cafe-15-personas.jpg'),
  ],
  cb_am_jugo: [
    getLocalImg('cb_coffee-break-am-jugo.jpg'),
    getLocalImg('cb_coffee-break-am-jugo-4-personas.jpg'),
    getLocalImg('cb_coffee-break-am-jugo-6-personas.jpg'),
    getLocalImg('cb_coffee-break-am-jugo-8-personas.jpg'),
    getLocalImg('cb_coffee-break-am-jugo-10-personas.jpg'),
    getLocalImg('cb_coffee-break-am-jugo-15-personas.jpg'),
  ],
  cb_pm: [
    getLocalImg('cb_coffee-break-pm.jpg'),
    getLocalImg('cb_coffee-break-pm-4-personas.jpg'),
    getLocalImg('cb_coffee-break-pm-6-personas.jpg'),
    getLocalImg('cb_coffee-break-pm-8-personas.jpg'),
    getLocalImg('cb_coffee-break-pm-10-personas.jpg'),
    getLocalImg('cb_coffee-break-pm-15-personas.jpg'),
  ],
  cafe_te_berlioz: [
    getLocalImg('beb_cafe-te-berlioz.jpg'),
    getLocalImg('beb_cafe-te-berlioz-cafe.jpg'),
    getLocalImg('beb_cafe-te-berlioz-te.jpg'),
  ],

  // ── SURTIDOS ──
  surtido_camille: [getLocalImg('cb_surtido-camille.jpg'), getLocalImg('cb_mini-surtido-camille.jpg')],
  surtido_voltaire: [getLocalImg('cb_surtido-voltaire.jpg'), getLocalImg('cb_mini-surtido-voltaire.jpg')],
  surtido_hugo: [getLocalImg('cb_surtido-hugo.jpg'), getLocalImg('cb_mini-surtido-hugo.jpg')],
  surtido_colette: [getLocalImg('cb_surtido-colette.jpg'), getLocalImg('cb_mini-surtido-colette.jpg')],
  surtido_balzac: [getLocalImg('cb_surtido-balzac.jpg'), getLocalImg('cb_mini-surtido-balzac.jpg')],
  surtido_zadig: [getLocalImg('cb_surtido-zadig.jpg'), getLocalImg('cb_mini-surtido-zadig.jpg')],
  surtido_snacks: [getLocalImg('cb_surtido-de-snacks.jpg'), getLocalImg('cb_snack.jpg')],
  surtido_dulces_mexicanos: [getLocalImg('cb_surtido-dulces-mexicanos.jpg'), getLocalImg('cb_surtido-dulces-mexicanos-2.jpg')],

  // ── INDIVIDUALES COFFEE BREAK ──
  panque_naranja: [getLocalImg('cb_panque-de-naranja.jpg'), getLocalImg('cb_panque-de-naranja-grande.jpg')],
  panque_pera: [getLocalImg('cb_panque-de-pera.jpg'), getLocalImg('cb_panque-de-pera-con-chocolate.jpg')],
  mix_semillas: [
    getLocalImg('cb_mix-de-semillas.jpg'),
    getLocalImg('cb_mix-de-semillas-naturales.jpg'),
    getLocalImg('cb_mix-de-semillas-enchiladas.jpg'),
    getLocalImg('cb_mix-de-semillas-con-romero.jpg'),
  ],
  snack_bag: [
    getLocalImg('cb_snack-bag.jpg'),
    getLocalImg('cb_snack-bag-con-panque-agua-y-bocadillo-de-pavo.jpg'),
    getLocalImg('cb_snack-bag-con-crudites-agua-del-dia-y-2-minibocadillos-.jpg'),
  ],

  // ── DESAYUNO ──
  breakfast_roma: [
    getLocalImg('des_breakfast-in-roma.jpg'),
    getLocalImg('des_breakfast-in-roma-pan-dulce.jpg'),
    getLocalImg('des_breakfast-in-roma-yogurt.jpg'),
  ],
  breakfast_london: [
    getLocalImg('des_breakfast-london.jpg'),
    getLocalImg('des_breakfast-london-pavo-y-pan.jpg'),
    getLocalImg('des_breakfast-london-pavo-y-yogurt.jpg'),
  ],
  breakfast_montreal: [
    getLocalImg('des_breakfast-in-montreal.jpg'),
    getLocalImg('des_breakfast-in-montreal-pan-recien-horneado.jpg'),
    getLocalImg('des_breakfast-in-montreal-yoghurt-organico.jpg'),
  ],
  breakfast_madrid: [
    getLocalImg('des_breakfast-in-madrid.jpg'),
    getLocalImg('des_breakfast-in-madrid-pan.jpg'),
    getLocalImg('des_breakfast-in-madrid-yogurt.jpg'),
  ],
  breakfast_blt: [
    getLocalImg('des_breakfast-blt.jpg'),
    getLocalImg('des_breakfast-blt-pavo-y-pan.jpg'),
    getLocalImg('des_breakfast-blt-tocino-y-pan-recien-horneado.jpg'),
  ],
  breakfast_bag_pavo: [
    getLocalImg('des_breakfast-bag-pavo.jpg'),
    getLocalImg('des_breakfast-bag-2.jpg'),
  ],

  // ── WORKING LUNCH PREMIUM ──
  pink_box: [getLocalImg('wl_pink-box.jpg'), getLocalImg('wl_pink-box-con-papitas-fritas.jpg')],
  blt_box: [getLocalImg('wl_blt-box.jpg'), getLocalImg('wl_blt-box-ensalada-de-calabaza.jpg')],
  aqua_box: [getLocalImg('wl_aqua-box.jpg'), getLocalImg('wl_aqua-box-ensalada-de-calabaza.jpg')],
  orzo_pasta_salad_box: [getLocalImg('wl_orzo-pasta-salad-box.jpg'), getLocalImg('veg_orzo-pasta-salad-box-vegetariana.jpg')],
  salad_box_pollo: [getLocalImg('wl_salad-box-pollo.jpg'), getLocalImg('wl_salad-box-pollo-con-agua-del-dia.jpg')],
  
  // ── WORKING LUNCH ECONÓMICO ──
  box_economica_2: [
    getLocalImg('wl_box-economica-2.jpg'),
    getLocalImg('wl_box-economica-2-quiche.jpg'),
    getLocalImg('wl_box-economica-2-pasta-con-pollo-y-queso.jpg'),
  ],
  box_economica_3: [
    getLocalImg('wl_box-economica-3.jpg'),
    getLocalImg('wl_box-economica-3-quiche.jpg'),
    getLocalImg('wl_box-economica-3-pasta-con-pollo-y-queso.jpg'),
  ],
  lunch_bag_ciabatta_pavo: [getLocalImg('wl_lunch-bag-ciabatta-pavo.jpg'), getLocalImg('wl_lunch-bag-ciabatta-2.jpg')],
  lunch_bag_pasta_pollo: [getLocalImg('wl_lunch-bag-pasta-pollo.jpg'), getLocalImg('wl_lunch-bag-pasta-2.jpg')],

  // ── TORTAS PIROPO ──
  piropo_surtida: [getLocalImg('tp_piropo-surtida.jpg'), getLocalImg('tp_piropo-surtida-caja-surtida.jpg')],

  // ── SUPABASE SLUGS GALLERIES ──
  'box-ejecutiva': [
    getLocalImg('wl_black-box.jpg'),
    getLocalImg('wl_golden-box.jpg'),
    getLocalImg('wl_white-box.jpg'),
    getLocalImg('wl_salmon-box.jpg'),
  ],
  'box-clasica': [
    getLocalImg('wl_white-box.jpg'),
    getLocalImg('wl_pink-box.jpg'),
    getLocalImg('wl_blt-box.jpg'),
    getLocalImg('wl_aqua-box.jpg'),
  ],
  'desayuno-continental': [
    getLocalImg('des_breakfast-in-roma.jpg'),
    getLocalImg('des_breakfast-in-madrid.jpg'),
    getLocalImg('des_breakfast-london.jpg'),
    getLocalImg('des_breakfast-in-montreal.jpg'),
  ],
  'coffee-break-am': [
    getLocalImg('cb_coffee-break-am-cafe.jpg'),
    getLocalImg('cb_coffee-break-am-jugo.jpg'),
    getLocalImg('cb_coffee-break-am-cafe-8-personas.jpg'),
  ],
  'coffee-break-pm': [
    getLocalImg('cb_coffee-break-pm.jpg'),
    getLocalImg('cb_coffee-break-pm-8-personas.jpg'),
    getLocalImg('cb_surtido-balzac.jpg'),
  ],
  'box-vegana': [
    getLocalImg('veg_pink-box-vegana.jpg'),
    getLocalImg('veg_pink-box-vegana-agua.jpg'),
    getLocalImg('veg_pink-box-vegana-postre.jpg'),
  ],
  'box-sin-gluten': [
    getLocalImg('veg_pink-box-keto-sin-gluten.jpg'),
    getLocalImg('veg_pink-box-keto-sin-gluten-agua.jpg'),
    getLocalImg('veg_pink-box-keto-sin-gluten-postre.jpg'),
  ],
  'junta-ejecutiva-premium': [
    getLocalImg('wl_salmon-box.jpg'),
    getLocalImg('wl_orzo-pasta-salad-box.jpg'),
    getLocalImg('wl_green-box.jpg'),
    getLocalImg('wl_black-box.jpg'),
  ],
  'desayuno-saludable': [
    getLocalImg('des_healthy-breakfast.jpg'),
    getLocalImg('des_breakfast-vegano.jpg'),
    getLocalImg('cb_yogurt-organico.jpg'),
  ],
  'box-economica': [
    getLocalImg('wl_comedor-berlioz.jpg'),
    getLocalImg('wl_box-economica-2.jpg'),
    getLocalImg('wl_box-economica-3.jpg'),
    getLocalImg('wl_box-economica-1-torta.jpg'),
  ],
};

/**
 * Get the Local image for a product by ID.
 * Always returns a valid URL.
 */
export function getProductImage(productId: string): string {
  return PRODUCT_IMAGES[productId] ?? FALLBACK_IMAGE;
}

/**
 * Get the gallery of images for a product by ID.
 * Returns an array of URLs. If no gallery found, returns array with main image.
 */
export function getProductGallery(productId: string): string[] {
  const gallery = PRODUCT_GALLERIES[productId];
  if (gallery && gallery.length > 0) return gallery;
  return [getProductImage(productId)];
}


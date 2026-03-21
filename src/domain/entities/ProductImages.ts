/**
 * Centralized Cloudinary image URLs for all Berlioz products.
 * berlioz.mx blocks external image loading (CORS), so we use Cloudinary mirrors.
 * 
 * RULE: If a product has no match here, use FALLBACK_IMAGE.
 */

const CL = 'https://res.cloudinary.com/dsr7tnfh6/image/upload/w_800,q_auto,f_auto';

export const FALLBACK_IMAGE = `${CL}/cateringCorporativo12_a0kxxe`;

/** Map of product IDs → Cloudinary URLs */
export const PRODUCT_IMAGES: Record<string, string> = {
  // ── COFFEE BREAK PAQUETES ──
  cb_am_cafe: `${CL}/coffeebreak_AM_cafe_zhxb1e`,
  cb_am_jugo: `${CL}/coffeebreak_AM_cafe2_sda4yc`,
  cb_pm: `${CL}/coffeebreak_PM_qlk47d`,
  cafe_te_berlioz: `${CL}/17_izcp6g`,

  // ── SURTIDOS ──
  surtido_camille: `${CL}/Surtido-Camille-Berlioz-bocadillos_paaynm`,
  surtido_voltaire: `${CL}/Surtido-Camille-Berlioz-bocadillos2_zkkuyr`,
  surtido_hugo: `${CL}/Hugo-grande_k0rrtc`,
  surtido_colette: `${CL}/Mini-danes_jxvrho`,
  surtido_balzac: `${CL}/pastelitos_pbbopa`,
  surtido_zadig: `${CL}/pastelitos_pbbopa`,
  surtido_snacks: `${CL}/Snacks-saludables-Berlioz-scaled_pukfu4`,
  surtido_dulces_mexicanos: `${CL}/Surtido-Dulces_nrm0yv`,
  mini_surtido_camille: `${CL}/MG_1600_jdhwpr`,
  mini_surtido_voltaire: `${CL}/MG_1600_jdhwpr`,
  mini_surtido_hugo: `${CL}/Mini-danes_jxvrho`,
  mini_surtido_colette: `${CL}/Coffee-break_vxyazg`,
  mini_surtido_balzac: `${CL}/mini-balzac_g5tbbm`,
  mini_surtido_zadig: `${CL}/mini-balzac_g5tbbm`,

  // ── INDIVIDUALES COFFEE BREAK ──
  ensalada_fruta: `${CL}/Desayuno-Berlioz-Coffee-break-ensalada-Frutas_sukr3c`,
  crudites: `${CL}/crudite_jpxful`,
  yogurt_organico: `${CL}/berlioz_fabian-21-scaled_sphrwf`,
  pan_dulce_individual: `${CL}/Pan-dulce-Berlioz-desayuno-zoom_k4cqtv`,
  panque_naranja: `${CL}/Panque-de-naranja-Berlioz-zoom_vcnb3h`,
  panque_pera: `${CL}/Panque-de-pera-con-chocolate-berlioz-zoom-1_qxvouv`,
  cookies: `${CL}/Cookies-de-mantequilla-de-mani_zejgmc`,
  paleta_hielo: `${CL}/WhatsApp-Image-2026-03-12-at-10.21.40-AM_kzezrf`,
  mix_semillas: `${CL}/bag-snack_zbsxe6`,
  ensalada_pepino: `${CL}/Ensalada-de-pepino-con-queso-de-cabra_lwpnd3`,
  ensalada_jicama: `${CL}/Ensalada-de-jicama-con-toronja_xjzemq`,
  snack_bag: `${CL}/bag-snack_zbsxe6`,
  snack_individual: `${CL}/garbanzos-enchilados_uj6tal`,

  // ── DESAYUNO ──
  desayuno_berlioz: `${CL}/comedorBERLIOZ_vvm0rz`,
  box_chilaquiles_verdes_huevo: `${CL}/Box-Chilaquiles-verdes-Berlioz-_sycy3y`,
  box_chilaquiles_verdes_pollo: `${CL}/Box-Chilaquiles-verdes-Berlioz-_sycy3y`,
  box_chilaquiles_rojos_huevo: `${CL}/Box-Chilaquiles-verdes-Berlioz-_sycy3y`,
  box_chilaquiles_rojos_pollo: `${CL}/Box-Chilaquiles-verdes-Berlioz-_sycy3y`,
  breakfast_roma: `${CL}/breakfast-ROMA-e1686675516812_bzzmzm`,
  breakfast_london: `${CL}/berlioz_fabian-12-scaled_rscq5d`,
  breakfast_montreal: `${CL}/Breakfast-in-Montreal-Berlioz1_msrqt6`,
  breakfast_madrid: `${CL}/breakfast-ROMA-e1686675516812_bzzmzm`,
  healthy_breakfast: `${CL}/Healthy-breakfast-1_wax9nd`,
  breakfast_blt: `${CL}/berlioz_fabian-03-scaled_owtrxy`,
  breakfast_bag_pavo: `${CL}/breakfast-bag_zctq0h`,
  breakfast_bag_especial: `${CL}/Desayuno-Berlioz-Coffee-break-ensalada-Frutas_sukr3c`,
  breakfast_roma_vegetariano: `${CL}/breakfast-ROMA-e1686675516812_bzzmzm`,
  breakfast_london_vegetariano: `${CL}/berlioz_fabian-12-scaled_rscq5d`,
  breakfast_vegano: `${CL}/breakfast-bag_zctq0h`,

  // ── WORKING LUNCH PREMIUM ──
  salmon_box: `${CL}/5_wkgrwj`,
  pink_box: `${CL}/Pasta-al-pesto-Pink-box-Berlioz-1_ijlkbj`,
  black_box: `${CL}/berlioz_fabian-40-scaled-e1596130008398_lro55u`,
  golden_box: `${CL}/berlioz_fabian-05-scaled_ruahji`,
  blt_box: `${CL}/berlioz_fabian-47-scaled_mc6xol`,
  aqua_box: `${CL}/aqua-box2_kcq4qa`,
  green_box: `${CL}/green-box3_jtivh8`,
  white_box: `${CL}/white-box_hnkxd9`,
  orzo_pasta_salad_box: `${CL}/Orzo-Pollo_esdfpp`,
  salad_box_pollo: `${CL}/Salad-box-pollo_eqizjy`,
  salad_box_vegetariana: `${CL}/Salad-box-pollo_eqizjy`,
  salad_box_vegana: `${CL}/Salad-box-pollo_eqizjy`,
  salad_box_pollo_gf: `${CL}/Salad-box-pollo_eqizjy`,
  pink_box_vegana: `${CL}/web-03_iad9sf`,
  pink_box_keto: `${CL}/web-06_r5afwn`,
  pink_box_vegetariana: `${CL}/web-_Mesa-de-trabajo-1_n9hqc4`,
  orzo_vegetariana: `${CL}/Orzo-Pollo_esdfpp`,
  box_oriental: `${CL}/IMG_8233-copia-1_nnegmi`,
  box_oriental_vegetariana: `${CL}/IMG_8253-copia-1_ucakpk`,
  st_tropez_box_pollo: FALLBACK_IMAGE,
  st_tropez_box_veg: FALLBACK_IMAGE,
  box_mediterranea_pollo: FALLBACK_IMAGE,
  box_mediterranea_veg: FALLBACK_IMAGE,
  box_tex_mex_pollo: FALLBACK_IMAGE,
  box_tex_mex_vegana: FALLBACK_IMAGE,
  box_tex_mex_gf: FALLBACK_IMAGE,

  // ── WORKING LUNCH ECONÓMICO ──
  mini_box: `${CL}/mini-BOX_ntjbxh`,
  box_economica_1: `${CL}/Torta-berlioz_hzjelx`,
  box_economica_2: FALLBACK_IMAGE,
  box_economica_3: FALLBACK_IMAGE,
  comedor_berlioz: `${CL}/comedorBERLIOZ_vvm0rz`,
  lunch_bag_pasta_pollo: `${CL}/lunch-pasta_kakdco`,
  lunch_bag_pasta_veg: `${CL}/lunch-pasta_kakdco`,
  lunch_bag_ciabatta_pavo: `${CL}/lunch-ciabatta_shrxzi`,
  lunch_bag_ciabatta_veg: `${CL}/berlioz_fabian-47-scaled_mc6xol`,

  // ── TORTAS PIROPO ──
  piropo_cochinita: `${CL}/tortas_gourmet2_devjfz`,
  piropo_carnitas: `${CL}/tortas_gourmet2_devjfz`,
  piropo_jamon: `${CL}/tortas_gourmet2_devjfz`,
  piropo_tinga: `${CL}/tortas_gourmet2_devjfz`,
  piropo_camaron: `${CL}/tortas_gourmet2_devjfz`,
  piropo_veggie: `${CL}/tortas_gourmet2_devjfz`,
  piropo_surtida: `${CL}/piropo-surtida_efarqs`,

  // ── BEBIDAS ──
  agua_bui_natural: `${CL}/bui-natural_k8kmdy`,
  agua_bui_mineral: `${CL}/bui-natural_k8kmdy`,
  agua_bui_infusionada: `${CL}/bui-natural_k8kmdy`,
  agua_jamaica: `${CL}/Aguas-de-sabor-Berlioz.jpg_guf7kw`,
  agua_limon_menta: `${CL}/Aguas-de-sabor-Berlioz.jpg_guf7kw`,
  agua_coco: `${CL}/Aguas-de-sabor-Berlioz.jpg_guf7kw`,
  agua_temporada: `${CL}/Aguas-de-sabor-Berlioz.jpg_guf7kw`,
  coca_cola: `${CL}/coca_vmdjqf`,
  coca_cola_light: `${CL}/coca_vmdjqf`,
  refresco_lata: `${CL}/sprite_ly3duj`,
  sanpellegrino_aranciata: `${CL}/sanpellegrino-aranciata-rossa_jrln2p`,
  sanpellegrino_melograno: `${CL}/sanpellegrino-aranciata-rossa_jrln2p`,
  jugo_naranja: `${CL}/JUS_zv5rsx`,
  cafe_frio: `${CL}/zoom_Berlioz_jugos_wxlv5r`,
};

/** Category images for grids and hero cards */
export const CATEGORY_IMAGES = {
  coffee_break: `${CL}/coffeebreak_PM_qlk47d`,
  coffee_break_surtido: `${CL}/Surtido-Camille-Berlioz-bocadillos_paaynm`,
  coffee_break_individual: `${CL}/berlioz_fabian-21-scaled_sphrwf`,
  desayuno: `${CL}/breakfast-ROMA-e1686675516812_bzzmzm`,
  working_lunch: FALLBACK_IMAGE,
  working_lunch_economico: `${CL}/comedorBERLIOZ_vvm0rz`,
  tortas: `${CL}/piropo-surtida_efarqs`,
  bebidas: `${CL}/Aguas-de-sabor-Berlioz.jpg_guf7kw`,
};

/** Hero card images */
export const HERO_IMAGES = {
  cotiza: FALLBACK_IMAGE,
  menu: `${CL}/coffeebreak_AM_cafe_zhxb1e`,
};

/** Addon images */
export const ADDON_IMAGES: Record<string, string> = {
  cafe_te_berlioz: `${CL}/17_izcp6g`,
  snack_bag: `${CL}/bag-snack_zbsxe6`,
  logo_caja: `${CL}/PersonalizacionDeCajas_br9mlr`,
  sticker: `${CL}/PersonalizacionDeCajas_br9mlr`,
  aguas_frescas: `${CL}/Aguas-de-sabor-Berlioz.jpg_guf7kw`,
};

/**
 * Get the Cloudinary image for a product by ID.
 * Always returns a valid URL (falls back to generic catering image).
 */
export function getProductImage(productId: string): string {
  return PRODUCT_IMAGES[productId] ?? FALLBACK_IMAGE;
}

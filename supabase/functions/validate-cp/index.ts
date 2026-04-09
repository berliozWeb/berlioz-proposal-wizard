const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const VALID_CPS: Record<string, string> = {
  "11520": "Polanco","11000": "Polanco","06600": "Juárez","11560": "Polanco",
  "06500": "Cuauhtémoc","11510": "Polanco","01210": "Santa Fe","11700": "Lomas",
  "06700": "Roma","05348": "Cuajimalpa","06760": "Roma","11590": "Lomas",
  "11800": "Lomas","01000": "Álvaro Obregón","01020": "Santa Fe","01030": "Santa Fe",
  "01040": "Santa Fe","01050": "Santa Fe","01060": "Santa Fe","01070": "Santa Fe",
  "03100": "Del Valle","03200": "Del Valle","03300": "Del Valle","03400": "Narvarte",
  "03500": "Narvarte","03600": "Narvarte","03700": "Insurgentes","03800": "Insurgentes",
  "03900": "Insurgentes","04000": "Coyoacán","06000": "Centro","06010": "Centro",
  "06020": "Centro","06030": "Centro","06040": "Centro","06050": "Centro",
  "06100": "Centro","06140": "Condesa","06170": "Condesa","06200": "Condesa",
  "06300": "Condesa","06350": "Roma","06400": "Roma","06470": "Roma",
  "52760": "Interlomas","52780": "Interlomas","52786": "Huixquilucan",
  "52787": "Huixquilucan","52790": "Huixquilucan","52930": "Naucalpan",
  "53100": "Naucalpan","53110": "Naucalpan","53120": "Naucalpan","53126": "Naucalpan",
  "53130": "Naucalpan","53140": "Naucalpan","53150": "Satélite","53160": "Satélite",
  "53220": "Naucalpan","53300": "Naucalpan","53310": "Naucalpan","53390": "Naucalpan",
  "53398": "Naucalpan","53900": "Naucalpan","53910": "Naucalpan","53920": "Naucalpan",
  "53930": "Naucalpan","53950": "Naucalpan",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { postalCode } = await req.json();
    if (!postalCode || typeof postalCode !== "string" || postalCode.length !== 5) {
      return new Response(JSON.stringify({ valid: false, error: "CP inválido" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

    const zone = VALID_CPS[postalCode];
    return new Response(JSON.stringify({ valid: !!zone, zone: zone || null }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ valid: false, error: "Error al validar" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});

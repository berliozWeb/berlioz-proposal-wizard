import { Helmet } from "react-helmet-async";

export const SITE_URL = "https://berlioz.mx";
const PROD_HOSTS = new Set(["berlioz.mx", "www.berlioz.mx"]);

export const isProductionHost = () =>
  typeof window !== "undefined" && PROD_HOSTS.has(window.location.hostname);

interface SeoProps {
  title: string;
  description?: string;
  path?: string;
  noindex?: boolean;
  jsonLd?: object;
}

export default function Seo({ title, description, path, noindex, jsonLd }: SeoProps) {
  const url = path ? `${SITE_URL}${path}` : undefined;
  const blockIndex = noindex || !isProductionHost();
  return (
    <Helmet>
      <title>{title}</title>
      {description && <meta name="description" content={description} />}
      {url && <link rel="canonical" href={url} />}
      <meta property="og:title" content={title} />
      {description && <meta property="og:description" content={description} />}
      {url && <meta property="og:url" content={url} />}
      <meta name="twitter:title" content={title} />
      {description && <meta name="twitter:description" content={description} />}
      {blockIndex && <meta name="robots" content="noindex, nofollow" />}
      {jsonLd && <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>}
    </Helmet>
  );
}

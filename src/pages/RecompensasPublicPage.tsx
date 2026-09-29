import Seo from "@/components/seo/Seo";
import BaseLayout from "@/components/layout/BaseLayout";
import RecompensasSection from "@/components/landing/RecompensasSection";

const RecompensasPublicPage = () => (
  <BaseLayout>
    <Seo title="Programa de recompensas | Berlioz" description="Acumula beneficios en cada pedido de catering corporativo con Berlioz." path="/recompensas" />
    <div style={{ paddingTop: 76 }}>
      <RecompensasSection />
    </div>
  </BaseLayout>
);

export default RecompensasPublicPage;

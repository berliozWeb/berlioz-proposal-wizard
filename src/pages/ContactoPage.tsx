import Seo from "@/components/seo/Seo";
import BaseLayout from "@/components/layout/BaseLayout";
import ContactSection from "@/components/landing/ContactSection";
import NosotrosSection from "@/components/landing/NosotrosSection";

const ContactoPage = () => (
  <BaseLayout>
    <Seo title="Contacto | Berlioz" description="Escríbenos por WhatsApp al 55 8237 5469 o a hola@berlioz.mx para pedidos y cotizaciones." path="/contacto" />
    <div style={{ paddingTop: 76 }}>
      <ContactSection />
      <NosotrosSection />
    </div>
  </BaseLayout>
);

export default ContactoPage;

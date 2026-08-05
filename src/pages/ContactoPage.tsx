import BaseLayout from "@/components/layout/BaseLayout";
import ContactSection from "@/components/landing/ContactSection";
import NosotrosSection from "@/components/landing/NosotrosSection";

const ContactoPage = () => (
  <BaseLayout>
    <div style={{ paddingTop: 76 }}>
      <ContactSection />
      <NosotrosSection />
    </div>
  </BaseLayout>
);

export default ContactoPage;

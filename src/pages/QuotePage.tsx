import BaseLayout from "@/components/layout/BaseLayout";
import Index from "./Index";

/** Wraps the existing quoter wizard inside the new site layout */
const QuotePage = () => (
  <BaseLayout>
    <Index />
  </BaseLayout>
);

export default QuotePage;
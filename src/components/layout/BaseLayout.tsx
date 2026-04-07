import type { ReactNode } from "react";
import Navbar from "./Navbar";
import Footer from "./Footer";

interface BaseLayoutProps {
  children: ReactNode;
  hideFooter?: boolean;
}

const BaseLayout = ({ children, hideFooter }: BaseLayoutProps) => (
  <div className="min-h-screen flex flex-col" style={{ background: '#FDFAF7' }}>
    <Navbar />
    <main className="flex-1" style={{ paddingTop: 68 }}>{children}</main>
    {!hideFooter && <Footer />}
  </div>
);

export default BaseLayout;

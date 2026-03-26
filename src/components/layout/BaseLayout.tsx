import type { ReactNode } from "react";
import Navbar from "./Navbar";
import Footer from "./Footer";

interface BaseLayoutProps {
  children: ReactNode;
  hideFooter?: boolean;
}

const BaseLayout = ({ children, hideFooter }: BaseLayoutProps) => (
  <div className="min-h-screen flex flex-col bg-background">
    <Navbar />
    <main className="flex-1 pt-[72px]">{children}</main>
    {!hideFooter && <Footer />}
  </div>
);

export default BaseLayout;
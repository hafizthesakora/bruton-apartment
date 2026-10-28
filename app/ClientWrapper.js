"use client";
import { usePathname } from "next/navigation";
import Header from "./_Components/Header";
import Footer from "./_Components/Footer";
import PromoBanner from "./_Components/PromoBanner";
import SmoothScroll from "./_Components/SmoothScroll";

export default function ClientWrapper({ children }) {
  const pathname = usePathname();
  const isAdmin = pathname?.startsWith('/admin');

  if (isAdmin) {
    return <>{children}</>;
  }

  return (
    <SmoothScroll>
      <div className="fixed top-0 left-0 right-0 z-50 flex flex-col">
        <PromoBanner />
        <Header />
      </div>
      <main>{children}</main>
      <Footer />
    </SmoothScroll>
  );
}

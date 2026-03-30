"use client";
import { Jost } from "next/font/google";
import { AnimatePresence } from "framer-motion";
import { usePathname } from "next/navigation";
import Header from "./_Components/Header";
import Footer from "./_Components/Footer";
import PromoBanner from "./_Components/PromoBanner";
import "./globals.css";

const jost = Jost({
  variable: "--font-jost",
  subsets: ["latin"],
  weight: ["100", "200", "300", "400", "500", "600", "700", "800", "900"],
});

export default function ClientWrapper({ children }) {
  const pathname = usePathname();
  const isAdmin = pathname?.startsWith('/admin');

  if (isAdmin) {
    return <div className={jost.className}>{children}</div>;
  }

  return (
    <div className={jost.className}>
      <div className="fixed top-0 left-0 right-0 z-50 flex flex-col">
        <PromoBanner />
          <Header />
      </div>
      <AnimatePresence mode="wait">
        <div key={pathname}>
          {children}
        </div>
      </AnimatePresence>
      <Footer />
    </div>
  );
}

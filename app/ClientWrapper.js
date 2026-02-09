"use client";
import { Jost } from "next/font/google";
import { AnimatePresence } from "framer-motion";
import { usePathname } from "next/navigation";
import Header from "./_Components/Header";
import Footer from "./_Components/Footer";
import "./globals.css";

const jost = Jost({
  variable: "--font-jost",
  subsets: ["latin"],
  weight: ["100", "200", "300", "400", "500", "600", "700", "800", "900"],
});

export default function ClientWrapper({ children }) {
  const pathname = usePathname();

  return (
    <div className={jost.className}>
      <Header />
      <AnimatePresence mode="wait">
        <div key={pathname}>
          {children}
        </div>
      </AnimatePresence>
      <Footer />
    </div>
  );
}

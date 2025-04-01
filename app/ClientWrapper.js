"use client";
import { Jost } from "next/font/google";
import AOS from "aos";
import "aos/dist/aos.css";
import { useEffect } from "react";
import Header from "./_Components/Header";
import Footer from "./_Components/Footer";
import "./globals.css";

const jost = Jost({
  variable: "--font-jost",
  subsets: ["latin"],
  weights: ["100", "200", "300", "400", "500", "600", "700", "800", "900"],
});

export default function ClientWrapper({ children }) {
  useEffect(() => {
    AOS.init({
      once: true,
    });
  }, []);

  return (
    <div className={jost.className}>
      <Header />
      {children}
      <Footer />
    </div>
  );
}

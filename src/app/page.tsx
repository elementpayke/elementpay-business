import Navbar from "@/components/landing/Navbar";
import Hero from "@/components/landing/Hero";
import TrustStrip from "@/components/landing/TrustStrip";
import Features from "@/components/landing/Features";
import Workflow from "@/components/landing/Workflow";
import DashboardShowcase from "@/components/landing/DashboardShowcase";
import Security from "@/components/landing/Security";
import Stats from "@/components/landing/Stats";
import CTA from "@/components/landing/CTA";
import Footer from "@/components/landing/Footer";

export default function Home() {
  return (
    <>
      <Navbar />
      <main>
        <Hero />
        <TrustStrip />
        <Features />
        <Workflow />
        <DashboardShowcase />
        <Security />
        <Stats />
        <CTA />
      </main>
      <Footer />
    </>
  );
}

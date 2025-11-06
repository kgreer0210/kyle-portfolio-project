"use client";

import Particles from "../Particles/Particles";
import { motion } from "motion/react";
import { useEffect } from "react";
import {
  ScrollHeader,
  BackToTop,
  Hero,
  About,
  Projects,
  Testimonials,
  Contact,
  Footer,
} from "../components";

export default function Home() {
  // Handle page refresh - always start at top and clear hash
  useEffect(() => {
    // Scroll to top immediately on page load/refresh
    window.scrollTo(0, 0);

    // Clear any hash from URL without adding to history
    if (window.location.hash) {
      window.history.replaceState(
        null,
        "",
        window.location.pathname + window.location.search
      );
    }
  }, []);

  return (
    <motion.div
      className="min-h-screen bg-rich-black text-text-primary relative w-full overflow-x-hidden"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.8 }}
    >
      {/* Animated Particles Background */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <Particles
          particleCount={1000}
          particleSpread={22}
          speed={1}
          particleColors={[
            "#0094c6", // blue-ncs (main accent)
            "#005e7c", // lapis-lazuli (secondary accent)
            "#001242", // penn-blue (subtle)
            "#e0e6f0", // text-primary (subtle white)
            "#a8b2d1", // text-secondary (muted)
          ]}
          moveParticlesOnHover={true}
          particleHoverFactor={1}
          alphaParticles={true}
          particleBaseSize={500}
          sizeRandomness={0.8}
          cameraDistance={25}
          disableRotation={true}
          className="opacity-50 pointer-events-auto"
        />
      </div>

      {/* Scroll-triggered Header */}
      <ScrollHeader />

      {/* Back to Top Button */}
      <BackToTop />

      {/* Content Layer */}
      <div className="relative z-10 pointer-events-none">
        {/* Hero Section - Full Viewport */}
        <div className="pointer-events-auto">
          <Hero />
        </div>

        {/* Main Content Sections */}
        <main className="max-w-6xl mx-auto px-4 sm:px-6 pointer-events-auto w-full">
          <About />
          <Projects />
          <Testimonials />
          <Contact />
        </main>

        <div className="pointer-events-auto">
          <Footer />
        </div>
      </div>
    </motion.div>
  );
}

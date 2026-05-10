import React from 'react';
import Nav from '../components/landing/Nav';
import Hero from '../components/landing/Hero';
import TransitionText from '../components/landing/TransitionText';
import StatsStrip from '../components/landing/StatsStrip';
import Problem from '../components/landing/Problem';
import Technology from '../components/landing/Technology';
import ClientPortal from '../components/landing/ClientPortal';
import HowItWorks from '../components/landing/HowItWorks';
import CTAFinal from '../components/landing/CTAFinal';
import Footer from '../components/landing/Footer';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-black-2 selection:bg-crimson">
      <Nav />
      
      <main>
        {/* Stage 1: Intuition vs Information */}
        <div id="hero">
          <Hero />
        </div>

        <StatsStrip />

        <TransitionText text={`The average Indonesian film spends\nIDR 2–5 billion on marketing and promotion.\n\n90% do not break even.\n\nAnd their marketing team is left wondering:\n"where exactly did we go wrong?"`} />

        {/* Stage 2: The Problem */}
        <div id="problem">
          <Problem />
        </div>

        <TransitionText 
          text={`That's why KALA exist.\nFounded by the best of minds and experts\nin AI & Digital Marketing Industry.`} 
          blackout 
          bgImage="https://storage.googleapis.com/bluestark_explorer/wallpaper-kalaos-2.png"
          showLogo
        />

        {/* Stage 3: The Technology (Evidence) */}
        <div id="technology">
          <Technology />
        </div>

        {/* Stage 4: Trust & Portal */}
        <div id="portal">
          <ClientPortal />
        </div>

        <TransitionText 
          text="It all works together for one goal." 
          blackout
          bgImage="https://storage.googleapis.com/bluestark_explorer/kala-os-wp3.png"
        />

        {/* Stage 5: The Process */}
        <div id="how-it-works">
          <HowItWorks />
        </div>

        <TransitionText 
          text="Your film is here. Your audience is too." 
          blackout 
          bgImage="https://storage.googleapis.com/bluestark_explorer/kala-os-wp4.png"
        />

        {/* Stage 6: Final Decision */}
        <div id="cta">
          <CTAFinal />
        </div>
      </main>

      <Footer />
    </div>
  );
}

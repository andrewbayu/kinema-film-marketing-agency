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

        <TransitionText text={`Rata-rata film Indonesia menghabiskan\nRp 2–5 miliar untuk marketing dan promosi.\n\n90% tidak balik modal.\n\nDan tim marketing-nya bertanya-tanya:\n"sebenernya yang salah di mana?"`} />

        {/* Stage 2: The Problem */}
        <div id="problem">
          <Problem />
        </div>

        <TransitionText text={`That's why KALA exist.\nFounded by the best of minds and experts\nin AI & Digital Marketing Industry.`} blackout />

        {/* Stage 3: The Technology (Evidence) */}
        <div id="technology">
          <Technology />
        </div>

        {/* Stage 4: Trust & Portal */}
        <div id="portal">
          <ClientPortal />
        </div>

        <TransitionText text="Semua ini bekerja bersama untuk satu tujuan." />

        {/* Stage 5: The Process */}
        <div id="how-it-works">
          <HowItWorks />
        </div>

        <TransitionText text="Filmmu sudah ada. Penontonnya juga." blackout />

        {/* Stage 6: Final Decision */}
        <div id="cta">
          <CTAFinal />
        </div>
      </main>

      <Footer />
    </div>
  );
}

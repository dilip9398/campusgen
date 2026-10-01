import Image from "next/image";
import Link from "next/link";
import { ArrowDown, ArrowUpRight, Heart, LockKeyhole, Sparkles } from "lucide-react";
import { Navbar } from "@/components/Navbar";

const steps = [
  { number: "01", title: "Show your ID", text: "A verified Siddhartha email keeps this circle on campus." },
  { number: "02", title: "Set your vibe", text: "Say what you’re into, add a few things you love, and meet people on the same wavelength." },
  { number: "03", title: "Like it both ways", text: "A mutual yes unlocks your chosen contact. No cold DMs, no guessing." },
];

export default function Home() {
  return <>
    <Navbar />
    <main>
      <section className="home-hero">
        <Image className="hero-image" src="https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=2200&q=85" alt="College friends spending time together outdoors" fill priority unoptimized sizes="100vw" />
        <div className="hero-scrim" />
        <div className="hero-content">
          <span className="hero-kicker"><span /> THE SIDDHARTHA EDITION</span>
          <h1>Campus dating<br />without the<br /><em>awkwardness.</em></h1>
          <p>For the people you pass between classes, and the ones you haven’t met yet. Exclusively for Siddhartha students.</p>
          <div className="hero-actions"><Link href="/auth" className="button button-light">Get started with Siddhartha ID <ArrowUpRight size={17} /></Link><Link href="/lexicon" className="hero-quiet-link">The vibe bible <ArrowDown size={14} /></Link></div>
        </div>
        <span className="hero-index">16° 31′ N &nbsp;·&nbsp; CAMPUS, CONNECTED</span>
      </section>

      <section className="how-section">
        <div className="section-header"><div><span className="eyebrow">THREE STEPS, NO GUESSWORK</span><h2>Keep it <em>real.</em></h2></div><p>Good connections start with a little more context and a lot less awkward.</p></div>
        <div className="steps-grid">{steps.map((step) => <article className="step-card" key={step.number}><span className="step-number">{step.number}</span><h3>{step.title}</h3><p>{step.text}</p><span className="step-rule" /></article>)}</div>
      </section>

      <section className="privacy-band"><div className="privacy-symbol"><LockKeyhole size={23} /></div><div><span className="eyebrow">YOUR HANDLE STAYS PRIVATE</span><h2>A mutual like is the only unlock.</h2><p>Your contact details never appear on your public profile. Only you and your match can see them.</p></div><Link href="/auth" className="privacy-link">Find your people <ArrowUpRight size={16} /></Link></section>

      <section className="field-guide"><div className="guide-mark"><Heart size={27} fill="currentColor" /></div><div className="guide-copy"><span className="eyebrow">SITUATIONSHIP? CUFFING SEASON?</span><h2>Same words.<br /><em>Different meanings.</em></h2><p>A little context goes a long way. Find your footing in the campus dating lexicon.</p><Link href="/lexicon" className="text-link">Open the vibe bible <ArrowUpRight size={16} /></Link></div><div className="guide-stamp"><Sparkles size={17} /><span>11 TERMS<br />NO JUDGMENT</span></div></section>
    </main>
    <footer className="site-footer"><Link href="/" className="wordmark"><span className="wordmark-mark">c.</span> campus kin</Link><span>Made for meeting well.</span><Link href="/lexicon">Know the lingo <ArrowUpRight size={14} /></Link></footer>
  </>;
}

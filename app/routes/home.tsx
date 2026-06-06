import type { Route } from "./+types/home";
import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";
import { ArrowRight, Terminal, Globe, Shield, Sparkles } from "lucide-react";

import ImmersiveCanvas from "~/components/ImmersiveCanvas";
import MagneticButton from "~/components/MagneticButton";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Antigravity — Next-Gen Web Experience" },
    { name: "description", content: "An immersive, 3D scroll-narrative showcase inspired by Apple, Stripe, and Google Antigravity." },
  ];
}

export default function Home() {
  const [isMounted, setIsMounted] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // High-performance progress ref to avoid parent re-renders on scroll
  const scrollProgressRef = useRef(0);

  // Stats text counters refs
  const stat1Ref = useRef<HTMLDivElement>(null);
  const stat2Ref = useRef<HTMLDivElement>(null);
  const stat3Ref = useRef<HTMLDivElement>(null);
  const stat4Ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setIsMounted(true);
    
    // Register GSAP ScrollTrigger
    gsap.registerPlugin(ScrollTrigger);

    // 1. Initialise Lenis Smooth Scroll
    const lenis = new Lenis({
      duration: 1.4,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      wheelMultiplier: 1.1,
      touchMultiplier: 1.5,
      infinite: false,
    });

    // 2. Synchronise Lenis scroll events with ScrollTrigger
    lenis.on("scroll", ScrollTrigger.update);

    // 3. Connect GSAP Ticker to Lenis RAF
    const gsapTicker = (time: number) => {
      lenis.raf(time * 1000);
    };
    gsap.ticker.add(gsapTicker);
    gsap.ticker.lagSmoothing(0);

    // 4. Create master GSAP ScrollTrigger timeline to drive WebGL progress
    const scrollObj = { progress: 0 };
    
    const tl = gsap.to(scrollObj, {
      progress: 10.0, // spans the 10 sections
      ease: "none",
      scrollTrigger: {
        trigger: containerRef.current,
        start: "top top",
        end: "bottom bottom",
        scrub: 1.0, // adds smooth interpolation/inertia to scroll
        onUpdate: (self) => {
          scrollProgressRef.current = scrollObj.progress;
        },
      },
    });

    // 5. DOM Animations: Section Titles Fade In/Out
    const sections = ["s1", "s2", "s3", "s4", "s5", "s6", "s7", "s8", "s9", "s10"];
    
    sections.forEach((secId, i) => {
      const element = document.getElementById(secId);
      if (!element) return;

      if (secId === "s1") {
        // Section 1 starts visible and only fades out as you scroll down
        gsap.to(element, {
          opacity: 0,
          y: -50,
          scrollTrigger: {
            trigger: element,
            start: "top top",
            end: "bottom 30%",
            scrub: true,
          }
        });
      } else if (secId === "s10") {
        // Section 10 fades in and stays visible at the bottom
        gsap.fromTo(
          element,
          { opacity: 0, y: 50 },
          {
            opacity: 1,
            y: 0,
            scrollTrigger: {
              trigger: element,
              start: "top 90%",
              end: "top 35%",
              scrub: true,
            }
          }
        );
      } else {
        // Middle sections fade in, hold, and fade out
        const secTl = gsap.timeline({
          scrollTrigger: {
            trigger: element,
            start: "top 95%",
            end: "bottom 5%",
            scrub: true,
          }
        });

        secTl.fromTo(
          element,
          { opacity: 0, y: 50 },
          { opacity: 1, y: 0, duration: 0.35, ease: "power1.out" }
        )
        .to(element, { opacity: 1, y: 0, duration: 0.3 })
        .to(element, { opacity: 0, y: -50, duration: 0.35, ease: "power1.in" });
      }

      // Section specific animations
      if (secId === "s1") {
        // Section 1 Arrival Text Morphing effect
        const text1 = document.getElementById("s1-t1");
        const text2 = document.getElementById("s1-t2");
        
        if (text1 && text2) {
          gsap.to(text1, {
            opacity: 0,
            y: -30,
            scrollTrigger: {
              trigger: "#s1",
              start: "top top",
              end: "bottom 50%",
              scrub: true,
            }
          });

          gsap.fromTo(text2,
            { opacity: 0, y: 30 },
            {
              opacity: 1,
              y: 0,
              scrollTrigger: {
                trigger: "#s1",
                start: "top top",
                end: "bottom 30%",
                scrub: true,
              }
            }
          );
        }
      }

      if (secId === "s5") {
        // Section 5 Exploded View DOM Labels
        const labels = document.querySelectorAll(".exploded-label");
        gsap.fromTo(labels,
          { opacity: 0, scale: 0.8 },
          {
            opacity: 1,
            scale: 1,
            stagger: 0.15,
            scrollTrigger: {
              trigger: "#s5",
              start: "top 50%",
              end: "bottom 80%",
              scrub: true,
            }
          }
        );
      }

      if (secId === "s6") {
        // Section 6 Metric counters count up using GSAP
        const statCounters = [
          { ref: stat1Ref, end: 99.99, decimals: 2, suffix: "%" },
          { ref: stat2Ref, end: 150, decimals: 0, suffix: "M+" },
          { ref: stat3Ref, end: 35, decimals: 0, suffix: "" },
          { ref: stat4Ref, end: 100, decimals: 0, suffix: "ms", prefix: "<" },
        ];

        statCounters.forEach((counter) => {
          const obj = { val: 0 };
          gsap.to(obj, {
            val: counter.end,
            scrollTrigger: {
              trigger: "#s6",
              start: "top 60%",
              toggleActions: "play none none reverse",
            },
            onUpdate: () => {
              if (counter.ref.current) {
                const prefix = counter.prefix || "";
                counter.ref.current.innerText = `${prefix}${obj.val.toFixed(counter.decimals)}${counter.suffix}`;
              }
            },
            duration: 1.8,
            ease: "power2.out",
          });
        });
      }
    });

    return () => {
      lenis.destroy();
      gsap.ticker.remove(gsapTicker);
      ScrollTrigger.getAll().forEach((t) => t.kill());
    };
  }, []);

  return (
    <div ref={containerRef} className="relative min-h-[1000vh] bg-black select-none text-white overflow-hidden">
      
      {/* 3D WebGL Canvas Layer */}
      {isMounted && <ImmersiveCanvas scrollProgressRef={scrollProgressRef} />}

      {/* Floating Status Bar / Header (Apple Apple-level polish) */}
      <header className="fixed top-0 left-0 w-full z-50 px-6 py-4 flex justify-between items-center backdrop-blur-md border-b border-white/5 bg-black/10">
        <div className="flex items-center gap-2 font-display text-lg font-bold tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-white via-gray-300 to-gray-500">
          <Sparkles className="w-5 h-5 text-brand-violet animate-pulse" />
          ANTIGRAVITY
        </div>
        <nav className="hidden md:flex items-center gap-8 text-sm text-gray-400 font-medium">
          <a href="#s2" className="hover:text-white transition-colors">Core</a>
          <a href="#s3" className="hover:text-white transition-colors">Features</a>
          <a href="#s5" className="hover:text-white transition-colors">Architecture</a>
          <a href="#s6" className="hover:text-white transition-colors">Metrics</a>
        </nav>
        <button className="px-4 py-1.5 bg-white text-black font-semibold text-xs rounded-full hover:bg-gray-200 transition-colors cursor-pointer">
          Launch Console
        </button>
      </header>

      {/* HTML Overlay Content (Scrub driven layout) */}
      <div className="relative z-10 w-full flex flex-col">
        
        {/* SECTION 1 — Arrival */}
        <section id="s1" className="h-[100vh] relative flex flex-col justify-center items-center px-6 text-center">
          <div className="max-w-4xl relative h-28">
            <h1 id="s1-t1" className="absolute left-1/2 -translate-x-1/2 w-full text-5xl md:text-7xl font-display font-bold tracking-tight text-glow text-glow-dark">
              The future isn't coming.
            </h1>
            <h1 id="s1-t2" className="absolute left-1/2 -translate-x-1/2 w-full text-5xl md:text-7xl font-display font-bold tracking-tight text-glow text-glow-dark text-transparent bg-clip-text bg-gradient-to-r from-brand-cyan via-brand-indigo to-brand-violet opacity-0">
              It's already here.
            </h1>
          </div>
          <p className="mt-8 text-gray-400 text-sm md:text-base max-w-md animate-pulse">
            Scroll to begin materialization
          </p>
        </section>

        {/* SECTION 2 — Product Materialization */}
        <section id="s2" className="h-[100vh] flex flex-col justify-center items-end px-12 md:px-32 text-right">
          <div className="max-w-xl">
            <span className="text-xs font-semibold tracking-widest text-brand-cyan uppercase">
              Phase 02 / Materialization
            </span>
            <h2 className="mt-4 text-4xl md:text-5xl font-display font-bold tracking-tight text-glow-dark">
              Say hello to the Neural Core.
            </h2>
            <p className="mt-6 text-gray-400 leading-relaxed">
              Particles assemble procedural intelligence. Witness the condensation of data structures into a tactile, floating engine designed to drive your complex cloud workloads.
            </p>
          </div>
        </section>

        {/* SECTION 3 — Antigravity Experience */}
        <section id="s3" className="h-[100vh] flex flex-col justify-start items-center pt-32 px-6 text-center">
          <div className="max-w-xl">
            <span className="text-xs font-semibold tracking-widest text-brand-indigo uppercase">
              Phase 03 / Antigravity
            </span>
            <h2 className="mt-4 text-4xl font-display font-bold tracking-tight text-glow-dark">
              Defy the limits.
            </h2>
            <p className="mt-4 text-gray-400 text-sm">
              Hover your cursor near the cards. Feel the magnetic anti-gravity repulsion field push them organically in 3D space.
            </p>
          </div>
        </section>

        {/* SECTION 4 — Infinite Data Tunnel */}
        <section id="s4" className="h-[100vh] flex flex-col justify-center items-start px-12 md:px-32 text-left">
          <div className="max-w-xl">
            <span className="text-xs font-semibold tracking-widest text-brand-violet uppercase">
              Phase 04 / Data Tunnel
            </span>
            <h2 className="mt-4 text-4xl md:text-5xl font-display font-bold tracking-tight text-glow-dark">
              Hyper-warp processing.
            </h2>
            <p className="mt-6 text-gray-400 leading-relaxed">
              Plunge into the neural data stream. Routing requests through an infinite tube of light trails and floating metrics at 120GB per second.
            </p>
          </div>
        </section>

        {/* SECTION 5 — Product Breakdown */}
        <section id="s5" className="h-[150vh] relative flex flex-col justify-between items-center py-32 px-6">
          <div className="text-center max-w-xl">
            <span className="text-xs font-semibold tracking-widest text-brand-emerald uppercase">
              Phase 05 / Exploded View
            </span>
            <h2 className="mt-4 text-4xl font-display font-bold tracking-tight text-glow-dark">
              Modular Substrates.
            </h2>
            <p className="mt-3 text-gray-400 text-sm">
              The Core divides. Inspect the individual specialized layers powering the ecosystem.
            </p>
          </div>

          {/* Floating HUD Labels (arranged in space, fading in sequence) */}
          <div className="w-full max-w-5xl grid grid-cols-1 md:grid-cols-4 gap-6 px-6 relative z-20">
            
            {/* Label 4: Top casing */}
            <div className="exploded-label glass-card p-5 rounded-xl border-l-2 border-l-emerald-500">
              <span className="text-xs font-mono text-gray-500">L4 — Top Cover</span>
              <h3 className="font-semibold text-white mt-1">Infrastructure Layer</h3>
              <p className="text-xs text-gray-400 mt-2">Durable alloy seal housing fiber optics and external connection interfaces.</p>
            </div>

            {/* Label 3: Shielding */}
            <div className="exploded-label glass-card p-5 rounded-xl border-l-2 border-l-indigo-500">
              <span className="text-xs font-mono text-gray-500">L3 — Defense</span>
              <h3 className="font-semibold text-white mt-1">Security Layer</h3>
              <p className="text-xs text-gray-400 mt-2">Interlocking zero-trust holographic rings filtering inputs in real time.</p>
            </div>

            {/* Label 2: Glass core */}
            <div className="exploded-label glass-card p-5 rounded-xl border-l-2 border-l-violet-500">
              <span className="text-xs font-mono text-gray-500">L2 — Cognitive</span>
              <h3 className="font-semibold text-white mt-1">AI Substrate</h3>
              <p className="text-xs text-gray-400 mt-2">Crystalline glass disk hosting the pulsating 250M parameter AI model.</p>
            </div>

            {/* Label 1: Base cylinder */}
            <div className="exploded-label glass-card p-5 rounded-xl border-l-2 border-l-cyan-500">
              <span className="text-xs font-mono text-gray-500">L1 — Foundation</span>
              <h3 className="font-semibold text-white mt-1">Core Engine</h3>
              <p className="text-xs text-gray-400 mt-2">Superconducting copper-chromium grid providing raw computing power.</p>
            </div>
            
          </div>
        </section>

        {/* SECTION 6 — Performance Reveal */}
        <section id="s6" className="h-[100vh] flex flex-col justify-center items-center px-6 text-center bg-black/40 backdrop-blur-sm">
          <div className="max-w-4xl">
            <span className="text-xs font-semibold tracking-widest text-brand-cyan uppercase">
              Phase 06 / Benchmarks
            </span>
            <h2 className="mt-4 text-4xl md:text-5xl font-display font-bold tracking-tight text-glow-dark mb-16">
              Velocity that speaks for itself.
            </h2>
            
            {/* Grid of counter numbers */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-16">
              
              <div className="flex flex-col items-center">
                <div ref={stat1Ref} className="text-4xl md:text-6xl font-display font-bold text-glow text-cyan-400">
                  0%
                </div>
                <span className="text-xs text-gray-400 uppercase tracking-widest mt-2 font-mono">Uptime SLA</span>
              </div>

              <div className="flex flex-col items-center">
                <div ref={stat2Ref} className="text-4xl md:text-6xl font-display font-bold text-glow text-violet-400">
                  0M+
                </div>
                <span className="text-xs text-gray-400 uppercase tracking-widest mt-2 font-mono">API Queries/sec</span>
              </div>

              <div className="flex flex-col items-center">
                <div ref={stat3Ref} className="text-4xl md:text-6xl font-display font-bold text-glow text-indigo-400">
                  0
                </div>
                <span className="text-xs text-gray-400 uppercase tracking-widest mt-2 font-mono">Edge PoPs</span>
              </div>

              <div className="flex flex-col items-center">
                <div ref={stat4Ref} className="text-4xl md:text-6xl font-display font-bold text-glow text-emerald-400">
                  0ms
                </div>
                <span className="text-xs text-gray-400 uppercase tracking-widest mt-2 font-mono">Latency SLA</span>
              </div>

            </div>
          </div>
        </section>

        {/* SECTION 7 — Neural Network */}
        <section id="s7" className="h-[100vh] flex flex-col justify-center items-start px-12 md:px-32 text-left">
          <div className="max-w-xl">
            <span className="text-xs font-semibold tracking-widest text-brand-indigo uppercase">
              Phase 07 / Connections
            </span>
            <h2 className="mt-4 text-4xl md:text-5xl font-display font-bold tracking-tight text-glow-dark">
              A living ecosystem.
            </h2>
            <p className="mt-6 text-gray-400 leading-relaxed">
              Every node connects. Dynamic lines are generated in real-time. Hover your cursor to distort the pathways, carving new routing patterns through the network grid.
            </p>
          </div>
        </section>

        {/* SECTION 8 — AI Visualization */}
        <section id="s8" className="h-[100vh] flex flex-col justify-center items-end px-12 md:px-32 text-right">
          <div className="max-w-xl">
            <span className="text-xs font-semibold tracking-widest text-brand-violet uppercase">
              Phase 08 / Cognitive Lobe
            </span>
            <h2 className="mt-4 text-4xl md:text-5xl font-display font-bold tracking-tight text-glow-dark">
              Synaptic intelligence.
            </h2>
            <p className="mt-6 text-gray-400 leading-relaxed">
              Witness the network coalesce into a pulsing neural center. Folds breathe, nodes spark, and glowing feedback pathways simulate dynamic cognitive growth.
            </p>
          </div>
        </section>

        {/* SECTION 9 — The Reveal */}
        <section id="s9" className="h-[100vh] flex flex-col justify-center items-center px-6 text-center">
          <div className="max-w-3xl">
            <span className="text-xs font-semibold tracking-widest text-brand-cyan uppercase">
              Phase 09 / Ecosystem
            </span>
            <h2 className="mt-4 text-5xl md:text-7xl font-display font-bold tracking-tight text-glow text-glow-dark text-transparent bg-clip-text bg-gradient-to-r from-white via-gray-300 to-gray-500">
              Built for what's next.
            </h2>
            <p className="mt-6 text-gray-400 max-w-md mx-auto">
              Everything you've seen converges into a single, unified computing mesh. Scalable, secure, and infinitely elastic.
            </p>
          </div>
        </section>

        {/* SECTION 10 — Final CTA */}
        <section id="s10" className="h-[100vh] flex flex-col justify-between items-center py-20 px-6 text-center">
          <div className="my-auto flex flex-col items-center">
            <span className="text-xs font-semibold tracking-widest text-brand-emerald uppercase mb-4">
              Phase 10 / Deploy
            </span>
            <h2 className="text-5xl md:text-7xl font-display font-bold tracking-tight text-glow text-glow-dark mb-8">
              Start building the future.
            </h2>
            
            {/* Magnetic CTA Button */}
            <MagneticButton className="shadow-[0_0_50px_rgba(99,102,241,0.2)]">
              Enter Platform
              <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
            </MagneticButton>
          </div>

          {/* Premium Apple-Style Footer */}
          <footer className="w-full max-w-5xl flex flex-col md:flex-row justify-between items-center border-t border-white/5 pt-8 text-xs text-gray-500 gap-4">
            <div className="flex gap-2 items-center">
              <span>© 2026 Antigravity Inc. All rights reserved.</span>
            </div>
            <div className="flex gap-6">
              <a href="#" className="hover:text-white transition-colors">Privacy</a>
              <a href="#" className="hover:text-white transition-colors">Terms</a>
              <a href="#" className="hover:text-white transition-colors">Docs</a>
              <a href="#" className="hover:text-white transition-colors">Github</a>
            </div>
          </footer>
        </section>

      </div>
    </div>
  );
}

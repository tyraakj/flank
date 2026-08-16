"use client";

import { Button } from "@/components/ui/button";
import { Target, ChevronRight, ArrowRight, PlayCircle } from "lucide-react";
import { motion, useScroll, useTransform } from "framer-motion";
import { HeroDashboard } from "@/components/hero/hero-dashboard";
import { FlankLogo } from "@/components/flank/logo";

export default function Home() {
  const { scrollY } = useScroll();
  const heroY = useTransform(scrollY, [0, 500], [0, 150]);
  const heroOpacity = useTransform(scrollY, [0, 300], [1, 0]);

  return (
    <main className="min-h-screen bg-background text-foreground overflow-hidden selection:bg-primary/20 selection:text-primary">
      {/* Navbar */}
      <nav className="fixed top-0 w-full z-50 bg-white/60 backdrop-blur-xl border-b border-white/20">
        <div className="container mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <FlankLogo size={26} className="text-black" />
            <span className="text-2xl font-bold tracking-tight">flank</span>
          </div>
          <div className="hidden md:flex items-center gap-8 text-[13px] font-semibold text-slate-800 tracking-widest">
            <a href="#platform" className="hover:text-black transition-colors">
              PLATFORM
            </a>
            <a href="#features" className="hover:text-black transition-colors">
              FEATURES
            </a>
            <a href="#manifesto" className="hover:text-black transition-colors">
              MANIFESTO
            </a>
            <a href="#blog" className="hover:text-black transition-colors">
              BLOG
            </a>
          </div>
          <div className="flex items-center gap-6">
            <a
              href="#"
              className="hidden md:block text-[13px] font-bold text-black tracking-widest hover:text-pink-500 transition-colors"
            >
              BOOK A DEMO
            </a>
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.96 }}>
              <Button className="relative overflow-hidden group rounded-full px-6 h-11 bg-pink-500 hover:bg-pink-600 text-white font-bold tracking-widest text-[12px] shadow-[0_4px_16px_rgba(236,72,153,0.35)] hover:shadow-[0_6px_22px_rgba(236,72,153,0.5)] transition-all uppercase border-0">
                <span className="relative z-10 flex items-center gap-1.5">
                  Join Waitlist
                  <ChevronRight className="w-3.5 h-3.5 transition-transform duration-300 group-hover:translate-x-1" />
                </span>
                {/* Diagonal subtle light sweep sheen */}
                <span className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-white/30 to-transparent pointer-events-none" />
              </Button>
            </motion.div>
          </div>
        </div>
      </nav>

      {/* Split-Layout Hero Section */}
      <section className="relative pt-24 pb-20 overflow-hidden bg-white">
        <div className="container mx-auto px-6 lg:px-12">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Left Column: Content */}
            <motion.div
              className="flex flex-col items-start text-left z-10"
              style={{ y: heroY, opacity: heroOpacity }}
            >
              <motion.h1
                className="text-5xl md:text-7xl font-serif tracking-tight mb-6 leading-[1.15] text-slate-900"
                style={{
                  fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
                }}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
              >
                Infuse your strategy
                <br />
                with data: simply
                <br />
                <span className="relative inline-block my-1">
                  <span className="relative z-10 px-3 text-slate-950 font-bold">add Flank.</span>
                  <span
                    className="absolute inset-0 bg-[#FDE047]/90 -rotate-1 scale-105 rounded-xs -z-0 transform -translate-y-0.5 shadow-[0_3px_10px_rgba(250,204,21,0.35)] mix-blend-multiply pointer-events-none"
                    style={{
                      clipPath:
                        "polygon(0% 2%, 2% 20%, 0% 40%, 2% 60%, 0% 80%, 2% 100%, 100% 98%, 98% 80%, 100% 60%, 98% 40%, 100% 20%, 98% 0%)",
                    }}
                    aria-hidden="true"
                  />
                </span>
              </motion.h1>

              <motion.p
                className="text-lg text-slate-600 mb-8 max-w-[400px] leading-relaxed font-medium"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                Transform a single URL into a comprehensive competitive analysis report. Understand
                your market, justify your pricing, and find your edge.
              </motion.p>

              <motion.div
                className="flex flex-wrap items-center gap-4 pt-2"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
              >
                {/* Creative Primary CTA */}
                <motion.div
                  whileHover={{ scale: 1.03, y: -2 }}
                  whileTap={{ scale: 0.97 }}
                  className="relative group"
                >
                  <Button className="relative overflow-hidden rounded-full px-8 h-14 bg-pink-500 hover:bg-pink-600 text-white font-bold text-base shadow-[0_10px_30px_-4px_rgba(236,72,153,0.5)] hover:shadow-[0_18px_38px_-4px_rgba(236,72,153,0.65)] transition-all border-0 flex items-center gap-3">
                    <span className="relative z-10 flex items-center gap-2">
                      Join the Waitlist
                      <ArrowRight className="w-5 h-5 transition-transform duration-300 group-hover:translate-x-1.5" />
                    </span>
                    {/* Animated glossy sheen sweep */}
                    <span className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/35 to-transparent pointer-events-none" />
                  </Button>
                </motion.div>

                {/* Secondary 'How it works' Button */}
                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                  <Button
                    variant="ghost"
                    className="rounded-full px-6 h-14 font-semibold text-base text-slate-700 hover:text-slate-950 hover:bg-slate-100 border border-slate-200/80 hover:border-slate-300 flex items-center gap-2.5 transition-all shadow-xs"
                  >
                    <PlayCircle className="w-5 h-5 text-pink-500" />
                    How it works
                  </Button>
                </motion.div>
              </motion.div>
            </motion.div>

            {/* Right Column: Vibrant Dithered Background & UI */}
            <motion.div
              className="relative w-full h-[600px] lg:h-[800px] flex items-center justify-center"
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{
                duration: 0.8,
                delay: 0.4,
                type: "spring",
                bounce: 0.2,
              }}
            >
              {/* Vibrant Background Graphic */}
              <div
                className="absolute inset-[-20%] lg:inset-[-50%] bg-cover bg-center rounded-l-[100px] opacity-90 mix-blend-multiply"
                style={{
                  backgroundImage: `url('/vibrant_gradient.jpg')`,
                  filter: "contrast(1.05) saturate(1.1) brightness(1.05)",
                }}
              />

              {/* Dashboard Overlay */}
              <div className="relative z-20 w-[120%] lg:w-[140%] -ml-10 lg:-ml-20">
                <HeroDashboard />
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features Section - Kreia Style */}
      <section id="features" className="py-24 px-4 bg-[#FAFAFA]">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-green-100 text-green-700 text-sm font-semibold mb-6">
              Why Flank $
            </span>
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-slate-900 max-w-2xl mx-auto">
              Everything your revenue team needs to move faster
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {/* Card 1: Discovery */}
            <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm flex flex-col h-[400px]">
              <div className="h-[60%] bg-slate-50 relative overflow-hidden flex items-center justify-center p-6 border-b border-slate-100">
                {/* Concentric rings graphic */}
                <div className="absolute w-[200%] h-[200%] rounded-full border border-dashed border-slate-300 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                <div className="absolute w-[150%] h-[150%] rounded-full border border-dashed border-slate-300 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                <div className="absolute w-[100%] h-[100%] rounded-full border border-dashed border-slate-300 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />

                {/* Floating nodes */}
                <div className="absolute w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center top-10 left-10 text-orange-600 shadow-sm">
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8" />
                    <path d="M21 3v5h-5" />
                  </svg>
                </div>
                <div className="absolute w-16 h-16 bg-black rounded-full flex items-center justify-center top-8 right-16 text-white shadow-sm">
                  <span className="font-bold text-xl">X</span>
                </div>
                <div className="absolute w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center bottom-12 left-16 text-amber-600 shadow-sm">
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
                  </svg>
                </div>
                <div className="absolute w-20 h-20 bg-orange-100/80 rounded-full flex items-center justify-center bottom-6 right-20 text-orange-600 shadow-sm">
                  <Target className="w-8 h-8" />
                </div>
              </div>
              <div className="h-[40%] p-6 flex flex-col justify-center">
                <div className="flex items-start gap-4">
                  <div className="p-2 border border-slate-200 rounded-lg shrink-0 text-orange-600 bg-slate-50">
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900 mb-1">Unified Discovery</h3>
                    <p className="text-sm text-slate-500 leading-relaxed">
                      Connect competitors, market signals, and pricing data in one clean dashboard.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Card 2: Extraction */}
            <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm flex flex-col h-[400px]">
              <div className="h-[60%] bg-slate-50 relative overflow-hidden flex items-end justify-center p-6 border-b border-slate-100">
                {/* Folder/Chart graphic */}
                <div className="relative w-full max-w-[240px]">
                  <div className="absolute -top-12 left-1/2 -translate-x-1/2 flex gap-3 z-0">
                    <div className="p-2 bg-orange-50 rounded-lg text-orange-600 shadow-sm border border-slate-200/50">
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                        <line x1="16" y1="2" x2="16" y2="6" />
                        <line x1="8" y1="2" x2="8" y2="6" />
                        <line x1="3" y1="10" x2="21" y2="10" />
                      </svg>
                    </div>
                    <div className="p-2 bg-amber-50 rounded-lg text-amber-600 shadow-sm border border-slate-200/50">
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                      </svg>
                    </div>
                    <div className="p-2 bg-pink-50 rounded-lg text-pink-600 shadow-sm border border-slate-200/50">
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
                      </svg>
                    </div>
                  </div>

                  {/* Documents stack */}
                  <div className="w-[90%] mx-auto h-8 bg-white border-t border-l border-r border-slate-200 rounded-t-xl opacity-50 relative z-10" />
                  <div className="w-[95%] mx-auto h-8 bg-white border-t border-l border-r border-slate-200 rounded-t-xl opacity-75 -mt-4 relative z-20" />

                  {/* Main Document */}
                  <div className="w-full h-32 bg-white border border-slate-200 rounded-t-xl shadow-lg -mt-4 relative z-30 flex flex-col items-center justify-center p-4">
                    <div className="w-32 h-16 relative overflow-hidden flex items-end justify-center mb-2">
                      <div className="absolute w-32 h-32 rounded-full border-[16px] border-orange-100 top-0 left-0" />
                      <div className="absolute w-32 h-32 rounded-full border-[16px] border-orange-500 border-l-transparent border-b-transparent top-0 left-0 -rotate-45" />
                    </div>
                    <div className="text-[10px] text-slate-400 font-medium">May 2026</div>
                  </div>
                </div>
              </div>
              <div className="h-[40%] p-6 flex flex-col justify-center">
                <div className="flex items-start gap-4">
                  <div className="p-2 border border-slate-200 rounded-lg shrink-0 text-orange-500 bg-slate-50">
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                      <polyline points="14 2 14 8 20 8" />
                      <line x1="16" y1="13" x2="8" y2="13" />
                      <line x1="16" y1="17" x2="8" y2="17" />
                      <polyline points="10 9 9 9 8 9" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900 mb-1">Automated Reports</h3>
                    <p className="text-sm text-slate-500 leading-relaxed">
                      Generate clear extraction reports for your team or leadership in seconds.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Card 3: Strategy */}
            <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm flex flex-col h-[400px]">
              <div className="h-[60%] bg-slate-50 relative overflow-hidden flex flex-col items-center justify-center p-6 border-b border-slate-100">
                {/* Metric UI widget */}
                <div className="w-full flex items-center justify-between gap-4 h-full relative">
                  {/* Left partial card */}
                  <div className="h-32 w-16 bg-white border border-slate-200 rounded-r-xl shadow-md absolute left-0 flex flex-col p-3">
                    <div className="w-8 h-8 rounded-lg bg-orange-50 text-orange-500 flex items-center justify-center mb-auto border border-orange-100">
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <circle cx="9" cy="21" r="1" />
                        <circle cx="20" cy="21" r="1" />
                        <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
                      </svg>
                    </div>
                  </div>

                  {/* Main Metric Card */}
                  <div className="h-40 w-full max-w-[200px] bg-white border border-slate-200 rounded-xl shadow-lg relative z-10 mx-auto flex flex-col p-4 justify-between">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="text-[10px] text-slate-500 font-medium mb-1">
                          Win Rate Edge
                        </div>
                        <div className="text-2xl font-bold text-slate-900">32.4%</div>
                      </div>
                      <div className="p-1.5 bg-green-100 text-green-700 rounded text-xs font-bold border border-green-200">
                        $
                      </div>
                    </div>
                    <div className="flex items-center gap-1 text-[11px] font-medium mt-auto">
                      <span className="text-green-600 flex items-center">
                        <svg
                          width="12"
                          height="12"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="3"
                        >
                          <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
                          <polyline points="17 6 23 6 23 12" />
                        </svg>{" "}
                        20.1%
                      </span>
                      <span className="text-slate-400">vs last month</span>
                    </div>
                  </div>

                  {/* Right partial card */}
                  <div className="h-32 w-16 bg-white border border-slate-200 rounded-l-xl shadow-md absolute right-0 flex flex-col p-3">
                    <div className="text-[10px] text-slate-500 font-medium mb-1">Conversion</div>
                    <div className="text-lg font-bold text-slate-900 mb-auto">3.2%</div>
                  </div>
                </div>
              </div>
              <div className="h-[40%] p-6 flex flex-col justify-center">
                <div className="flex items-start gap-4">
                  <div className="p-2 border border-slate-200 rounded-lg shrink-0 text-orange-500 bg-slate-50">
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900 mb-1">Real-time Performance</h3>
                    <p className="text-sm text-slate-500 leading-relaxed">
                      Track conversion, revenue, and campaign results as they happen.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/40 py-12 px-4 mt-20 bg-slate-50">
        <div className="container mx-auto text-center">
          <div className="flex items-center justify-center gap-2.5 mb-6">
            <FlankLogo size={22} className="text-slate-900" />
            <span className="font-bold text-slate-900">Flank</span>
          </div>
          <p className="text-sm text-slate-500 mb-4">Competitive Intelligence Platform</p>
          <div className="flex items-center justify-center gap-4 text-sm text-slate-500">
            <a href="#" className="hover:text-slate-900 transition-colors">
              Privacy Policy
            </a>
            <a href="#" className="hover:text-slate-900 transition-colors">
              Terms of Service
            </a>
          </div>
        </div>
      </footer>
    </main>
  );
}

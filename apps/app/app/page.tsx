"use client"

import { Button } from "@/components/ui/button"
import { Target, ChevronRight, Search, Activity, Database, Zap, Lock, Sparkles, BarChart3, Shield, ArrowRight, CheckCircle2, Globe } from "lucide-react"
import { motion, useScroll, useTransform, AnimatePresence } from "framer-motion"
import { useEffect, useState } from "react"

// SVG Dither pattern as a data URI
const ditherPattern = `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`

export default function Home() {
  const { scrollY } = useScroll()
  const heroY = useTransform(scrollY, [0, 500], [0, 150])
  const heroOpacity = useTransform(scrollY, [0, 300], [1, 0])

  // Animation State Machine
  const [animationStep, setAnimationStep] = useState(0)

  useEffect(() => {
    const timer = setInterval(() => {
      setAnimationStep((prev) => (prev + 1) % 4)
    }, 4000) // Change step every 4 seconds
    return () => clearInterval(timer)
  }, [])

  return (
    <main className="min-h-screen bg-background text-foreground overflow-hidden selection:bg-primary/20 selection:text-primary">
      
      {/* Navbar */}
      <nav className="fixed top-0 w-full z-50 bg-background/80 backdrop-blur-xl border-b border-border/40">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 bg-gradient-to-br from-primary to-primary/80 rounded-lg flex items-center justify-center shadow-sm">
              <Target className="h-4 w-4 text-white" />
            </div>
            <span className="text-xl font-bold tracking-tight">Flank</span>
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-muted-foreground">
            <a href="#features" className="hover:text-foreground transition-colors">Platform</a>
            <a href="#demo" className="hover:text-foreground transition-colors">Components</a>
            <a href="#about" className="hover:text-foreground transition-colors">Manifesto</a>
          </div>
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" className="hidden md:flex text-muted-foreground hover:text-foreground">Sign In</Button>
            <Button size="sm" className="rounded-full px-6 bg-black text-white hover:bg-black/90">Join Waitlist</Button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-40 pb-24 px-4 overflow-hidden">
        {/* Dithered Background */}
        <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
          {/* Base gradient */}
          <div className="absolute inset-0 bg-gradient-to-b from-white via-slate-50 to-slate-100/50" />
          
          {/* Subtle colorful glows for flavor */}
          <div className="absolute top-0 left-[20%] w-[500px] h-[500px] bg-pink-400/10 rounded-full blur-[100px] mix-blend-multiply" />
          <div className="absolute top-[20%] right-[20%] w-[600px] h-[600px] bg-purple-400/10 rounded-full blur-[120px] mix-blend-multiply" />
          
          {/* Dither texture overlay */}
          <div 
            className="absolute inset-0 opacity-[0.03] mix-blend-multiply"
            style={{ backgroundImage: ditherPattern }}
          />
        </div>

        <motion.div 
          className="container mx-auto max-w-5xl text-center relative z-10"
          style={{ y: heroY, opacity: heroOpacity }}
        >
          <motion.h1 
            className="text-5xl md:text-7xl font-semibold tracking-tight mb-6 leading-[1.1]"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            Anyone can find competitors.<br/>
            Can you prove <span className="bg-gradient-to-r from-pink-500 via-purple-500 to-orange-500 bg-clip-text text-transparent">how to beat them?</span>
          </motion.h1>

          <motion.p 
            className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            One input: your product's URL. One output: a live, fully cited report revealing your competitors' pricing, positioning, features, and your strategic edge.
          </motion.p>

          <motion.div 
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <Button size="lg" className="rounded-full px-8 h-14 text-base w-full sm:w-auto bg-black text-white hover:bg-black/90 shadow-lg">
              Join the Waitlist
            </Button>
            <Button size="lg" variant="outline" className="rounded-full px-8 h-14 text-base w-full sm:w-auto border-border/80 bg-white/50 backdrop-blur-sm hover:bg-slate-50">
              View Sample Report
            </Button>
          </motion.div>
        </motion.div>

        {/* Animated Dashboard Flow Graphic */}
        <motion.div 
          className="container mx-auto max-w-5xl mt-20 relative z-20"
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.4 }}
        >
          <div className="rounded-2xl border border-border/50 bg-white/60 backdrop-blur-2xl shadow-[0_20px_60px_-15px_rgba(0,0,0,0.05)] overflow-hidden p-2">
            <div className="rounded-xl border border-border/40 bg-white overflow-hidden aspect-[16/9] relative flex flex-col">
              
              {/* Fake Window Header */}
              <div className="h-12 border-b border-border/40 flex items-center px-4 gap-2 bg-slate-50/50">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-400/80" />
                  <div className="w-3 h-3 rounded-full bg-amber-400/80" />
                  <div className="w-3 h-3 rounded-full bg-green-400/80" />
                </div>
                <div className="mx-auto bg-white border border-border/40 rounded-md px-32 py-1 text-xs text-muted-foreground shadow-sm">
                  app.flank.ai
                </div>
              </div>

              {/* Animation Container */}
              <div className="flex-1 relative overflow-hidden bg-slate-50">
                <AnimatePresence mode="wait">
                  
                  {/* STEP 0: INPUT */}
                  {animationStep === 0 && (
                    <motion.div 
                      key="step-0"
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, y: -20 }}
                      className="absolute inset-0 flex flex-col items-center justify-center p-8"
                    >
                      <div className="w-16 h-16 bg-gradient-to-br from-primary/10 to-primary/5 rounded-2xl flex items-center justify-center mb-6 shadow-sm border border-primary/10">
                        <Target className="h-8 w-8 text-primary" />
                      </div>
                      <h2 className="text-2xl font-semibold mb-2">Analyze a Target</h2>
                      <p className="text-muted-foreground mb-8 text-sm">Enter a URL to generate a competitive intelligence report.</p>
                      
                      <div className="w-full max-w-lg flex gap-2">
                        <div className="relative flex-1 h-12 bg-white border border-border/60 rounded-lg shadow-sm flex items-center px-4 overflow-hidden">
                          <Search className="h-4 w-4 text-muted-foreground mr-2 shrink-0" />
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: "100%" }}
                            transition={{ duration: 2, ease: "linear" }}
                            className="overflow-hidden whitespace-nowrap text-sm"
                          >
                            https://your-product.com
                          </motion.div>
                          {/* Blinking cursor */}
                          <motion.div 
                            animate={{ opacity: [1, 0] }} 
                            transition={{ repeat: Infinity, duration: 0.8 }}
                            className="w-[2px] h-5 bg-primary ml-1"
                          />
                        </div>
                        <Button className="h-12 px-6 bg-black text-white hover:bg-black/90">Analyze</Button>
                      </div>
                    </motion.div>
                  )}

                  {/* STEP 1: DISCOVERY */}
                  {animationStep === 1 && (
                    <motion.div 
                      key="step-1"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 1.05 }}
                      className="absolute inset-0 flex flex-col items-center justify-center p-8"
                    >
                      <h2 className="text-lg font-medium mb-12 text-slate-600">Discovering Competitors...</h2>
                      
                      <div className="relative w-64 h-64 flex items-center justify-center">
                        <motion.div 
                          animate={{ scale: [1, 2], opacity: [0.5, 0] }}
                          transition={{ repeat: Infinity, duration: 2 }}
                          className="absolute w-32 h-32 rounded-full border-2 border-pink-400"
                        />
                        <motion.div 
                          animate={{ scale: [1, 2], opacity: [0.5, 0] }}
                          transition={{ repeat: Infinity, duration: 2, delay: 1 }}
                          className="absolute w-32 h-32 rounded-full border-2 border-purple-400"
                        />
                        <div className="w-16 h-16 bg-gradient-to-br from-pink-500 to-purple-500 rounded-full shadow-lg flex items-center justify-center z-10">
                          <Globe className="text-white h-6 w-6" />
                        </div>
                        
                        {/* Nodes popping up */}
                        {[
                          { top: "10%", left: "20%", delay: 0.2 },
                          { top: "30%", left: "80%", delay: 0.6 },
                          { top: "80%", left: "30%", delay: 1.2 },
                          { top: "60%", left: "10%", delay: 1.8 },
                          { top: "75%", left: "75%", delay: 2.4 },
                        ].map((pos, i) => (
                          <motion.div 
                            key={i}
                            initial={{ scale: 0, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ delay: pos.delay, type: "spring" }}
                            className="absolute w-8 h-8 bg-white border border-border rounded-full shadow-sm flex items-center justify-center"
                            style={{ top: pos.top, left: pos.left }}
                          >
                            <div className="w-4 h-4 bg-slate-200 rounded-sm" />
                          </motion.div>
                        ))}
                      </div>
                    </motion.div>
                  )}

                  {/* STEP 2: EXTRACTION */}
                  {animationStep === 2 && (
                    <motion.div 
                      key="step-2"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0, x: -20 }}
                      className="absolute inset-0 p-8 flex gap-6"
                    >
                      <div className="flex-1 flex flex-col h-full bg-white border border-border/50 rounded-xl shadow-sm p-6 overflow-hidden">
                        <div className="h-6 w-32 bg-slate-100 rounded mb-6" />
                        <div className="flex gap-4 mb-4">
                          <div className="flex-1 h-8 bg-slate-50 rounded border border-border/40" />
                          <div className="flex-1 h-8 bg-purple-50 border border-purple-100 rounded" />
                          <div className="flex-1 h-8 bg-slate-50 rounded border border-border/40" />
                        </div>
                        {Array.from({length: 4}).map((_, i) => (
                          <motion.div 
                            key={i}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.2 }}
                            className="flex gap-4 mb-3"
                          >
                            <div className="flex-1 h-10 bg-slate-50 rounded" />
                            <div className="flex-1 h-10 bg-slate-50 rounded flex items-center justify-center">
                              <CheckCircle2 className="w-4 h-4 text-slate-300" />
                            </div>
                            <div className="flex-1 h-10 bg-slate-50 rounded flex items-center justify-center">
                              <CheckCircle2 className="w-4 h-4 text-slate-300" />
                            </div>
                          </motion.div>
                        ))}
                      </div>
                      
                      <div className="w-1/3 flex flex-col gap-4">
                        <motion.div 
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.5 }}
                          className="bg-white border border-border/50 rounded-xl shadow-sm p-6 flex-1"
                        >
                          <div className="h-4 w-20 bg-slate-100 rounded mb-4" />
                          <div className="space-y-3">
                            <div className="h-2 w-full bg-slate-100 rounded" />
                            <div className="h-2 w-4/5 bg-slate-100 rounded" />
                            <div className="h-2 w-5/6 bg-slate-100 rounded" />
                          </div>
                          <div className="mt-4 flex gap-2">
                            <div className="h-6 w-16 bg-green-50 rounded-full" />
                            <div className="h-6 w-16 bg-amber-50 rounded-full" />
                          </div>
                        </motion.div>
                        
                        <motion.div 
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.8 }}
                          className="bg-gradient-to-br from-purple-500 to-fuchsia-500 rounded-xl shadow-sm p-6 text-white flex flex-col justify-center items-center"
                        >
                          <Database className="w-8 h-8 mb-2 opacity-80" />
                          <div className="text-2xl font-bold">1,240</div>
                          <div className="text-xs opacity-80 text-center mt-1">Data points extracted</div>
                        </motion.div>
                      </div>
                    </motion.div>
                  )}

                  {/* STEP 3: STRATEGY */}
                  {animationStep === 3 && (
                    <motion.div 
                      key="step-3"
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0 }}
                      className="absolute inset-0 p-8 flex flex-col"
                    >
                      <div className="flex justify-between items-center mb-8">
                        <h2 className="text-2xl font-semibold">Your Competitive Edge</h2>
                        <Button size="sm" className="bg-black text-white rounded-full">Export PDF</Button>
                      </div>
                      
                      <div className="flex gap-6 flex-1">
                        <div className="w-2/3 space-y-4">
                          {[
                            { color: "from-orange-500 to-red-500", text: "Target their mid-market pricing gap" },
                            { color: "from-pink-500 to-purple-500", text: "Emphasize your SOC2 compliance" },
                            { color: "from-blue-500 to-cyan-500", text: "Highlight unlimited seat structure" }
                          ].map((opp, i) => (
                            <motion.div 
                              key={i}
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: i * 0.3 }}
                              className="bg-white border border-border/50 rounded-xl p-4 shadow-sm flex items-start gap-4"
                            >
                              <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${opp.color} flex items-center justify-center shrink-0`}>
                                <Sparkles className="w-5 h-5 text-white" />
                              </div>
                              <div>
                                <div className="font-medium mb-1">{opp.text}</div>
                                <div className="text-sm text-muted-foreground">Based on analysis of 4 competitors who lack this feature...</div>
                              </div>
                            </motion.div>
                          ))}
                        </div>
                        
                        <motion.div 
                          initial={{ opacity: 0, x: 20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.8 }}
                          className="w-1/3 bg-slate-900 text-white rounded-xl p-6 relative overflow-hidden flex flex-col justify-center"
                        >
                          <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/20 blur-[50px] rounded-full" />
                          <div className="absolute bottom-0 left-0 w-32 h-32 bg-pink-500/20 blur-[50px] rounded-full" />
                          
                          <div className="relative z-10 text-center">
                            <div className="text-6xl font-bold mb-2 text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-pink-400">92</div>
                            <div className="text-sm text-slate-400 uppercase tracking-widest font-medium">Confidence Score</div>
                          </div>
                        </motion.div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
        </motion.div>
      </section>

      {/* Features Section - Intelligent Performance */}
      <section id="features" className="py-32 px-4 relative bg-white">
        <div className="container mx-auto max-w-6xl">
          <div className="flex flex-col md:flex-row gap-10 items-end justify-between mb-16">
            <div className="max-w-xl">
              <h2 className="text-4xl md:text-5xl font-bold tracking-tight mb-4 text-slate-900">
                Built for Competitive <span className="text-transparent bg-clip-text bg-gradient-to-r from-slate-400 to-slate-800">Dominance</span>
              </h2>
            </div>
            <div className="max-w-md">
              <p className="text-lg text-slate-500">
                A multi-agent pipeline engineered to automatically discover competitors, extract complex pricing models, and surface actionable strategic gaps.
              </p>
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {/* Card 1: Discovery */}
            <motion.div 
              whileHover={{ y: -10 }}
              className="group relative rounded-3xl overflow-hidden text-white flex flex-col shadow-xl"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-pink-500 to-red-500" />
              
              <div className="relative z-10 p-8 flex flex-col h-full">
                <div className="mb-auto">
                  <h3 className="text-2xl font-medium">Automated Discovery</h3>
                  <p className="text-white/80 mt-1">Multi-Angle Web Search</p>
                </div>
                
                <div className="py-16 flex flex-col items-center justify-center relative">
                  {/* Speedometer Graphic */}
                  <div className="relative w-48 h-24 overflow-hidden mb-4">
                    <div className="absolute top-0 left-0 w-48 h-48 rounded-full border-[2px] border-dashed border-white/30" />
                    <div className="absolute top-0 left-0 w-48 h-48 rounded-full border-t-[4px] border-l-[4px] border-white rotate-45 transform origin-center transition-transform duration-1000 group-hover:rotate-90 shadow-[0_0_15px_rgba(255,255,255,0.5)]" />
                  </div>
                  <div className="absolute top-[80px] text-center">
                    <div className="text-6xl font-bold tracking-tighter">
                      100<span className="text-3xl text-white/80">%</span>
                    </div>
                    <div className="text-sm text-white/70 uppercase tracking-widest mt-1 font-medium">Coverage</div>
                  </div>
                </div>

                <div className="mt-auto text-center">
                  <p className="text-white/90 mb-6 font-medium">Identifies true competitors, automatically without manual input.</p>
                  <Button variant="outline" className="w-full rounded-full bg-white text-pink-600 hover:bg-white/90 hover:text-pink-700 border-none font-semibold h-12 shadow-md hover:shadow-lg transition-all">
                    Join Waitlist
                  </Button>
                </div>
              </div>
            </motion.div>

            {/* Card 2: Extraction */}
            <motion.div 
              whileHover={{ y: -10 }}
              className="group relative rounded-3xl overflow-hidden text-white flex flex-col mt-0 md:mt-8 shadow-xl"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500 to-fuchsia-500" />
              
              <div className="relative z-10 p-8 flex flex-col h-full">
                <div className="mb-auto">
                  <h3 className="text-2xl font-medium">Deep Extraction</h3>
                  <p className="text-white/80 mt-1">Pricing & Feature Matrices</p>
                </div>
                
                <div className="py-16 flex flex-col items-center justify-center relative w-full">
                  {/* Matrix Graphic */}
                  <div className="w-full max-w-[200px] space-y-4">
                    <div className="h-3 w-full bg-white/20 rounded-full overflow-hidden shadow-inner">
                      <motion.div className="h-full bg-white rounded-full w-[85%] shadow-[0_0_10px_rgba(255,255,255,0.8)]" />
                    </div>
                    <div className="h-3 w-full bg-white/20 rounded-full overflow-hidden shadow-inner">
                      <motion.div className="h-full bg-white/80 rounded-full w-[60%]" />
                    </div>
                    <div className="h-3 w-full bg-white/20 rounded-full overflow-hidden shadow-inner">
                      <motion.div className="h-full bg-white/50 rounded-full w-[40%]" />
                    </div>
                  </div>
                  <div className="mt-10 text-center">
                    <div className="text-6xl font-bold tracking-tighter">
                      8.2<span className="text-3xl text-white/80">K</span>
                    </div>
                    <div className="text-sm text-white/70 uppercase tracking-widest mt-1 font-medium">Data Points Read</div>
                  </div>
                </div>

                <div className="mt-auto text-center">
                  <p className="text-white/90 mb-6 font-medium">Reads deep pricing tiers, usage limits, and nested add-ons.</p>
                  <Button variant="outline" className="w-full rounded-full bg-white text-purple-600 hover:bg-white/90 hover:text-purple-700 border-none font-semibold h-12 shadow-md hover:shadow-lg transition-all">
                    Join Waitlist
                  </Button>
                </div>
              </div>
            </motion.div>

            {/* Card 3: Strategy */}
            <motion.div 
              whileHover={{ y: -10 }}
              className="group relative rounded-3xl overflow-hidden text-white flex flex-col shadow-xl"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-orange-400 to-red-500" />
              
              <div className="relative z-10 p-8 flex flex-col h-full">
                <div className="mb-auto">
                  <h3 className="text-2xl font-medium">Actionable Strategy</h3>
                  <p className="text-white/80 mt-1">Ranked Edge Opportunities</p>
                </div>
                
                <div className="py-16 flex flex-col items-center justify-center relative">
                  {/* Line Chart Graphic */}
                  <div className="relative w-full h-24 flex items-end justify-between px-4">
                    <svg className="absolute inset-0 w-full h-full overflow-visible" preserveAspectRatio="none" viewBox="0 0 100 100">
                      <motion.path 
                        d="M0,80 Q20,60 40,70 T80,40 T100,20" 
                        fill="none" 
                        stroke="rgba(255,255,255,0.6)" 
                        strokeWidth="3"
                        className="transition-all duration-1000 group-hover:stroke-white drop-shadow-[0_0_8px_rgba(255,255,255,0.5)]"
                      />
                      <circle cx="0" cy="80" r="4" fill="#fff" className="opacity-80" />
                      <circle cx="40" cy="70" r="4" fill="#fff" className="opacity-80" />
                      <circle cx="80" cy="40" r="4" fill="#fff" className="opacity-80" />
                      <circle cx="100" cy="20" r="6" fill="#fff" className="opacity-100 shadow-[0_0_15px_#fff]" />
                    </svg>
                  </div>
                  <div className="mt-10 text-center">
                    <div className="text-6xl font-bold tracking-tighter">
                      3<span className="text-3xl text-white/80">x</span>
                    </div>
                    <div className="text-sm text-white/70 uppercase tracking-widest mt-1 font-medium">Win Rate Edge</div>
                  </div>
                </div>

                <div className="mt-auto text-center">
                  <p className="text-white/90 mb-6 font-medium">100% cited, evidence-backed recommendations for your team.</p>
                  <Button variant="outline" className="w-full rounded-full bg-white text-orange-600 hover:bg-white/90 hover:text-orange-700 border-none font-semibold h-12 shadow-md hover:shadow-lg transition-all">
                    Join Waitlist
                  </Button>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/40 py-12 px-4 mt-20 bg-slate-50">
        <div className="container mx-auto text-center">
          <div className="flex items-center justify-center gap-2 mb-6">
            <div className="h-6 w-6 bg-primary rounded flex items-center justify-center shadow-sm">
              <Target className="h-3 w-3 text-white" />
            </div>
            <span className="font-bold text-slate-900">Flank</span>
          </div>
          <p className="text-sm text-slate-500 mb-4">Competitive Intelligence Platform</p>
          <div className="flex items-center justify-center gap-4 text-sm text-slate-500">
            <a href="#" className="hover:text-slate-900 transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-slate-900 transition-colors">Terms of Service</a>
          </div>
        </div>
      </footer>
    </main>
  )
}

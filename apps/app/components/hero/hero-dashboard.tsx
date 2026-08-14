"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Search, Bot, CheckCircle2, Database, FileText, Star, Target, Activity, Users, Settings, MessageSquare, LayoutDashboard } from "lucide-react"

export function HeroDashboard() {
  const [step, setStep] = useState(0)
  const [activeTab, setActiveTab] = useState(0)
  const [typedText, setTypedText] = useState("")
  const [isClicking, setIsClicking] = useState(false)
  const targetText = "flank.com/competitor"

  // Sequence Controller
  useEffect(() => {
    let isActive = true;

    const click = async () => {
      setIsClicking(true)
      await new Promise(r => setTimeout(r, 150))
      setIsClicking(false)
    }

    const runSequence = async () => {
      while (isActive) {
        // Reset
        setStep(0)
        setActiveTab(0)
        setTypedText("")
        await new Promise(r => setTimeout(r, 1000))
        if (!isActive) break;

        // Step 1: Input appears
        setStep(1)
        await new Promise(r => setTimeout(r, 400))
        if (!isActive) break;

        // Typing effect
        for (let i = 0; i <= targetText.length; i++) {
          setTypedText(targetText.slice(0, i))
          await new Promise(r => setTimeout(r, 40)) // faster typing
        }
        await new Promise(r => setTimeout(r, 500))
        if (!isActive) break;

        // Step 2: Cursor moves to Analyze
        setStep(2)
        await new Promise(r => setTimeout(r, 800))
        if (!isActive) break;
        await click() // Click Analyze
        await new Promise(r => setTimeout(r, 400))
        if (!isActive) break;

        // Step 3: Expand panel and move cursor to Tab 0
        setStep(3)
        setActiveTab(0) // Pricing Page
        await new Promise(r => setTimeout(r, 800))
        if (!isActive) break;
        await click()
        await new Promise(r => setTimeout(r, 1200)) // View data
        if (!isActive) break;
        
        // Move cursor to Tab 1
        setActiveTab(1) // G2 Reviews
        await new Promise(r => setTimeout(r, 600))
        if (!isActive) break;
        await click()
        await new Promise(r => setTimeout(r, 1200)) // View data
        if (!isActive) break;

        // Move cursor to Tab 2
        setActiveTab(2) // Help Center
        await new Promise(r => setTimeout(r, 600))
        if (!isActive) break;
        await click()
        await new Promise(r => setTimeout(r, 1200)) // View data
        if (!isActive) break;

        // Step 4: Export (Cursor moves to sync)
        setStep(4)
        await new Promise(r => setTimeout(r, 800))
        if (!isActive) break;
        await click() // Click Sync
        
        // Step 5: Slack
        setStep(5)
        await new Promise(r => setTimeout(r, 2500))
        if (!isActive) break;

        // Step 6: Notion
        setStep(6)
        await new Promise(r => setTimeout(r, 2500))
        if (!isActive) break;

        // Step 7: Linear
        setStep(7)
        await new Promise(r => setTimeout(r, 2500))
      }
    }

    runSequence()

    return () => {
      isActive = false
    }
  }, [])

  const getCursorX = () => {
    if (step === 0 || step === 1) return 300;
    if (step === 2) return 130; // Analyze button
    if (step === 3) {
      if (activeTab === 0) return -190;
      if (activeTab === 1) return -75;
      if (activeTab === 2) return 40;
    }
    if (step === 4 || step === 5) return 230; // Save button
    return 300;
  }

  const getCursorY = () => {
    if (step === 0 || step === 1) return 300;
    if (step === 2) return -2; // Analyze button
    if (step === 3) return -175; // Tabs
    if (step === 4 || step === 5) return -175; // Save button
    return 300;
  }

  return (
    <div className="w-full h-full min-h-[500px] bg-transparent relative flex items-center justify-center font-sans pointer-events-none">
      
      {/* The Central Panel */}
      <motion.div
        className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden relative z-10 flex flex-col"
        initial={{ width: 380, height: 60, opacity: 0, y: 20 }}
        animate={{
          width: step >= 3 ? 640 : 380,
          height: step >= 3 ? 400 : 60,
          opacity: step >= 1 ? 1 : 0,
          y: step >= 1 ? 0 : 20,
        }}
        transition={{ duration: 0.6, type: "spring", bounce: 0.2 }}
      >
        {/* State 1 & 2: Search Bar */}
        <AnimatePresence>
          {step < 3 && (
            <motion.div 
              className="absolute inset-0 flex items-center px-4 gap-3"
              exit={{ opacity: 0, y: -20 }}
            >
              <Search className="w-5 h-5 text-slate-400" />
              <div className="flex-1 text-slate-700 font-mono text-sm flex items-center">
                {typedText}
                <motion.span 
                  animate={{ opacity: [1, 0] }} 
                  transition={{ repeat: Infinity, duration: 0.8 }}
                  className="inline-block w-2 h-4 bg-pink-500 ml-1"
                />
              </div>
              <motion.button 
                className="bg-gradient-to-r from-indigo-500 to-pink-500 text-white px-4 py-1.5 rounded-lg text-sm font-semibold flex items-center gap-2 shadow-sm border-0"
                animate={{
                  opacity: (step === 2 && isClicking) ? 0.8 : 1
                }}
                transition={{ duration: 0.1 }}
              >
                Analyze
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* State 3 & 4: Expanded Panel (Dashboard) */}
        <AnimatePresence>
          {(step === 3 || step === 4) && (
            <motion.div 
              className="absolute inset-0 flex"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, filter: "blur(4px)" }}
              transition={{ duration: 0.4 }}
            >
              {/* Sidebar */}
              <div className="w-14 shrink-0 border-r border-slate-100 flex flex-col items-center py-4 gap-6 bg-slate-50/80 z-20">
                <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-pink-500 rounded-lg flex items-center justify-center text-white shadow-sm mb-2">
                  <span className="font-bold text-xs">F</span>
                </div>
                {/* Active link */}
                <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-white shadow-sm border border-slate-200 text-indigo-600 relative">
                  <div className="absolute -left-[17px] w-1 h-4 bg-indigo-600 rounded-r-md" />
                  <Target className="w-4 h-4" />
                </div>
                <div className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400">
                  <Activity className="w-4 h-4" />
                </div>
                <div className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400">
                  <Users className="w-4 h-4" />
                </div>
                <div className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 mt-auto">
                  <Settings className="w-4 h-4" />
                </div>
              </div>

              {/* Main Content */}
              <div className="flex-1 flex flex-col min-w-0">
                {/* Header / Tabs */}
                <div className="h-14 border-b border-slate-100 flex items-center px-4 gap-6 bg-slate-50/50 relative">
                  <div className={`flex items-center gap-2 text-sm font-medium transition-colors ${activeTab === 0 ? "text-slate-900" : "text-slate-400"}`}>
                    <Database className={`w-4 h-4 ${activeTab === 0 ? "text-blue-500" : ""}`} />
                    Pricing Page
                  </div>
                  <div className={`flex items-center gap-2 text-sm font-medium transition-colors ${activeTab === 1 ? "text-slate-900" : "text-slate-400"}`}>
                    <Star className={`w-4 h-4 ${activeTab === 1 ? "text-yellow-500" : ""}`} />
                    G2 Reviews
                  </div>
                  <div className={`flex items-center gap-2 text-sm font-medium transition-colors ${activeTab === 2 ? "text-slate-900" : "text-slate-400"}`}>
                    <FileText className={`w-4 h-4 ${activeTab === 2 ? "text-purple-500" : ""}`} />
                    Help Center
                  </div>

                  {/* Export Options */}
                  <div className="ml-auto flex gap-2">
                    <motion.button
                      className="bg-slate-900 text-white px-3 py-1.5 rounded-md text-xs font-semibold flex items-center gap-2 shadow-sm whitespace-nowrap"
                      animate={{
                        backgroundColor: (step === 4 && isClicking) ? "#020617" : "#0F172A",
                        scale: (step === 4 && isClicking) ? 0.95 : 1
                      }}
                      transition={{ duration: 0.2 }}
                    >
                      <div className="flex -space-x-1">
                        <img 
                          src="https://img.logo.dev/notion.so?token=pk_BZOhereATUe11DHE7ILvBg&format=webp&retina=true" 
                          onError={(e) => { e.currentTarget.src = "https://logo.clearbit.com/notion.so" }}
                          alt="Notion" 
                          className="w-5 h-5 rounded-full border border-slate-900"
                        />
                        <img 
                          src="https://img.logo.dev/slack.com?token=pk_BZOhereATUe11DHE7ILvBg&format=webp&retina=true" 
                          onError={(e) => { e.currentTarget.src = "https://logo.clearbit.com/slack.com" }}
                          alt="Slack" 
                          className="w-5 h-5 rounded-full border border-slate-900"
                        />
                        <img 
                          src="https://img.logo.dev/linear.app?token=pk_BZOhereATUe11DHE7ILvBg&format=webp&retina=true" 
                          onError={(e) => { e.currentTarget.src = "https://logo.clearbit.com/linear.app" }}
                          alt="Linear" 
                          className="w-5 h-5 rounded-full border border-slate-900"
                        />
                      </div>
                      Sync All
                    </motion.button>
                  </div>
                </div>

                {/* Body: Data */}
                <div className="flex-1 p-6 relative overflow-hidden bg-white flex flex-col">
                  
                  {/* Inline AI Status Indicator (Replaces floating box) */}
                  <div className="flex items-center gap-2 mb-4">
                    <motion.div 
                      className="w-2 h-2 rounded-full bg-pink-500"
                      animate={{ opacity: [1, 0.4, 1] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                    />
                    <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">AI Processing Source...</span>
                  </div>

                  {/* Real Data Generating (Re-animates when activeTab changes) */}
                  <div className="flex-1 relative">
                    <AnimatePresence mode="wait">
                      <motion.div 
                        key={activeTab} // Forces re-render and re-animation
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -15 }}
                        transition={{ duration: 0.4 }}
                        className="w-full absolute inset-0"
                      >
                        {activeTab === 0 && (
                          <div className="space-y-4">
                            <div className="flex items-center gap-2 mb-2">
                              <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-[10px] font-bold tracking-wider rounded uppercase">Pricing Insight</span>
                              <span className="text-xs text-slate-400">Extracted in 0.4s</span>
                            </div>
                            <p className="text-sm text-slate-700 font-medium leading-relaxed">
                              Competitor's Enterprise tier is <span className="text-pink-600 font-bold">40% more expensive</span> than Flank, and they just moved SAML/SSO to their unlisted Custom tier.
                            </p>
                            <div className="grid grid-cols-2 gap-4 mt-4">
                              <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.5 }} className="bg-slate-50 border border-slate-100 p-3 rounded-xl">
                                <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">Competitor</div>
                                <div className="text-lg font-bold text-slate-800">$299<span className="text-xs text-slate-400 font-normal">/mo</span></div>
                                <div className="text-[10px] text-slate-500 mt-1 flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-red-400"></span> SSO Paywalled</div>
                              </motion.div>
                              <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.7 }} className="bg-green-50/50 border border-green-100 p-3 rounded-xl">
                                <div className="text-[10px] text-green-600 font-bold uppercase tracking-wider mb-1">Flank</div>
                                <div className="text-lg font-bold text-slate-800">$179<span className="text-xs text-slate-400 font-normal">/mo</span></div>
                                <div className="text-[10px] text-slate-500 mt-1 flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-green-500"></span> SSO Included</div>
                              </motion.div>
                            </div>
                          </div>
                        )}

                        {activeTab === 1 && (
                          <div className="space-y-4">
                            <div className="flex items-center gap-2 mb-2">
                              <span className="px-2 py-0.5 bg-orange-100 text-orange-700 text-[10px] font-bold tracking-wider rounded uppercase">Sentiment Alert</span>
                            </div>
                            <p className="text-sm text-slate-700 font-medium leading-relaxed mb-4">
                              Spike in negative sentiment detected. <span className="font-bold text-slate-900">32 recent reviews</span> mention frustration over sudden forced upgrades and a new "SSO tax".
                            </p>
                            <motion.div 
                              initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }}
                              className="pl-3 border-l-2 border-orange-200 text-xs text-slate-500 italic"
                            >
                              "We were forced to upgrade to the Custom tier just to keep SAML/SSO running. The price jumped 40% overnight."
                            </motion.div>
                          </div>
                        )}

                        {activeTab === 2 && (
                          <div className="space-y-4">
                            <div className="flex items-center gap-2 mb-2">
                              <span className="px-2 py-0.5 bg-purple-100 text-purple-700 text-[10px] font-bold tracking-wider rounded uppercase">Doc Change</span>
                            </div>
                            <p className="text-sm text-slate-700 font-medium leading-relaxed">
                              Competitor silently updated their <span className="font-semibold text-purple-600 cursor-pointer">SSO Setup Guide</span> yesterday, adding a banner that states "SAML/SSO is now exclusively available on Custom plans."
                            </p>
                            <motion.div 
                              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
                              className="mt-4 p-3 bg-slate-50 rounded-lg border border-slate-100"
                            >
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-xs font-bold text-slate-800">Action Recommended</span>
                              </div>
                              <p className="text-[11px] text-slate-500 leading-relaxed">
                                Highlight our out-of-the-box SAML/SSO integrations on upcoming enterprise calls to instantly create technical leverage.
                              </p>
                            </motion.div>
                          </div>
                        )}
                      </motion.div>
                    </AnimatePresence>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* State 5: Export Destination Slide (Slack Mockup) */}
        <AnimatePresence>
          {step === 5 && (
            <motion.div 
              className="absolute inset-0 flex bg-white z-30"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.5, type: "spring", bounce: 0 }}
            >
              {/* Slack Sidebar Mock */}
              <div className="w-48 bg-[#3F0E40] flex flex-col pt-4 shrink-0">
                <div className="px-4 text-white font-bold mb-4 flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-green-500" />
                  Flank HQ
                </div>
                <div className="px-4 text-[#cfc3cf] text-sm mb-1 opacity-60">Channels</div>
                <div className="px-4 text-[#cfc3cf] text-sm mb-1"># general</div>
                <div className="px-4 text-white text-sm bg-[#350d36] py-1 font-medium"># alerts-competitors</div>
                <div className="px-4 text-[#cfc3cf] text-sm mt-1"># sales-wins</div>
              </div>
              
              {/* Slack Chat Area */}
              <div className="flex-1 flex flex-col bg-white">
                <div className="h-14 border-b border-slate-200 flex items-center px-4 font-bold text-slate-800 shadow-sm z-10 gap-3">
                  <img src="https://img.logo.dev/slack.com?token=pk_BZOhereATUe11DHE7ILvBg&format=webp&retina=true" onError={(e) => { e.currentTarget.src = "https://logo.clearbit.com/slack.com" }} alt="Slack" className="w-6 h-6 rounded-sm" />
                  # alerts-competitors
                </div>
                <div className="flex-1 p-6 flex flex-col justify-end pb-8">
                  {/* Past Mock Message */}
                  <div className="flex gap-3 mb-6 opacity-40">
                    <div className="w-9 h-9 bg-blue-500 rounded-md flex items-center justify-center text-white shrink-0 font-bold text-xs">
                      S
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 text-sm">Sarah (Sales)</span>
                        <span className="text-xs text-slate-400">10:42 AM</span>
                      </div>
                      <div className="text-sm text-slate-800 mt-0.5">
                        Has anyone checked if they updated their pricing recently?
                      </div>
                    </div>
                  </div>

                  {/* Incoming Flank Message Animation */}
                  <motion.div 
                    className="flex gap-3"
                    initial={{ opacity: 0, y: 20, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ delay: 0.4, type: "spring", bounce: 0.4, duration: 0.6 }}
                  >
                    <div className="w-9 h-9 bg-[#FA5A2A] rounded-md flex items-center justify-center text-white shrink-0 shadow-sm">
                      <span className="font-bold text-sm">F</span>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 text-sm">Flank Bot</span>
                        <span className="text-[10px] font-bold bg-slate-200 text-slate-600 px-1 rounded uppercase">App</span>
                        <span className="text-xs text-slate-400">Just now</span>
                      </div>
                      <div className="mt-1 text-sm text-slate-800">
                        🚨 <span className="font-semibold">Competitor Insight Detected</span>
                      </div>
                      
                      {/* Slack Attachment Block */}
                      <motion.div 
                        className="mt-2 border-l-4 border-pink-500 pl-3 py-1"
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.8, duration: 0.4 }}
                      >
                        <p className="text-sm font-bold text-slate-800">Pricing Page Change Detected</p>
                        <p className="text-sm text-slate-600 mt-1 leading-relaxed">
                          Competitor's Enterprise tier is <span className="font-semibold text-slate-800">40% more expensive</span> than Flank, and they have moved SAML/SSO exclusively to their Custom tier.
                        </p>
                      </motion.div>
                    </div>
                  </motion.div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* State 6: Export Destination Slide (Notion Mockup) */}
        <AnimatePresence>
          {step === 6 && (
            <motion.div 
              className="absolute inset-0 flex bg-white z-30"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.5, type: "spring", bounce: 0 }}
            >
              {/* Notion Sidebar Mock */}
              <div className="w-48 bg-[#F7F7F5] border-r border-[#EBEBEA] flex flex-col pt-4 shrink-0 px-2">
                <div className="px-2 text-slate-800 font-medium mb-4 flex items-center gap-2 text-sm">
                  <div className="w-5 h-5 bg-slate-900 rounded-[3px] flex items-center justify-center text-white text-[11px] font-bold shadow-sm">F</div>
                  Flank HQ
                </div>
                <div className="px-2 text-slate-500 text-xs mb-1 font-medium mt-4">Favorites</div>
                <div className="px-2 text-slate-700 text-sm mb-1 py-1 rounded bg-[#EBEBEA] font-medium flex items-center gap-2">
                  <img src="https://img.logo.dev/notion.so?token=pk_BZOhereATUe11DHE7ILvBg&format=webp&retina=true" onError={(e) => { e.currentTarget.src = "https://logo.clearbit.com/notion.so" }} alt="Notion" className="w-3.5 h-3.5 opacity-70 grayscale" />
                  Competitor Intel
                </div>
                <div className="px-2 text-slate-600 text-sm py-1 flex items-center gap-2">
                  <span className="text-[13px] opacity-70">📊</span> Pricing Matrix
                </div>
              </div>
              
              {/* Notion Content Area */}
              <div className="flex-1 flex flex-col bg-white overflow-hidden">
                <div className="flex-1 p-8 flex flex-col pt-12">
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                  >
                    <div className="flex items-center gap-4 mb-6">
                      <img src="https://img.logo.dev/notion.so?token=pk_BZOhereATUe11DHE7ILvBg&format=webp&retina=true" onError={(e) => { e.currentTarget.src = "https://logo.clearbit.com/notion.so" }} alt="Notion" className="w-10 h-10 rounded-md shadow-sm" />
                      <div className="text-4xl font-bold text-slate-900 font-serif tracking-tight">Competitor Intel</div>
                    </div>
                    
                    <div className="mt-6 flex flex-col gap-4">
                      <div className="font-bold text-slate-800 text-lg border-b border-slate-100 pb-2">Opportunities Identified</div>
                      
                      <div className="bg-[#F7F7F5] rounded p-4 flex gap-3">
                        <div className="text-xl">💡</div>
                        <div>
                          <div className="font-bold text-slate-800">Highlight SAML/SSO Advantage</div>
                          <div className="text-sm text-slate-600 mt-1">
                            Their enterprise tier limits SSO to the highest custom plan. Flank includes this by default, which can be used as leverage in upcoming deals.
                          </div>
                          <div className="text-xs text-slate-400 mt-2 flex items-center gap-1">
                            <span className="w-2 h-2 rounded-full bg-green-500"></span>
                            High Confidence
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* State 7: Export Destination Slide (Linear Mockup) */}
        <AnimatePresence>
          {step === 7 && (
            <motion.div 
              className="absolute inset-0 flex bg-[#1E1F22] z-30"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.5, type: "spring", bounce: 0 }}
            >
              {/* Linear Sidebar Mock */}
              <div className="w-48 bg-[#2B2D31] border-r border-[#1E1F22] flex flex-col pt-4 shrink-0 text-sm">
                <div className="px-4 text-slate-300 font-medium mb-4 flex items-center gap-2">
                  <div className="w-4 h-4 bg-indigo-500 rounded flex items-center justify-center text-white text-[10px] font-bold">F</div>
                  Flank
                </div>
                <div className="px-4 text-slate-400 text-xs mb-1 font-medium mt-2">Your views</div>
                <div className="px-4 text-slate-300 py-1 flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-blue-400"></div> Inbox
                </div>
                <div className="px-4 text-slate-300 py-1 flex items-center gap-2 bg-[#383A40] rounded mx-2">
                  <div className="w-2 h-2 rounded-full bg-orange-400"></div> My Issues
                </div>
              </div>
              
              {/* Linear Content Area */}
              <div className="flex-1 flex flex-col bg-[#1E1F22]">
                <div className="h-14 border-b border-[#2B2D31] flex items-center px-6 text-slate-300 text-sm font-medium gap-3">
                  <img src="https://img.logo.dev/linear.app?token=pk_BZOhereATUe11DHE7ILvBg&format=webp&retina=true" onError={(e) => { e.currentTarget.src = "https://logo.clearbit.com/linear.app" }} alt="Linear" className="w-6 h-6 rounded-sm" />
                  FLK-128
                </div>
                <div className="flex-1 p-8 flex flex-col">
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                  >
                    <div className="flex items-center gap-3 mb-4">
                      <div className="px-2 py-0.5 rounded bg-[#2B2D31] text-xs font-medium text-slate-300 border border-[#383A40]">Todo</div>
                      <div className="px-2 py-0.5 rounded bg-red-500/10 text-red-400 text-xs font-medium border border-red-500/20">High Priority</div>
                    </div>
                    <div className="text-2xl font-bold text-white mb-6">Create battlecard for new competitor pricing and SSO paywall</div>
                    
                    <div className="text-sm text-slate-300 leading-relaxed max-w-2xl">
                      Flank Bot automatically created this issue based on a recent competitor update. 
                      <br/><br/>
                      <strong>Context:</strong><br/>
                      Competitor recently updated their pricing page to increase Enterprise tier by 40% and moved SAML/SSO exclusively to their Custom tier. We need to update our sales battlecards to highlight our out-of-the-box SSO advantage.
                    </div>
                  </motion.div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* The Animated Cursor */}
      <motion.div
        className="absolute z-50 pointer-events-none drop-shadow-2xl"
        initial={{ x: 300, y: 300, opacity: 0 }}
        animate={{
          x: getCursorX(),
          y: getCursorY(),
          opacity: step >= 2 && step <= 4 ? 1 : 0,
          scale: isClicking ? 0.85 : 1, // trigger click scale
        }}
        transition={{ 
          duration: isClicking ? 0.1 : 0.6, // Fast scale down on click, slower move between points
          ease: "circOut",
        }}
      >
        {/* Classic macOS style cursor */}
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M4 2.5L11 20L13.5 13.5L20 11L4 2.5Z" fill="#1A1A1A" stroke="white" strokeWidth="2" strokeLinejoin="round"/>
        </svg>
      </motion.div>

    </div>
  )
}

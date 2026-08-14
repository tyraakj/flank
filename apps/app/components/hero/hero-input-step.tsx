"use client"

import { motion } from "framer-motion"
import { Search, Target } from "lucide-react"
import { Button } from "@/components/ui/button"

export function HeroInputStep() {
  return (
    <motion.div
      key="step-0"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, y: -20 }}
      className="absolute inset-0 flex flex-col items-center justify-center p-8 bg-slate-50"
    >
      <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mb-6 shadow-sm border border-slate-200">
        <Target className="h-8 w-8 text-slate-800" />
      </div>
      <h2 className="text-2xl font-semibold mb-2 text-slate-900">Analyze a Target</h2>
      <p className="text-slate-500 mb-8 text-sm">Enter a URL to generate a competitive intelligence report.</p>

      <div className="w-full max-w-lg flex gap-3">
        <div className="relative flex-1 h-14 bg-white border border-slate-200 rounded-full shadow-sm flex items-center px-6 overflow-hidden">
          <Search className="h-5 w-5 text-slate-400 mr-3 shrink-0" />
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: "100%" }}
            transition={{ duration: 2, ease: "linear" }}
            className="overflow-hidden whitespace-nowrap text-slate-700 text-base"
          >
            https://your-product.com
          </motion.div>
          {/* Blinking cursor */}
          <motion.div
            animate={{ opacity: [1, 0] }}
            transition={{ repeat: Infinity, duration: 0.8 }}
            className="w-[2px] h-6 bg-slate-900 ml-1"
          />
        </div>
        <Button className="h-14 px-8 rounded-full bg-slate-900 text-white hover:bg-slate-800 text-base shadow-md font-medium">
          Analyze
        </Button>
      </div>
    </motion.div>
  )
}

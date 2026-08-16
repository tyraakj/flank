"use client";

import { motion } from "framer-motion";
import { Search } from "lucide-react";

export function HeroDiscoveryStep() {
  return (
    <motion.div
      key="step-1"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 1.05 }}
      className="absolute inset-0 flex flex-col p-8 bg-slate-50/50"
    >
      <div className="flex flex-col items-center justify-center h-full max-w-lg mx-auto w-full">
        {/* Progress Card Mimicking Reference */}
        <div className="w-full bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-orange-50 rounded-full flex items-center justify-center">
              <Search className="w-6 h-6 text-orange-500" />
            </div>
            <div>
              <div className="text-lg font-medium text-slate-900">Discovery Engine</div>
              <div className="text-sm text-slate-500">Scanning web (20x)</div>
            </div>
          </div>

          <div className="flex items-end gap-1 h-8">
            {Array.from({ length: 24 }).map((_, i) => (
              <motion.div
                key={i}
                initial={{ height: "20%" }}
                animate={{ height: ["20%", "100%", "20%"] }}
                transition={{
                  repeat: Infinity,
                  duration: 1.5,
                  delay: i * 0.05,
                  ease: "easeInOut",
                }}
                className="w-1.5 bg-orange-500 rounded-full opacity-80"
              />
            ))}
          </div>
        </div>

        {/* Nodes / Graph visualization to show web search */}
        <div className="relative w-full h-48 bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden flex items-center justify-center">
          <motion.div
            animate={{ scale: [1, 1.5], opacity: [0.3, 0] }}
            transition={{ repeat: Infinity, duration: 2 }}
            className="absolute w-24 h-24 rounded-full border-2 border-orange-200"
          />
          <div className="w-12 h-12 bg-slate-900 rounded-full shadow-lg flex items-center justify-center z-10">
            <div className="w-4 h-4 bg-white rounded-sm" />
          </div>

          {[
            { top: "20%", left: "20%", delay: 0.2 },
            { top: "30%", left: "70%", delay: 0.6 },
            { top: "70%", left: "30%", delay: 1.2 },
            { top: "60%", left: "80%", delay: 1.8 },
          ].map((pos, i) => (
            <motion.div
              key={i}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: pos.delay, type: "spring" }}
              className="absolute w-8 h-8 bg-white border border-slate-200 rounded-full shadow-sm flex items-center justify-center"
              style={{ top: pos.top, left: pos.left }}
            >
              <div className="w-3 h-3 bg-orange-400 rounded-full" />
            </motion.div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

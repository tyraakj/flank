"use client";

import { motion } from "framer-motion";
import { Sparkles, ArrowRight } from "lucide-react";

export function HeroStrategyStep() {
  return (
    <motion.div
      key="step-3"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 p-8 flex flex-col bg-slate-50"
    >
      {/* Mimicking the "Upgrade with AI" banner from the reference */}
      <div className="relative w-full h-40 rounded-2xl overflow-hidden mb-6 shadow-sm border border-slate-200 bg-white group cursor-pointer">
        {/* Placeholder for the anime/nature artwork in the reference */}
        <div className="absolute inset-0 bg-gradient-to-r from-blue-100 via-indigo-50 to-emerald-50 opacity-80" />
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1579546929518-9e396f3cc809?q=80&w=1000&auto=format&fit=crop')] bg-cover bg-center opacity-20 mix-blend-overlay" />
        <div className="absolute inset-0 bg-gradient-to-t from-white via-white/80 to-transparent" />

        <div className="relative z-10 p-6 flex flex-col h-full justify-end">
          <div className="flex items-center gap-2 mb-1">
            <Sparkles className="w-5 h-5 text-indigo-600" />
            <h3 className="text-xl font-bold text-slate-900">Your Strategic Edge</h3>
          </div>
          <p className="text-slate-600 text-sm">3 actionable opportunities found</p>
        </div>
      </div>

      <div className="flex-1 space-y-3">
        {[
          { title: "Target mid-market pricing gap", color: "text-blue-600", bg: "bg-blue-50" },
          { title: "Emphasize SOC2 compliance", color: "text-indigo-600", bg: "bg-indigo-50" },
          {
            title: "Highlight unlimited seat structure",
            color: "text-emerald-600",
            bg: "bg-emerald-50",
          },
        ].map((opp, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.2 }}
            className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex items-center justify-between hover:shadow-md transition-shadow cursor-pointer"
          >
            <div className="flex items-center gap-4">
              <div
                className={`w-10 h-10 rounded-lg ${opp.bg} flex items-center justify-center shrink-0`}
              >
                <Sparkles className={`w-5 h-5 ${opp.color}`} />
              </div>
              <div>
                <div className="font-medium text-slate-900">{opp.title}</div>
                <div className="text-xs text-slate-500">
                  High confidence based on competitor data
                </div>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-slate-300" />
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}

"use client"

import { motion } from "framer-motion"
import { Database, CheckCircle2 } from "lucide-react"

export function HeroExtractionStep() {
  const competitors = [
    { name: "Acme Corp", dataPoints: 452, time: "05:16", color: "bg-blue-500" },
    { name: "Globex Inc", dataPoints: 328, time: "05:18", color: "bg-purple-500" },
    { name: "Soylent", dataPoints: 89, time: "05:21", color: "bg-emerald-500" },
  ]

  return (
    <motion.div
      key="step-2"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, x: -20 }}
      className="absolute inset-0 p-8 flex gap-6 bg-slate-50"
    >
      <div className="flex-1 flex flex-col h-full bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-white">
          <div className="font-medium text-slate-900">Extraction Queue</div>
          <Database className="w-4 h-4 text-slate-400" />
        </div>
        
        <div className="flex-1 overflow-hidden">
          {competitors.map((comp, i) => (
            <motion.div
              key={comp.name}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.2 }}
              className="p-4 border-b border-slate-50 flex items-start gap-4 hover:bg-slate-50 transition-colors"
            >
              <div className={`w-10 h-10 rounded-full ${comp.color} flex items-center justify-center shrink-0 shadow-sm`}>
                <span className="text-white font-medium text-sm">{comp.name.charAt(0)}</span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-center mb-1">
                  <span className="font-medium text-slate-900 truncate">{comp.name}</span>
                  <span className="text-xs text-slate-400">{comp.time}</span>
                </div>
                <div className="text-sm text-slate-500 truncate">
                  Successfully extracted {comp.dataPoints} pricing and feature data points.
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
      
      <div className="w-1/3 flex flex-col gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6 flex-1 flex flex-col justify-center"
        >
          <div className="flex items-center gap-2 mb-4">
            <CheckCircle2 className="w-5 h-5 text-emerald-500" />
            <span className="font-medium text-slate-900">Data Normalized</span>
          </div>
          <div className="space-y-3">
            <div className="h-2 w-full bg-slate-100 rounded-full" />
            <div className="h-2 w-4/5 bg-slate-100 rounded-full" />
            <div className="h-2 w-5/6 bg-slate-100 rounded-full" />
          </div>
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="bg-slate-900 rounded-2xl shadow-sm p-6 text-white flex flex-col justify-center items-center relative overflow-hidden"
        >
          <div className="absolute -top-10 -right-10 w-32 h-32 bg-blue-500/20 blur-2xl rounded-full" />
          <Database className="w-8 h-8 mb-2 text-blue-400" />
          <div className="text-3xl font-bold">1,240</div>
          <div className="text-xs text-slate-400 text-center mt-1 uppercase tracking-wider font-medium">Total Points</div>
        </motion.div>
      </div>
    </motion.div>
  )
}

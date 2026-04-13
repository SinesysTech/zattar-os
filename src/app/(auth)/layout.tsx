'use client'

import { motion } from 'framer-motion'

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-svh flex items-center justify-center p-6 bg-background canvas-dots overflow-hidden selection:bg-primary/30 selection:text-white">
      {/* Aurora Background Layer */}
      <div className="aurora-bg" aria-hidden="true" />

      <div className="w-full max-w-[440px] relative z-10">
        
        {/* Logo Mark Centered above card */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          className="flex justify-center mb-10"
        >
          <div className="w-16 h-16 bg-primary rounded-[22px] flex items-center justify-center shadow-2xl shadow-primary/40 transition-all hover:scale-110 hover:shadow-primary/60 duration-500 cursor-pointer group">
            <svg 
              className="w-9 h-9 text-white group-hover:rotate-12 transition-transform duration-500" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
            </svg>
          </div>
        </motion.div>

        {/* Main Content Card with High Glass Depth */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
          className="glass-card-luminous p-10 sm:p-12 rounded-[48px] relative overflow-hidden"
        >
          {/* Subtle internal light effect */}
          <div className="absolute -top-32 -right-32 w-64 h-64 bg-primary/10 blur-[80px] rounded-full pointer-events-none" />
          
          {children}
        </motion.div>
      </div>

      {/* Decorative floating orbs for added depth */}
      <div className="fixed top-0 right-0 w-[500px] h-[500px] bg-primary/5 blur-[120px] rounded-full -mr-64 -mt-64 pointer-events-none" />
      <div className="fixed bottom-0 left-0 w-[400px] h-[400px] bg-highlight/5 blur-[100px] rounded-full -ml-48 -mb-48 pointer-events-none" />
    </div>
  )
}

import React from 'react'
import Link from 'next/link'

interface LogoProps {
  size?: 'sm' | 'md' | 'lg' | number
  showText?: boolean
  className?: string
}

const Logo: React.FC<LogoProps> = ({ size = 'md', showText = true, className = '' }) => {
  const getIconSize = () => {
    if (typeof size === 'number') return size
    switch (size) {
      case 'sm': return 28
      case 'lg': return 48
      default: return 36
    }
  }

  const iconSize = getIconSize()
  const fontSize = iconSize * 0.75

  return (
    <Link href="/" className={`flex items-center gap-3 group select-none ${className}`}>
      <div className="relative" style={{ width: iconSize, height: iconSize }}>
        {/* Glow Layer */}
        <div 
          className="absolute inset-0 bg-brand/40 rounded-xl blur-[12px] group-hover:bg-brand/60 transition-all duration-500 opacity-50"
          style={{ transform: 'scale(1.2)' }}
        />
        
        <svg
          viewBox="0 0 100 100"
          className="w-full h-full relative z-10 drop-shadow-[0_0_8px_rgba(108,71,255,0.4)]"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <linearGradient id="logoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#6C47FF" />
              <stop offset="50%" stopColor="#9B8AFF" />
              <stop offset="100%" stopColor="#C4B8FF" />
            </linearGradient>
            
            <filter id="neonGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="2.5" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Neural G Letterform */}
          <path
            d="M85 50C85 69.33 69.33 85 50 85C30.67 85 15 69.33 15 50C15 30.67 30.67 15 50 15C60 15 69 19 75.5 25.5"
            stroke="url(#logoGradient)"
            strokeWidth="10"
            strokeLinecap="round"
            className="group-hover:stroke-white transition-all duration-500"
          />
          
          <path
            d="M85 50H55"
            stroke="url(#logoGradient)"
            strokeWidth="10"
            strokeLinecap="round"
            className="group-hover:stroke-white transition-all duration-500"
          />

          {/* Neural Nodes */}
          <circle cx="15" cy="50" r="4" fill="white" className="animate-pulse" />
          <circle cx="50" cy="85" r="4" fill="white" />
          <circle cx="50" cy="15" r="4" fill="white" />
          <circle cx="85" cy="50" r="6" fill="white" filter="url(#neonGlow)" />
          
          {/* AI Lightning Spark */}
          <path
            d="M58 45L52 50L58 55"
            stroke="white"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="group-hover:scale-110 origin-center transition-transform"
          />
        </svg>
      </div>

      {showText && (
        <span 
          className="font-display font-bold text-white tracking-tight group-hover:text-brand-light transition-colors"
          style={{ fontSize }}
        >
          Gig<span className="bg-clip-text text-transparent bg-brand-gradient">Mind</span>
        </span>
      )}
    </Link>
  )
}

export default Logo

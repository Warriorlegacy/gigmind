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
      case 'sm': return 32
      case 'lg': return 56
      default: return 42
    }
  }

  const iconSize = getIconSize()
  const fontSize = iconSize * 0.7

  return (
    <Link href="/" className={`flex items-center gap-3 group select-none ${className}`}>
      <div className="relative flex items-center justify-center" style={{ width: iconSize, height: iconSize }}>
        {/* Animated Background Glow */}
        <div 
          className="absolute inset-0 bg-brand/30 rounded-full blur-[15px] group-hover:bg-brand/50 transition-all duration-700 opacity-60 animate-pulse"
        />
        
        <svg
          viewBox="0 0 100 100"
          className="w-full h-full relative z-10 drop-shadow-[0_0_10px_rgba(108,71,255,0.5)] transition-all duration-500 group-hover:scale-110"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <linearGradient id="logoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#6C47FF" />
              <stop offset="50%" stopColor="#A855F7" />
              <stop offset="100%" stopColor="#EC4899" />
            </linearGradient>
            
            <filter id="neonGlow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>

            {/* Animation for synapses */}
            <style>
              {`
                @keyframes dash {
                  to {
                    stroke-dashoffset: 0;
                  }
                }
                .synapse {
                  stroke-dasharray: 100;
                  stroke-dashoffset: 100;
                  animation: dash 3s linear infinite;
                  opacity: 0.3;
                }
                .node {
                  transition: all 0.3s ease;
                }
                .group:hover .synapse {
                  opacity: 0.8;
                  animation-duration: 1.5s;
                }
              `}
            </style>
          </defs>

          {/* Background Connections (The "Graphify" part) */}
          <path d="M20 30L50 15" stroke="url(#logoGradient)" strokeWidth="1" className="synapse" />
          <path d="M50 15L80 30" stroke="url(#logoGradient)" strokeWidth="1" className="synapse" />
          <path d="M80 30L80 70" stroke="url(#logoGradient)" strokeWidth="1" className="synapse" />
          <path d="M80 70L50 85" stroke="url(#logoGradient)" strokeWidth="1" className="synapse" />
          <path d="M50 85L20 70" stroke="url(#logoGradient)" strokeWidth="1" className="synapse" />
          <path d="M20 70L20 30" stroke="url(#logoGradient)" strokeWidth="1" className="synapse" />
          
          {/* Main G-Brain Shape */}
          <path
            d="M82 50C82 67.67 67.67 82 50 82C32.33 82 18 67.67 18 50C18 32.33 32.33 18 50 18C59.1 18 67.3 21.8 73.1 27.9"
            stroke="url(#logoGradient)"
            strokeWidth="8"
            strokeLinecap="round"
            className="group-hover:stroke-white transition-all duration-500"
          />
          
          <path
            d="M82 50H52"
            stroke="url(#logoGradient)"
            strokeWidth="8"
            strokeLinecap="round"
            className="group-hover:stroke-white transition-all duration-500"
          />

          {/* Neural Nodes */}
          <circle cx="50" cy="18" r="4" fill="white" className="node group-hover:r-5 group-hover:fill-brand-light" />
          <circle cx="18" cy="50" r="4" fill="white" className="node" />
          <circle cx="50" cy="82" r="4" fill="white" className="node" />
          <circle cx="82" cy="50" r="6" fill="white" filter="url(#neonGlow)" className="node group-hover:scale-125" />
          
          {/* Central AI Nucleus */}
          <circle cx="52" cy="50" r="3" fill="white" className="animate-pulse" />
        </svg>
      </div>

      {showText && (
        <span 
          className="font-display font-bold text-white tracking-tighter group-hover:text-brand-light transition-all duration-300"
          style={{ fontSize }}
        >
          Gig<span className="text-brand">Mind</span>
        </span>
      )}
    </Link>
  )
}

export default Logo


// GigMind Premium SVG Logo Component
// Usage: <GigMindLogo /> or <GigMindLogo showText={false} size={32} />

interface GigMindLogoProps {
  showText?: boolean
  size?: number
  className?: string
  textClassName?: string
}

export function GigMindIcon({ size = 32, className = '' }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <defs>
        {/* Main gradient: deep violet → bright lavender */}
        <linearGradient id="gm-main" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#6C47FF" />
          <stop offset="55%" stopColor="#9B8AFF" />
          <stop offset="100%" stopColor="#C4B8FF" />
        </linearGradient>

        {/* Spark gradient: bright white-violet */}
        <linearGradient id="gm-spark" x1="0%" y1="100%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#9B8AFF" />
          <stop offset="100%" stopColor="#ffffff" />
        </linearGradient>

        {/* Background gradient */}
        <linearGradient id="gm-bg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#1a1430" />
          <stop offset="100%" stopColor="#0F0F13" />
        </linearGradient>

        {/* Glow filter */}
        <filter id="gm-glow" x="-40%" y="-40%" width="180%" height="180%">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>

        {/* Outer glow for nodes */}
        <filter id="gm-node-glow" x="-100%" y="-100%" width="300%" height="300%">
          <feGaussianBlur stdDeviation="2.5" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>

        {/* Clip to rounded square */}
        <clipPath id="gm-clip">
          <rect x="0" y="0" width="100" height="100" rx="22" ry="22" />
        </clipPath>
      </defs>

      {/* Background rounded square */}
      <rect x="0" y="0" width="100" height="100" rx="22" ry="22" fill="url(#gm-bg)" />

      {/* Subtle inner purple ambient glow */}
      <ellipse cx="50" cy="50" rx="38" ry="38" fill="#6C47FF" opacity="0.08" />

      {/* ── Neural G Lettermark ── */}
      {/* The G arc — thick open arc, top-right gap */}
      <g filter="url(#gm-glow)" clipPath="url(#gm-clip)">
        {/* G outer arc */}
        <path
          d="M 68 38 A 24 24 0 1 0 68 62"
          stroke="url(#gm-main)"
          strokeWidth="7"
          strokeLinecap="round"
          fill="none"
          opacity="0.95"
        />

        {/* G horizontal bar (crossbar) */}
        <path
          d="M 56 50 L 70 50"
          stroke="url(#gm-main)"
          strokeWidth="7"
          strokeLinecap="round"
          fill="none"
          opacity="0.95"
        />

        {/* G crossbar right end going down */}
        <path
          d="M 70 50 L 70 62"
          stroke="url(#gm-main)"
          strokeWidth="7"
          strokeLinecap="round"
          fill="none"
          opacity="0.95"
        />
      </g>

      {/* ── Neural Network Nodes & Connections ── */}
      {/* Connection lines from arc nodes */}
      <g opacity="0.55">
        {/* Line: top-left arc point → outer node top-left */}
        <line x1="32" y1="34" x2="22" y2="22" stroke="#9B8AFF" strokeWidth="1.5" strokeLinecap="round" />
        {/* Line: bottom-left arc → outer node bottom */}
        <line x1="32" y1="66" x2="20" y2="76" stroke="#9B8AFF" strokeWidth="1.5" strokeLinecap="round" />
        {/* Line: top arc → top node */}
        <line x1="50" y1="26" x2="50" y2="14" stroke="#9B8AFF" strokeWidth="1.5" strokeLinecap="round" />
        {/* Crossbar end → spark node */}
        <line x1="70" y1="50" x2="84" y2="44" stroke="#C4B8FF" strokeWidth="1.5" strokeLinecap="round" />
        {/* Cross-connections between outer nodes */}
        <line x1="22" y1="22" x2="50" y2="14" stroke="#9B8AFF" strokeWidth="1" strokeLinecap="round" opacity="0.6" />
        <line x1="20" y1="76" x2="50" y2="86" stroke="#9B8AFF" strokeWidth="1" strokeLinecap="round" opacity="0.6" />
        <line x1="50" y1="86" x2="84" y2="44" stroke="#9B8AFF" strokeWidth="1" strokeLinecap="round" opacity="0.4" />
      </g>

      {/* Neural nodes — outer ring */}
      <g filter="url(#gm-node-glow)">
        {/* Top-left node */}
        <circle cx="22" cy="22" r="4" fill="#9B8AFF" opacity="0.9" />
        <circle cx="22" cy="22" r="2" fill="white" opacity="0.8" />

        {/* Top node */}
        <circle cx="50" cy="14" r="3.5" fill="#9B8AFF" opacity="0.9" />
        <circle cx="50" cy="14" r="1.8" fill="white" opacity="0.7" />

        {/* Bottom-left node */}
        <circle cx="20" cy="76" r="3.5" fill="#9B8AFF" opacity="0.9" />
        <circle cx="20" cy="76" r="1.8" fill="white" opacity="0.7" />

        {/* Bottom node */}
        <circle cx="50" cy="86" r="3" fill="#8B6FFF" opacity="0.8" />
        <circle cx="50" cy="86" r="1.5" fill="white" opacity="0.6" />
      </g>

      {/* ── Spark / Lightning node at crossbar end ── */}
      {/* Main spark node — bright, glowing */}
      <g filter="url(#gm-node-glow)">
        <circle cx="84" cy="44" r="5.5" fill="#C4B8FF" opacity="0.25" />
        <circle cx="84" cy="44" r="4" fill="url(#gm-spark)" />
        <circle cx="84" cy="44" r="2" fill="white" />
      </g>

      {/* Lightning bolt inside spark area */}
      <path
        d="M 84 39 L 81.5 44.5 L 84 44.5 L 81.5 50 L 87 43.5 L 84 43.5 Z"
        fill="white"
        opacity="0.95"
      />
    </svg>
  )
}

export function GigMindLogo({
  showText = true,
  size = 32,
  className = '',
  textClassName = '',
}: GigMindLogoProps) {
  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      <GigMindIcon size={size} />
      {showText && (
        <span
          className={`font-display font-bold tracking-tight bg-clip-text text-transparent ${textClassName}`}
          style={{
            fontSize: size * 0.72,
            backgroundImage: 'linear-gradient(135deg, #ffffff 0%, #C4B8FF 60%, #9B8AFF 100%)',
          }}
        >
          GigMind
        </span>
      )}
    </span>
  )
}

export default GigMindLogo

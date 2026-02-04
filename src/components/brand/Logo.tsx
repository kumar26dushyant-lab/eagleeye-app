'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'

interface LogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'hero'
  showText?: boolean
  animated?: boolean
  href?: string
  className?: string
  showTagline?: boolean
  variant?: 'default' | 'glow' | 'minimal'
}

const sizes = {
  sm: { icon: 28, text: 'text-lg', tagline: 'text-[8px]', gap: 'gap-2' },
  md: { icon: 36, text: 'text-xl', tagline: 'text-[9px]', gap: 'gap-2.5' },
  lg: { icon: 48, text: 'text-2xl', tagline: 'text-[10px]', gap: 'gap-3' },
  xl: { icon: 64, text: 'text-4xl', tagline: 'text-xs', gap: 'gap-4' },
  hero: { icon: 88, text: 'text-5xl', tagline: 'text-sm', gap: 'gap-5' },
}

// Premium Eagle Eye Icon with animated glow
function EagleIcon({ size = 40, animated = true }: { size?: number; animated?: boolean }) {
  const iconId = `eagle-${Math.random().toString(36).substr(2, 9)}`
  
  return (
    <motion.svg 
      width={size}
      height={size}
      viewBox="0 0 64 64" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      initial={false}
      animate={animated ? { 
        filter: ['drop-shadow(0 0 8px rgba(6, 182, 212, 0.3))', 'drop-shadow(0 0 16px rgba(6, 182, 212, 0.5))', 'drop-shadow(0 0 8px rgba(6, 182, 212, 0.3))']
      } : undefined}
      transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
    >
      <defs>
        {/* Premium gradient - cyan to blue */}
        <linearGradient id={`${iconId}-primary`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#22D3EE" />
          <stop offset="50%" stopColor="#06B6D4" />
          <stop offset="100%" stopColor="#0891B2" />
        </linearGradient>
        {/* Dark background gradient */}
        <linearGradient id={`${iconId}-bg`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#0C1222" />
          <stop offset="100%" stopColor="#1A2332" />
        </linearGradient>
        {/* Glow filter */}
        <filter id={`${iconId}-glow`} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
          <feMerge>
            <feMergeNode in="coloredBlur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
        {/* Inner glow */}
        <radialGradient id={`${iconId}-innerGlow`} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#22D3EE" stopOpacity="0.8"/>
          <stop offset="100%" stopColor="#06B6D4" stopOpacity="0"/>
        </radialGradient>
      </defs>
      
      {/* Outer ring with glow */}
      <circle cx="32" cy="32" r="30" fill={`url(#${iconId}-bg)`} stroke={`url(#${iconId}-primary)`} strokeWidth="2"/>
      
      {/* Inner glow effect */}
      <circle cx="32" cy="32" r="24" fill={`url(#${iconId}-innerGlow)`} opacity="0.3"/>
      
      {/* Eagle eye shape - stylized */}
      <ellipse cx="32" cy="32" rx="20" ry="13" fill="none" stroke={`url(#${iconId}-primary)`} strokeWidth="2" opacity="0.7"/>
      
      {/* Inner eye ring */}
      <circle cx="32" cy="32" r="10" fill="none" stroke={`url(#${iconId}-primary)`} strokeWidth="1.5" opacity="0.9"/>
      
      {/* Iris - the core */}
      <circle cx="32" cy="32" r="6" fill={`url(#${iconId}-primary)`} filter={`url(#${iconId}-glow)`}/>
      
      {/* Pupil - dark center */}
      <circle cx="32" cy="32" r="3" fill="#0C1222"/>
      
      {/* Eye highlight - makes it look alive */}
      <circle cx="30" cy="30" r="2" fill="white" opacity="0.95"/>
      <circle cx="34" cy="33" r="1" fill="white" opacity="0.5"/>
      
      {/* Wing accents - stylized feathers */}
      <path d="M8 32 L16 27 L16 37 Z" fill={`url(#${iconId}-primary)`} opacity="0.9"/>
      <path d="M4 32 L10 29 L10 35 Z" fill={`url(#${iconId}-primary)`} opacity="0.5"/>
      <path d="M56 32 L48 27 L48 37 Z" fill={`url(#${iconId}-primary)`} opacity="0.9"/>
      <path d="M60 32 L54 29 L54 35 Z" fill={`url(#${iconId}-primary)`} opacity="0.5"/>
    </motion.svg>
  )
}

// Animated brand text with gradient shimmer
function BrandText({ 
  size, 
  animated = true,
  showTagline = false 
}: { 
  size: keyof typeof sizes
  animated?: boolean
  showTagline?: boolean 
}) {
  const sizeConfig = sizes[size]
  
  return (
    <div className="flex flex-col">
      {/* Main brand name with gradient */}
      <motion.span 
        className={`font-black ${sizeConfig.text} tracking-tight`}
        style={{
          background: 'linear-gradient(135deg, #ffffff 0%, #22D3EE 50%, #ffffff 100%)',
          backgroundSize: '200% auto',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
        }}
        animate={animated ? {
          backgroundPosition: ['0% center', '200% center'],
        } : undefined}
        transition={{
          duration: 5,
          repeat: Infinity,
          ease: 'linear',
        }}
      >
        EagleEye
      </motion.span>
      
      {/* Tagline */}
      {showTagline && (
        <motion.span 
          className={`${sizeConfig.tagline} text-cyan-400/80 tracking-[0.2em] uppercase font-semibold`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          Signal • Focus • Succeed
        </motion.span>
      )}
    </div>
  )
}

export function Logo({ 
  size = 'md', 
  showText = true, 
  animated = true,
  href = '/',
  className = '',
  showTagline = false,
  variant = 'default'
}: LogoProps) {
  const sizeConfig = sizes[size]
  
  const content = (
    <div className={`flex items-center ${sizeConfig.gap} group ${className}`}>
      {/* Logo icon with glow on hover */}
      <motion.div
        className="relative shrink-0"
        whileHover={animated ? { scale: 1.08, rotate: 3 } : undefined}
        whileTap={animated ? { scale: 0.95 } : undefined}
        transition={{ duration: 0.2 }}
      >
        {/* Glow effect behind icon on hover */}
        {variant === 'glow' && (
          <div className="absolute inset-0 bg-cyan-500/30 rounded-full blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        )}
        <EagleIcon size={sizeConfig.icon} animated={animated} />
      </motion.div>
      
      {/* Brand name */}
      {showText && (
        <BrandText size={size} animated={animated} showTagline={showTagline} />
      )}
    </div>
  )

  if (href) {
    return (
      <Link href={href} className="focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500/50 rounded-lg">
        {content}
      </Link>
    )
  }

  return content
}

// Animated logo for loading states
export function LogoAnimated({ className }: { className?: string }) {
  return (
    <motion.div
      className={className}
      animate={{
        scale: [1, 1.05, 1],
      }}
      transition={{
        duration: 2,
        repeat: Infinity,
        ease: "easeInOut"
      }}
    >
      <Logo size="lg" showText={false} animated={true} href={undefined} />
    </motion.div>
  )
}

// Full brand lockup for hero sections
export function BrandLockup() {
  return (
    <motion.div 
      className="flex flex-col items-center gap-4"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
    >
      <Logo size="xl" showText={true} showTagline={true} animated={true} href={undefined} />
      <p className="text-muted-foreground text-center max-w-md">
        See what matters before it becomes a problem
      </p>
    </motion.div>
  )
}

// Compact brand for headers/navs
export function BrandCompact({ href = '/' }: { href?: string }) {
  return (
    <Logo size="md" showText={true} showTagline={false} animated={true} href={href} variant="glow" />
  )
}

export default Logo

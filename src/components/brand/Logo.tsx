'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'

interface LogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl'
  showText?: boolean
  animated?: boolean
  href?: string
  className?: string
}

const sizes = {
  sm: { icon: 24, text: 'text-base', gap: 'gap-2' },
  md: { icon: 32, text: 'text-lg', gap: 'gap-2' },
  lg: { icon: 44, text: 'text-2xl', gap: 'gap-3' },
  xl: { icon: 64, text: 'text-4xl', gap: 'gap-4' },
}

// Clean, professional eagle eye icon - sharp and clearly visible
function EagleIcon({ size = 32 }: { size?: number }) {
  return (
    <svg 
      width={size}
      height={size}
      viewBox="0 0 48 48" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Gradient background */}
      <defs>
        <linearGradient id="bgGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#6366F1" />
          <stop offset="100%" stopColor="#4F46E5" />
        </linearGradient>
      </defs>
      
      {/* Background circle */}
      <circle cx="24" cy="24" r="23" fill="url(#bgGradient)" />
      
      {/* Simple clean eye shape representing eagle&apos;s eye / vision */}
      <ellipse cx="24" cy="24" rx="14" ry="9" fill="white" opacity="0.95" />
      
      {/* Iris */}
      <circle cx="24" cy="24" r="7" fill="#1E1B4B" />
      
      {/* Pupil with highlight */}
      <circle cx="24" cy="24" r="3.5" fill="#6366F1" />
      <circle cx="22" cy="22.5" r="1.5" fill="white" opacity="0.8" />
      
      {/* Eagle wing tips on sides - stylized */}
      <path d="M8 24C8 24 10 20 14 18L10 24L14 30C10 28 8 24 8 24Z" fill="white" opacity="0.9" />
      <path d="M40 24C40 24 38 20 34 18L38 24L34 30C38 28 40 24 40 24Z" fill="white" opacity="0.9" />
    </svg>
  )
}

export function Logo({ 
  size = 'md', 
  showText = true, 
  animated = true,
  href = '/',
  className = ''
}: LogoProps) {
  const sizeConfig = sizes[size]
  
  const content = (
    <div className={`flex items-center ${sizeConfig.gap} group ${className}`}>
      {/* Logo icon */}
      <motion.div
        className="relative shrink-0"
        whileHover={animated ? { scale: 1.05 } : undefined}
        transition={{ duration: 0.2 }}
      >
        <EagleIcon size={sizeConfig.icon} />
      </motion.div>
      
      {/* Brand name */}
      {showText && (
        <div className="flex flex-col">
          <span className={`font-bold ${sizeConfig.text} text-foreground group-hover:text-primary transition-colors duration-300`}>
            EagleEye
          </span>
          {(size === 'lg' || size === 'xl') && (
            <span className="text-xs text-muted-foreground tracking-wider">
              Decision Intelligence
            </span>
          )}
        </div>
      )}
    </div>
  )

  if (href) {
    return (
      <Link href={href} className="focus:outline-none focus:ring-2 focus:ring-primary/50 rounded-lg">
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
        opacity: [0.7, 1, 0.7],
      }}
      transition={{
        duration: 2,
        repeat: Infinity,
        ease: "easeInOut"
      }}
    >
      <Logo size="lg" showText={false} animated={false} href={undefined} />
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
      <Logo size="xl" showText={true} />
      <p className="text-muted-foreground text-center max-w-md">
        See what matters before it becomes a problem
      </p>
    </motion.div>
  )
}

export default Logo

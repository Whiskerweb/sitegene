import { type ReactNode, useMemo } from 'react'
import { motion } from 'framer-motion'

interface FadeInProps {
  children: ReactNode
  as?: keyof HTMLElementTagNameMap
  delay?: number
  duration?: number
  y?: number
  className?: string
  style?: React.CSSProperties
}

const EASE = [0.22, 1, 0.36, 1] as const

export default function FadeIn({
  children,
  as = 'div',
  delay = 0,
  duration = 0.7,
  y = 30,
  className,
  style,
}: FadeInProps) {
  const MotionTag = useMemo(() => motion.create(as), [as])
  return (
    <MotionTag
      className={className}
      style={style}
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ duration, delay, ease: EASE }}
    >
      {children}
    </MotionTag>
  )
}

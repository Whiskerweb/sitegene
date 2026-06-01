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
  // Laisse passer les attributs data-* (ex. data-sg-path de l'éditeur) vers le DOM.
  [dataAttr: `data-${string}`]: string | undefined
}

const EASE = [0.22, 1, 0.36, 1] as const

export default function FadeIn({
  children,
  as = 'div',
  delay = 0,
  duration = 0.7,
  y = 28,
  className,
  style,
  ...rest
}: FadeInProps) {
  const MotionTag = useMemo(() => motion.create(as), [as])
  return (
    <MotionTag
      className={className}
      style={style}
      {...rest}
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ duration, delay, ease: EASE }}
    >
      {children}
    </MotionTag>
  )
}

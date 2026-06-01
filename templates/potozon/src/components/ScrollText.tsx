import { useRef } from 'react'
import { motion, useScroll, useTransform, type MotionValue } from 'framer-motion'
import { scrollText, scrollAccents } from '../data/content'

const ACCENT: Record<string, string> = {
  red: '#E5412A',
  yellow: '#FFC400',
  orange: '#F15A24',
  purple: '#8B7CF6',
}

function Word({
  children,
  progress,
  range,
}: {
  children: string
  progress: MotionValue<number>
  range: [number, number]
}) {
  const opacity = useTransform(progress, range, [0.15, 1])
  const accent = scrollAccents[children]
  return (
    <motion.span
      style={{ opacity, color: accent ? ACCENT[accent] : undefined }}
      className="mr-[0.22em] inline-block"
    >
      {children}
    </motion.span>
  )
}

export default function ScrollText() {
  const ref = useRef<HTMLParagraphElement>(null)
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start 0.85', 'end 0.5'],
  })
  const words = scrollText.split(' ')
  return (
    <section className="mx-auto max-w-5xl py-24 md:py-36">
      <p
        ref={ref}
        data-sg-path="scrollText"
        data-sg-edit="panel"
        className="text-center text-3xl font-extrabold leading-[1.18] tracking-tight text-poto-ink md:text-[3rem]"
      >
        {words.map((w, i) => {
          const start = i / words.length
          const end = start + 1 / words.length
          return (
            <Word key={i} progress={scrollYProgress} range={[start, end]}>
              {w}
            </Word>
          )
        })}
      </p>
    </section>
  )
}

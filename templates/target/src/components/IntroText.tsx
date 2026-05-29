import { useRef } from 'react'
import { motion, useScroll, useTransform, type MotionValue } from 'framer-motion'
import { intro } from '../data/content'

function Word({ children, progress, range }: { children: string; progress: MotionValue<number>; range: [number, number] }) {
  const opacity = useTransform(progress, range, [0.18, 1])
  return (
    <motion.span style={{ opacity }} className="mr-[0.25em] inline-block">
      {children}
    </motion.span>
  )
}

export default function IntroText() {
  const ref = useRef<HTMLParagraphElement>(null)
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start 0.85', 'end 0.55'] })
  const words = intro.split(' ')
  return (
    <section id="about" className="mx-auto max-w-5xl px-5 py-20 md:py-32">
      <p
        ref={ref}
        className="tg-head text-center text-3xl font-medium leading-[1.25] md:text-[2.7rem]"
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

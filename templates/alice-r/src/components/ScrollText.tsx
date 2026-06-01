import { useRef } from 'react'
import { motion, useScroll, useTransform, type MotionValue } from 'framer-motion'
import { scrollText } from '../data/content'

function Word({
  children,
  progress,
  range,
}: {
  children: string
  progress: MotionValue<number>
  range: [number, number]
}) {
  const opacity = useTransform(progress, range, [0.18, 1])
  return (
    <motion.span style={{ opacity }} className="mr-[0.25em] inline-block">
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
    <section className="relative z-10 mx-auto max-w-5xl px-6 py-24 md:py-36">
      <p
        ref={ref}
        data-sg-path="scrollText"
        data-sg-edit="panel"
        className="text-center text-2xl font-medium leading-[1.3] text-white sm:text-3xl md:text-[2.6rem]"
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

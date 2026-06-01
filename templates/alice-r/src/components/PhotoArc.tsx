import { motion } from 'framer-motion'
import { arcPhotos } from '../data/content'

const EASE = [0.22, 1, 0.36, 1] as const

// Grand arc en demi-cercle (180°). Le centre du cercle est placé au niveau du
// BAS du bouton (CY) ; les extrémités de l'arc (a=±90) descendent donc jusqu'à
// cette « ligne invisible », et l'arc enveloppe tout le texte au-dessus.
// Offsets en vmin → vrai cercle (rayon identique X/Y). Légèrement décalé à gauche (CX).
export const ARC_CX = 48 // % horizontal du centre (un peu à gauche)
export const ARC_CY = 74 // % vertical du centre (= bas du bouton)
const R = 58 // rayon en vmin (grand)
const photos = arcPhotos.slice(0, 13)
const N = photos.length

export default function PhotoArc() {
  return (
    <div className="pointer-events-none absolute inset-0 z-10 hidden md:block">
      {photos.map((photo, i) => {
        const a = -90 + (180 / (N - 1)) * i // -90° → +90°
        const rad = (a * Math.PI) / 180
        const dx = R * Math.sin(rad) // vmin
        const dy = -R * Math.cos(rad) // vmin
        // calc avec signe explicite ('+ -' est invalide en CSS)
        const tx = `calc(-50% ${dx >= 0 ? '+' : '-'} ${Math.abs(dx).toFixed(2)}vmin)`
        const ty = `calc(-50% ${dy >= 0 ? '+' : '-'} ${Math.abs(dy).toFixed(2)}vmin)`
        return (
          // Div externe = positionnement (Framer Motion ne touche pas à son transform).
          <div
            key={photo.img}
            className="absolute"
            style={{
              left: `${ARC_CX}%`,
              top: `${ARC_CY}%`,
              transform: `translate(${tx}, ${ty}) rotate(${(a * 0.1).toFixed(1)}deg)`,
            }}
          >
            {/* Motion interne = anim opacity/scale uniquement */}
            <motion.div
              initial={{ opacity: 0, scale: 0.6 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.7, delay: 0.08 + i * 0.05, ease: EASE }}
              className="h-[12vmin] max-h-[140px] w-[12vmin] max-w-[140px] overflow-hidden rounded-[18px] shadow-2xl ring-1 ring-white/10"
            >
              <img src={photo.img} alt="" data-sg-img={`arcPhotos[${i}].img`} className="h-full w-full object-cover" />
            </motion.div>
          </div>
        )
      })}
    </div>
  )
}

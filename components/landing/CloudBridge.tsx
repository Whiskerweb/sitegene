type Props = { className?: string };

/**
 * Transition décorative « nuage » entre deux sections (DA cloud).
 * Placeholder minimal — importé par Starter.tsx (landing en cours de refonte).
 */
export default function CloudBridge({ className = "" }: Props) {
  return (
    <div aria-hidden className={`pointer-events-none absolute inset-x-0 z-0 ${className}`}>
      <div className="mx-auto h-full max-w-6xl bg-[radial-gradient(60%_60%_at_50%_50%,rgba(191,227,255,0.45),transparent_70%)] blur-2xl" />
    </div>
  );
}

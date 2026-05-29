export function Spinner({ size = 18 }: { size?: number }) {
  return (
    <span
      style={{ width: size, height: size }}
      className="inline-block shrink-0 animate-spin rounded-full border-2 border-sky-300 border-t-brand"
      aria-hidden
    />
  );
}

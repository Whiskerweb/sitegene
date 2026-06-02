import MarketingShell from "@/components/marketing/MarketingShell";

/**
 * Surface marketing — thème clair/sombre togglable (≠ dashboard).
 * Le shell fournit le provider de thème, la nav, le footer et le quadrillage.
 */
export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <MarketingShell>{children}</MarketingShell>;
}

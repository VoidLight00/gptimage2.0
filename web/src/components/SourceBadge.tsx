const PALETTE = {
  voidlight: "bg-fg text-bg border-border-strong",
  prompts3: "bg-amber-500/15 text-amber-100 border-amber-300/30",
  default: "bg-bg/80 text-fg border-border-strong",
} as const;

function compactLicense(license?: string) {
  if (!license || license === "internal") return null;
  if (license === "CC BY 4.0") return "CC BY";
  return license;
}

export function SourceBadge({ source, license }: { source: string; license?: string }) {
  const licenseLabel = compactLicense(license);
  const label =
    source === "voidlight"
      ? "VOIDLIGHT"
      : source === "prompts3"
        ? licenseLabel
          ? `Curated · ${licenseLabel}`
          : "Curated"
        : licenseLabel
          ? `External · ${licenseLabel}`
          : "External";
  const className =
    source === "voidlight"
      ? PALETTE.voidlight
      : source === "prompts3"
        ? PALETTE.prompts3
        : PALETTE.default;

  return (
    <span
      className={`inline-flex items-center px-2 py-1 border font-mono text-[9px] uppercase tracking-[0.14em] backdrop-blur-sm ${className}`}
    >
      {label}
    </span>
  );
}

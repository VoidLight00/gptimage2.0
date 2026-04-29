"use client";

type SourceFilter = "all" | "voidlight" | "curated";

type SourceCounts = {
  all: number;
  voidlight: number;
  curated: number;
};

function getOptions(lang: "ko" | "en") {
  return lang === "ko"
    ? [
        { value: "all" as const, label: "전체" },
        { value: "voidlight" as const, label: "VOIDLIGHT" },
        { value: "curated" as const, label: "큐레이션" },
      ]
    : [
        { value: "all" as const, label: "All" },
        { value: "voidlight" as const, label: "VOIDLIGHT" },
        { value: "curated" as const, label: "Curated" },
      ];
}

export function SourceToggle({
  value,
  counts,
  onChange,
  lang = "en",
}: {
  value: SourceFilter;
  counts: SourceCounts;
  onChange: (value: SourceFilter) => void;
  lang?: "ko" | "en";
}) {
  const options = getOptions(lang);
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((option) => {
        const count = counts[option.value];
        const active = value === option.value;
        return (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            className={`inline-flex items-center gap-2 px-4 py-2.5 min-h-[40px] border font-mono text-[11px] uppercase tracking-[0.14em] ${
              active
                ? "bg-fg text-bg border-fg"
                : "border-border-strong text-fg hover:bg-surface-hover"
            }`}
          >
            <span>{option.label}</span>
            <span className={`text-[10px] ${active ? "text-bg/70" : "text-fg-50"}`}>{count}</span>
          </button>
        );
      })}
    </div>
  );
}

export type { SourceFilter };

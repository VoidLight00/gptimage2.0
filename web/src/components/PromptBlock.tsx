"use client";

import { useState } from "react";

export function PromptBlock({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // noop
    }
  }

  return (
    <div className="group">
      <div className="flex items-center justify-between mb-3">
        <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-fg-50">
          {label}
        </span>
        <button
          type="button"
          onClick={copy}
          className="font-mono text-[11px] tracking-[0.14em] px-3 py-1.5 border border-border-strong hover:bg-surface-hover"
        >
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      <pre className="font-mono text-[13px] leading-[1.7] text-fg whitespace-pre-wrap break-words bg-surface border border-border-subtle p-5">
        {value}
      </pre>
    </div>
  );
}

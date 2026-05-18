"use client";

import { useEffect, useRef, useState } from "react";

type CopyPromptButtonProps = {
  prompt: string;
  lang?: "ko" | "en";
  className?: string;
};

function getCopy(lang: "ko" | "en", copied: boolean) {
  if (lang === "ko") {
    return copied ? "복사됨" : "복사";
  }
  return copied ? "Copied" : "Copy";
}

function copyWithTextarea(value: string) {
  const textarea = document.createElement("textarea");
  textarea.value = value;
  textarea.setAttribute("readonly", "");
  textarea.style.position = "fixed";
  textarea.style.opacity = "0";
  document.body.appendChild(textarea);
  textarea.select();

  try {
    return document.execCommand("copy");
  } finally {
    document.body.removeChild(textarea);
  }
}

export function CopyPromptButton({ prompt, lang = "ko", className = "" }: CopyPromptButtonProps) {
  const [copied, setCopied] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const handleCopy = async () => {
    let didCopy = false;

    try {
      await navigator.clipboard.writeText(prompt);
      didCopy = true;
    } catch {
      didCopy = copyWithTextarea(prompt);
    }

    if (!didCopy) {
      return;
    }

    setCopied(true);

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => setCopied(false), 1200);
  };

  return (
    <button
      type="button"
      onClick={handleCopy}
      className={`relative z-10 inline-flex min-h-[36px] items-center justify-center border border-border-strong bg-bg/90 px-3 py-2 font-mono text-[10px] uppercase tracking-[0.14em] text-fg backdrop-blur-sm hover:bg-fg hover:text-bg focus:bg-fg focus:text-bg ${className}`}
      aria-live="polite"
    >
      {getCopy(lang, copied)}
    </button>
  );
}

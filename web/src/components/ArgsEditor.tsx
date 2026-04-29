"use client";

import { useMemo, useState } from "react";
import { applyPromptArguments, extractPromptArguments } from "@/lib/prompt-args";

function buildInitialValues(prompt: string) {
  return Object.fromEntries(
    extractPromptArguments(prompt).map((argument) => [argument.key, argument.defaultValue])
  );
}

function getCopy(lang: "ko" | "en") {
  return lang === "ko"
    ? {
        title: "Args Editor",
        description: "기본값만 바꿔 커스텀 프롬프트를 만들 수 있습니다. 저장된 원문은 수정되지 않습니다.",
        reset: "초기화",
        copy: "채워진 프롬프트 복사",
        copied: "복사됨",
      }
    : {
        title: "Args Editor",
        description: "Customize the prompt by changing only the default values. The stored source text stays unchanged.",
        reset: "Reset",
        copy: "Copy Filled Prompt",
        copied: "Copied",
      };
}

export function ArgsEditor({ prompt, lang = "ko" }: { prompt: string; lang?: "ko" | "en" }) {
  const ui = getCopy(lang);
  const argumentsList = useMemo(() => extractPromptArguments(prompt), [prompt]);
  const [values, setValues] = useState<Record<string, string>>(() => buildInitialValues(prompt));
  const [copied, setCopied] = useState(false);

  if (argumentsList.length === 0) {
    return null;
  }

  const resolvedPrompt = applyPromptArguments(prompt, values);

  async function copyPrompt() {
    try {
      await navigator.clipboard.writeText(resolvedPrompt);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  return (
    <section className="space-y-5 border border-border-subtle bg-surface p-4 md:p-5">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <div className="font-mono text-[11px] uppercase tracking-[0.18em] text-fg-50">{ui.title}</div>
          <p className="mt-2 font-sans text-sm text-fg-70">{ui.description}</p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setValues(buildInitialValues(prompt))}
            className="px-4 py-2 min-h-[40px] border border-border-strong font-mono text-[11px] uppercase tracking-[0.14em] hover:bg-surface-hover"
          >
            {ui.reset}
          </button>
          <button
            type="button"
            onClick={copyPrompt}
            className="px-4 py-2 min-h-[40px] bg-fg text-bg font-mono text-[11px] uppercase tracking-[0.14em] hover:bg-fg/90"
          >
            {copied ? ui.copied : ui.copy}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
        {argumentsList.map((argument) => {
          const id = `${argument.name}-${argument.occurrence}`;
          const isLong = argument.defaultValue.length > 80 || argument.defaultValue.includes("\n");
          return (
            <label key={argument.key} htmlFor={id} className="space-y-2">
              <span className="block font-mono text-[11px] uppercase tracking-[0.14em] text-fg-50">
                {argument.name}
                {argument.occurrence > 1 ? ` ${argument.occurrence}` : ""}
              </span>
              {isLong ? (
                <textarea
                  id={id}
                  value={values[argument.key] ?? ""}
                  onChange={(event) =>
                    setValues((current) => ({
                      ...current,
                      [argument.key]: event.target.value,
                    }))
                  }
                  rows={4}
                  className="w-full bg-bg border border-border-subtle px-3 py-2.5 font-sans text-sm text-fg focus:outline-none focus:border-border-strong resize-y"
                />
              ) : (
                <input
                  id={id}
                  type="text"
                  value={values[argument.key] ?? ""}
                  onChange={(event) =>
                    setValues((current) => ({
                      ...current,
                      [argument.key]: event.target.value,
                    }))
                  }
                  className="w-full bg-bg border border-border-subtle px-3 py-2.5 min-h-[42px] font-sans text-sm text-fg focus:outline-none focus:border-border-strong"
                />
              )}
            </label>
          );
        })}
      </div>

      <pre className="font-mono text-[12px] md:text-[13px] leading-[1.7] text-fg whitespace-pre-wrap break-words border border-border-subtle bg-bg p-4">
        {resolvedPrompt}
      </pre>
    </section>
  );
}

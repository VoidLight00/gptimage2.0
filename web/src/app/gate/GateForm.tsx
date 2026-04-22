"use client";

import { useRef, useState, useTransition } from "react";

export default function GateForm({
  action,
  next,
  err,
}: {
  action: (fd: FormData) => Promise<void>;
  next: string;
  err: boolean;
}) {
  const [pending, start] = useTransition();
  const [shake, setShake] = useState(err);
  const inputRef = useRef<HTMLInputElement>(null);

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    setShake(false);
    start(() => action(fd));
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <input type="hidden" name="next" value={next} />
      <label className="block">
        <span className="font-mono text-[11px] uppercase tracking-[0.22em] text-fg-50 block mb-3">
          ▸ PASSWORD
        </span>
        <div
          className={`flex items-center border ${
            err ? "border-fg" : "border-border-strong"
          } focus-within:border-fg ${shake ? "animate-[shake_0.3s_ease-in-out]" : ""}`}
        >
          <span className="font-mono text-fg-50 px-4 select-none">$</span>
          <input
            ref={inputRef}
            name="cmd"
            type="password"
            autoFocus
            autoComplete="current-password"
            autoCapitalize="off"
            autoCorrect="off"
            spellCheck={false}
            inputMode="text"
            placeholder="enter password"
            aria-label="Password"
            className="flex-1 bg-transparent py-3.5 pr-4 font-mono text-[15px] md:text-[16px] text-fg placeholder:text-fg-30 focus:outline-none min-h-[48px] tracking-wider"
          />
        </div>
      </label>

      {err && (
        <div className="font-mono text-[11px] uppercase tracking-[0.2em] text-fg">
          × access denied — invalid password
        </div>
      )}

      <button
        type="submit"
        disabled={pending}
        className="w-full py-3.5 min-h-[48px] bg-fg text-bg font-mono text-[12px] md:text-[13px] uppercase tracking-[0.18em] hover:bg-fg/90 active:bg-fg/80 disabled:opacity-50"
      >
        {pending ? "VERIFYING…" : "AUTHORIZE →"}
      </button>

      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-6px); }
          75% { transform: translateX(6px); }
        }
      `}</style>
    </form>
  );
}

import type { PromptArgument } from "./types";

const ARGUMENT_PATTERN = /\{argument\s+name\s*=\s*(?:"([^"]*)"|([^\s}]+))(?:\s+default\s*=\s*(?:"([^"]*)"|([^\s}]+)))?\s*\}/g;

export function extractPromptArguments(prompt: string): PromptArgument[] {
  const seen = new Set<string>();
  const occurrences = new Map<string, number>();
  const matches = Array.from(prompt.matchAll(ARGUMENT_PATTERN));

  return matches.flatMap((match) => {
    const key = match[0];
    if (seen.has(key)) {
      return [];
    }
    seen.add(key);
    const name = match[1] ?? match[2] ?? "argument";
    const defaultValue = match[3] ?? match[4] ?? "";
    const occurrence = (occurrences.get(name) ?? 0) + 1;
    occurrences.set(name, occurrence);
    return [{ key, name, defaultValue, occurrence }];
  });
}

export function applyPromptArguments(prompt: string, values: Record<string, string>): string {
  return extractPromptArguments(prompt).reduce((resolved, argument) => {
    const nextValue = values[argument.key] ?? argument.defaultValue;
    return resolved.split(argument.key).join(nextValue);
  }, prompt);
}

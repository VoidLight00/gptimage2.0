import type { Metadata } from "next";
import { buildRootMetadata } from "@/lib/page-metadata";

export const metadata: Metadata = buildRootMetadata("en");

export default function EnLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

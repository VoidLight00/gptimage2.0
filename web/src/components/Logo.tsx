import Image from "next/image";

export function Logo({ className = "w-8 h-8" }: { className?: string }) {
  return (
    <div
      className={`${className} relative inline-block`}
      aria-label="VOIDLIGHT"
      role="img"
    >
      {/* Background ring so the black silhouette reads on dark bg */}
      <div className="absolute inset-0 bg-fg rounded-full" aria-hidden />
      <Image
        src="/brand/voidlight-original.png"
        alt=""
        fill
        sizes="40px"
        className="object-contain p-[2px]"
        priority
      />
    </div>
  );
}

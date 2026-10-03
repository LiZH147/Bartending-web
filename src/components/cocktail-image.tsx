"use client";

import { useState } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";

function hashString(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (h * 31 + s.charCodeAt(i)) >>> 0;
  }
  return h;
}

interface CocktailImageProps {
  src?: string | null;
  alt: string;
  seed: string;
  emoji?: string;
  className?: string;
  priority?: boolean;
}

export function CocktailImage({ src, alt, seed, emoji = "🍸", className, priority }: CocktailImageProps) {
  const [failed, setFailed] = useState(false);
  const h = hashString(seed);
  const hueA = (h % 360 + 360) % 360;
  const hueB = (hueA + 45) % 360;

  const showImage = src && !failed && /^https?:\/\//.test(src);

  return (
    <div className={cn("relative overflow-hidden", className)}>
      {showImage ? (
        <Image
          src={src}
          alt={alt}
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          className="object-cover"
          onError={() => setFailed(true)}
          priority={priority}
        />
      ) : (
        <div
          className="absolute inset-0 flex flex-col items-center justify-center"
          style={{
            background: `radial-gradient(120% 120% at 20% 10%, hsl(${hueA} 45% 24%), hsl(${hueB} 40% 8%))`,
          }}
        >
          <span className="text-5xl drop-shadow-lg" aria-hidden>
            {emoji}
          </span>
          <span className="sr-only">{alt}</span>
        </div>
      )}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-transparent"
      />
    </div>
  );
}
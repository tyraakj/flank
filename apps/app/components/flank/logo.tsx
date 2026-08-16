"use client";

import React from "react";

interface LogoProps {
  className?: string;
  size?: number;
}

export function FlankLogo({ className = "", size = 28 }: LogoProps) {
  // Generate a procedural halftone/dithered dot sphere with pastel yellow & pink dots
  const radius = 14;
  const cx = 16;
  const cy = 16;
  const step = 2.1;
  const lightDir = { x: -0.6, y: -0.5, z: 0.63 };
  const len = Math.sqrt(lightDir.x ** 2 + lightDir.y ** 2 + lightDir.z ** 2);
  const lx = lightDir.x / len;
  const ly = lightDir.y / len;
  const lz = lightDir.z / len;

  // Pastel Yellow: #FBBF24 -> Rich Pink: #EC4899
  const colorStart = { r: 251, g: 191, b: 36 }; // warm pastel yellow/amber
  const colorEnd = { r: 236, g: 72, b: 153 }; // rich pink

  const dots: {
    cx: number;
    cy: number;
    r: number;
    fill: string;
    opacity: number;
  }[] = [];

  for (let y = -radius; y <= radius; y += step) {
    for (let x = -radius; x <= radius; x += step) {
      const distSq = x * x + y * y;
      if (distSq <= radius * radius) {
        const z = Math.sqrt(radius * radius - distSq);
        // Normal vector at surface
        const nx = x / radius;
        const ny = y / radius;
        const nz = z / radius;

        // Lambertian lighting diffuse intensity
        const dotProduct = nx * lx + ny * ly + nz * lz;
        const intensity = Math.max(0.12, (dotProduct + 1) / 2);

        // Sphere latitude curve modulation
        const lat = Math.asin(y / radius);
        const latBand = (Math.cos(lat * 8) + 1) / 2;

        const r = Math.max(0.45, 1.2 * (1 - intensity * 0.65) + latBand * 0.25);
        const opacity = Math.min(1, Math.max(0.4, 1.1 - intensity * 0.4));

        // Diagonal gradient progression across the globe (0: top-left yellow, 1: bottom-right pink)
        const t = Math.min(1, Math.max(0, (x + y + 1.2 * radius) / (2.4 * radius)));
        const red = Math.round(colorStart.r + t * (colorEnd.r - colorStart.r));
        const green = Math.round(colorStart.g + t * (colorEnd.g - colorStart.g));
        const blue = Math.round(colorStart.b + t * (colorEnd.b - colorStart.b));
        const fill = `rgb(${red}, ${green}, ${blue})`;

        dots.push({
          cx: Number((cx + x).toFixed(2)),
          cy: Number((cy + y).toFixed(2)),
          r: Number(Math.min(1.35, r).toFixed(2)),
          fill,
          opacity: Number(opacity.toFixed(2)),
        });
      }
    }
  }

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`shrink-0 ${className}`}
    >
      {dots.map((d, i) => (
        <circle key={i} cx={d.cx} cy={d.cy} r={d.r} fill={d.fill} fillOpacity={d.opacity} />
      ))}
    </svg>
  );
}

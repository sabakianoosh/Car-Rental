import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const cars = [
  { id: 'c1', name: 'پژو ۲۰۷', color: '#f5f5f5', accent: '#2563eb' },
  { id: 'c2', name: 'سمند LX', color: '#c0c5ce', accent: '#475569' },
  { id: 'c3', name: 'کیا سراتو', color: '#1f2937', accent: '#dc2626' },
  { id: 'c4', name: 'هیوندای i20', color: '#3b82f6', accent: '#1d4ed8' },
  { id: 'c5', name: 'پژو پارس', color: '#fafafa', accent: '#059669' },
  { id: 'c6', name: 'رنو ساندرو', color: '#ef4444', accent: '#991b1b' },
  { id: 'c7', name: 'تویوتا کرولا', color: '#9ca3af', accent: '#374151' },
];

function carSvg({ name, color, accent }) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 500" role="img" aria-label="${name}">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#eef2f7"/>
      <stop offset="100%" stop-color="#dde5ef"/>
    </linearGradient>
    <linearGradient id="body" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="${color}"/>
      <stop offset="100%" stop-color="${accent}" stop-opacity="0.35"/>
    </linearGradient>
    <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="8" stdDeviation="12" flood-color="#0f172a" flood-opacity="0.18"/>
    </filter>
  </defs>
  <rect width="800" height="500" fill="url(#bg)"/>
  <ellipse cx="400" cy="430" rx="280" ry="24" fill="#000" opacity="0.08"/>
  <g filter="url(#shadow)">
    <path d="M120 320h560c18 0 32-14 32-32V260c0-16-10-30-24-36l-58-22c-12-5-26-5-38 0l-42 18H230l-48-18c-14-6-30-4-42 6l-36 28c-10 8-16 20-16 32v20c0 18 14 32 32 32z" fill="url(#body)" stroke="${accent}" stroke-width="3"/>
    <path d="M250 260h300l48-36c8-6 18-10 28-10h42c14 0 26 8 32 20l28 56H250z" fill="${color}" opacity="0.92" stroke="${accent}" stroke-width="2"/>
    <rect x="270" y="272" width="88" height="42" rx="8" fill="#dbeafe" opacity="0.85"/>
    <rect x="442" y="272" width="88" height="42" rx="8" fill="#dbeafe" opacity="0.85"/>
    <circle cx="230" cy="320" r="42" fill="#111827"/>
    <circle cx="230" cy="320" r="22" fill="#6b7280"/>
    <circle cx="570" cy="320" r="42" fill="#111827"/>
    <circle cx="570" cy="320" r="22" fill="#6b7280"/>
    <rect x="318" y="248" width="164" height="8" rx="4" fill="${accent}" opacity="0.55"/>
  </g>
  <text x="400" y="88" text-anchor="middle" font-family="Tahoma, Arial, sans-serif" font-size="34" font-weight="700" fill="#334155">${name}</text>
  <text x="400" y="126" text-anchor="middle" font-family="Tahoma, Arial, sans-serif" font-size="18" fill="#64748b">ری‌کار · اجاره خودرو</text>
</svg>`;
}

const outDir = path.join(__dirname, '../../client/public/cars');
fs.mkdirSync(outDir, { recursive: true });

for (const car of cars) {
  const file = path.join(outDir, `${car.id}.svg`);
  fs.writeFileSync(file, carSvg(car), 'utf8');
  console.log('created', file);
}

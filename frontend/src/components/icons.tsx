// Custom SVG icon library for MyOrbit
// All icons: 24x24 viewBox, stroke-based, 1.8px strokeWidth, linecap/linejoin round

interface IconProps {
  size?: number;
  color?: string;
  strokeWidth?: number;
  className?: string;
}

const base = (strokeWidth = 1.8) => ({
  fill: "none" as const,
  stroke: "currentColor",
  strokeWidth,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
});

export function IconBook({ size = 20, color = "currentColor", strokeWidth = 1.8 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" {...base(strokeWidth)} style={{ color }}>
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
      <path d="M8 7h8M8 11h6" />
    </svg>
  );
}

export function IconRun({ size = 20, color = "currentColor", strokeWidth = 1.8 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" {...base(strokeWidth)} style={{ color }}>
      <circle cx="12" cy="4" r="1.5" fill="currentColor" stroke="none" />
      <path d="M9 9.5l1.5 3.5H6M15 9.5l-1 4L11.5 17l-1.5 3" />
      <path d="M9.5 13.5l3 1.5 2-2.5" />
      <path d="M15.5 9l2-2.5" />
    </svg>
  );
}

export function IconReadingBook({ size = 20, color = "currentColor", strokeWidth = 1.8 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" {...base(strokeWidth)} style={{ color }}>
      <path d="M2 6s3-2 6-2 6 2 6 2v14s-3-2-6-2-6 2-6 2V6z" />
      <path d="M22 6s-3-2-6-2-6 2-6 2v14s3-2 6-2 6 2 6 2V6z" />
      <path d="M12 6v14" />
    </svg>
  );
}

export function IconMeditate({ size = 20, color = "currentColor", strokeWidth = 1.8 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" {...base(strokeWidth)} style={{ color }}>
      <circle cx="12" cy="4" r="1.5" fill="currentColor" stroke="none" />
      <path d="M12 6v5" />
      <path d="M7 10c1.5 0 3 1 5 1s3.5-1 5-1" />
      <path d="M9 14c-2 0-4 1-4 1M15 14c2 0 4 1 4 1" />
      <path d="M9 14c0 2 1.5 4 3 4s3-2 3-4" />
      <path d="M12 18v3" />
    </svg>
  );
}

export function IconNoPhone({ size = 20, color = "currentColor", strokeWidth = 1.8 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" {...base(strokeWidth)} style={{ color }}>
      <rect x="7" y="2" width="10" height="18" rx="2" />
      <path d="M11 18h2" />
      <path d="M3 3l18 18" />
    </svg>
  );
}

export function IconPencil({ size = 20, color = "currentColor", strokeWidth = 1.8 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" {...base(strokeWidth)} style={{ color }}>
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z" />
    </svg>
  );
}

export function IconCalendar({ size = 20, color = "currentColor", strokeWidth = 1.8 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" {...base(strokeWidth)} style={{ color }}>
      <rect x="3" y="4" width="18" height="18" rx="3" />
      <path d="M8 2v4M16 2v4M3 10h18" />
    </svg>
  );
}

export function IconBell({ size = 20, color = "currentColor", strokeWidth = 1.8 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" {...base(strokeWidth)} style={{ color }}>
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
  );
}

export function IconTarget({ size = 20, color = "currentColor", strokeWidth = 1.8 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" {...base(strokeWidth)} style={{ color }}>
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="12" r="5" />
      <circle cx="12" cy="12" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function IconRepeat({ size = 20, color = "currentColor", strokeWidth = 1.8 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" {...base(strokeWidth)} style={{ color }}>
      <path d="M17 1l4 4-4 4" />
      <path d="M3 11V9a4 4 0 0 1 4-4h14" />
      <path d="M7 23l-4-4 4-4" />
      <path d="M21 13v2a4 4 0 0 1-4 4H3" />
    </svg>
  );
}

export function IconRadar({ size = 20, color = "currentColor", strokeWidth = 1.8 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" {...base(strokeWidth)} style={{ color }}>
      <path d="M12 2a10 10 0 1 0 10 10" />
      <path d="M12 6a6 6 0 1 0 6 6" />
      <path d="M12 10a2 2 0 1 0 2 2" />
      <line x1="12" y1="2" x2="12" y2="2" strokeWidth="3" />
      <path d="M12 12L19.5 4.5" />
    </svg>
  );
}

export function IconUser({ size = 20, color = "currentColor", strokeWidth = 1.8 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" {...base(strokeWidth)} style={{ color }}>
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}

export function IconSettings({ size = 20, color = "currentColor", strokeWidth = 1.8 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" {...base(strokeWidth)} style={{ color }}>
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  );
}

export function IconShield({ size = 20, color = "currentColor", strokeWidth = 1.8 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" {...base(strokeWidth)} style={{ color }}>
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      <path d="M9 12l2 2 4-4" />
    </svg>
  );
}

export function IconGraduation({ size = 20, color = "currentColor", strokeWidth = 1.8 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" {...base(strokeWidth)} style={{ color }}>
      <path d="M22 10v6M2 10l10 5 10-5-10-5z" />
      <path d="M6 12v5c0 2.21 2.686 4 6 4s6-1.79 6-4v-5" />
    </svg>
  );
}

export function IconClipboard({ size = 20, color = "currentColor", strokeWidth = 1.8 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" {...base(strokeWidth)} style={{ color }}>
      <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
      <rect x="8" y="2" width="8" height="4" rx="1" />
      <path d="M9 12l2 2 4-4" />
    </svg>
  );
}

export function IconSearch({ size = 20, color = "currentColor", strokeWidth = 1.8 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" {...base(strokeWidth)} style={{ color }}>
      <circle cx="11" cy="11" r="8" />
      <path d="M21 21l-4.35-4.35" />
    </svg>
  );
}

export function IconFlame({ size = 20, color = "currentColor", strokeWidth = 1.8 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" {...base(strokeWidth)} style={{ color }}>
      <path d="M8.5 14.5A5 5 0 0 0 17 12c0-5-3-6.5-3-6.5.5 3-1.5 5-3 6.5-.5.5-1 1-1 2.5A4 4 0 0 0 14 18a4 4 0 0 1-5.5-3.5z" />
      <path d="M12 22a5 5 0 0 0 5-5c0-2.5-2-4-2-4a3 3 0 0 1-3 3 3 3 0 0 1-3-3s-2 1.5-2 4a5 5 0 0 0 5 5z" />
    </svg>
  );
}

export function IconMoon({ size = 20, color = "currentColor", strokeWidth = 1.8 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" {...base(strokeWidth)} style={{ color }}>
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  );
}

export function IconKey({ size = 20, color = "currentColor", strokeWidth = 1.8 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" {...base(strokeWidth)} style={{ color }}>
      <circle cx="8" cy="8" r="4" />
      <path d="M20 20l-8.9-8.9" />
      <path d="M15 16l2 2" />
      <path d="M18 13l2 2" />
    </svg>
  );
}

export function IconBuilding({ size = 20, color = "currentColor", strokeWidth = 1.8 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" {...base(strokeWidth)} style={{ color }}>
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <path d="M9 22V12h6v10" />
      <path d="M8 7h1M12 7h1M16 7h1M8 11h1M12 11h1M16 11h1" />
    </svg>
  );
}

export function IconCheckCircle({ size = 20, color = "currentColor", strokeWidth = 1.8 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" {...base(strokeWidth)} style={{ color }}>
      <circle cx="12" cy="12" r="9" />
      <path d="M9 12l2 2 4-4" />
    </svg>
  );
}

export function IconPackage({ size = 20, color = "currentColor", strokeWidth = 1.8 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" {...base(strokeWidth)} style={{ color }}>
      <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
      <path d="M3.27 6.96L12 12.01l8.73-5.05M12 22.08V12" />
    </svg>
  );
}

export function IconDocument({ size = 20, color = "currentColor", strokeWidth = 1.8 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" {...base(strokeWidth)} style={{ color }}>
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" />
    </svg>
  );
}

export function IconStar({ size = 20, color = "currentColor", strokeWidth = 1.8 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" {...base(strokeWidth)} style={{ color }}>
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  );
}

export function IconTag({ size = 20, color = "currentColor", strokeWidth = 1.8 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" {...base(strokeWidth)} style={{ color }}>
      <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
      <line x1="7" y1="7" x2="7.01" y2="7" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  );
}

export function IconChecklist({ size = 20, color = "currentColor", strokeWidth = 1.8 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" {...base(strokeWidth)} style={{ color }}>
      <path d="M9 6h11M9 12h11M9 18h11" />
      <path d="M4 6l1 1 2-2M4 12l1 1 2-2M4 18l1 1 2-2" />
    </svg>
  );
}

export function IconGoogle({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
      <path d="M5.84 14.1c-.22-.66-.35-1.36-.35-2.1s.13-1.44.35-2.1V7.07H2.18A10 10 0 0 0 2 12c0 1.64.39 3.19 1.07 4.57l2.77-2.47z" fill="#FBBC05"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    </svg>
  );
}

export function IconTrendUp({ size = 20, color = "currentColor", strokeWidth = 1.8 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" {...base(strokeWidth)} style={{ color }}>
      <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
      <polyline points="17 6 23 6 23 12" />
    </svg>
  );
}

export function IconClock({ size = 20, color = "currentColor", strokeWidth = 1.8 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" {...base(strokeWidth)} style={{ color }}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 3" />
    </svg>
  );
}

export function IconMapPin({ size = 20, color = "currentColor", strokeWidth = 1.8 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" {...base(strokeWidth)} style={{ color }}>
      <path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0 1 18 0z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  );
}

export function IconLink({ size = 20, color = "currentColor", strokeWidth = 1.8 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" {...base(strokeWidth)} style={{ color }}>
      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
    </svg>
  );
}

export function IconUsers({ size = 20, color = "currentColor", strokeWidth = 1.8 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" {...base(strokeWidth)} style={{ color }}>
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}

export function IconActivity({ size = 20, color = "currentColor", strokeWidth = 1.8 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" {...base(strokeWidth)} style={{ color }}>
      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
    </svg>
  );
}

export function IconHabit({ size = 20, color = "currentColor", strokeWidth = 1.8 }: IconProps) {
  // A circular arrow suggesting an orbit / routine
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" {...base(strokeWidth)} style={{ color }}>
      <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
      <path d="M3 3v5h5" />
    </svg>
  );
}

export function IconOrbit({ size = 20, color = "currentColor", strokeWidth = 1.8 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" {...base(strokeWidth)} style={{ color }}>
      <ellipse cx="12" cy="12" rx="10" ry="4.5" />
      <ellipse cx="12" cy="12" rx="10" ry="4.5" transform="rotate(60 12 12)" />
      <ellipse cx="12" cy="12" rx="10" ry="4.5" transform="rotate(120 12 12)" />
      <circle cx="12" cy="12" r="2" fill="currentColor" stroke="none" />
    </svg>
  );
}

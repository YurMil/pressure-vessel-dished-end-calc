import type { ReactNode } from 'react';

const ICONS: Record<string, string | null> = {
  download: ['M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4', 'M7 10l5 5 5-5', 'M12 15V3'].join(''),
  settings: [
    'M12 15.5a3.5 3.5 0 1 1 0-7 3.5 3.5 0 0 1 0 7.5z',
    'M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 8.1 19.4 1.65 1.65 0 0 0 6.28 19l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 3.67 15a1.65 1.65 0 0 0-1.51-1H2a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 3.6 8.6 1.65 1.65 0 0 0 3.67 7l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 8 3.67 1.65 1.65 0 0 0 9.51 2H10a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9c.35 0 .69.07 1 .2h.09a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1 1.51z',
  ].join(''),
  plus: ['M12 5v14', 'M5 12h14'].join(''),
  'trash-2': ['M3 6h18', 'M8 6v12a2 2 0 0 0 2 2h4a2 2 0 0 0 2-2V6', 'M10 6V4a2 2 0 0 1 2-2h0a2 2 0 0 1 2 2v2', 'M10 11v6', 'M14 11v6'].join(''),
  x: ['M18 6 6 18', 'M6 6l12 12'].join(''),
  info: ['M12 9v4', 'M12 17h.01', 'M22 12A10 10 0 1 1 2 12a10 10 0 0 1 20 0Z'].join(''),
  printer: ['M6 9V2h12v7', 'M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2', 'M6 14h12v8H6v-8z'].join(''),
  ruler: 'M21.3 8.7 8.7 21.3a2.12 2.12 0 0 1-3 0l-3-3a2.12 2.12 0 0 1 0-3L15.3 2.7a2.12 2.12 0 0 1 3 0l3 3a2.12 2.12 0 0 1 0 3Z',
  layers: ['M12 2 2 7l10 5 10-5-10-5z', 'M2 17l10 5 10-5', 'M2 12l10 5 10-5'].join(''),
  scissors: ['M20 4 8.5 15.5', 'M8.5 8.5 20 20', 'M6 6a2 2 0 1 1-4 0 2 2 0 0 1 4 0zm0 12a2 2 0 1 1-4 0 2 2 0 0 1 4 0z'].join(''),
  box: ['M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z', 'M3.3 7 12 12l8.7-5', 'M12 22V12'].join(''),
  loader: 'M21 12a9 9 0 1 1-6.2-8.56',
  cpu: null,
  alert: ['M12 9v4', 'M12 17h.01', 'M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z'].join(''),
};

const CpuIcon = () => (
  <>
    <rect x="4" y="4" width="16" height="16" rx="2" ry="2"></rect>
    <rect x="9" y="9" width="6" height="6"></rect>
    <path d="M9 1v3M15 1v3M9 20v3M15 20v3M20 9h3M20 14h3M1 9h3M1 14h3"></path>
  </>
);

interface IconProps {
  name: string;
  size?: number;
  className?: string;
}

export function Icon({ name, size = 18, className = '' }: IconProps) {
  let content: ReactNode = null;

  if (name === 'cpu') {
    content = <CpuIcon />;
  } else if (ICONS[name]) {
    content = <path d={ICONS[name] as string}></path>;
  }

  if (!content) return null;

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      {content}
    </svg>
  );
}

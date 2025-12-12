import * as React from 'react';

type Props = React.SVGProps<SVGSVGElement>;

function IconBase({ children, ...props }: Props & { children: React.ReactNode }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      {children}
    </svg>
  );
}

export function BorderAllIcon(props: Props) {
  return (
    <IconBase {...props}>
      <rect x="4" y="4" width="16" height="16" />
      <path d="M12 4v16" />
      <path d="M4 12h16" />
    </IconBase>
  );
}

export function BorderNoneIcon(props: Props) {
  return (
    <IconBase {...props}>
      <rect x="4" y="4" width="16" height="16" />
      <path d="M6 6l12 12" />
    </IconBase>
  );
}

export function BorderTopIcon(props: Props) {
  return (
    <IconBase {...props}>
      <rect x="4" y="4" width="16" height="16" />
      <path d="M4 6h16" />
    </IconBase>
  );
}

export function BorderBottomIcon(props: Props) {
  return (
    <IconBase {...props}>
      <rect x="4" y="4" width="16" height="16" />
      <path d="M4 18h16" />
    </IconBase>
  );
}

export function BorderLeftIcon(props: Props) {
  return (
    <IconBase {...props}>
      <rect x="4" y="4" width="16" height="16" />
      <path d="M6 4v16" />
    </IconBase>
  );
}

export function BorderRightIcon(props: Props) {
  return (
    <IconBase {...props}>
      <rect x="4" y="4" width="16" height="16" />
      <path d="M18 4v16" />
    </IconBase>
  );
}



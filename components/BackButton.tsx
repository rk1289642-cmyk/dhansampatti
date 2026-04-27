'use client';

import Link from 'next/link';

interface BackButtonProps {
  href: string;
  label?: string;
}

/**
 * Inline back arrow link — navigates to a specific dashboard href.
 * Uses <Link> (not router.back()) so it always goes to the right place
 * even if the user opened the page directly.
 */
export default function BackButton({ href, label = 'Back to Dashboard' }: BackButtonProps) {
  return (
    <Link href={href} className="back-btn" aria-label={label}>
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <line x1="19" y1="12" x2="5" y2="12" />
        <polyline points="12 19 5 12 12 5" />
      </svg>
      {label}
    </Link>
  );
}

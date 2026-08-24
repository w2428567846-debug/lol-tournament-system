import type { AnchorHTMLAttributes } from 'react';

type SafeLinkProps = Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'href'> & {
  href: string;
};

/**
 * Uses a native navigation so production remains usable even when the Vinext
 * client-side Link runtime cannot initialize. The browser still preserves the
 * current authenticated session during the full-page request.
 */
export default function SafeLink({ href, ...props }: SafeLinkProps) {
  return <a href={href} {...props} />;
}

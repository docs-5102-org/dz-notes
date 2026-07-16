'use client';

import * as React from 'react';
import { ArrowUp } from 'lucide-react';

export function BackToTopButton() {
  const [visible, setVisible] = React.useState(false);

  React.useEffect(() => {
    const updateVisibility = () => {
      const threshold = Math.round(window.innerHeight * (2 / 3));
      setVisible(window.scrollY > threshold);
    };

    updateVisibility();
    window.addEventListener('scroll', updateVisibility, { passive: true });
    window.addEventListener('resize', updateVisibility);

    return () => {
      window.removeEventListener('scroll', updateVisibility);
      window.removeEventListener('resize', updateVisibility);
    };
  }, []);

  return (
    <button
      type="button"
      aria-label="回到顶部"
      onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
      className={[
        'fixed bottom-6 right-6 z-40 flex h-12 w-12 items-center justify-center rounded-full border border-fd-border bg-fd-card/92 text-fd-foreground shadow-[0_12px_30px_rgba(33,28,19,0.16)] backdrop-blur transition-all',
        visible
          ? 'pointer-events-auto translate-y-0 opacity-100'
          : 'pointer-events-none translate-y-3 opacity-0',
        'hover:-translate-y-0.5 hover:border-fd-muted-foreground hover:bg-fd-secondary',
      ].join(' ')}
    >
      <ArrowUp className="h-5 w-5" />
    </button>
  );
}

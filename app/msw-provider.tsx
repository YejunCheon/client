'use client';

import { PropsWithChildren, useState, useEffect } from 'react';

export function MSWProvider({ children }: PropsWithChildren) {
  const [mswReady, setMswReady] = useState(false);

  useEffect(() => {
    async function setupMsw() {
      if (process.env.NODE_ENV === 'development') {
        const { worker } = await import('@/mocks/browser');
        await worker.start();
        setMswReady(true);
      }
    }

    if (!mswReady) {
      setupMsw();
    }
  }, [mswReady]);

  if (process.env.NODE_ENV !== 'development') {
    return <>{children}</>;
  }

  return mswReady ? <>{children}</> : null; // Or a loading spinner
}

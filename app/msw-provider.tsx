'use client';

import { PropsWithChildren, useEffect, useState } from 'react';
import { apiMode } from '@/lib/api';

const shouldUseMock = apiMode === 'mock';

export function MSWProvider({ children }: PropsWithChildren) {
  const [mswReady, setMswReady] = useState(false);

  useEffect(() => {
    async function setupMsw() {
      if (!shouldUseMock) {
        setMswReady(true);
        return;
      }

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

  if (!shouldUseMock || process.env.NODE_ENV !== 'development') {
    return <>{children}</>;
  }

  return mswReady ? <>{children}</> : null;
}

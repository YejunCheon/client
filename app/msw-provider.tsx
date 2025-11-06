'use client';

import { PropsWithChildren, useEffect, useState } from 'react';
import { useMockApi } from '@/lib/api';

export function MSWProvider({ children }: PropsWithChildren) {
  const isMockMode = useMockApi();
  const [mswReady, setMswReady] = useState(!isMockMode);

  useEffect(() => {
    async function setupMsw() {
      if (!isMockMode) {
        setMswReady(true);
        return;
      }

      try {
        const { worker } = await import('@/mocks/browser');
        await worker.start({
          onUnhandledRequest: 'bypass', // MSW에서 처리하지 않는 요청은 그대로 통과
        });
        console.log('[MSW] Mock Service Worker started');
        setMswReady(true);
      } catch (error) {
        console.error('[MSW] Failed to start Mock Service Worker:', error);
        setMswReady(true); // 에러가 나도 앱은 로드되도록
      }
    }

    if (!mswReady) {
      setupMsw();
    }
  }, [mswReady]);

  // Mock 모드가 아니면 바로 렌더링
  if (!isMockMode) {
    return <>{children}</>;
  }

  // Mock 모드인 경우 MSW가 준비될 때까지 대기
  return mswReady ? <>{children}</> : null;
}

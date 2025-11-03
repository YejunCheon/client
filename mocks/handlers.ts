import { http, HttpResponse } from 'msw';
import { mockContracts } from './data/contracts';

export const handlers = [
  http.get('*/contracts', () => {
    return HttpResponse.json({
      contracts: mockContracts,
      success: true,
      count: mockContracts.length,
    });
  }),
];

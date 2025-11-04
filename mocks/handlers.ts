import { http, HttpResponse, type PathParams } from 'msw';
import { mockContracts } from './data/contracts';
import { mockProducts } from './data/products';

export const handlers = [
  http.get('*/contracts', () => {
    return HttpResponse.json({
      contracts: mockContracts,
      success: true,
      count: mockContracts.length,
    });
  }),
  http.get('*/products', () => {
    return HttpResponse.json({
      product: mockProducts,
      success: true,
      count: mockProducts.length,
    });
  }),
  http.get<PathParams<never>, { productId: string }>('*/products/:productId', ({ params }) => {
    const { productId } = params;
    const product = mockProducts.find((p) => p.id === Number(productId));

    if (product) {
      return HttpResponse.json({
        product,
        success: true,
      });
    }

    return new HttpResponse(null, { status: 404 });
  }),
];

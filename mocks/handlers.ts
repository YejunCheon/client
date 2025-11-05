import { http, HttpResponse, type PathParams } from 'msw';
import { mockContracts } from './data/contracts';
import { mockProducts } from './data/products';

export const handlers = [
  http.get('*/api/contracts', () => {
    return HttpResponse.json({
      contracts: mockContracts,
      success: true,
      count: mockContracts.length,
    });
  }),
  http.get('*/api/products/list', () => {
    return HttpResponse.json({
      products: mockProducts,
      success: true,
      count: mockProducts.length,
    });
  }),
  http.get('*/api/products/:productId', ({ params }) => {
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

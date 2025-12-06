import { getStripeProducts, getStripePrices } from '@/lib/payments/stripe';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const [products, prices] = await Promise.all([
      getStripeProducts(),
      getStripePrices()
    ]);

    // Combine products with their prices
    const productsWithPrices = products.map(product => {
      const productPrices = prices.filter(price => price.productId === product.id);
      return {
        ...product,
        prices: productPrices
      };
    });

    return NextResponse.json(productsWithPrices);
  } catch (error) {
    console.error('Error fetching products:', error);
    return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 });
  }
}

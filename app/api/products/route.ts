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

    // Sort products: Base first, then Plus, then others alphabetically
    const productOrder: Record<string, number> = { base: 0, plus: 1 };
    productsWithPrices.sort((a, b) => {
      const aName = a.name.toLowerCase();
      const bName = b.name.toLowerCase();
      const aOrder = Object.entries(productOrder).find(([key]) => aName.includes(key))?.[1] ?? 99;
      const bOrder = Object.entries(productOrder).find(([key]) => bName.includes(key))?.[1] ?? 99;
      if (aOrder !== bOrder) return aOrder - bOrder;
      return aName.localeCompare(bName);
    });

    return NextResponse.json(productsWithPrices);
  } catch (error) {
    console.error('Error fetching products:', error);
    return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 });
  }
}

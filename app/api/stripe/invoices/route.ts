import { getTeamForUser } from '@/lib/db/queries';
import { stripe } from '@/lib/payments/stripe';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const team = await getTeamForUser();

    if (!team?.stripeCustomerId) {
      return NextResponse.json({ invoices: [] });
    }

    const invoices = await stripe.invoices.list({
      customer: team.stripeCustomerId,
      limit: 24,
    });

    const formattedInvoices = invoices.data.map((invoice) => ({
      id: invoice.id,
      number: invoice.number,
      created: invoice.created,
      amount: invoice.amount_paid,
      currency: invoice.currency,
      status: invoice.status,
      invoicePdf: invoice.invoice_pdf,
      hostedInvoiceUrl: invoice.hosted_invoice_url,
    }));

    return NextResponse.json({ invoices: formattedInvoices });
  } catch (error) {
    console.error('Error fetching invoices:', error);
    return NextResponse.json(
      { error: 'Failed to fetch invoices' },
      { status: 500 }
    );
  }
}

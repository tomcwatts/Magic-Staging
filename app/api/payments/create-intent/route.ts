import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { stripe } from '@/lib/stripe';
import { getCreditPackage, priceToStripeAmount } from '@/lib/pricing';
import { getOrCreateStripeCustomer } from '@/lib/stripe-customer';
import { requireAuthWithOrg } from '@/lib/auth-utils';

const createPaymentIntentSchema = z.object({
  packageId: z.string(),
});

export async function POST(request: NextRequest) {
  try {
    const userWithOrg = await requireAuthWithOrg();
    const body = await request.json();
    const { packageId } = createPaymentIntentSchema.parse(body);

    // Get credit package details
    const creditPackage = getCreditPackage(packageId);
    if (!creditPackage) {
      return NextResponse.json(
        { error: 'Invalid credit package' },
        { status: 400 }
      );
    }

    // Get or create Stripe customer
    const customer = await getOrCreateStripeCustomer(
      userWithOrg.organization.id,
      userWithOrg.user.email,
      userWithOrg.user.name || undefined
    );

    // Create payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: priceToStripeAmount(creditPackage.totalPrice),
      currency: 'usd',
      customer: customer.id,
      metadata: {
        organizationId: userWithOrg.organization.id,
        userId: userWithOrg.user.id,
        packageId: creditPackage.id,
        credits: creditPackage.credits.toString(),
      },
      description: `${creditPackage.credits} AI Staging Credits - Magic Staging`,
    });

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
      amount: paymentIntent.amount,
      currency: paymentIntent.currency,
      credits: creditPackage.credits,
    });

  } catch (error) {
    console.error('Payment intent creation failed:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to create payment intent' },
      { status: 500 }
    );
  }
}
import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { db } from '@/lib/db';
import { headers } from 'next/headers';

const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

export async function POST(request: NextRequest) {
  if (!endpointSecret) {
    console.error('STRIPE_WEBHOOK_SECRET not configured');
    return NextResponse.json(
      { error: 'Webhook secret not configured' },
      { status: 500 }
    );
  }

  const body = await request.text();
  const headersList = await headers();
  const sig = headersList.get('stripe-signature');

  if (!sig) {
    return NextResponse.json(
      { error: 'Missing stripe signature' },
      { status: 400 }
    );
  }

  let event;

  try {
    event = stripe.webhooks.constructEvent(body, sig, endpointSecret);
  } catch (err) {
    console.error('Webhook signature verification failed:', err);
    return NextResponse.json(
      { error: 'Invalid signature' },
      { status: 400 }
    );
  }

  try {
    switch (event.type) {
      case 'payment_intent.succeeded':
        await handlePaymentSucceeded(event.data.object);
        break;
      
      case 'payment_intent.payment_failed':
        await handlePaymentFailed(event.data.object);
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
    
  } catch (error) {
    console.error('Webhook handler error:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}

async function handlePaymentSucceeded(paymentIntent: {
  id: string;
  amount: number;
  currency: string;
  metadata: {
    organizationId?: string;
    userId?: string;
    packageId?: string;
    credits?: string;
  };
}) {
  const { organizationId, userId, packageId, credits } = paymentIntent.metadata;

  if (!organizationId || !userId || !credits) {
    console.error('Missing required metadata in payment intent:', paymentIntent.metadata);
    return;
  }

  const creditsToAdd = parseInt(credits, 10);
  if (isNaN(creditsToAdd) || creditsToAdd <= 0) {
    console.error('Invalid credits amount:', credits);
    return;
  }

  try {
    // Use transaction to ensure atomicity
    await db.$transaction(async (tx) => {
      // Create transaction record
      await tx.transaction.create({
        data: {
          organizationId,
          stripePaymentIntentId: paymentIntent.id,
          amountCents: paymentIntent.amount,
          currency: paymentIntent.currency.toUpperCase(),
          status: 'succeeded',
          roomsPurchased: creditsToAdd, // This field name is legacy, but represents credits
          description: `${creditsToAdd} credits purchase via ${packageId}`,
        },
      });

      // Add credits to organization
      await tx.organization.update({
        where: { id: organizationId },
        data: {
          creditsRemaining: {
            increment: creditsToAdd,
          },
        },
      });

      // Log the credit purchase
      await tx.usageLog.create({
        data: {
          organizationId,
          userId,
          action: 'credits_purchased',
          resourceId: paymentIntent.id,
          billableCredits: -creditsToAdd, // Negative because it's adding credits
        },
      });
    });

    console.log(`Successfully added ${creditsToAdd} credits to organization ${organizationId}`);
    
  } catch (error) {
    console.error('Failed to process successful payment:', error);
    throw error;
  }
}

async function handlePaymentFailed(paymentIntent: {
  id: string;
  amount: number;
  currency: string;
  metadata: {
    organizationId?: string;
  };
}) {
  const { organizationId } = paymentIntent.metadata;

  if (!organizationId) {
    console.error('Missing organizationId in failed payment intent metadata');
    return;
  }

  try {
    // Create failed transaction record
    await db.transaction.create({
      data: {
        organizationId,
        stripePaymentIntentId: paymentIntent.id,
        amountCents: paymentIntent.amount,
        currency: paymentIntent.currency.toUpperCase(),
        status: 'failed',
        roomsPurchased: 0,
        description: `Failed payment attempt`,
      },
    });

    console.log(`Recorded failed payment for organization ${organizationId}`);
    
  } catch (error) {
    console.error('Failed to record failed payment:', error);
    throw error;
  }
}
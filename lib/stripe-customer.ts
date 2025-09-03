import { stripe } from './stripe';
import { db } from './db';

export async function createStripeCustomer(organizationId: string, email: string, name?: string) {
  const customer = await stripe.customers.create({
    email,
    name: name || undefined,
    metadata: {
      organizationId,
    },
  });

  // Update organization with Stripe customer ID
  await db.organization.update({
    where: { id: organizationId },
    data: { stripeCustomerId: customer.id },
  });

  return customer;
}

export async function getOrCreateStripeCustomer(organizationId: string, email: string, name?: string) {
  // First check if organization already has a Stripe customer
  const organization = await db.organization.findUnique({
    where: { id: organizationId },
    select: { stripeCustomerId: true },
  });

  if (organization?.stripeCustomerId) {
    try {
      // Verify customer still exists in Stripe
      const customer = await stripe.customers.retrieve(organization.stripeCustomerId);
      if (!customer.deleted) {
        return customer;
      }
    } catch {
      console.warn(`Stripe customer ${organization.stripeCustomerId} not found, creating new one`);
    }
  }

  // Create new customer if none exists or old one was deleted
  return createStripeCustomer(organizationId, email, name);
}

export async function getStripeCustomer(customerId: string) {
  return stripe.customers.retrieve(customerId);
}
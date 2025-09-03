export interface CreditPackage {
  id: string;
  credits: number;
  pricePerCredit: number;
  totalPrice: number;
  savings: number;
  isPopular?: boolean;
}

export const CREDIT_PACKAGES: CreditPackage[] = [
  {
    id: 'credits-10',
    credits: 10,
    pricePerCredit: 4.49,
    totalPrice: 44.90,
    savings: 0.50,
  },
  {
    id: 'credits-25', 
    credits: 25,
    pricePerCredit: 4.29,
    totalPrice: 107.25,
    savings: 1.75,
  },
  {
    id: 'credits-50',
    credits: 50,
    pricePerCredit: 3.99,
    totalPrice: 199.50,
    savings: 5.00,
    isPopular: true,
  },
  {
    id: 'credits-100',
    credits: 100,
    pricePerCredit: 3.49,
    totalPrice: 349.00,
    savings: 15.00,
  },
];

export const BASE_PRICE_PER_CREDIT = 4.99;

export function getCreditPackage(packageId: string): CreditPackage | null {
  return CREDIT_PACKAGES.find(pkg => pkg.id === packageId) || null;
}

export function calculateSavings(credits: number, pricePerCredit: number): number {
  return (BASE_PRICE_PER_CREDIT - pricePerCredit) * credits;
}

export function calculateTotalPrice(credits: number, pricePerCredit: number): number {
  return Math.round(credits * pricePerCredit * 100) / 100; // Round to 2 decimal places
}

export function formatPrice(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

export function priceToStripeAmount(price: number): number {
  return Math.round(price * 100); // Convert dollars to cents for Stripe
}
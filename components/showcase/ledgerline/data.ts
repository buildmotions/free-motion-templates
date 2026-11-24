export type Billing = 'monthly' | 'annual';
export type PlanId = 'starter' | 'pro' | 'scale';

export const MIN_SEATS = 1;
export const MAX_SEATS = 200;

export const plans: {
  id: PlanId;
  name: string;
  line: string;
  seats: [number, number];
  perSeat: Record<Billing, number>;
  minimumSeats: number;
  features: string[];
}[] = [
  {
    id: 'starter',
    name: 'Starter',
    line: 'For a founder and a bookkeeper closing the first books.',
    seats: [1, 3],
    perSeat: { monthly: 0, annual: 0 },
    minimumSeats: 0,
    features: ['Up to 3 seats', 'Two bank feeds', 'Monthly close checklist', 'Email support'],
  },
  {
    id: 'pro',
    name: 'Pro',
    line: 'For finance teams that close every month and want it boring.',
    seats: [4, 49],
    perSeat: { monthly: 14, annual: 11 },
    minimumSeats: 0,
    features: ['Unlimited bank feeds', 'Approval flows', 'Variance alerts', 'Audit trail export', 'Priority support'],
  },
  {
    id: 'scale',
    name: 'Scale',
    line: 'For groups with several entities, auditors and a security review.',
    seats: [50, 200],
    perSeat: { monthly: 12, annual: 9 },
    minimumSeats: 50,
    features: ['Everything in Pro', 'Multi-entity consolidation', 'SSO and SCIM', 'Dedicated close manager', '99.9% uptime terms'],
  },
];

// What one plan costs per month for a team; Scale bills a 50-seat minimum, Starter is free but capped.
export function monthly(plan: (typeof plans)[number], seats: number, billing: Billing) {
  if (plan.id === 'starter') return seats <= plan.seats[1] ? 0 : null;
  return Math.max(seats, plan.minimumSeats) * plan.perSeat[billing];
}

export const recommended = (seats: number): PlanId =>
  plans.find((plan) => seats >= plan.seats[0] && seats <= plan.seats[1])!.id;

export const comparison: [string, string, string, string][] = [
  ['Seats', 'Up to 3', '4–49', '50+'],
  ['Bank feeds', '2', 'Unlimited', 'Unlimited'],
  ['Entities', '1', '1', 'Unlimited'],
  ['Approval flows', '—', '✓', '✓'],
  ['SSO and SCIM', '—', '—', '✓'],
  ['Support', 'Email', 'Priority', 'Dedicated manager'],
];

import { api } from './api';
import type { Payment } from './payments';
import { cacheReservation, type Reservation } from './reservations';

// Matches App\Services\RentLedger::periods() — plain arrays the service
// derives, not Eloquent models, so they arrive as-is (same data the Blade
// view consumes).
export type PeriodStatus = 'paid' | 'partial' | 'due' | 'overdue' | 'upcoming';

export type RentPeriod = {
  period: string;
  label: string;
  due_on: string;
  expected: number;
  paid: number;
  balance: number;
  status: PeriodStatus;
  payments: Payment[];
};

// RentLedger::summary(). Note the camelCase keys — this is a hand-built
// array, not a Resource, so it doesn't follow the snake_case convention the
// rest of the API uses.
export type LedgerSummary = {
  monthlyRent: number;
  dueDay: number;
  periodCount: number;
  collected: number;
  monthlyCollected: number;
  otherCollected: number;
  outstanding: number;
  overdueCount: number;
  overdueAmount: number;
  nextDue: RentPeriod | null;
  oldestOverdue: RentPeriod | null;
};

export type Tenancy = {
  reservation: Reservation;
  periods: RentPeriod[];
  other_charges: Payment[];
  summary: LedgerSummary;
  payable_period: RentPeriod | null;
};

// Laravel serializes decimals as numeric strings — coerce once here so
// screens can call .toLocaleString() without checking typeof first.
function normalizePeriod(period: RentPeriod): RentPeriod {
  return {
    ...period,
    expected: Number(period.expected),
    paid: Number(period.paid),
    balance: Number(period.balance),
  };
}

export async function getTenancy(reservationId: number): Promise<Tenancy> {
  const { data } = await api.get<{ data: Tenancy }>(`/tenant/tenancy/${reservationId}`);
  cacheReservation(data.data.reservation);

  return {
    ...data.data,
    periods: data.data.periods.map(normalizePeriod),
    payable_period: data.data.payable_period ? normalizePeriod(data.data.payable_period) : null,
  };
}

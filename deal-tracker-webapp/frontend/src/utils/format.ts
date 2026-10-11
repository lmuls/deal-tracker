import type { DealResponse, DealType, SiteResponse } from '../api/generated';
import type { TrackerStatus } from '../components/ui/TrackerCard';

/** "just now", "4 min ago", "3 h ago", "2 days ago", then a date. */
export function timeAgo(dateString?: string): string {
  if (!dateString) return '';
  const date = new Date(dateString);
  const sec = Math.floor((Date.now() - date.getTime()) / 1000);
  if (sec < 60) return 'just now';
  if (sec < 3600) return `${Math.floor(sec / 60)} min ago`;
  if (sec < 86400) return `${Math.floor(sec / 3600)} h ago`;
  const days = Math.floor(sec / 86400);
  if (days < 7) return days === 1 ? 'yesterday' : `${days} days ago`;
  return shortDate(dateString);
}

/** "12 Oct". */
export function shortDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString(undefined, { day: 'numeric', month: 'short' });
}

export function isToday(dateString?: string): boolean {
  if (!dateString) return false;
  return new Date(dateString).toDateString() === new Date().toDateString();
}

/** "https://www.store.se/sale/" → "www.store.se/sale". */
export function displayUrl(url?: string): string {
  return (url ?? '').replace(/^https?:\/\//i, '').replace(/\/$/, '');
}

export function plural(n: number, one: string, many = `${one}s`): string {
  return `${n.toLocaleString()} ${n === 1 ? one : many}`;
}

export function trackerStatus(site: SiteResponse): TrackerStatus {
  if (!site.active) return 'paused';
  return site.hasActiveDeal ? 'deal' : 'watching';
}

export const DEAL_TYPE_LABEL: Record<DealType, string> = {
  PERCENTAGE_OFF: 'Percentage off',
  COUPON: 'Coupon',
  SALE_EVENT: 'Sale',
  FREE_SHIPPING: 'Free shipping',
  BOGO: 'Buy one, get one',
  OTHER: 'Offer',
};

export function dealTitle(deal: DealResponse): string {
  return deal.title || deal.description || (deal.type ? DEAL_TYPE_LABEL[deal.type] : 'Offer found');
}

/** "-20% · ends 12 Oct". */
export function dealDetail(deal: DealResponse): string | undefined {
  const parts = [deal.discountValue, deal.expiresAt && `ends ${shortDate(deal.expiresAt)}`].filter(Boolean);
  return parts.length ? parts.join(' · ') : undefined;
}

import { createSite, updateSite } from '../api/generated';
import type { SiteResponse } from '../api/generated';
import type { TrackerFormValues } from '../components/ui';

/** Creates a tracker from AddTrackerForm values. Resolves to an error message, or null on success. */
export async function createTracker({ url, name, frequency }: TrackerFormValues): Promise<string | null> {
  const { error } = await createSite({ body: { url: `https://${url}`, name, checkInterval: frequency } });
  return error
    ? 'Could not add this site. Check that the address is a full web address, like nordicoutdoor.se/jackets.'
    : null;
}

/** Pauses an active tracker or resumes a paused one. Resolves to an error message, or null on success. */
export async function toggleTrackerPaused(site: SiteResponse): Promise<string | null> {
  if (!site.id) return 'Could not find this tracker. Reload the page and try again.';
  const { error } = await updateSite({ path: { id: site.id }, body: { active: !site.active } });
  return error ? `Could not ${site.active ? 'pause' : 'resume'} ${site.name ?? 'this tracker'}. Try again.` : null;
}

/** Opens the tracked page, where the offer is, in a new tab. */
export function openOffer(site: SiteResponse) {
  if (site.url) window.open(site.url, '_blank', 'noopener');
}

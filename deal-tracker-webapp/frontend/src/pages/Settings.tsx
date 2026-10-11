import { useEffect, useState } from 'react';
import { getPreferences, updatePreferences } from '../api/generated';
import type { EmailFrequency, UpdatePreferencesRequest } from '../api/generated';
import { ChoiceField, Notice, PageHeader, Panel, Skeleton, Switch } from '../components/ui';
import { useAuth } from '../context/AuthContext';
import './Settings.css';

const FREQUENCY_OPTIONS: { value: EmailFrequency; label: string }[] = [
  { value: 'INSTANT', label: 'Every offer' },
  { value: 'DAILY_DIGEST', label: 'Daily summary' },
];

export default function Settings() {
  const { user } = useAuth();
  const [prefs, setPrefs] = useState<UpdatePreferencesRequest | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    getPreferences().then(({ data, error: err }) => {
      if (err || !data) { setError('Could not load your settings. Reload the page to try again.'); return; }
      setPrefs({
        notifyInApp: data.notifyInApp ?? true,
        notifyEmail: data.notifyEmail ?? false,
        emailFrequency: data.emailFrequency ?? 'INSTANT',
      });
    });
  }, []);

  // Settings apply as soon as they change; roll back if the save fails.
  const change = async (patch: Partial<UpdatePreferencesRequest>) => {
    if (!prefs) return;
    const previous = prefs;
    const next = { ...prefs, ...patch };
    setPrefs(next);
    setError(null);
    setSaved(false);
    const { error: err } = await updatePreferences({ body: next });
    if (err) {
      setPrefs(previous);
      setError('Could not save that change. Try again.');
    } else {
      setSaved(true);
    }
  };

  return (
    <>
      <PageHeader title="Settings" summary={user ? `Signed in as ${user.email}` : undefined} />

      <Panel title="Alerts" className="settings-panel">
        {error && <Notice tone="error">{error}</Notice>}
        {!prefs ? (
          !error && <Skeleton shape="tile" />
        ) : (
          <>
            <Switch
              label="In-app alerts"
              description="New offers appear under Alerts"
              checked={prefs.notifyInApp}
              onChange={(v) => change({ notifyInApp: v })}
            />
            <Switch
              label="Email"
              description={`Sent to ${user?.email ?? 'your account email'}`}
              checked={prefs.notifyEmail}
              onChange={(v) => change({ notifyEmail: v })}
            />
            {prefs.notifyEmail && (
              <ChoiceField
                className="settings-group"
                label="Send email for"
                options={FREQUENCY_OPTIONS}
                value={prefs.emailFrequency}
                onChange={(v) => change({ emailFrequency: v })}
              />
            )}
            <p className="small settings-status" role="status">{saved ? 'Saved' : ''}</p>
          </>
        )}
      </Panel>
    </>
  );
}

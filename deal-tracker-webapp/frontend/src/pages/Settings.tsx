import { useState, useEffect } from 'react';
import Typography from '@mui/material/Typography';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardHeader from '@mui/material/CardHeader';
import FormControlLabel from '@mui/material/FormControlLabel';
import Switch from '@mui/material/Switch';
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Alert from '@mui/material/Alert';
import Skeleton from '@mui/material/Skeleton';
import Box from '@mui/material/Box';
import { getPreferences, updatePreferences } from '../api/generated';
import type { EmailFrequency, PreferencesResponse } from '../api/generated';

const FREQUENCY_OPTIONS: { value: EmailFrequency; label: string }[] = [
  { value: 'INSTANT', label: 'Instant (per deal)' },
  { value: 'DAILY_DIGEST', label: 'Daily digest' },
];

export default function Settings() {
  const [prefs, setPrefs] = useState<PreferencesResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getPreferences()
      .then(({ data }) => setPrefs(data ?? null))
      .catch(() => setError('Failed to load preferences'))
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    if (!prefs) return;
    setSaving(true); setError(null); setSaved(false);
    const { error: err } = await updatePreferences({
      body: {
        notifyEmail: prefs.notifyEmail ?? false,
        notifyInApp: prefs.notifyInApp ?? true,
        emailFrequency: prefs.emailFrequency ?? 'INSTANT',
      },
    });
    if (err) {
      setError('Failed to save preferences');
    } else {
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    }
    setSaving(false);
  };

  return (
    <>
      <Typography variant="h5" fontWeight={700} sx={{ mb: 3 }}>Settings</Typography>
      <Card elevation={1} sx={{ maxWidth: 560 }}>
        <CardHeader title="Notification Preferences" titleTypographyProps={{ variant: 'h6', fontWeight: 600 }} />
        <CardContent sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {loading ? (
            <>{[0, 1, 2].map((i) => <Skeleton key={i} height={40} />)}</>
          ) : (
            <>
              {error && <Alert severity="error">{error}</Alert>}
              {saved && <Alert severity="success">Preferences saved.</Alert>}
              <FormControlLabel
                control={
                  <Switch
                    checked={prefs?.notifyInApp ?? true}
                    onChange={(e) => setPrefs((p) => p ? { ...p, notifyInApp: e.target.checked } : p)}
                  />
                }
                label="In-app notifications"
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={prefs?.notifyEmail ?? false}
                    onChange={(e) => setPrefs((p) => p ? { ...p, notifyEmail: e.target.checked } : p)}
                  />
                }
                label="Email notifications"
              />
              {prefs?.notifyEmail && (
                <TextField
                  select label="Email frequency" size="small" sx={{ maxWidth: 280 }}
                  value={prefs?.emailFrequency ?? 'INSTANT'}
                  onChange={(e) => setPrefs((p) => p ? { ...p, emailFrequency: e.target.value as EmailFrequency } : p)}
                >
                  {FREQUENCY_OPTIONS.map((opt) => (
                    <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>
                  ))}
                </TextField>
              )}
              <Box>
                <Button variant="contained" onClick={handleSave} disabled={saving}>
                  {saving ? 'Saving…' : 'Save'}
                </Button>
              </Box>
            </>
          )}
        </CardContent>
      </Card>
    </>
  );
}

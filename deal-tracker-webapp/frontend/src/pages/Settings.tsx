import { useState, useEffect } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import FormControlLabel from '@mui/material/FormControlLabel';
import Switch from '@mui/material/Switch';
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Alert from '@mui/material/Alert';
import Skeleton from '@mui/material/Skeleton';
import Divider from '@mui/material/Divider';
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
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" sx={{ mb: 0.25 }}>
          Settings
        </Typography>
        <Typography sx={{ fontSize: '0.82rem', color: '#4A4E65' }}>
          Manage your notification preferences
        </Typography>
      </Box>

      <Box
        sx={{
          backgroundColor: '#0F1016',
          border: '1px solid #1E2030',
          borderRadius: 3,
          maxWidth: 520,
          overflow: 'hidden',
        }}
      >
        <Box sx={{ px: 3, py: 2.5, borderBottom: '1px solid #1E2030' }}>
          <Typography sx={{ fontFamily: '"Syne", sans-serif', fontWeight: 600, fontSize: '0.95rem', color: '#E8E9F3' }}>
            Notifications
          </Typography>
        </Box>

        <Box sx={{ px: 3, py: 3 }}>
          {loading ? (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {[0, 1, 2].map((i) => <Skeleton key={i} height={40} sx={{ borderRadius: 1 }} />)}
            </Box>
          ) : (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
              {error && <Alert severity="error" sx={{ mb: 2.5, borderRadius: 2 }}>{error}</Alert>}
              {saved && <Alert severity="success" sx={{ mb: 2.5, borderRadius: 2 }}>Preferences saved.</Alert>}

              <Box sx={{ py: 1.5 }}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={prefs?.notifyInApp ?? true}
                      onChange={(e) => setPrefs((p) => p ? { ...p, notifyInApp: e.target.checked } : p)}
                      size="small"
                    />
                  }
                  label={
                    <Box sx={{ ml: 0.5 }}>
                      <Typography sx={{ fontSize: '0.88rem', fontWeight: 500, color: '#E8E9F3' }}>In-app notifications</Typography>
                      <Typography sx={{ fontSize: '0.75rem', color: '#4A4E65' }}>Show a bell indicator when deals are found</Typography>
                    </Box>
                  }
                  sx={{ alignItems: 'flex-start', m: 0, gap: 1 }}
                />
              </Box>

              <Divider />

              <Box sx={{ py: 1.5 }}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={prefs?.notifyEmail ?? false}
                      onChange={(e) => setPrefs((p) => p ? { ...p, notifyEmail: e.target.checked } : p)}
                      size="small"
                    />
                  }
                  label={
                    <Box sx={{ ml: 0.5 }}>
                      <Typography sx={{ fontSize: '0.88rem', fontWeight: 500, color: '#E8E9F3' }}>Email notifications</Typography>
                      <Typography sx={{ fontSize: '0.75rem', color: '#4A4E65' }}>Receive deal alerts via email</Typography>
                    </Box>
                  }
                  sx={{ alignItems: 'flex-start', m: 0, gap: 1 }}
                />
              </Box>

              {prefs?.notifyEmail && (
                <>
                  <Divider />
                  <Box sx={{ py: 2 }}>
                    <Typography sx={{ fontSize: '0.8rem', color: '#8890A8', mb: 1.25 }}>Email frequency</Typography>
                    <TextField
                      select
                      size="small"
                      sx={{ width: 260 }}
                      value={prefs?.emailFrequency ?? 'INSTANT'}
                      onChange={(e) => setPrefs((p) => p ? { ...p, emailFrequency: e.target.value as EmailFrequency } : p)}
                    >
                      {FREQUENCY_OPTIONS.map((opt) => (
                        <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>
                      ))}
                    </TextField>
                  </Box>
                </>
              )}
            </Box>
          )}
        </Box>

        {!loading && (
          <Box sx={{ px: 3, pb: 3 }}>
            <Button
              variant="contained"
              onClick={handleSave}
              disabled={saving}
              sx={{ boxShadow: '0 0 14px rgba(245,166,35,0.15)' }}
            >
              {saving ? 'Saving…' : 'Save changes'}
            </Button>
          </Box>
        )}
      </Box>
    </>
  );
}

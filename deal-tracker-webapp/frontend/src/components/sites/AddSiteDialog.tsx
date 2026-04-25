import { useState } from 'react';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import MenuItem from '@mui/material/MenuItem';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import { createSite } from '../../api/generated';

interface Props {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
}

const INTERVALS = [
  { value: 'PT30M', label: '30 minutes' },
  { value: 'PT1H', label: '1 hour' },
  { value: 'PT6H', label: '6 hours' },
  { value: 'PT12H', label: '12 hours' },
  { value: 'P1D', label: '24 hours' },
];

export default function AddSiteDialog({ open, onClose, onCreated }: Props) {
  const [url, setUrl] = useState('');
  const [name, setName] = useState('');
  const [checkInterval, setCheckInterval] = useState('P1D');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!url || !name) { setError('URL and name are required'); return; }
    setSubmitting(true);
    setError(null);
    const { error: err } = await createSite({ body: { url, name, checkInterval } });
    if (err) {
      setError('Failed to add site');
    } else {
      setUrl(''); setName(''); setCheckInterval('P1D');
      onCreated();
      onClose();
    }
    setSubmitting(false);
  };

  const handleClose = () => { setError(null); onClose(); };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>Track a new site</DialogTitle>
      <DialogContent sx={{ pt: '20px !important', pb: 1 }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
          {error && <Alert severity="error" sx={{ borderRadius: 2 }}>{error}</Alert>}
          <TextField
            label="URL"
            placeholder="https://example.com"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            fullWidth
            required
            type="url"
          />
          <TextField
            label="Display Name"
            placeholder="My Favourite Store"
            value={name}
            onChange={(e) => setName(e.target.value)}
            fullWidth
            required
          />
          <TextField
            select
            label="Check Interval"
            value={checkInterval}
            onChange={(e) => setCheckInterval(e.target.value)}
            fullWidth
          >
            {INTERVALS.map((opt) => (
              <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>
            ))}
          </TextField>
        </Box>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2.5, pt: 1.5, gap: 1 }}>
        <Button onClick={handleClose} disabled={submitting} sx={{ color: '#8890A8' }}>
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={submitting}
          sx={{ px: 2.5, boxShadow: '0 0 16px rgba(245,166,35,0.18)' }}
        >
          {submitting ? 'Adding…' : 'Add Site'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

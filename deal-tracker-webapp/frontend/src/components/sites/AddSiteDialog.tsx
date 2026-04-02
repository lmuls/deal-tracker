import { useState } from 'react';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import MenuItem from '@mui/material/MenuItem';
import Alert from '@mui/material/Alert';
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
  const [checkInterval, setCheckInterval] = useState('PT1H');
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
      setUrl(''); setName(''); setCheckInterval('PT1H');
      onCreated();
      onClose();
    }
    setSubmitting(false);
  };

  const handleClose = () => { setError(null); onClose(); };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>Add New Site</DialogTitle>
      <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
        {error && <Alert severity="error">{error}</Alert>}
        <TextField label="URL" placeholder="https://example.com" value={url}
          onChange={(e) => setUrl(e.target.value)} fullWidth required type="url" />
        <TextField label="Display Name" placeholder="My Favourite Store" value={name}
          onChange={(e) => setName(e.target.value)} fullWidth required />
        <TextField select label="Check Interval" value={checkInterval}
          onChange={(e) => setCheckInterval(e.target.value)} fullWidth>
          {INTERVALS.map((opt) => (
            <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>
          ))}
        </TextField>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={handleClose} disabled={submitting}>Cancel</Button>
        <Button variant="contained" onClick={handleSubmit} disabled={submitting}>
          {submitting ? 'Adding…' : 'Add Site'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

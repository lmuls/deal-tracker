import { useState, FormEvent, useEffect } from 'react';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Link from '@mui/material/Link';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import Alert from '@mui/material/Alert';
import { useAuth } from '../context/AuthContext';

export default function Register() {
  const { user, loading, refreshUser } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && user) navigate('/dashboard', { replace: true });
  }, [user, loading, navigate]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');

    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    setSubmitting(true);

    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ email, password }),
    });

    if (res.ok || res.status === 201) {
      await refreshUser();
      navigate('/dashboard', { replace: true });
    } else {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? data.message ?? 'Registration failed');
    }
    setSubmitting(false);
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        backgroundColor: '#07080D',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        '&::before': {
          content: '""',
          position: 'absolute',
          inset: 0,
          backgroundImage: `radial-gradient(circle at 1px 1px, rgba(255,255,255,0.025) 1px, transparent 0)`,
          backgroundSize: '28px 28px',
          pointerEvents: 'none',
        },
      }}
    >
      <Box
        sx={{
          position: 'relative',
          zIndex: 1,
          width: '100%',
          maxWidth: 400,
          mx: 'auto',
          px: 3,
          animation: 'fade-up 0.5s ease both',
        }}
      >
        {/* Logo */}
        <Stack alignItems="center" sx={{ mb: 4 }}>
          <Box
            sx={{
              width: 44,
              height: 44,
              backgroundColor: '#F5A623',
              borderRadius: '11px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              mb: 2.5,
              boxShadow: '0 0 30px rgba(245, 166, 35, 0.25)',
            }}
          >
            <Typography
              sx={{ fontFamily: '"Syne", sans-serif', fontWeight: 800, fontSize: '1.3rem', color: '#07080D', lineHeight: 1 }}
            >
              %
            </Typography>
          </Box>
          <Typography
            sx={{ fontFamily: '"Syne", sans-serif', fontWeight: 700, fontSize: '1.5rem', color: '#E8E9F3', letterSpacing: '-0.02em' }}
          >
            Create account
          </Typography>
          <Typography sx={{ fontSize: '0.875rem', color: '#8890A8', mt: 0.5 }}>
            Start tracking deals today
          </Typography>
        </Stack>

        {/* Card */}
        <Box
          sx={{
            backgroundColor: '#0F1016',
            border: '1px solid #1E2030',
            borderRadius: 3,
            p: 3.5,
          }}
        >
          {error && (
            <Alert severity="error" sx={{ mb: 2.5 }}>
              {error}
            </Alert>
          )}

          <Box component="form" onSubmit={handleSubmit}>
            <Stack spacing={2.5}>
              <TextField
                label="Email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                fullWidth
                autoFocus
                autoComplete="email"
              />
              <TextField
                label="Password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                fullWidth
                inputProps={{ minLength: 8 }}
                helperText="At least 8 characters"
                autoComplete="new-password"
              />
              <Button
                type="submit"
                variant="contained"
                size="large"
                fullWidth
                disabled={submitting}
                sx={{ py: 1.4, mt: 0.5, boxShadow: '0 0 20px rgba(245, 166, 35, 0.2)' }}
              >
                {submitting ? 'Creating account…' : 'Create account'}
              </Button>
            </Stack>
          </Box>
        </Box>

        <Typography sx={{ fontSize: '0.85rem', color: '#8890A8', textAlign: 'center', mt: 2.5 }}>
          Already have an account?{' '}
          <Link component={RouterLink} to="/login" sx={{ color: '#F5A623', fontWeight: 500 }}>
            Sign in
          </Link>
        </Typography>
      </Box>
    </Box>
  );
}

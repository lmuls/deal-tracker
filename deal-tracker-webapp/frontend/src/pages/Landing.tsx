import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import Stack from '@mui/material/Stack';
import { useAuth } from '../context/AuthContext';

export default function Landing() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && user) navigate('/dashboard', { replace: true });
  }, [user, loading, navigate]);

  return (
    <Box
      sx={{
        minHeight: '100vh',
        backgroundColor: '#07080D',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        overflow: 'hidden',
        '&::before': {
          content: '""',
          position: 'absolute',
          inset: 0,
          backgroundImage: `radial-gradient(circle at 1px 1px, rgba(255,255,255,0.03) 1px, transparent 0)`,
          backgroundSize: '28px 28px',
          pointerEvents: 'none',
        },
      }}
    >
      {/* Ambient glow blobs */}
      <Box
        sx={{
          position: 'absolute',
          width: 600,
          height: 600,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(245,166,35,0.07) 0%, transparent 70%)',
          top: '10%',
          left: '15%',
          pointerEvents: 'none',
        }}
      />
      <Box
        sx={{
          position: 'absolute',
          width: 500,
          height: 500,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(34,217,140,0.05) 0%, transparent 70%)',
          bottom: '5%',
          right: '10%',
          pointerEvents: 'none',
        }}
      />

      {/* Content */}
      <Box
        sx={{
          position: 'relative',
          zIndex: 1,
          textAlign: 'center',
          px: 3,
          animation: 'fade-up 0.6s ease both',
        }}
      >
        {/* Logo mark */}
        <Box
          sx={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 52,
            height: 52,
            backgroundColor: '#F5A623',
            borderRadius: '13px',
            mb: 5,
            boxShadow: '0 0 40px rgba(245, 166, 35, 0.3)',
          }}
        >
          <Typography
            sx={{
              fontFamily: '"Syne", sans-serif',
              fontWeight: 800,
              fontSize: '1.5rem',
              color: '#07080D',
              lineHeight: 1,
            }}
          >
            %
          </Typography>
        </Box>

        {/* Headline */}
        <Typography
          sx={{
            fontFamily: '"Syne", sans-serif',
            fontWeight: 800,
            fontSize: { xs: '3rem', sm: '4.5rem', md: '6rem' },
            lineHeight: 0.95,
            letterSpacing: '-0.04em',
            color: '#E8E9F3',
            mb: 3,
          }}
        >
          STOP
          <br />
          <Box component="span" sx={{ color: '#F5A623' }}>
            MISSING
          </Box>
          <br />
          DEALS.
        </Typography>

        {/* Subtext */}
        <Typography
          sx={{
            fontSize: '1.05rem',
            color: '#8890A8',
            maxWidth: 420,
            mx: 'auto',
            lineHeight: 1.6,
            mb: 5,
            fontWeight: 400,
          }}
        >
          Monitor any website automatically.
          <br />
          Get alerted the moment prices drop or sales go live.
        </Typography>

        {/* CTAs */}
        <Stack direction="row" spacing={1.5} justifyContent="center">
          <Button
            variant="contained"
            size="large"
            onClick={() => navigate('/register')}
            sx={{
              px: 3.5,
              py: 1.4,
              fontSize: '0.95rem',
              boxShadow: '0 0 24px rgba(245, 166, 35, 0.25)',
              '&:hover': { boxShadow: '0 0 32px rgba(245, 166, 35, 0.4)' },
            }}
          >
            Start tracking for free
          </Button>
          <Button
            variant="outlined"
            size="large"
            onClick={() => navigate('/login')}
            sx={{ px: 3, py: 1.4, fontSize: '0.95rem' }}
          >
            Sign in
          </Button>
        </Stack>
      </Box>

      {/* Decorative tag */}
      <Box
        sx={{
          position: 'absolute',
          right: { xs: -60, md: '6%' },
          top: '50%',
          transform: 'translateY(-50%) rotate(12deg)',
          opacity: 0.06,
          pointerEvents: 'none',
          fontFamily: '"Syne", sans-serif',
          fontWeight: 800,
          fontSize: { xs: '10rem', md: '18rem' },
          color: '#F5A623',
          lineHeight: 1,
          userSelect: 'none',
        }}
      >
        %
      </Box>
    </Box>
  );
}

import Grid from '@mui/material/Grid';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import TravelExploreRoundedIcon from '@mui/icons-material/TravelExploreRounded';
import LocalOfferRoundedIcon from '@mui/icons-material/LocalOfferRounded';
import BoltRoundedIcon from '@mui/icons-material/BoltRounded';

interface Props {
  totalSites: number;
  activeDeals: number;
  dealsToday: number;
}

interface StatCardProps {
  title: string;
  value: number;
  icon: React.ReactNode;
  accentColor: string;
  glowColor: string;
}

function StatCard({ title, value, icon, accentColor, glowColor }: StatCardProps) {
  return (
    <Box
      sx={{
        backgroundColor: '#0F1016',
        border: '1px solid #1E2030',
        borderRadius: 3,
        p: 3,
        height: '100%',
        position: 'relative',
        overflow: 'hidden',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '2px',
          background: `linear-gradient(90deg, transparent, ${accentColor}, transparent)`,
          opacity: 0.6,
        },
      }}
    >
      {/* Background glow */}
      <Box
        sx={{
          position: 'absolute',
          top: -20,
          right: -20,
          width: 120,
          height: 120,
          borderRadius: '50%',
          background: `radial-gradient(circle, ${glowColor} 0%, transparent 70%)`,
          pointerEvents: 'none',
        }}
      />

      <Box sx={{ position: 'relative', zIndex: 1 }}>
        <Box
          sx={{
            display: 'inline-flex',
            p: 1,
            borderRadius: '10px',
            backgroundColor: `${accentColor}18`,
            color: accentColor,
            mb: 2.5,
            '& .MuiSvgIcon-root': { fontSize: '1.2rem' },
          }}
        >
          {icon}
        </Box>

        <Typography
          sx={{
            fontFamily: '"Syne", sans-serif',
            fontWeight: 800,
            fontSize: '2.8rem',
            lineHeight: 1,
            color: '#E8E9F3',
            letterSpacing: '-0.03em',
            mb: 0.75,
          }}
        >
          {value}
        </Typography>

        <Typography
          sx={{
            fontSize: '0.78rem',
            color: '#4A4E65',
            fontWeight: 600,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
          }}
        >
          {title}
        </Typography>
      </Box>
    </Box>
  );
}

export default function StatsCards({ totalSites, activeDeals, dealsToday }: Props) {
  return (
    <Grid container spacing={2} sx={{ mb: 3 }}>
      <Grid item xs={12} sm={4}>
        <StatCard
          title="Sites Tracked"
          value={totalSites}
          icon={<TravelExploreRoundedIcon />}
          accentColor="#5B8FF9"
          glowColor="rgba(91,143,249,0.08)"
        />
      </Grid>
      <Grid item xs={12} sm={4}>
        <StatCard
          title="Active Deals"
          value={activeDeals}
          icon={<LocalOfferRoundedIcon />}
          accentColor="#22D98C"
          glowColor="rgba(34,217,140,0.08)"
        />
      </Grid>
      <Grid item xs={12} sm={4}>
        <StatCard
          title="Deals Today"
          value={dealsToday}
          icon={<BoltRoundedIcon />}
          accentColor="#F5A623"
          glowColor="rgba(245,166,35,0.1)"
        />
      </Grid>
    </Grid>
  );
}

import Grid from '@mui/material/Grid';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import LanguageIcon from '@mui/icons-material/Language';
import LocalOfferIcon from '@mui/icons-material/LocalOffer';
import TodayIcon from '@mui/icons-material/Today';

interface Props {
  totalSites: number;
  activeDeals: number;
  dealsToday: number;
}

interface StatCardProps {
  title: string;
  value: number;
  icon: React.ReactNode;
  color: string;
}

function StatCard({ title, value, icon, color }: StatCardProps) {
  return (
    <Card elevation={1} sx={{ height: '100%' }}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <Box>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              {title}
            </Typography>
            <Typography variant="h4" fontWeight={700}>
              {value}
            </Typography>
          </Box>
          <Box
            sx={{
              p: 1,
              borderRadius: 2,
              backgroundColor: `${color}20`,
              color,
              display: 'flex',
              alignItems: 'center',
            }}
          >
            {icon}
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
}

export default function StatsCards({ totalSites, activeDeals, dealsToday }: Props) {
  return (
    <Grid container spacing={3} sx={{ mb: 3 }}>
      <Grid item xs={12} sm={4}>
        <StatCard
          title="Sites Tracked"
          value={totalSites}
          icon={<LanguageIcon />}
          color="#1976d2"
        />
      </Grid>
      <Grid item xs={12} sm={4}>
        <StatCard
          title="Active Deals"
          value={activeDeals}
          icon={<LocalOfferIcon />}
          color="#2e7d32"
        />
      </Grid>
      <Grid item xs={12} sm={4}>
        <StatCard
          title="Deals Today"
          value={dealsToday}
          icon={<TodayIcon />}
          color="#e65100"
        />
      </Grid>
    </Grid>
  );
}

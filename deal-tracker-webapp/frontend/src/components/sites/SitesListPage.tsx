import { useState } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Grid from '@mui/material/Grid';
import Skeleton from '@mui/material/Skeleton';
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import { useSites } from '../../hooks/useSites';
import SiteCard from './SiteCard';
import AddSiteDialog from './AddSiteDialog';

export default function SitesListPage() {
  const { sites, loading, refresh } = useSites();
  const [dialogOpen, setDialogOpen] = useState(false);

  return (
    <>
      <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 3 }}>
        <Box>
          <Typography variant="h5" sx={{ mb: 0.25 }}>
            Tracked Sites
          </Typography>
          <Typography sx={{ fontSize: '0.82rem', color: '#4A4E65' }}>
            {loading ? '…' : `${sites.length} site${sites.length !== 1 ? 's' : ''} monitored`}
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddRoundedIcon />}
          onClick={() => setDialogOpen(true)}
          sx={{ boxShadow: '0 0 18px rgba(245,166,35,0.18)' }}
        >
          Add Site
        </Button>
      </Box>

      {loading ? (
        <Grid container spacing={2}>
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <Grid item xs={12} sm={6} md={4} key={i}>
              <Skeleton height={170} variant="rectangular" sx={{ borderRadius: 2.5 }} />
            </Grid>
          ))}
        </Grid>
      ) : sites.length === 0 ? (
        <Box
          sx={{
            textAlign: 'center',
            py: 10,
            backgroundColor: '#0F1016',
            border: '1px solid #1E2030',
            borderRadius: 3,
          }}
        >
          <Box
            sx={{
              width: 52,
              height: 52,
              backgroundColor: 'rgba(245,166,35,0.08)',
              border: '1px solid rgba(245,166,35,0.15)',
              borderRadius: '14px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              mx: 'auto',
              mb: 2.5,
            }}
          >
            <Typography sx={{ fontFamily: '"Syne", sans-serif', fontWeight: 800, fontSize: '1.5rem', color: '#F5A623' }}>
              %
            </Typography>
          </Box>
          <Typography sx={{ fontFamily: '"Syne", sans-serif', fontWeight: 700, fontSize: '1.1rem', color: '#E8E9F3', mb: 1 }}>
            No sites yet
          </Typography>
          <Typography sx={{ fontSize: '0.85rem', color: '#4A4E65', mb: 3, maxWidth: 300, mx: 'auto' }}>
            Add your first URL to start monitoring for deals and discounts.
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddRoundedIcon />}
            onClick={() => setDialogOpen(true)}
            sx={{ boxShadow: '0 0 18px rgba(245,166,35,0.18)' }}
          >
            Add Your First Site
          </Button>
        </Box>
      ) : (
        <Grid container spacing={2}>
          {sites.map((site) => (
            <Grid item xs={12} sm={6} md={4} key={site.id}>
              <SiteCard site={site} onChanged={refresh} />
            </Grid>
          ))}
        </Grid>
      )}

      <AddSiteDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onCreated={refresh}
      />
    </>
  );
}

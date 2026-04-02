import { useState } from 'react';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Grid from '@mui/material/Grid';
import Box from '@mui/material/Box';
import Skeleton from '@mui/material/Skeleton';
import AddIcon from '@mui/icons-material/Add';
import { useSites } from '../../hooks/useSites';
import SiteCard from './SiteCard';
import AddSiteDialog from './AddSiteDialog';

export default function SitesListPage() {
  const { sites, loading, refresh } = useSites();
  const [dialogOpen, setDialogOpen] = useState(false);

  return (
    <>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h5" fontWeight={700}>
          Tracked Sites
        </Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => setDialogOpen(true)}>
          Add Site
        </Button>
      </Box>

      {loading ? (
        <Grid container spacing={2}>
          {[0, 1, 2].map((i) => (
            <Grid item xs={12} sm={6} md={4} key={i}>
              <Skeleton height={160} variant="rectangular" sx={{ borderRadius: 1 }} />
            </Grid>
          ))}
        </Grid>
      ) : sites.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <Typography variant="h6" color="text.secondary" gutterBottom>
            No sites tracked yet
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Add your first URL to start monitoring for deals.
          </Typography>
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => setDialogOpen(true)}>
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

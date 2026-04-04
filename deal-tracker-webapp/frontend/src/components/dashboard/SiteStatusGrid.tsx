import Grid from '@mui/material/Grid';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Skeleton from '@mui/material/Skeleton';
import { useNavigate } from 'react-router-dom';
import type { SiteResponse } from '../../api/generated';
import TimeAgo from '../common/TimeAgo';

interface Props {
  sites: SiteResponse[];
  loading: boolean;
}

function SiteStatusCard({ site, onClick }: { site: SiteResponse; onClick: () => void }) {
  const hasDeal = site.hasActiveDeal;
  return (
    <Box
      onClick={onClick}
      sx={{
        backgroundColor: '#0F1016',
        border: `1px solid ${hasDeal ? 'rgba(34,217,140,0.3)' : '#1E2030'}`,
        borderLeft: `3px solid ${hasDeal ? '#22D98C' : '#1E2030'}`,
        borderRadius: 2,
        p: 2,
        cursor: 'pointer',
        height: '100%',
        transition: 'all 0.14s ease',
        boxShadow: hasDeal ? '-4px 0 20px rgba(34,217,140,0.06)' : 'none',
        '&:hover': {
          backgroundColor: '#12131A',
          borderColor: hasDeal ? 'rgba(34,217,140,0.5)' : '#2E3145',
          borderLeftColor: hasDeal ? '#22D98C' : '#2E3145',
        },
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 0.75 }}>
        <Typography
          sx={{
            fontSize: '0.85rem',
            fontWeight: 600,
            color: '#E8E9F3',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            maxWidth: '80%',
          }}
        >
          {site.name}
        </Typography>
        <Box
          sx={{
            width: 7,
            height: 7,
            borderRadius: '50%',
            backgroundColor: hasDeal ? '#22D98C' : '#2A2D45',
            flexShrink: 0,
            mt: '4px',
            animation: hasDeal ? 'pulse-dot 2.5s ease infinite' : 'none',
          }}
        />
      </Box>

      <Typography
        sx={{
          fontSize: '0.72rem',
          color: '#4A4E65',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
          mb: 1.25,
        }}
      >
        {site.url}
      </Typography>

      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, flexWrap: 'wrap' }}>
        {hasDeal ? (
          <Box
            component="span"
            sx={{
              fontSize: '0.65rem',
              fontWeight: 700,
              letterSpacing: '0.05em',
              color: '#22D98C',
              backgroundColor: 'rgba(34,217,140,0.1)',
              border: '1px solid rgba(34,217,140,0.25)',
              px: '6px',
              py: '2px',
              borderRadius: '4px',
            }}
          >
            {site.activeDealsCount ?? 1} DEAL{(site.activeDealsCount ?? 1) !== 1 ? 'S' : ''}
          </Box>
        ) : (
          <Box
            component="span"
            sx={{
              fontSize: '0.65rem',
              fontWeight: 600,
              letterSpacing: '0.04em',
              color: '#4A4E65',
              backgroundColor: 'rgba(74,78,101,0.1)',
              border: '1px solid rgba(74,78,101,0.2)',
              px: '6px',
              py: '2px',
              borderRadius: '4px',
            }}
          >
            NO OFFER
          </Box>
        )}
        {!site.active && (
          <Box
            component="span"
            sx={{
              fontSize: '0.65rem',
              fontWeight: 700,
              letterSpacing: '0.04em',
              color: '#FFB020',
              backgroundColor: 'rgba(255,176,32,0.1)',
              border: '1px solid rgba(255,176,32,0.25)',
              px: '6px',
              py: '2px',
              borderRadius: '4px',
            }}
          >
            PAUSED
          </Box>
        )}
      </Box>

      {site.lastCheckedAt && (
        <Typography sx={{ fontSize: '0.7rem', color: '#4A4E65', mt: 1 }}>
          Checked <TimeAgo dateString={site.lastCheckedAt} />
        </Typography>
      )}
    </Box>
  );
}

export default function SiteStatusGrid({ sites, loading }: Props) {
  const navigate = useNavigate();

  return (
    <Box
      sx={{
        backgroundColor: '#0F1016',
        border: '1px solid #1E2030',
        borderRadius: 3,
        overflow: 'hidden',
      }}
    >
      <Box sx={{ px: 2.5, py: 2, borderBottom: '1px solid #1E2030' }}>
        <Typography sx={{ fontFamily: '"Syne", sans-serif', fontWeight: 600, fontSize: '0.95rem', color: '#E8E9F3' }}>
          Monitored Sites
        </Typography>
      </Box>

      <Box sx={{ p: 2 }}>
        {loading ? (
          <Grid container spacing={1.5}>
            {[0, 1, 2].map((i) => (
              <Grid item xs={12} sm={6} md={4} key={i}>
                <Skeleton variant="rectangular" height={110} sx={{ borderRadius: 2 }} />
              </Grid>
            ))}
          </Grid>
        ) : sites.length === 0 ? (
          <Box sx={{ py: 3, textAlign: 'center' }}>
            <Typography sx={{ fontSize: '0.85rem', color: '#4A4E65' }}>
              No sites tracked yet. Add one from the Sites page.
            </Typography>
          </Box>
        ) : (
          <Grid container spacing={1.5}>
            {sites.map((site) => (
              <Grid item xs={12} sm={6} md={4} key={site.id}>
                <SiteStatusCard site={site} onClick={() => navigate(`/sites/${site.id}`)} />
              </Grid>
            ))}
          </Grid>
        )}
      </Box>
    </Box>
  );
}

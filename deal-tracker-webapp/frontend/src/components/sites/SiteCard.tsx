import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import PauseRoundedIcon from '@mui/icons-material/PauseRounded';
import PlayArrowRoundedIcon from '@mui/icons-material/PlayArrowRounded';
import DeleteRoundedIcon from '@mui/icons-material/DeleteRounded';
import OpenInNewRoundedIcon from '@mui/icons-material/OpenInNewRounded';
import { useNavigate } from 'react-router-dom';
import type { SiteResponse } from '../../api/generated';
import { updateSite, deleteSite } from '../../api/generated';
import TimeAgo from '../common/TimeAgo';

interface Props {
  site: SiteResponse;
  onChanged: () => void;
}

export default function SiteCard({ site, onChanged }: Props) {
  const navigate = useNavigate();
  const hasDeal = site.hasActiveDeal;

  const handleToggleActive = async (e: React.MouseEvent) => {
    e.stopPropagation();
    await updateSite({ path: { id: site.id! }, body: { active: !site.active } });
    onChanged();
  };

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm(`Remove "${site.name}"?`)) return;
    await deleteSite({ path: { id: site.id! } });
    onChanged();
  };

  return (
    <Box
      onClick={() => navigate(`/sites/${site.id}`)}
      sx={{
        backgroundColor: '#0F1016',
        border: `1px solid ${hasDeal ? 'rgba(34,217,140,0.3)' : '#1E2030'}`,
        borderLeft: `3px solid ${hasDeal ? '#22D98C' : '#1E2030'}`,
        borderRadius: 2.5,
        cursor: 'pointer',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        transition: 'all 0.14s ease',
        boxShadow: hasDeal ? '-4px 0 24px rgba(34,217,140,0.07)' : 'none',
        '&:hover': {
          backgroundColor: '#12131A',
          borderColor: hasDeal ? 'rgba(34,217,140,0.5)' : '#2E3145',
          borderLeftColor: hasDeal ? '#22D98C' : '#2E3145',
          transform: 'translateY(-1px)',
          boxShadow: hasDeal
            ? '-4px 4px 28px rgba(34,217,140,0.1)'
            : '0 4px 20px rgba(0,0,0,0.3)',
        },
      }}
    >
      {/* Card body */}
      <Box sx={{ p: 2.25, flexGrow: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 0.75 }}>
          <Typography
            sx={{
              fontSize: '0.9rem',
              fontWeight: 600,
              color: '#E8E9F3',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              maxWidth: '82%',
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
              mt: '5px',
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
            mb: 1.5,
          }}
        >
          {site.url}
        </Typography>

        <Box sx={{ display: 'flex', gap: 0.75, flexWrap: 'wrap' }}>
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
                px: '7px',
                py: '3px',
                borderRadius: '5px',
              }}
            >
              {site.activeDealsCount ?? 1} ACTIVE DEAL{(site.activeDealsCount ?? 1) !== 1 ? 'S' : ''}
            </Box>
          ) : (
            <Box
              component="span"
              sx={{
                fontSize: '0.65rem',
                fontWeight: 600,
                letterSpacing: '0.04em',
                color: '#4A4E65',
                backgroundColor: 'rgba(74,78,101,0.08)',
                border: '1px solid rgba(74,78,101,0.15)',
                px: '7px',
                py: '3px',
                borderRadius: '5px',
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
                backgroundColor: 'rgba(255,176,32,0.08)',
                border: '1px solid rgba(255,176,32,0.2)',
                px: '7px',
                py: '3px',
                borderRadius: '5px',
              }}
            >
              PAUSED
            </Box>
          )}
        </Box>

        {site.lastCheckedAt && (
          <Typography sx={{ fontSize: '0.7rem', color: '#4A4E65', mt: 1.25 }}>
            Last checked <TimeAgo dateString={site.lastCheckedAt} />
          </Typography>
        )}
      </Box>

      {/* Card footer */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'flex-end',
          gap: 0.25,
          px: 1.5,
          py: 1,
          borderTop: '1px solid #1A1C28',
        }}
      >
        <Tooltip title="Open URL" arrow>
          <IconButton
            size="small"
            onClick={(e) => { e.stopPropagation(); window.open(site.url, '_blank'); }}
            sx={{ '& .MuiSvgIcon-root': { fontSize: '0.9rem' } }}
          >
            <OpenInNewRoundedIcon />
          </IconButton>
        </Tooltip>
        <Tooltip title={site.active ? 'Pause monitoring' : 'Resume monitoring'} arrow>
          <IconButton
            size="small"
            onClick={handleToggleActive}
            sx={{ '& .MuiSvgIcon-root': { fontSize: '0.9rem' } }}
          >
            {site.active ? <PauseRoundedIcon /> : <PlayArrowRoundedIcon />}
          </IconButton>
        </Tooltip>
        <Tooltip title="Remove site" arrow>
          <IconButton
            size="small"
            onClick={handleDelete}
            sx={{ color: '#FF4D6D', '&:hover': { backgroundColor: 'rgba(255,77,109,0.1)', color: '#FF4D6D' }, '& .MuiSvgIcon-root': { fontSize: '0.9rem' } }}
          >
            <DeleteRoundedIcon />
          </IconButton>
        </Tooltip>
      </Box>
    </Box>
  );
}

import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardActions from '@mui/material/CardActions';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import PauseIcon from '@mui/icons-material/Pause';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import DeleteIcon from '@mui/icons-material/Delete';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import FiberManualRecordIcon from '@mui/icons-material/FiberManualRecord';
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
    <Card
      elevation={1}
      sx={{
        cursor: 'pointer',
        transition: 'box-shadow 0.2s',
        '&:hover': { boxShadow: 4 },
        borderLeft: site.hasActiveDeal ? '4px solid' : '4px solid transparent',
        borderLeftColor: site.hasActiveDeal ? 'success.main' : 'transparent',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
      }}
      onClick={() => navigate(`/sites/${site.id}`)}
    >
      <CardContent sx={{ flexGrow: 1, pb: 0 }}>
        <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 0.5 }}>
          <Typography variant="subtitle1" fontWeight={600} noWrap sx={{ maxWidth: '80%' }}>
            {site.name}
          </Typography>
          <FiberManualRecordIcon
            sx={{ fontSize: 10, color: site.hasActiveDeal ? 'success.main' : 'text.disabled', mt: 0.5 }}
          />
        </Box>
        <Typography
          variant="caption" color="text.secondary" display="block"
          sx={{ mb: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
        >
          {site.url}
        </Typography>
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          <Chip
            label={site.hasActiveDeal
              ? `${site.activeDealsCount ?? 1} active deal${(site.activeDealsCount ?? 1) !== 1 ? 's' : ''}`
              : 'No offer'}
            size="small"
            color={site.hasActiveDeal ? 'success' : 'default'}
            variant="outlined"
          />
          {!site.active && <Chip label="Paused" size="small" color="warning" />}
        </Box>
        {site.lastCheckedAt && (
          <Typography variant="caption" color="text.disabled" display="block" sx={{ mt: 1 }}>
            Last checked: <TimeAgo dateString={site.lastCheckedAt} />
          </Typography>
        )}
      </CardContent>
      <CardActions sx={{ pt: 0, justifyContent: 'flex-end' }}>
        <Tooltip title="Open URL">
          <IconButton size="small" onClick={(e) => { e.stopPropagation(); window.open(site.url, '_blank'); }}>
            <OpenInNewIcon fontSize="small" />
          </IconButton>
        </Tooltip>
        <Tooltip title={site.active ? 'Pause monitoring' : 'Resume monitoring'}>
          <IconButton size="small" onClick={handleToggleActive}>
            {site.active ? <PauseIcon fontSize="small" /> : <PlayArrowIcon fontSize="small" />}
          </IconButton>
        </Tooltip>
        <Tooltip title="Remove site">
          <IconButton size="small" color="error" onClick={handleDelete}>
            <DeleteIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </CardActions>
    </Card>
  );
}

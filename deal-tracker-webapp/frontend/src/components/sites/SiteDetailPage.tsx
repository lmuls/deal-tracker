import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardHeader from '@mui/material/CardHeader';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import TablePagination from '@mui/material/TablePagination';
import Skeleton from '@mui/material/Skeleton';
import Alert from '@mui/material/Alert';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import PauseIcon from '@mui/icons-material/Pause';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import DeleteIcon from '@mui/icons-material/Delete';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import { getSite, updateSite, deleteSite, listSiteDeals } from '../../api/generated';
import type { SiteDetailResponse, DealResponse } from '../../api/generated';
import ConfidenceBadge from '../common/ConfidenceBadge';
import DealTypeBadge from '../common/DealTypeBadge';
import TimeAgo from '../common/TimeAgo';

export default function SiteDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [site, setSite] = useState<SiteDetailResponse | null>(null);
  const [deals, setDeals] = useState<DealResponse[]>([]);
  const [totalDeals, setTotalDeals] = useState(0);
  const [page, setPage] = useState(0);
  const rowsPerPage = 20;
  const [loading, setLoading] = useState(true);
  const [dealsLoading, setDealsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadSite = useCallback(async () => {
    if (!id) return;
    const { data, error: err } = await getSite({ path: { id } });
    if (err || !data) { setError('Site not found'); } else { setSite(data); }
    setLoading(false);
  }, [id]);

  const loadDeals = useCallback(async () => {
    if (!id) return;
    setDealsLoading(true);
    const { data } = await listSiteDeals({ path: { id }, query: { page, size: rowsPerPage } });
    setDeals(data?.content ?? []);
    setTotalDeals(data?.totalElements ?? 0);
    setDealsLoading(false);
  }, [id, page]);

  useEffect(() => { loadSite(); }, [loadSite]);
  useEffect(() => { loadDeals(); }, [loadDeals]);

  const handleToggleActive = async () => {
    if (!site?.id) return;
    await updateSite({ path: { id: site.id }, body: { active: !site.active } });
    loadSite();
  };

  const handleDelete = async () => {
    if (!site?.id || !confirm(`Remove "${site.name}"?`)) return;
    await deleteSite({ path: { id: site.id } });
    navigate('/sites');
  };

  if (error) {
    return (
      <Box>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  if (loading || !site) {
    return (
      <Box>
        <Skeleton height={40} width={200} sx={{ mb: 2 }} />
        <Skeleton height={120} sx={{ mb: 2 }} />
        <Skeleton height={300} />
      </Box>
    );
  }

  return (
    <>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
        <Typography variant="h5" fontWeight={700} sx={{ flexGrow: 1 }}>
          {site.name}
        </Typography>
        <Tooltip title="Open URL">
          <IconButton onClick={() => window.open(site.url, '_blank')}>
            <OpenInNewIcon />
          </IconButton>
        </Tooltip>
        <Tooltip title={site.active ? 'Pause monitoring' : 'Resume monitoring'}>
          <IconButton onClick={handleToggleActive}>
            {site.active ? <PauseIcon /> : <PlayArrowIcon />}
          </IconButton>
        </Tooltip>
        <Tooltip title="Remove site">
          <IconButton color="error" onClick={handleDelete}>
            <DeleteIcon />
          </IconButton>
        </Tooltip>
      </Box>

      <Card elevation={1} sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
            <Typography variant="body2" color="text.secondary">{site.url}</Typography>
            <Chip label={site.hasActiveDeal ? 'Active offer' : 'No offer'} size="small"
              color={site.hasActiveDeal ? 'success' : 'default'} />
            {!site.active && <Chip label="Paused" size="small" color="warning" />}
            {site.lastCheckedAt && (
              <Typography variant="caption" color="text.disabled">
                Last checked: <TimeAgo dateString={site.lastCheckedAt} />
              </Typography>
            )}
            <Typography variant="caption" color="text.disabled">Interval: {site.checkInterval}</Typography>
          </Box>
        </CardContent>
      </Card>

      <Card elevation={1}>
        <CardHeader
          title="Deal History"
          titleTypographyProps={{ variant: 'h6', fontWeight: 600 }}
          subheader={`${totalDeals} deals recorded`}
        />
        <CardContent sx={{ p: 0 }}>
          {dealsLoading ? (
            <Box sx={{ p: 2 }}>
              {[0, 1, 2].map((i) => <Skeleton key={i} height={52} sx={{ mb: 0.5 }} />)}
            </Box>
          ) : deals.length === 0 ? (
            <Box sx={{ p: 3 }}>
              <Typography variant="body2" color="text.secondary" align="center">
                No deals detected yet for this site
              </Typography>
            </Box>
          ) : (
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Confidence</TableCell>
                    <TableCell>Type</TableCell>
                    <TableCell>Title / Description</TableCell>
                    <TableCell>Discount</TableCell>
                    <TableCell>Detected</TableCell>
                    <TableCell>Expires</TableCell>
                    <TableCell>Status</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {deals.map((deal) => (
                    <TableRow key={deal.id} sx={{ '&:last-child td': { border: 0 }, opacity: deal.active ? 1 : 0.6 }}>
                      <TableCell><ConfidenceBadge confidence={deal.confidence} /></TableCell>
                      <TableCell><DealTypeBadge type={deal.type} /></TableCell>
                      <TableCell sx={{ maxWidth: 280 }}>
                        <Typography variant="body2" noWrap>{deal.title ?? deal.description ?? '—'}</Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" fontWeight={600} color="primary">
                          {deal.discountValue ?? '—'}
                        </Typography>
                      </TableCell>
                      <TableCell><TimeAgo dateString={deal.detectedAt} /></TableCell>
                      <TableCell>{deal.expiresAt ? new Date(deal.expiresAt).toLocaleDateString() : '—'}</TableCell>
                      <TableCell>
                        <Chip label={deal.active ? 'Active' : 'Expired'} size="small"
                          color={deal.active ? 'success' : 'default'} variant="outlined" />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <TablePagination
                component="div"
                count={totalDeals}
                page={page}
                rowsPerPage={rowsPerPage}
                rowsPerPageOptions={[20]}
                onPageChange={(_, p) => setPage(p)}
              />
            </TableContainer>
          )}
        </CardContent>
      </Card>
    </>
  );
}

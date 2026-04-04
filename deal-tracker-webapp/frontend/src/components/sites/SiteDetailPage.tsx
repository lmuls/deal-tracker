import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
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
import PauseRoundedIcon from '@mui/icons-material/PauseRounded';
import PlayArrowRoundedIcon from '@mui/icons-material/PlayArrowRounded';
import DeleteRoundedIcon from '@mui/icons-material/DeleteRounded';
import OpenInNewRoundedIcon from '@mui/icons-material/OpenInNewRounded';
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
    return <Alert severity="error" sx={{ borderRadius: 2 }}>{error}</Alert>;
  }

  if (loading || !site) {
    return (
      <Box>
        <Skeleton height={44} width={240} sx={{ mb: 2.5, borderRadius: 2 }} />
        <Skeleton height={100} sx={{ mb: 2, borderRadius: 2 }} />
        <Skeleton height={320} sx={{ borderRadius: 2 }} />
      </Box>
    );
  }

  const hasDeal = site.hasActiveDeal;

  return (
    <>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1, mb: 3 }}>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 0.25 }}>
            <Typography variant="h5" sx={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {site.name}
            </Typography>
            {hasDeal && (
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 0.5,
                  px: 1,
                  py: '3px',
                  backgroundColor: 'rgba(34,217,140,0.1)',
                  border: '1px solid rgba(34,217,140,0.25)',
                  borderRadius: '6px',
                  flexShrink: 0,
                }}
              >
                <Box sx={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: '#22D98C', animation: 'pulse-dot 2s ease infinite' }} />
                <Typography sx={{ fontSize: '0.68rem', fontWeight: 700, color: '#22D98C', letterSpacing: '0.05em' }}>
                  LIVE DEAL
                </Typography>
              </Box>
            )}
          </Box>
          <Typography sx={{ fontSize: '0.78rem', color: '#4A4E65' }}>{site.url}</Typography>
        </Box>

        <Box sx={{ display: 'flex', gap: 0.5, flexShrink: 0 }}>
          <Tooltip title="Open URL" arrow>
            <IconButton size="small" onClick={() => window.open(site.url, '_blank')}>
              <OpenInNewRoundedIcon sx={{ fontSize: '1rem' }} />
            </IconButton>
          </Tooltip>
          <Tooltip title={site.active ? 'Pause monitoring' : 'Resume monitoring'} arrow>
            <IconButton size="small" onClick={handleToggleActive}>
              {site.active ? <PauseRoundedIcon sx={{ fontSize: '1rem' }} /> : <PlayArrowRoundedIcon sx={{ fontSize: '1rem' }} />}
            </IconButton>
          </Tooltip>
          <Tooltip title="Remove site" arrow>
            <IconButton
              size="small"
              onClick={handleDelete}
              sx={{ color: '#FF4D6D', '&:hover': { backgroundColor: 'rgba(255,77,109,0.1)', color: '#FF4D6D' } }}
            >
              <DeleteRoundedIcon sx={{ fontSize: '1rem' }} />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {/* Info card */}
      <Box
        sx={{
          backgroundColor: '#0F1016',
          border: `1px solid ${hasDeal ? 'rgba(34,217,140,0.25)' : '#1E2030'}`,
          borderLeft: `3px solid ${hasDeal ? '#22D98C' : '#1E2030'}`,
          borderRadius: 2.5,
          p: 2.5,
          mb: 3,
          display: 'flex',
          gap: 3,
          flexWrap: 'wrap',
          alignItems: 'center',
        }}
      >
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', flexWrap: 'wrap' }}>
          {!site.active && (
            <Box component="span" sx={{ fontSize: '0.65rem', fontWeight: 700, color: '#FFB020', backgroundColor: 'rgba(255,176,32,0.08)', border: '1px solid rgba(255,176,32,0.2)', px: '7px', py: '3px', borderRadius: '5px', letterSpacing: '0.04em' }}>
              PAUSED
            </Box>
          )}
        </Box>
        {site.lastCheckedAt && (
          <Typography sx={{ fontSize: '0.8rem', color: '#8890A8' }}>
            Last checked: <TimeAgo dateString={site.lastCheckedAt} />
          </Typography>
        )}
        <Typography sx={{ fontSize: '0.8rem', color: '#8890A8' }}>
          Check interval: <Box component="span" sx={{ color: '#E8E9F3', fontWeight: 500 }}>{site.checkInterval}</Box>
        </Typography>
      </Box>

      {/* Deal history */}
      <Box
        sx={{
          backgroundColor: '#0F1016',
          border: '1px solid #1E2030',
          borderRadius: 2.5,
          overflow: 'hidden',
        }}
      >
        <Box sx={{ px: 2.5, py: 2, borderBottom: '1px solid #1E2030', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography sx={{ fontFamily: '"Syne", sans-serif', fontWeight: 600, fontSize: '0.95rem', color: '#E8E9F3' }}>
            Deal History
          </Typography>
          <Typography sx={{ fontSize: '0.78rem', color: '#4A4E65' }}>
            {totalDeals} recorded
          </Typography>
        </Box>

        {dealsLoading ? (
          <Box sx={{ p: 2.5 }}>
            {[0, 1, 2].map((i) => <Skeleton key={i} height={48} sx={{ mb: 0.5, borderRadius: 1 }} />)}
          </Box>
        ) : deals.length === 0 ? (
          <Box sx={{ py: 5, textAlign: 'center' }}>
            <Typography sx={{ fontSize: '0.85rem', color: '#4A4E65' }}>
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
                  <TableRow key={deal.id} sx={{ opacity: deal.active ? 1 : 0.55 }}>
                    <TableCell><ConfidenceBadge confidence={deal.confidence} /></TableCell>
                    <TableCell><DealTypeBadge type={deal.type} /></TableCell>
                    <TableCell sx={{ maxWidth: 280 }}>
                      <Typography sx={{ fontSize: '0.83rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {deal.title ?? deal.description ?? '—'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      {deal.discountValue ? (
                        <Box
                          component="span"
                          sx={{
                            color: '#F5A623',
                            fontWeight: 700,
                            fontSize: '0.85rem',
                            backgroundColor: 'rgba(245,166,35,0.08)',
                            px: '8px',
                            py: '2px',
                            borderRadius: '5px',
                          }}
                        >
                          {deal.discountValue}
                        </Box>
                      ) : (
                        <Typography sx={{ fontSize: '0.83rem', color: '#4A4E65' }}>—</Typography>
                      )}
                    </TableCell>
                    <TableCell><TimeAgo dateString={deal.detectedAt} /></TableCell>
                    <TableCell>
                      <Typography sx={{ fontSize: '0.83rem', color: '#8890A8' }}>
                        {deal.expiresAt ? new Date(deal.expiresAt).toLocaleDateString() : '—'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Box
                        component="span"
                        sx={{
                          fontSize: '0.63rem',
                          fontWeight: 700,
                          letterSpacing: '0.05em',
                          color: deal.active ? '#22D98C' : '#4A4E65',
                          backgroundColor: deal.active ? 'rgba(34,217,140,0.1)' : 'rgba(74,78,101,0.08)',
                          border: `1px solid ${deal.active ? 'rgba(34,217,140,0.25)' : 'rgba(74,78,101,0.15)'}`,
                          px: '6px',
                          py: '2px',
                          borderRadius: '4px',
                        }}
                      >
                        {deal.active ? 'ACTIVE' : 'EXPIRED'}
                      </Box>
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
      </Box>
    </>
  );
}

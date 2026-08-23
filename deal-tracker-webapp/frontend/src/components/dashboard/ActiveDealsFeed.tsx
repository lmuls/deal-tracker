import { useState } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Skeleton from '@mui/material/Skeleton';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import Snackbar from '@mui/material/Snackbar';
import Button from '@mui/material/Button';
import BlockRoundedIcon from '@mui/icons-material/BlockRounded';
import { useNavigate } from 'react-router-dom';
import type { DealResponse } from '../../api/generated';
import { markDealInvalid, restoreDeal } from '../../api/generated';
import ConfidenceBadge from '../common/ConfidenceBadge';
import DealTypeBadge from '../common/DealTypeBadge';
import TimeAgo from '../common/TimeAgo';

interface Props {
  deals: DealResponse[];
  loading: boolean;
  onDealInvalidated?: () => void;
}

function DealRow({
  deal,
  onClick,
  onInvalidate,
}: {
  deal: DealResponse;
  onClick: () => void;
  onInvalidate: (e: React.MouseEvent) => void;
}) {
  return (
    <Box
      onClick={onClick}
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 2,
        px: 2.5,
        py: 1.75,
        cursor: 'pointer',
        borderBottom: '1px solid #1E2030',
        transition: 'background 0.12s ease',
        '&:hover': { backgroundColor: '#12131A' },
        '&:last-child': { borderBottom: 'none' },
        '&:hover .invalidate-btn': { opacity: 1 },
      }}
    >
      {/* Live indicator */}
      <Box
        sx={{
          width: 7,
          height: 7,
          borderRadius: '50%',
          backgroundColor: '#22D98C',
          flexShrink: 0,
          animation: 'pulse-dot 2s ease infinite',
        }}
      />

      {/* Main content */}
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, flexWrap: 'wrap', mb: 0.4 }}>
          <Typography sx={{ fontSize: '0.875rem', fontWeight: 600, color: '#E8E9F3' }}>
            {deal.siteName}
          </Typography>
          <ConfidenceBadge confidence={deal.confidence} />
          <DealTypeBadge type={deal.type} />
        </Box>
        <Typography sx={{ fontSize: '0.8rem', color: '#8890A8', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {deal.title ?? deal.description ?? 'Deal detected'}
        </Typography>
      </Box>

      {/* Right side */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexShrink: 0 }}>
        <Box sx={{ textAlign: 'right' }}>
          {deal.discountValue && (
            <Box
              sx={{
                display: 'inline-block',
                backgroundColor: 'rgba(245,166,35,0.12)',
                border: '1px solid rgba(245,166,35,0.3)',
                color: '#F5A623',
                px: 1.25,
                py: 0.25,
                borderRadius: '6px',
                fontSize: '0.8rem',
                fontWeight: 700,
                letterSpacing: '0.02em',
                mb: 0.4,
              }}
            >
              {deal.discountValue}
            </Box>
          )}
          <Typography sx={{ fontSize: '0.72rem', color: '#4A4E65', display: 'block' }}>
            <TimeAgo dateString={deal.detectedAt} />
          </Typography>
        </Box>
        <Tooltip title="Not a real deal" arrow>
          <IconButton
            className="invalidate-btn"
            size="small"
            onClick={onInvalidate}
            sx={{
              opacity: 0,
              transition: 'opacity 0.12s ease',
              color: '#4A4E65',
              '&:hover': { color: '#FF4D6D', backgroundColor: 'rgba(255,77,109,0.1)' },
            }}
          >
            <BlockRoundedIcon sx={{ fontSize: '0.95rem' }} />
          </IconButton>
        </Tooltip>
      </Box>
    </Box>
  );
}

export default function ActiveDealsFeed({ deals, loading, onDealInvalidated }: Props) {
  const navigate = useNavigate();
  const [visibleDeals, setVisibleDeals] = useState<DealResponse[]>(deals);
  const [toast, setToast] = useState<{ open: boolean; dealId: string; prevDeals: DealResponse[] }>({
    open: false,
    dealId: '',
    prevDeals: [],
  });

  // Sync when parent updates deals
  if (deals !== visibleDeals && !toast.open) {
    setVisibleDeals(deals);
  }

  const handleInvalidate = async (e: React.MouseEvent, deal: DealResponse) => {
    e.stopPropagation();
    const prev = visibleDeals;
    setVisibleDeals((cur) => cur.filter((d) => d.id !== deal.id));
    setToast({ open: true, dealId: deal.id!, prevDeals: prev });
    await markDealInvalid({ path: { id: deal.id! } });
    onDealInvalidated?.();
  };

  const handleUndo = async () => {
    setVisibleDeals(toast.prevDeals);
    setToast((t) => ({ ...t, open: false }));
    await restoreDeal({ path: { id: toast.dealId } });
    onDealInvalidated?.();
  };

  return (
    <>
      <Box
        sx={{
          backgroundColor: '#0F1016',
          border: '1px solid #1E2030',
          borderRadius: 3,
          mb: 3,
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            px: 2.5,
            py: 2,
            borderBottom: '1px solid #1E2030',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography sx={{ fontFamily: '"Syne", sans-serif', fontWeight: 600, fontSize: '0.95rem', color: '#E8E9F3' }}>
              Active Deals
            </Typography>
            {!loading && visibleDeals.length > 0 && (
              <Box
                sx={{
                  backgroundColor: 'rgba(34,217,140,0.12)',
                  border: '1px solid rgba(34,217,140,0.25)',
                  color: '#22D98C',
                  px: 1,
                  py: '1px',
                  borderRadius: '5px',
                  fontSize: '0.68rem',
                  fontWeight: 700,
                  letterSpacing: '0.05em',
                }}
              >
                {visibleDeals.length} LIVE
              </Box>
            )}
          </Box>
        </Box>

        {loading ? (
          <Box sx={{ px: 2.5, py: 2 }}>
            {[0, 1, 2].map((i) => (
              <Box key={i} sx={{ display: 'flex', gap: 2, mb: 2, alignItems: 'center' }}>
                <Skeleton variant="circular" width={7} height={7} />
                <Box sx={{ flex: 1 }}>
                  <Skeleton height={16} width="40%" sx={{ mb: 0.5 }} />
                  <Skeleton height={14} width="70%" />
                </Box>
                <Skeleton height={24} width={60} sx={{ borderRadius: 1 }} />
              </Box>
            ))}
          </Box>
        ) : visibleDeals.length === 0 ? (
          <Box sx={{ py: 5, textAlign: 'center' }}>
            <Typography sx={{ fontSize: '0.85rem', color: '#4A4E65' }}>
              No active deals detected
            </Typography>
          </Box>
        ) : (
          visibleDeals.map((deal) => (
            <DealRow
              key={deal.id}
              deal={deal}
              onClick={() => navigate(`/sites/${deal.siteId}`)}
              onInvalidate={(e) => handleInvalidate(e, deal)}
            />
          ))
        )}
      </Box>

      <Snackbar
        open={toast.open}
        autoHideDuration={6000}
        onClose={(_, reason) => { if (reason !== 'clickaway') setToast((t) => ({ ...t, open: false })); }}
        message="Deal marked as not valid"
        action={
          <Button size="small" sx={{ color: '#F5A623', fontWeight: 600 }} onClick={handleUndo}>
            UNDO
          </Button>
        }
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      />
    </>
  );
}

import { useEffect, useState } from 'react';
import MuiBreadcrumbs from '@mui/material/Breadcrumbs';
import Link from '@mui/material/Link';
import Box from '@mui/material/Box';
import ChevronRightIcon from '@mui/icons-material/ChevronRightRounded';
import { useMatches, Link as RouterLink } from 'react-router-dom';
import { getSite } from '../../api/generated';

interface CrumbHandle {
  crumb: string | ((params: Record<string, string | undefined>) => React.ReactNode);
}

function SiteNameCrumb({ siteId }: { siteId: string }) {
  const [name, setName] = useState<string>('…');

  useEffect(() => {
    getSite({ path: { id: siteId } }).then(({ data }) => {
      setName(data?.name ?? siteId);
    });
  }, [siteId]);

  return <>{name}</>;
}

export default function AppBreadcrumbs() {
  const matches = useMatches() as Array<{
    id: string;
    pathname: string;
    params: Record<string, string | undefined>;
    handle?: CrumbHandle;
  }>;

  const crumbs = matches.filter((m) => m.handle?.crumb);

  if (crumbs.length <= 1) return null;

  return (
    <MuiBreadcrumbs
      separator={<ChevronRightIcon sx={{ fontSize: '0.85rem', color: '#4A4E65' }} />}
      sx={{ mb: 2.5 }}
    >
      {crumbs.map((match, idx) => {
        const isLast = idx === crumbs.length - 1;
        const label =
          typeof match.handle!.crumb === 'function'
            ? match.handle!.crumb(match.params)
            : match.handle!.crumb;

        return isLast ? (
          <Box
            key={match.id}
            component="span"
            sx={{ fontSize: '0.8rem', color: '#E8E9F3', fontWeight: 500 }}
          >
            {label}
          </Box>
        ) : (
          <Link
            key={match.id}
            component={RouterLink}
            to={match.pathname}
            sx={{
              fontSize: '0.8rem',
              color: '#8890A8',
              textDecoration: 'none',
              '&:hover': { color: '#F5A623' },
              transition: 'color 0.12s ease',
            }}
          >
            {label}
          </Link>
        );
      })}
    </MuiBreadcrumbs>
  );
}

export { SiteNameCrumb };

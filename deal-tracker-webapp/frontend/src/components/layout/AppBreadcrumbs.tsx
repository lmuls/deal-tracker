import { useEffect, useState } from 'react';
import MuiBreadcrumbs from '@mui/material/Breadcrumbs';
import Link from '@mui/material/Link';
import Typography from '@mui/material/Typography';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import { useMatches, Link as RouterLink } from 'react-router-dom';
import { getSite } from '../../api/generated';

interface CrumbHandle {
  crumb: string | ((params: Record<string, string | undefined>) => React.ReactNode);
}

/**
 * Resolves the site name from the API for the /sites/:id breadcrumb.
 * Rendered as a separate component so it can have its own state.
 */
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
  const matches = useMatches() as Array<{ id: string; pathname: string; params: Record<string, string | undefined>; handle?: CrumbHandle }>;

  const crumbs = matches.filter((m) => m.handle?.crumb);

  if (crumbs.length <= 1) return null;

  return (
    <MuiBreadcrumbs
      separator={<NavigateNextIcon fontSize="small" />}
      sx={{ mb: 2, fontSize: '0.875rem' }}
    >
      {crumbs.map((match, idx) => {
        const isLast = idx === crumbs.length - 1;
        const label = typeof match.handle!.crumb === 'function'
          ? match.handle!.crumb(match.params)
          : match.handle!.crumb;

        return isLast ? (
          <Typography key={match.id} variant="body2" color="text.primary" fontWeight={500}>
            {label}
          </Typography>
        ) : (
          <Link
            key={match.id}
            component={RouterLink}
            to={match.pathname}
            variant="body2"
            color="inherit"
            underline="hover"
          >
            {label}
          </Link>
        );
      })}
    </MuiBreadcrumbs>
  );
}

export { SiteNameCrumb };

import { Button } from './Button';
import './Pager.css';

/** Previous / next for a paged list. `page` is zero-based. */
export function Pager({ page, totalPages, onChange }: { page: number; totalPages: number; onChange: (page: number) => void }) {
  if (totalPages <= 1) return null;
  return (
    <nav className="app-pager" aria-label="Pages">
      <Button variant="quiet" size="sm" disabled={page === 0} onClick={() => onChange(page - 1)}>Previous</Button>
      <span className="small app-pager__label">Page {page + 1} of {totalPages}</span>
      <Button variant="quiet" size="sm" disabled={page >= totalPages - 1} onClick={() => onChange(page + 1)}>Next</Button>
    </nav>
  );
}

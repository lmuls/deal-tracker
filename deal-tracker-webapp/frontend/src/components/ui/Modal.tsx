import { useEffect, useRef, type ReactNode } from 'react';
import { cx } from './cx';
import './Modal.css';

/** A modal dialog on the `overlay` backdrop. Uses the native <dialog> for focus handling and Escape. */
export interface ModalProps {
  open: boolean;
  onClose: () => void;
  /** Accessible name, when the content has no heading to point at. */
  label?: string;
  /** Wrap the content in a padded surface card. Leave off when the content is already a card (AddTrackerForm). */
  card?: boolean;
  className?: string;
  children: ReactNode;
}

export function Modal({ open, onClose, label, card, className, children }: ModalProps) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      className={cx('app-modal', className)}
      aria-label={label}
      onCancel={(e) => { e.preventDefault(); onClose(); }}
      onClick={(e) => { if (e.target === ref.current) onClose(); }}
    >
      {open && <div className={cx(card && 'app-modal__card')}>{children}</div>}
    </dialog>
  );
}

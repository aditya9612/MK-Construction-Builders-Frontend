import { useUiStore } from '../../store/uiStore';
import { Button } from '../common/Button';
import { Modal } from './Modal';

export function ConfirmDialog() {
  const confirm = useUiStore((s) => s.confirm);
  const closeConfirm = useUiStore((s) => s.closeConfirm);
  if (!confirm) return null;

  return (
    <Modal
      open
      title={confirm.title || 'Please confirm'}
      onClose={closeConfirm}
      footer={
        <>
          <Button variant="secondary" onClick={closeConfirm}>
            {confirm.cancelLabel || 'Cancel'}
          </Button>
          <Button
            variant={confirm.danger ? 'danger' : 'primary'}
            onClick={async () => {
              await confirm.onConfirm?.();
              closeConfirm();
            }}
          >
            {confirm.confirmLabel || 'Confirm'}
          </Button>
        </>
      }
    >
      <p className="text-sm leading-relaxed text-muted">{confirm.message}</p>
    </Modal>
  );
}

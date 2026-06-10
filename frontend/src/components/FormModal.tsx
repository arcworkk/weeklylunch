import { ReactNode, useEffect, useId, useRef } from "react";
import { createPortal } from "react-dom";

type FormModalProps = {
  open: boolean;
  title: string;
  description?: string;
  children: ReactNode;
  closeDisabled?: boolean;
  onClose: () => void;
};

export const FormModal = ({
  open,
  title,
  description,
  children,
  closeDisabled = false,
  onClose
}: FormModalProps) => {
  const titleId = useId();
  const descriptionId = useId();
  const dialogRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!open) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (event: KeyboardEvent) => {
      const dialogs = document.querySelectorAll<HTMLElement>('[aria-modal="true"]');
      const topDialog = dialogs[dialogs.length - 1];

      if (
        event.key === "Escape" &&
        !closeDisabled &&
        topDialog === dialogRef.current
      ) {
        onClose();
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [closeDisabled, onClose, open]);

  if (!open) {
    return null;
  }

  return createPortal(
    <div
      className="modal-backdrop form-modal-backdrop"
      role="presentation"
      onMouseDown={() => {
        if (!closeDisabled) {
          onClose();
        }
      }}
    >
      <section
        ref={dialogRef}
        aria-describedby={description ? descriptionId : undefined}
        aria-labelledby={titleId}
        aria-modal="true"
        className="form-modal"
        role="dialog"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <header className="form-modal-header">
          <div>
            <h2 id={titleId}>{title}</h2>
            {description && <p id={descriptionId}>{description}</p>}
          </div>
          <button
            aria-label="Fermer"
            className="modal-close-button"
            disabled={closeDisabled}
            type="button"
            onClick={onClose}
          >
            &times;
          </button>
        </header>
        <div className="form-modal-content">{children}</div>
      </section>
    </div>,
    document.body
  );
};

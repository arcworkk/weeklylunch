import { ReactNode, useRef, useState } from "react";
import { ConfirmModal } from "../components/ConfirmModal";

type ConfirmOptions = {
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
};

type ConfirmState = ConfirmOptions & {
  open: boolean;
};

export const useConfirm = () => {
  const [state, setState] = useState<ConfirmState | null>(null);
  const resolverRef = useRef<((confirmed: boolean) => void) | null>(null);

  const close = (confirmed: boolean) => {
    resolverRef.current?.(confirmed);
    resolverRef.current = null;
    setState(null);
  };

  const confirm = (options: ConfirmOptions) => {
    return new Promise<boolean>((resolve) => {
      resolverRef.current = resolve;
      setState({ ...options, open: true });
    });
  };

  const confirmationModal: ReactNode = (
    <ConfirmModal
      open={Boolean(state?.open)}
      title={state?.title ?? ""}
      message={state?.message ?? ""}
      confirmLabel={state?.confirmLabel}
      cancelLabel={state?.cancelLabel}
      onConfirm={() => close(true)}
      onCancel={() => close(false)}
    />
  );

  return { confirm, confirmationModal };
};

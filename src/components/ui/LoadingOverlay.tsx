import { Loader2 } from 'lucide-react';

interface LoadingOverlayProps {
  message?: string;
  visible: boolean;
}

export default function LoadingOverlay({
  message = 'Loading...',
  visible,
}: LoadingOverlayProps) {
  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-background/80">
      <Loader2 className="h-10 w-10 animate-spin text-primary" />
      <p className="mt-4 text-base text-muted">{message}</p>
    </div>
  );
}

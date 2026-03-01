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
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-background/60 backdrop-blur-sm">
      <div className="glass-strong rounded-2xl p-8 flex flex-col items-center gap-4 animate-scale-in">
        <Loader2 className="h-10 w-10 animate-spin text-primary drop-shadow-[0_0_12px_rgba(59,130,246,0.5)]" />
        <p className="text-base text-muted">{message}</p>
      </div>
    </div>
  );
}

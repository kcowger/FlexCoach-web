import { useAppStore } from '@/stores/useAppStore';
import CoachChat from '@/components/coach/CoachChat';

export default function CoachPage() {
  const pid = useAppStore((s) => s.activeProfileId)!;

  return (
    <div className="bg-transparent text-text flex flex-col h-full">
      <div className="flex items-center px-6 pt-6 pb-4 flex-shrink-0">
        <h1 className="text-xl font-bold gradient-text">Coach</h1>
      </div>
      <div className="flex-1 overflow-hidden px-2 pb-4">
        <CoachChat pid={pid} maxHeight="100%" />
      </div>
    </div>
  );
}

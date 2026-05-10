import { Loader2 } from 'lucide-react';

export function Spinner() {
  return (
    <div className="flex flex-1 items-center justify-center py-24">
      <Loader2 className="size-10 animate-spin text-vibrant-coral" />
    </div>
  );
}

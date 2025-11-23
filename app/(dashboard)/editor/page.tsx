import { Toaster } from 'sonner';

import { PlateEditor } from '@/components/plate-editor';

export default function Page() {
  return (
    <div className="flex h-full w-full max-w-full overflow-x-hidden min-h-0">
      <PlateEditor />

      <Toaster />
    </div>
  );
}

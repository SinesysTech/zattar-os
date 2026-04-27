"use client";

import { cn } from '@/lib/utils';
import NoteSidebar from "./note-sidebar";
import NoteContent from "./note-content";
import type { NotasPayload } from "../domain";
import { NotesProvider } from "../notes-context";

export default function NotesApp({ initialData }: { initialData: NotasPayload }) {
  return (
    <NotesProvider initialData={initialData}>
      <div className={cn(/* design-system-escape: lg:space-x-4 sem equivalente DS */ "flex items-start lg:space-x-4")}>
        <NoteSidebar />
        <NoteContent />
      </div>
    </NotesProvider>
  );
}

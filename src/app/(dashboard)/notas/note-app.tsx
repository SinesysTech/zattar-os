"use client";

import NoteSidebar from "./note-sidebar";
import NoteContent from "./note-content";
import type { NotasPayload } from "./domain";
import { NotesProvider } from "./notes-context";

export default function NotesApp({ initialData }: { initialData: NotasPayload }) {
  return (
    <NotesProvider initialData={initialData}>
      <div className="flex items-start lg:space-x-4">
        <NoteSidebar />
        <NoteContent />
      </div>
    </NotesProvider>
  );
}

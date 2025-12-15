export * from './domain';
// export * from './domain'; // Already exported above
export * from './utils';

// Components
export { DocumentList } from './components/document-list';
export { DocumentListSkeleton } from './components/document-list-skeleton';
export { DocumentEditor } from './components/document-editor';
export { FolderTree } from './components/folder-tree';
export { ShareDocumentDialog } from './components/share-document-dialog';
export { VersionHistoryDialog } from './components/version-history-dialog';
export { UploadDialog } from './components/upload-dialog';
export { TemplateLibraryDialog } from './components/template-library-dialog';
// export { CollaboratorsAvatars } from './components/collaborators-avatars'; // If needed public
// export { DocumentChat } from './components/document-chat';

// Hooks (Optional, usually imported directly to tree shake)
export { useDocument } from './hooks/use-document';
export { useDocumentsList } from './hooks/use-documents-list';
export { useDocumentSharing } from './hooks/use-document-sharing';
export { useDocumentVersions } from './hooks/use-document-versions';
export { useFolders } from './hooks/use-folders';
export { useTemplates } from './hooks/use-templates';
export { useDocumentUploads } from './hooks/use-document-uploads';

// Server Actions
export {
  actionUploadArquivo,
  actionListarUploads,
  actionGerarPresignedUrl,
  actionGerarUrlDownload,
} from './actions/uploads-actions';

// Lixeira Actions
export {
  actionListarLixeira,
  actionRestaurarDaLixeira,
  actionDeletarPermanentemente,
} from './actions/lixeira-actions';

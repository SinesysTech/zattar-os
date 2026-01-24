/**
 * Layout para página de edição de documento
 * Compensa o padding do layout pai para layout fullscreen
 */
export default function EditarDocumentoLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="-m-6 h-[calc(100%+3rem)] w-[calc(100%+3rem)]">
      {children}
    </div>
  );
}

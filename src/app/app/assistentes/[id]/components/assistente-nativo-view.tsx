'use client';

import { DifyChatPanel } from '@/features/dify/components/dify-chat/dify-chat-panel';
import { WorkflowRunner } from '@/features/dify/components/dify-workflows/workflow-runner';
import { CompletionPanel } from '@/features/dify/components/dify-completion/completion-panel';

interface AssistenteNativoViewProps {
  appId: string;
  appType: string;
}

export function AssistenteNativoView({ appId, appType }: AssistenteNativoViewProps) {
  switch (appType) {
    case 'chat':
    case 'chatflow':
    case 'agent':
      return <DifyChatPanel appId={appId} className="h-full" />;

    case 'workflow':
      return (
        <div className="h-full overflow-auto p-4">
          <WorkflowRunner appId={appId} className="max-w-3xl mx-auto" />
        </div>
      );

    case 'completion':
      return <CompletionPanel appId={appId} className="h-full" />;

    default:
      return (
        <div className="flex items-center justify-center h-full text-muted-foreground">
          Tipo de app não suportado: {appType}
        </div>
      );
  }
}

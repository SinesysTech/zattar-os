'use client';

import { ProfileConfig, ProfileData, SectionConfig } from "../configs/types";
import { ProfileHeader } from "./profile-layout/profile-header";
import { ProfileSidebar } from "./profile-layout/profile-sidebar";
import { ProfileTabs } from "./profile-layout/profile-tabs";
import { InfoCards } from "./sections/info-cards";
import { RelatedTable } from "./sections/related-table";
import { RelatedEntitiesCards } from "./sections/related-entities-cards";
import { ActivityTimeline } from "./sections/activity-timeline";
import { ClienteDocumentosViewer } from "@/features/partes/components/clientes";
import { ClienteInfoSection } from "./sections/cliente-info-section";
import { ClienteContatoSection } from "./sections/cliente-contato-section";
import { ClienteEnderecoSection } from "./sections/cliente-endereco-section";
import { ClientePJESection } from "./sections/cliente-pje-section";
import { ClienteProcessosTable, ParteContrariaProcessosTable, TerceiroProcessosTable } from "./sections/cliente-processos-table";
import {
    clienteProfileConfig
} from "../configs/cliente-profile.config";
import {
    parteContrariaProfileConfig
} from "../configs/parte-contraria-profile.config";
import {
    terceiroProfileConfig
} from "../configs/terceiro-profile.config";
import {
    representanteProfileConfig
} from "../configs/representante-profile.config";
import {
    usuarioProfileConfig
} from "../configs/usuario-profile.config";

interface ProfileShellClientProps {
  entityType: 'cliente' | 'parte_contraria' | 'terceiro' | 'representante' | 'usuario';
  entityId: number;
  initialData: ProfileData;
}

const configs: Record<string, ProfileConfig> = {
    cliente: clienteProfileConfig,
    parte_contraria: parteContrariaProfileConfig,
    terceiro: terceiroProfileConfig,
    representante: representanteProfileConfig,
    usuario: usuarioProfileConfig,
};

export function ProfileShellClient({ entityType, entityId, initialData }: ProfileShellClientProps) {
  const config = configs[entityType];
  const data = initialData;

  if (!config) {
      return <div>Configuracao de perfil nao encontrada para {entityType}</div>;
  }

  if (!data) {
      return <div>Dados nao encontrados</div>;
  }

  const renderSection = (section: SectionConfig) => {
    switch (section.type) {
        case 'info-cards':
            return <InfoCards key={section.title} cards={[section]} data={data} />;
        case 'table':
            // Pass whole data so it can find dataSource
            return <RelatedTable key={section.title} config={section} data={data} />;
        case 'related-cards':
            return <RelatedEntitiesCards
                        key={section.title}
                        config={section.cardConfig!}
                        entityType={entityType}
                        entityId={entityId}
                    />;
        case 'timeline':
            // Pass specific dataSource if defined, else data
            const timelineData = section.dataSource ? data[section.dataSource] : data;
            return <ActivityTimeline key={section.title} data={timelineData as Record<string, unknown>} />;
        case 'custom':
            // Render custom components based on componentName
            switch (section.componentName) {
                case 'ClienteDocumentosViewer':
                    return <ClienteDocumentosViewer
                        key={section.title}
                        clienteId={entityId}
                        {...(section.componentProps ?? {})}
                    />;
                case 'ClienteInfoSection':
                    return <ClienteInfoSection
                        key={section.title}
                        data={data as Record<string, unknown>}
                    />;
                case 'ClienteContatoSection':
                    return <ClienteContatoSection
                        key={section.title}
                        data={data as Record<string, unknown>}
                    />;
                case 'ClienteEnderecoSection':
                    return <ClienteEnderecoSection
                        key={section.title}
                        data={data as Record<string, unknown>}
                    />;
                case 'ClientePJESection':
                    return <ClientePJESection
                        key={section.title}
                        data={data as Record<string, unknown>}
                    />;
                case 'ClienteProcessosTable':
                    return <ClienteProcessosTable
                        key={section.title}
                        data={data}
                    />;
                case 'ParteContrariaProcessosTable':
                    return <ParteContrariaProcessosTable
                        key={section.title}
                        data={data}
                        title="Processos Relacionados"
                    />;
                case 'TerceiroProcessosTable':
                    return <TerceiroProcessosTable
                        key={section.title}
                        data={data}
                        title="Processos onde atua"
                    />;
                default:
                    return null;
            }
        default:
            return null;
    }
  };

  return (
    <div className="mx-auto lg:max-w-7xl">
      <ProfileHeader config={config.headerConfig} data={data} />

      <div className="grid gap-6 lg:grid-cols-[300px_1fr] xl:grid-cols-[340px_1fr]">
        <div className="order-2 lg:order-1">
            <ProfileSidebar sections={config.sidebarSections} data={data} />
        </div>

        <div className="order-1 lg:order-2">
            <ProfileTabs
                tabs={config.tabs}
                data={data}
            >
                {(tabId) => {
                    const tab = config.tabs.find(t => t.id === tabId);
                    if (!tab) return null;
                    return (
                        <div className="space-y-6">
                            {tab.sections.map((section, idx) => (
                                <div key={idx}>
                                    {renderSection(section)}
                                </div>
                            ))}
                        </div>
                    );
                }}
            </ProfileTabs>
        </div>
      </div>
    </div>
  );
}

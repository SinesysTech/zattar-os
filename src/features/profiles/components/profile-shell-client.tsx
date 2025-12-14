'use client';

import { ProfileConfig } from "../configs/types";
import { ProfileHeader } from "./profile-layout/profile-header";
import { ProfileSidebar } from "./profile-layout/profile-sidebar";
import { ProfileTabs } from "./profile-layout/profile-tabs";
import { InfoCards } from "./sections/info-cards";
import { RelatedTable } from "./sections/related-table";
import { RelatedEntitiesCards } from "./sections/related-entities-cards";
import { ActivityTimeline } from "./sections/activity-timeline";
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
  initialData: any;
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
      return <div>Configuração de perfil não encontrada para {entityType}</div>;
  }

  if (!data) {
      return <div>Dados não encontrados</div>;
  }

  const renderSection = (section: any) => {
    switch (section.type) {
        case 'info-cards':
            return <InfoCards key={section.title} cards={[section]} data={data} />;
        case 'table':
            // Pass whole data so it can find dataSource
            return <RelatedTable key={section.title} config={section} data={data} />;
        case 'related-cards':
            return <RelatedEntitiesCards 
                        key={section.title} 
                        config={section.cardConfig} 
                        entityType={entityType} 
                        entityId={entityId} 
                    />;
        case 'timeline':
            // Pass specific dataSource if defined, else data
            const timelineData = section.dataSource ? data[section.dataSource] : data;
            return <ActivityTimeline key={section.title} data={timelineData} />;
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

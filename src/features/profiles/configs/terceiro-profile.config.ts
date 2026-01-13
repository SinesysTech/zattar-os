import { ProfileConfig } from './types';
import { FileText, Mail, Phone, User, Users } from 'lucide-react';

export const terceiroProfileConfig: ProfileConfig = {
  entityType: 'terceiro',
  headerConfig: {
    showBanner: true,
    showAvatar: true,
    showStatus: true,
    titleField: 'nome',
    subtitleFields: ['cpf_cnpj'],
    badges: [
       { field: 'tipo', variant: 'secondary' }, // e.g. Perito, Testemunha
       { field: 'polo', variant: 'outline' }
    ],
    metadata: [
       { label: 'Tipo', valuePath: 'tipo', icon: Users }
    ]
  },
  sidebarSections: [
    {
       title: 'Sobre',
       fields: [
         { label: 'Nome', valuePath: 'nome', icon: User },
         { label: 'CPF', valuePath: 'cpf_cnpj', icon: FileText }
       ]
    },
    {
       title: 'Contatos',
       fields: [
         { label: 'Email', valuePath: 'email', icon: Mail },
         { label: 'Telefone', valuePath: 'telefone', icon: Phone }
       ]
    },
    {
        title: 'Estatísticas',
        fields: [
          { label: 'Participações', valuePath: 'stats.total_participacoes', icon: FileText }
        ]
    }
  ],
  tabs: [
    {
       id: 'perfil',
       label: 'Perfil',
       sections: [
         {
            type: 'info-cards',
            title: 'Dados do Terceiro',
            fields: [
               { label: 'Nome', valuePath: 'nome' },
               { label: 'Especialidade', valuePath: 'especialidade' } // se perito
            ]
         }
       ]
    },
    {
       id: 'participacoes',
       label: 'Participacoes',
       badgeField: 'stats.total_processos',
       sections: [
         {
            type: 'custom',
            title: 'Processos onde atua',
            componentName: 'TerceiroProcessosTable',
         }
       ]
    },
    {
       id: 'atividades',
       label: 'Atividades',
       sections: [
         {
            type: 'timeline',
            title: 'Histórico de Atividades',
            dataSource: 'activities',
         }
       ]
    }
  ]
};

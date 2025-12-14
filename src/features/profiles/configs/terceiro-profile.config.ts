import { ProfileConfig } from './types';
import { Calendar, FileText, Mail, MapPin, Phone, User, Users } from 'lucide-react';

export const terceiroProfileConfig: ProfileConfig = {
  entityType: 'terceiro',
  headerConfig: {
    showBanner: true,
    showAvatar: true,
    showStatus: true,
    titleField: 'nome',
    showSubtitles: true,
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
       label: 'Participações',
       sections: [
         {
            type: 'table',
            title: 'Processos onde atua',
            dataSource: 'processos',
            columns: [
               { header: 'Processo', accessorKey: 'numero_processo' },
               { header: 'Tipo Atuação', accessorKey: 'tipo_atuacao' }
            ]
         }
       ]
    }
  ]
};

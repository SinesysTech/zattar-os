import { createServiceClient } from '@/backend/utils/supabase/service-client';

async function main() {
  const supabase = createServiceClient();

  const { data, error } = await supabase
    .from('tribunais_config')
    .select(`
      id,
      tipo_acesso,
      tribunais!inner (
        codigo,
        nome
      )
    `)
    .limit(20);

  if (error) {
    console.error('Erro:', error);
    process.exit(1);
  }

  console.log('Tribunais disponíveis:');
  console.log('='.repeat(80));

  data?.forEach((config: any) => {
    const tribunal = Array.isArray(config.tribunais) ? config.tribunais[0] : config.tribunais;
    console.log(`- ${tribunal.codigo} | ${config.tipo_acesso} | ${tribunal.nome}`);
  });

  process.exit(0);
}

main();

import { GET } from './src/app/api/captura/historico/route';
import { NextRequest } from 'next/server';

async function run() {
  const req = new NextRequest("http://localhost:3000/api/captura/historico?pagina=1&limite=50", {
    method: 'GET',
    headers: new Headers({
      'authorization': 'Bearer MOCK_TOKEN'
    })
  });
  
  try {
    const res = await GET(req);
    console.log("Status:", res.status);
    console.log("Body:", await res.text());
  } catch(e) {
    console.error("UNHANDLED EXCEPTION:", e);
  }
}
run();

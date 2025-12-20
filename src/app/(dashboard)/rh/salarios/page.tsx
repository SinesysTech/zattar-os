import { SalariosList } from '@/features/rh';

// Force dynamic rendering to avoid static prerendering issues with CopilotKit context
export const dynamic = 'force-dynamic';

export default function SalariosPage() {
  return <SalariosList />;
}

import { SessionWizard } from '@/components/SessionWizard';

interface SessionPageProps {
  params: Promise<{
    comboId: string;
    locale: string;
  }>;
}

export default async function SessionPage({ params }: SessionPageProps) {
  const { comboId } = await params;

  return <SessionWizard comboId={comboId} />;
}


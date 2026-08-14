import { Card } from '../components/ui/Card';

export function Settings() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="mt-1 text-sm text-slate-400">Placeholder — real user settings require auth and a backend.</p>
      </div>

      <Card title="Coming soon">
        <p className="text-sm text-slate-500">
          Wallet preferences, Lens pricing defaults and notification settings will land here once
          accounts and the fee oracle (Fase 4) are live.
        </p>
      </Card>
    </div>
  );
}

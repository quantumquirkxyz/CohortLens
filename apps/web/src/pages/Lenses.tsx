import { useState, type FormEvent } from 'react';
import type { LensDefinition, LensType } from '@cohortlens/shared';
import { Card } from '../components/ui/Card';
import { useExecuteLens, useLensResults, useLenses, usePublishLens, useRegisterLens } from '../hooks/useLenses';

const LENS_TYPE_LABELS: Record<LensType, string> = {
  ml_model: 'ML model',
  graph_query: 'Graph query',
  risk_signal: 'Risk signal',
};

export function Lenses() {
  const lenses = useLenses();
  const publishLens = usePublishLens();
  const executeLens = useExecuteLens();
  const registerLens = useRegisterLens();
  const [executingId, setExecutingId] = useState<string | null>(null);
  const [publishingId, setPublishingId] = useState<string | null>(null);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Lens marketplace</h1>
        <p className="mt-1 text-sm text-slate-400">
          Registered, priced capabilities that answer questions about the Capital Flow Graph.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <div className="xl:col-span-2">
          {lenses.isLoading ? (
            <p className="text-sm text-slate-500">Loading lenses…</p>
          ) : lenses.data ? (
            <ul className="space-y-3">
              {lenses.data.map((lens) => (
                <LensCard
                  key={lens.id}
                  lens={lens}
                  executing={executeLens.isPending && executingId === lens.id}
                  publishing={publishLens.isPending && publishingId === lens.id}
                  onPublish={async () => {
                    setPublishingId(lens.id);
                    await publishLens.mutateAsync(lens.id);
                    setPublishingId(null);
                  }}
                  onExecute={async () => {
                    setExecutingId(lens.id);
                    await executeLens.mutateAsync({ lensId: lens.id, params: {} });
                    setExecutingId(null);
                  }}
                />
              ))}
            </ul>
          ) : (
            <Card title="Lenses">
              <p className="text-sm text-slate-500">
                Failed to load lenses (
                {lenses.error instanceof Error ? lenses.error.message : 'unknown error'}).
              </p>
            </Card>
          )}
        </div>

        <RegisterLensForm onRegister={registerLens.mutateAsync} pending={registerLens.isPending} />
      </div>
    </div>
  );
}

function LensCard({
  lens,
  executing,
  publishing,
  onPublish,
  onExecute,
}: {
  lens: LensDefinition;
  executing: boolean;
  publishing: boolean;
  onPublish: () => void;
  onExecute: () => void;
}) {
  const results = useLensResults(lens.id);

  return (
    <li className="rounded-lg border border-slate-800 bg-slate-900/60 p-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-semibold">{lens.name}</h3>
            <span className="rounded bg-slate-800 px-1.5 py-0.5 text-[10px] text-slate-300">
              {LENS_TYPE_LABELS[lens.type]}
            </span>
            <span
              className={`rounded px-1.5 py-0.5 text-[10px] ${
                lens.active
                  ? 'bg-emerald-500/15 text-emerald-300'
                  : 'bg-slate-800 text-slate-400'
              }`}
            >
              {lens.active ? 'active' : 'inactive'}
            </span>
          </div>
          <p className="mt-1 text-sm text-slate-400">{lens.description}</p>
        </div>
        <span className="shrink-0 font-mono text-sm text-sky-300">{lens.price} LENS</span>
      </div>

      <div className="mt-3 flex items-center gap-2">
        {!lens.active ? (
          <button
            type="button"
            onClick={onPublish}
            disabled={publishing}
            className="rounded-md border border-slate-700 px-3 py-1 text-xs text-slate-300 hover:bg-slate-800 disabled:opacity-50"
          >
            {publishing ? 'Publishing…' : 'Publish'}
          </button>
        ) : null}
        <button
          type="button"
          onClick={onExecute}
          disabled={executing}
          className="rounded-md border border-sky-500/50 bg-sky-500/10 px-3 py-1 text-xs font-medium text-sky-300 hover:bg-sky-500/20 disabled:opacity-50"
        >
          {executing ? 'Executing…' : 'Execute'}
        </button>
      </div>

      {results.data ? (
        <div className="mt-3 rounded-md border border-slate-800 bg-slate-950/60 p-3 text-xs">
          <div className="flex items-center justify-between text-slate-400">
            <span className="font-medium text-slate-300">Latest result — {results.data.summary}</span>
            <span>{results.data.generatedAt.toLocaleString()}</span>
          </div>
          <ul className="mt-2 space-y-1">
            {results.data.findings.map((finding) => (
              <li key={finding.nodeId} className="flex items-start justify-between gap-3">
                <span className="font-mono text-slate-300">
                  {finding.nodeId} <span className="text-slate-500">({finding.nodeType})</span>
                </span>
                <span className="text-slate-400">{finding.score.toFixed(2)}</span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </li>
  );
}

function RegisterLensForm({
  onRegister,
  pending,
}: {
  onRegister: (input: {
    id: string;
    name: string;
    type: LensType;
    description: string;
    inputSchema: Record<string, unknown>;
    price: string;
  }) => Promise<unknown>;
  pending: boolean;
}) {
  const [form, setForm] = useState({
    id: '',
    name: '',
    type: 'risk_signal' as LensType,
    description: '',
    price: '',
  });
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    try {
      await onRegister({
        ...form,
        inputSchema: {},
        id: form.id || form.name.toLowerCase().replace(/\s+/g, '-'),
      });
      setForm({ id: '', name: '', type: 'risk_signal', description: '', price: '' });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'registration failed');
    }
  };

  return (
    <Card title="Register a Lens">
      <form onSubmit={handleSubmit} className="space-y-3 text-sm">
        <label className="block">
          <span className="text-xs text-slate-500">Name</span>
          <input
            required
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="mt-1 w-full rounded-md border border-slate-800 bg-slate-950 px-2 py-1.5 text-slate-200 outline-none focus:border-sky-500"
          />
        </label>
        <label className="block">
          <span className="text-xs text-slate-500">Type</span>
          <select
            value={form.type}
            onChange={(e) => setForm({ ...form, type: e.target.value as LensType })}
            className="mt-1 w-full rounded-md border border-slate-800 bg-slate-950 px-2 py-1.5 text-slate-200 outline-none focus:border-sky-500"
          >
            {Object.entries(LENS_TYPE_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="text-xs text-slate-500">Price (LENS per query)</span>
          <input
            required
            inputMode="decimal"
            value={form.price}
            onChange={(e) => setForm({ ...form, price: e.target.value })}
            placeholder="0.5"
            className="mt-1 w-full rounded-md border border-slate-800 bg-slate-950 px-2 py-1.5 text-slate-200 outline-none focus:border-sky-500"
          />
        </label>
        <label className="block">
          <span className="text-xs text-slate-500">Description</span>
          <textarea
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            rows={2}
            className="mt-1 w-full rounded-md border border-slate-800 bg-slate-950 px-2 py-1.5 text-slate-200 outline-none focus:border-sky-500"
          />
        </label>
        {error ? <p className="text-xs text-rose-400">{error}</p> : null}
        <button
          type="submit"
          disabled={pending}
          className="w-full rounded-md bg-sky-600 px-3 py-2 text-xs font-medium text-white hover:bg-sky-500 disabled:opacity-50"
        >
          {pending ? 'Registering…' : 'Register Lens'}
        </button>
      </form>
    </Card>
  );
}

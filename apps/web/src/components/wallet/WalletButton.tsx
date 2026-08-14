import { useAccount, useConnect, useDisconnect } from 'wagmi';

export function WalletButton() {
  const { address, isConnected } = useAccount();
  const { connect, connectors, isPending } = useConnect();
  const { disconnect } = useDisconnect();

  if (isConnected && address) {
    return (
      <div className="flex items-center gap-3">
        <span className="rounded-md border border-emerald-500/40 bg-emerald-500/10 px-2 py-1 font-mono text-xs text-emerald-300">
          {address.slice(0, 6)}…{address.slice(-4)}
        </span>
        <button
          type="button"
          onClick={() => disconnect()}
          className="rounded-md border border-slate-700 px-3 py-1 text-xs text-slate-300 hover:bg-slate-800"
        >
          Disconnect
        </button>
      </div>
    );
  }

  const connector = connectors[0];
  return (
    <button
      type="button"
      onClick={() => connect({ connector })}
      disabled={!connector || isPending}
      className="rounded-md border border-sky-500/50 bg-sky-500/10 px-3 py-1 text-xs font-medium text-sky-300 hover:bg-sky-500/20 disabled:cursor-not-allowed disabled:opacity-50"
    >
      {isPending ? 'Connecting…' : 'Connect Wallet'}
    </button>
  );
}

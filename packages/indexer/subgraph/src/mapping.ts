import { Address, BigInt, ethereum } from '@graphprotocol/graph-ts';
import { CapitalFlow, Chain, Protocol, Asset, Wallet, Pool } from '../generated/schema';
import {
  CFGEvents,
  Deposit,
  Borrow,
  Repay,
  Withdraw,
  Swap,
  Transfer,
} from '../generated/CFGEvents/CFGEvents';

// Per-chain constants. A deployed subgraph is single-chain, so these are
// static; the real deployment configures them per chain (ADR 006).
const CHAIN_ID = 'ethereum';
const CHAIN_NAME = 'Ethereum';
const PROTOCOL_ID = 'cohortlens';
const PROTOCOL_NAME = 'CohortLens';

function getOrCreateChain(): Chain {
  let chain = Chain.load(CHAIN_ID);
  if (chain === null) {
    chain = new Chain(CHAIN_ID);
    chain.name = CHAIN_NAME;
    chain.save();
  }
  return chain;
}

function getOrCreateProtocol(): Protocol {
  let protocol = Protocol.load(PROTOCOL_ID);
  if (protocol === null) {
    protocol = new Protocol(PROTOCOL_ID);
    protocol.name = PROTOCOL_NAME;
    protocol.chain = CHAIN_ID;
    protocol.save();
  }
  return protocol;
}

function getOrCreateWallet(address: Address): Wallet {
  let id = address.toHexString();
  let wallet = Wallet.load(id);
  if (wallet === null) {
    wallet = new Wallet(id);
    wallet.address = address;
    wallet.save();
  }
  return wallet;
}

// Asset metadata (symbol/name/decimals) is resolved off-chain in the real
// integration; the prototype records the token address with placeholders. The
// symbol falls back to the token address so the identity stays unique per
// token — the sync resolves assets by (symbol, chain), so a constant
// placeholder would collapse every token onto a single CFG node.
function getOrCreateAsset(token: Address): Asset {
  let id = token.toHexString();
  let asset = Asset.load(id);
  if (asset === null) {
    asset = new Asset(id);
    asset.symbol = id;
    asset.name = 'Unknown';
    asset.chain = CHAIN_ID;
    asset.decimals = 18;
    asset.save();
  }
  return asset;
}

function getOrCreatePool(poolAddress: Address, asset: Asset): Pool {
  let id = poolAddress.toHexString();
  let pool = Pool.load(id);
  if (pool === null) {
    pool = new Pool(id);
    pool.address = poolAddress;
    pool.protocol = PROTOCOL_ID;
    pool.asset = asset.id;
    pool.save();
  }
  return pool;
}

function createFlow(
  event: ethereum.Event,
  flowType: string,
  from: Wallet,
  to: Wallet,
  pool: Pool | null,
  asset: Asset,
  amount: BigInt,
): void {
  let id = event.transaction.hash.toHexString() + '-' + event.logIndex.toString();
  let flow = new CapitalFlow(id);
  flow.type = flowType;
  flow.fromWallet = from.id;
  flow.toWallet = to.id;
  if (pool !== null) flow.pool = pool.id;
  flow.amount = amount.toBigDecimal();
  flow.asset = asset.id;
  flow.chain = CHAIN_ID;
  flow.timestamp = event.block.timestamp;
  flow.blockNumber = event.block.number;
  flow.transactionHash = event.transaction.hash;
  flow.save();
}

// Pool events (Deposit/Borrow/Repay/Withdraw/Swap) share the same shape:
// sender → pool, with the pool address as the flow counterpart wallet
// (ADR 006 models the pool's address as the flow counterpart).
function handlePoolFlow(
  event: ethereum.Event,
  flowType: string,
  sender: Address,
  poolAddress: Address,
  token: Address,
  amount: BigInt,
): void {
  let from = getOrCreateWallet(sender);
  let asset = getOrCreateAsset(token);
  let pool = getOrCreatePool(poolAddress, asset);
  createFlow(event, flowType, from, getOrCreateWallet(poolAddress), pool, asset, amount);
}

export function handleDeposit(event: Deposit): void {
  handlePoolFlow(event, 'DEPOSIT', event.params.sender, event.params.pool, event.params.token, event.params.amount);
}

export function handleBorrow(event: Borrow): void {
  handlePoolFlow(event, 'BORROW', event.params.borrower, event.params.pool, event.params.token, event.params.amount);
}

export function handleRepay(event: Repay): void {
  handlePoolFlow(event, 'REPAY', event.params.borrower, event.params.pool, event.params.token, event.params.amount);
}

export function handleWithdraw(event: Withdraw): void {
  handlePoolFlow(event, 'WITHDRAW', event.params.sender, event.params.pool, event.params.token, event.params.amount);
}

export function handleSwap(event: Swap): void {
  handlePoolFlow(event, 'SWAP', event.params.sender, event.params.pool, event.params.tokenIn, event.params.amountIn);
}

export function handleTransfer(event: Transfer): void {
  let from = getOrCreateWallet(event.params.from);
  let to = getOrCreateWallet(event.params.to);
  let asset = getOrCreateAsset(event.params.token);
  createFlow(event, 'TRANSFER', from, to, null, asset, event.params.amount);
}

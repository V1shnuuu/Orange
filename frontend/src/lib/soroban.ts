import {
  Account,
  Contract,
  TransactionBuilder,
  BASE_FEE,
  nativeToScVal,
  scValToNative,
  rpc,
} from '@stellar/stellar-sdk';
import type { NativeToScValOpts } from '@stellar/stellar-sdk';
import { getServer, NETWORK_PASSPHRASE } from './stellar';

export type SignTransactionFn = (xdr: string) => Promise<string>;

// stellar-sdk's per-value type literals for nativeToScVal() aren't exported
// as a standalone type, so this mirrors the scalar subset this app uses.
export type ScalarArgType =
  | 'address'
  | 'symbol'
  | 'string'
  | 'bytes'
  | 'bool'
  | 'i32'
  | 'u32'
  | 'i64'
  | 'u64'
  | 'i128'
  | 'u128';

export interface ContractArg {
  value: unknown;
  type: ScalarArgType;
}

export function arg(value: unknown, type: ScalarArgType): ContractArg {
  return { value, type };
}

const POLL_INTERVAL_MS = 1500;
const CONFIRMATION_TIMEOUT_MS = 30_000;

/**
 * Any well-formed account id works as the source of a read-only simulation:
 * nothing is signed or submitted, so it needs neither a balance nor a real
 * sequence number. Used when no wallet is connected.
 */
const READ_ONLY_SOURCE = 'GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWHF';

function buildArgs(args: ContractArg[]) {
  return args.map(({ value, type }) =>
    nativeToScVal(value, { type: type as NativeToScValOpts['type'] })
  );
}

/**
 * Thrown when the source account doesn't exist on the ledger yet (i.e. it has
 * never been funded). Distinguishes this from other simulation/network
 * failures so the UI can point the user at the testnet friendbot.
 */
export class AccountNotFundedError extends Error {
  constructor(public readonly address: string) {
    super(`Account ${address} is not funded on this network yet.`);
    this.name = 'AccountNotFundedError';
  }
}

/**
 * Reads a contract view function by simulating a call — nothing is signed,
 * submitted, or charged, so this is safe to poll and works with no wallet
 * connected.
 *
 * Returns the decoded native value, or `undefined` when the function returns
 * void. Throws when the simulation itself fails, which for a view function
 * means the contract rejected the arguments.
 */
export async function readContract({
  contractId,
  method,
  args = [],
  sourceAddress,
}: {
  contractId: string;
  method: string;
  args?: ContractArg[];
  sourceAddress?: string;
}): Promise<unknown> {
  const server = getServer();

  // A sequence number is irrelevant to a simulation, so this avoids the
  // network round-trip that fetching the real account would cost.
  const source = new Account(sourceAddress || READ_ONLY_SOURCE, '0');
  const contract = new Contract(contractId);

  const tx = new TransactionBuilder(source, {
    fee: BASE_FEE,
    networkPassphrase: NETWORK_PASSPHRASE,
  })
    .addOperation(contract.call(method, ...buildArgs(args)))
    .setTimeout(30)
    .build();

  const sim = await server.simulateTransaction(tx);

  if (rpc.Api.isSimulationError(sim)) {
    throw new Error(sim.error);
  }

  const retval = (sim as rpc.Api.SimulateTransactionSuccessResponse).result?.retval;
  return retval ? scValToNative(retval) : undefined;
}

/**
 * Builds, simulates, signs (via the connected wallet), submits, and confirms
 * a single Soroban contract invocation. Throws on any failure — simulation
 * error, signing rejection, submission error, on-chain failure, or timeout.
 */
export async function invokeContract({
  contractId,
  method,
  args,
  sourceAddress,
  signTransaction,
}: {
  contractId: string;
  method: string;
  args: ContractArg[];
  sourceAddress: string;
  signTransaction: SignTransactionFn;
}): Promise<{ hash: string; returnValue?: unknown }> {
  const server = getServer();

  let account;
  try {
    account = await server.getAccount(sourceAddress);
  } catch {
    throw new AccountNotFundedError(sourceAddress);
  }

  const contract = new Contract(contractId);
  const operation = contract.call(method, ...buildArgs(args));

  const builtTx = new TransactionBuilder(account, {
    fee: BASE_FEE,
    networkPassphrase: NETWORK_PASSPHRASE,
  })
    .addOperation(operation)
    .setTimeout(60)
    .build();

  // Simulates the call and attaches resources/footprint/auth. Throws if
  // simulation fails (e.g. a contract error like "circle already exists").
  const prepared = await server.prepareTransaction(builtTx);

  const signedXdr = await signTransaction(prepared.toXDR());
  const signedTx = TransactionBuilder.fromXDR(signedXdr, NETWORK_PASSPHRASE);

  const sendResponse = await server.sendTransaction(signedTx);

  if (sendResponse.status === 'ERROR') {
    throw new Error(
      `Transaction rejected by the network: ${sendResponse.errorResult?.toString() ?? 'unknown error'}`
    );
  }

  const hash = sendResponse.hash;
  const deadline = Date.now() + CONFIRMATION_TIMEOUT_MS;

  while (Date.now() < deadline) {
    await new Promise((r) => setTimeout(r, POLL_INTERVAL_MS));
    const result = await server.getTransaction(hash);

    if (result.status === rpc.Api.GetTransactionStatus.SUCCESS) {
      const returnValue = result.returnValue ? scValToNative(result.returnValue) : undefined;
      return { hash, returnValue };
    }

    if (result.status === rpc.Api.GetTransactionStatus.FAILED) {
      throw new Error(`Transaction failed on-chain (hash: ${hash})`);
    }
    // NOT_FOUND — not yet ingested by RPC, keep polling.
  }

  throw new Error(`Timed out waiting for confirmation (hash: ${hash})`);
}

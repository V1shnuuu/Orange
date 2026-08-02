import {
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
  const scArgs = args.map(({ value, type }) =>
    nativeToScVal(value, { type: type as NativeToScValOpts['type'] })
  );
  const operation = contract.call(method, ...scArgs);

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

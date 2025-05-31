export interface FusionOrder {
  readonly id: string;
  readonly maker: string;
  readonly makerAsset: string;
  readonly makerAmount: bigint;
  readonly takerAsset: string;
  readonly takerAmount: bigint;
  readonly srcChainId: string;
  readonly dstChainId: string;
  readonly secretHash: string;
  readonly timeLocks: TimeLockConfig;
  readonly signature: string;
  readonly status: SwapStatus;
  readonly createdAt: Date;
  readonly updatedAt: Date;
  readonly expiresAt: Date;
}

export interface TimeLockConfig {
  srcWithdrawal: number;
  srcPublicWithdrawal: number;
  srcCancellation: number;
  srcPublicCancellation: number;
  dstWithdrawal: number;
  dstPublicWithdrawal: number;
  dstCancellation: number;
}

export enum SwapStatus {
  CREATED = 'created',
  SRC_ESCROW_DEPLOYED = 'src_deployed',
  DST_ESCROW_DEPLOYED = 'dst_deployed',
  ESCROWS_READY = 'escrows_ready',
  SECRET_REVEALED = 'secret_revealed',
  DST_WITHDRAWN = 'dst_withdrawn',
  SRC_WITHDRAWN = 'src_withdrawn',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  FAILED = 'failed',
}

export interface EscrowRecord {
  orderId: string;
  type: 'src' | 'dst';
  chainId: string;
  address: string;
  txHash: string;
  blockNumber: number;
  status: EscrowStatus;
  safetyDeposit: bigint;
  deployedAt: Date;
}

export enum EscrowStatus {
  DEPLOYING = 'deploying',
  DEPLOYED = 'deployed',
  FUNDED = 'funded',
  WITHDRAWN = 'withdrawn',
  CANCELLED = 'cancelled',
}

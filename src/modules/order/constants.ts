export enum OrderStatus {
  PENDING = 'pending',
  ESCROWS_DEPLOYED = 'escrows_deployed',
  SECRET_REVEALED = 'secret_revealed',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled', // This scenario must be not possible in current implementation
  FAILED = 'failed', // This scenario must be not possible in current implementation
}

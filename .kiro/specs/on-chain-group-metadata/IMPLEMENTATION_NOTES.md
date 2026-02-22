# On-Chain Group Metadata - Implementation Notes

## Overview

This document provides implementation notes and guidance for the on-chain group metadata feature.

## Database Migration

The database migration script `scripts/003_add_blockchain_fields.sql` adds three new columns to the `rooms` table:

- `stellar_tx_hash` (TEXT NULL) - Stores the Stellar transaction hash
- `metadata_hash` (TEXT NULL) - Stores the SHA-256 hash of group metadata
- `blockchain_submitted_at` (TIMESTAMPTZ NULL) - Timestamp of blockchain submission

### Applying the Migration

1. Open Supabase Dashboard → SQL Editor
2. Copy contents of `scripts/003_add_blockchain_fields.sql`
3. Execute the SQL script
4. Verify the new columns exist in the `rooms` table

## Environment Configuration

### Required Variables

```env
STELLAR_NETWORK=testnet
STELLAR_SOURCE_SECRET=S...
STELLAR_HORIZON_URL=https://horizon-testnet.stellar.org
```

### Getting a Stellar Testnet Account

1. Visit [Stellar Laboratory](https://laboratory.stellar.org/#account-creator?network=test)
2. Click "Generate keypair"
3. Copy the Secret Key (starts with 'S')
4. Click "Fund account with Friendbot" to get testnet XLM
5. Verify your account has funds on [Stellar Expert](https://stellar.expert/explorer/testnet)

### Optional Configuration

```env
STELLAR_TRANSACTION_TIMEOUT=30000  # Default: 30 seconds
```

## API Endpoints

### POST /api/rooms

Enhanced to include blockchain integration:

**Request:**
```json
{
  "name": "My Group",
  "description": "Group description",
  "is_private": false
}
```

**Response:**
```json
{
  "room": {
    "id": "room_...",
    "name": "My Group",
    "description": "Group description",
    "is_private": false,
    "created_by": "user_id",
    "created_at": "2026-02-22T...",
    "stellar_tx_hash": "abc123...",
    "metadata_hash": "def456..."
  },
  "success": true,
  "blockchain": {
    "submitted": true,
    "transactionHash": "abc123...",
    "explorerUrl": "https://stellar.expert/explorer/testnet/tx/abc123..."
  }
}
```

### GET /api/rooms/[id]/verify

Verifies group metadata against blockchain records:

**Response:**
```json
{
  "groupId": "room_...",
  "currentMetadataHash": "def456...",
  "blockchainMetadataHash": "def456...",
  "transactionHash": "abc123...",
  "verified": true,
  "explorerUrl": "https://stellar.expert/explorer/testnet/tx/abc123..."
}
```

## Error Handling

The system uses graceful degradation:

- If Stellar configuration is missing, blockchain operations are skipped
- If blockchain submission fails, the group is still created
- Transaction hash field will be `null` if blockchain submission fails
- All errors are logged with correlation IDs for tracing

## Logging

All blockchain operations are logged with structured format:

```json
{
  "timestamp": "2026-02-22T...",
  "level": "info",
  "operation": "Blockchain transaction successful",
  "correlationId": "uuid...",
  "context": {
    "groupId": "room_...",
    "metadataHash": "def456...",
    "transactionHash": "abc123...",
    "duration": 1234
  }
}
```

## Testing

### Manual Testing

1. Set up Stellar testnet account (see above)
2. Configure environment variables
3. Create a group via POST /api/rooms
4. Verify the response includes blockchain info
5. Check the transaction on Stellar Expert
6. Call GET /api/rooms/[id]/verify to verify metadata

### Verification

To verify a group's blockchain record:

1. Get the `stellar_tx_hash` from the group record
2. Visit `https://stellar.expert/explorer/testnet/tx/{stellar_tx_hash}`
3. Check the memo field contains the metadata hash
4. Compare with the `metadata_hash` in the database

## Troubleshooting

### Blockchain submission fails

**Symptoms:** Groups are created but `stellar_tx_hash` is null

**Possible causes:**
- Missing or invalid Stellar configuration
- Insufficient XLM balance in source account
- Network connectivity issues
- Stellar testnet is down

**Solutions:**
1. Check environment variables are set correctly
2. Verify source account has XLM balance
3. Check logs for specific error messages
4. Try funding account again with Friendbot

### Transaction timeout

**Symptoms:** Blockchain submission takes too long

**Solutions:**
1. Increase `STELLAR_TRANSACTION_TIMEOUT` value
2. Check network connectivity
3. Verify Stellar Horizon URL is correct

### Verification fails

**Symptoms:** `verified: false` in verification response

**Possible causes:**
- Group metadata was modified after blockchain submission
- Transaction hash is incorrect
- Blockchain transaction not found

**Solutions:**
1. Check if metadata was modified in database
2. Verify transaction exists on Stellar Explorer
3. Check logs for transaction submission errors

## Performance Considerations

- Blockchain operations are asynchronous and non-blocking
- Group creation completes even if blockchain submission fails
- 30-second timeout prevents hanging requests
- Minimal XLM amount (0.0000001) keeps costs low

## Security Notes

- Source account secret is stored in environment variables only
- Never commit `.env.local` to version control
- Metadata hash prevents tampering detection
- Public blockchain provides transparency
- No sensitive user data in blockchain transactions

## Future Enhancements

1. **Mainnet Support:** Switch to Stellar mainnet for production
2. **Batch Transactions:** Submit multiple group hashes in single transaction
3. **Smart Contract Integration:** Use Soroban smart contracts
4. **Verification UI:** Frontend component to display verification status
5. **Webhook Notifications:** Alert on blockchain confirmation

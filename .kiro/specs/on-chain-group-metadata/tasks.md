# Implementation Plan

- [x] 1. Install dependencies and set up testing framework
  - Install @stellar/stellar-sdk for blockchain integration
  - Install fast-check for property-based testing
  - Install jest and @types/jest for unit testing
  - Configure jest.config.js for TypeScript support
  - _Requirements: 4.1, 4.2_

- [ ] 2. Create Metadata Hash Service
  - [x] 2.1 Implement hash computation function
    - Create lib/blockchain/metadata-hash.ts
    - Implement computeHash function using SHA-256
    - Implement canonical JSON serialization (sorted keys)
    - Return hex-encoded hash string
    - _Requirements: 1.1_
  
  - [ ]* 2.2 Write property test for hash determinism
    - **Property 1: Hash computation determinism**
    - **Validates: Requirements 1.1**
  
  - [x] 2.3 Implement hash verification function
    - Add verifyHash function to compare hashes
    - _Requirements: 3.3_
  
  - [ ]* 2.4 Write unit tests for hash service
    - Test with empty strings, special characters, null values
    - Test canonical JSON serialization
    - _Requirements: 1.1_

- [ ] 3. Create Stellar Service
  - [x] 3.1 Implement Stellar configuration loader
    - Create lib/blockchain/stellar-config.ts
    - Read environment variables (STELLAR_NETWORK, STELLAR_SOURCE_SECRET, STELLAR_HORIZON_URL)
    - Implement isConfigured validation function
    - _Requirements: 4.1, 4.2, 4.3, 4.4_
  
  - [x] 3.2 Implement transaction submission function
    - Create lib/blockchain/stellar-service.ts
    - Implement submitMetadataHash function
    - Build transaction with memo field containing hash
    - Use self-payment pattern (minimal amount)
    - Implement 30-second timeout
    - Handle network errors gracefully
    - _Requirements: 1.2, 1.3, 1.4, 2.4_
  
  - [ ]* 3.3 Write property test for transaction structure
    - **Property 2: Transaction structure correctness**
    - **Validates: Requirements 1.2, 1.3**
  
  - [x] 3.4 Implement transaction retrieval function
    - Add getTransaction function to fetch transaction by hash
    - Parse memo field from transaction
    - _Requirements: 3.1, 3.2_
  
  - [ ]* 3.5 Write property test for configuration validation
    - **Property 7: Configuration validation**
    - **Validates: Requirements 4.4, 4.5**
  
  - [ ]* 3.6 Write unit tests for Stellar service
    - Test configuration validation with missing variables
    - Test timeout behavior
    - Test error handling for network failures
    - Mock Stellar SDK calls
    - _Requirements: 2.1, 2.4, 4.5_

- [ ] 4. Update database schema
  - [x] 4.1 Create database migration script
    - Create scripts/003_add_blockchain_fields.sql
    - Add stellar_tx_hash column (TEXT NULL)
    - Add metadata_hash column (TEXT NULL)
    - Add blockchain_submitted_at column (TIMESTAMPTZ NULL)
    - Create index on stellar_tx_hash
    - _Requirements: 1.5_
  
  - [x] 4.2 Apply migration to Supabase
    - Document migration steps in implementation notes
    - _Requirements: 1.5_

- [ ] 5. Enhance Group Creation API
  - [x] 5.1 Update POST /api/rooms endpoint
    - Import metadata hash service and Stellar service
    - After database insert, compute metadata hash
    - Submit hash to Stellar (with error handling)
    - Update group record with transaction hash
    - Add blockchain info to response
    - Implement comprehensive logging
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 2.1, 2.2, 2.3, 2.5, 5.1, 5.2, 5.3, 5.4_
  
  - [ ]* 5.2 Write property test for graceful degradation
    - **Property 4: Graceful degradation on failure**
    - **Validates: Requirements 2.2, 2.3, 2.5**
  
  - [ ]* 5.3 Write property test for database persistence
    - **Property 3: Database persistence**
    - **Validates: Requirements 1.5**
  
  - [ ]* 5.4 Write property test for API response completeness
    - **Property 6: API response completeness**
    - **Validates: Requirements 3.4, 3.5**
  
  - [ ]* 5.5 Write property test for comprehensive logging
    - **Property 8: Comprehensive logging**
    - **Validates: Requirements 5.1, 5.2, 5.3, 5.4**
  
  - [ ]* 5.6 Write unit tests for enhanced API endpoint
    - Test successful group creation with blockchain
    - Test group creation with blockchain failure
    - Test group creation with missing configuration
    - Test response format
    - _Requirements: 2.2, 2.5, 3.4, 3.5_

- [ ] 6. Create Verification API Endpoint
  - [x] 6.1 Implement GET /api/rooms/[id]/verify endpoint
    - Create app/api/rooms/[id]/verify/route.ts
    - Fetch group from database
    - Retrieve transaction from Stellar if hash exists
    - Recompute current metadata hash
    - Compare hashes
    - Return verification response with explorer URL
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_
  
  - [ ]* 6.2 Write property test for verification round-trip
    - **Property 5: Verification round-trip**
    - **Validates: Requirements 3.3**
  
  - [ ]* 6.3 Write unit tests for verification endpoint
    - Test verification with valid transaction hash
    - Test verification with null transaction hash
    - Test verification with tampered metadata
    - Test error handling for invalid group ID
    - _Requirements: 3.1, 3.2, 3.3_

- [ ] 7. Add environment configuration
  - [x] 7.1 Update .env.example file
    - Add STELLAR_NETWORK variable
    - Add STELLAR_SOURCE_SECRET variable
    - Add STELLAR_HORIZON_URL variable
    - Add STELLAR_TRANSACTION_TIMEOUT variable
    - Document each variable
    - _Requirements: 4.1, 4.2, 4.3_
  
  - [x] 7.2 Create configuration documentation
    - Add setup instructions to SETUP.md
    - Document how to obtain Stellar testnet account
    - Document how to fund testnet account
    - _Requirements: 4.1, 4.2, 4.3_

- [ ] 8. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 9. Update TypeScript types
  - [x] 9.1 Create blockchain type definitions
    - Create types/blockchain.ts
    - Define GroupMetadata interface
    - Define StellarTransactionResult interface
    - Define StellarTransaction interface
    - Define VerificationResponse interface
    - Define GroupCreationResponse interface
    - _Requirements: 1.1, 1.4, 3.1, 3.4_

- [ ] 10. Add logging utilities
  - [x] 10.1 Create structured logging helper
    - Create lib/blockchain/logger.ts
    - Implement logBlockchainOperation function
    - Include correlation IDs, timestamps, context
    - Support different log levels (info, warn, error)
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_
  
  - [ ]* 10.2 Write unit tests for logging utilities
    - Test log format structure
    - Test correlation ID generation
    - Test different log levels
    - _Requirements: 5.5_

- [ ] 11. Integration testing
  - [ ]* 11.1 Write integration test for full group creation flow
    - Test end-to-end group creation with blockchain
    - Use actual Stellar testnet
    - Verify database state
    - Verify blockchain transaction
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_
  
  - [ ]* 11.2 Write integration test for verification flow
    - Create group with blockchain record
    - Call verification endpoint
    - Verify response accuracy
    - _Requirements: 3.1, 3.2, 3.3_

- [ ] 12. Final Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

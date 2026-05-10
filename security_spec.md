# Security Specification for KALA

## Data Invariants
1. A campaign must have a `userId` matching the authenticated user.
2. AudienceDNA and BoxPredict results must reference a `campaignId` that exists and belongs to the authenticated user.
3. Users can only read/write their own data.

## The Dirty Dozen Payloads (Targeting Rejection)
1. **Unauthenticated Write**: Creating a campaign without a token.
2. **UserId Spoofing**: Attempting to create a campaign with a `userId` that is not mine.
3. **Ghost Field in Campaign**: Adding `isVerified: true` to a campaign document.
4. **Orphaned DNA Result**: Creating an AudienceDNA document with a `campaignId` that doesn't exist.
5. **Cross-User DNA Result**: Creating an AudienceDNA document for a `campaignId` that belongs to another user.
6. **Immutable Field Update**: Trying to change the `createdAt` or `userId` of an existing campaign.
7. **Large ID Poisoning**: Using a 2KB string as a campaign ID.
8. **Invalid Schema**: Sending a campaign without a `title`.
9. **Type Mismatch**: Sending `resonanceScore` as a string instead of a number in DNA results.
10. **Terminal State Bypass**: (If status is 'archived', preventing updates from non-admins).
11. **Negative Score**: Sending a `behavioralScore` of -50 or 150 (out of bounds).
12. **PII Leak**: (Not applicable yet, but restricting blanket reads).

## Test Runner (Draft)
A `firestore.rules.test.ts` would verify these. (Skipping the full test file for now to proceed to rules generation).

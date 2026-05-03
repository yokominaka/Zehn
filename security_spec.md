# Security Spec

## Data Invariants
1. A Vibe document can only be created by the authenticated user whose `request.auth.uid` matches the `userId` field.
2. A Vibe document can only be updated or deleted by its owner (`userId == request.auth.uid`).
3. Vibe lists can only be queried by the owner where `userId == request.auth.uid`.
4. `createdAt` must be `request.time` during creation, and immutable during update.
5. `updatedAt` must be `request.time` during update.
6. `userId` is immutable.
7. `tone`, `sentiment`, `date` are required strings. `energyLevel` is required number.
8. Unknown or undefined fields are rejected to prevent shadow data.

## The "Dirty Dozen" Payloads
1. **Unauthenticated Read/Write**: Attempt reading or writing to `vibes` without auth.
2. **Identity Spoofing**: Auth as `user_A` but try to create a vibe with `userId: "user_B"`.
3. **Invalid ID**: Attempt to create a vibe with a massive path ID `vibes/{1.5KB_string}`.
4. **Owner Snatching**: Auth as `user_B` and update `userId` field on a doc owned by `user_A`.
5. **Missing Required Fields**: Create a vibe without `tone` or `uiState`.
6. **Data Poisoning (Type Mismatch)**: Create a vibe with `energyLevel="HIGH"` instead of number.
7. **Shadow Field Injection**: Include `isAdmin: true` in the payload.
8. **Time Tampering (Create)**: Provide a `createdAt` value in the past.
9. **Time Tampering (Update)**: Update a doc without `request.time` for `updatedAt`.
10. **Immutable Field Modification**: Change `createdAt` during an update.
11. **Total Array Guarding**: Not applicable directly if no arrays, but we will test string length bounds for `tone` and `sentiment`.
12. **Query Scraping**: Call `.list()` without filtering by `userId == request.auth.uid`.

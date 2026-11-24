# Firestore Security Specification

## 1. Data Invariants
1. **No PII in Analytics**: Analytics events (`events/{eventId}`) contain only anonymous `sessionId`, route `screen`, `eventType`, `eventName`, `label`, `interestCategory`, optional `course`/`metadata`, and server `createdAt`.
2. **Append-Only Telemetry**: Events cannot be updated by anyone (`allow update: if false;`).
3. **Admin-Only Reads & Cleanup**: Only the verified owner account (`sultanawaischeema@gmail.com` with `email_verified == true`) can `get`, `list`, or `delete` stored events.
4. **Strict Server Timestamps**: `createdAt` MUST equal `request.time` on creation.
5. **Bounded Document IDs & Fields**: Every `eventId` must match `^[a-zA-Z0-9_-]+$` (`<= 128` chars), and every string field has strict `.size()` limits and enum constraints.

## 2. Adversarial "Dirty Dozen" Payloads (All Must Fail with PERMISSION_DENIED)
1. **Shadow Field Injection**: Creating `/events/evt_1` with an extra `isAdmin: true` or `phone: "123"` field -> rejected by `keys().hasOnly(...)`.
2. **Missing Required Field**: Creating `/events/evt_1` without `interestCategory` or `sessionId` -> rejected by `keys().hasAll(...)`.
3. **Spoofed Timestamp**: Creating `/events/evt_1` with client timestamp instead of `request.time` -> rejected by `data.createdAt == request.time`.
4. **Oversized String / Resource Poisoning**: `label` > 140 chars or `metadata` > 200 chars -> rejected by `.size()` bounds.
5. **Invalid Enum (`eventType`)**: `eventType: "sql_inject"` -> rejected by enum allowlist.
6. **Invalid Enum (`interestCategory`)**: `interestCategory: "other_hack"` -> rejected by enum allowlist.
7. **ID Poisoning**: Document ID > 128 chars or containing invalid characters -> rejected by `isValidId(eventId)`.
8. **Unauthorized Read (`get`)**: Unauthenticated or non-admin signed-in user reading `/events/evt_1` -> rejected by `isAdmin()`.
9. **Unauthorized List (`list`)**: Unauthenticated or non-admin signed-in user listing `/events` -> rejected by `isAdmin()`.
10. **Email Spoofing Attack**: Signed-in user with matching admin email but `email_verified: false` -> rejected by `request.auth.token.email_verified == true`.
11. **Event Tampering (`update`)**: Any user (even admin) attempting to mutate an existing event -> rejected by `allow update: if false;`.
12. **Unauthorized Delete**: Non-admin attempting to delete `/events/evt_1` -> rejected by `isAdmin()`.

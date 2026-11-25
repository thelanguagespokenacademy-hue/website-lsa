# Firestore Security Specification

## 1. Data Invariants
1. **No PII Storage**: `/visitors/{visitorId}` and `/visitors/{visitorId}/events/{eventId}` never accept emails, phone numbers, names, or form inputs — only persistent deterministic device-bound `visitorId`, `visitorToken`, `sessionId`, route `screen`, `section`, `optionKey`, `eventType`, `eventName`, `label`, `interestCategory`, bounded summaries, non-PII `deviceSummary` (`<= 120` chars), and server timestamps.
2. **Parent Token Ownership Proof**: Creating `/visitors/{visitorId}` establishes an immutable secret `visitorToken`. All subsequent profile updates (`update`) and nested event writes (`/visitors/{visitorId}/events/{eventId}` `create`) MUST present an identical `visitorToken` matching the parent document.
3. **Master Gate & Immutability**: Nested events in `/visitors/{visitorId}/events/{eventId}` require `exists()` on the parent `/visitors/{visitorId}` and matching `visitorToken`, and cannot be updated (`allow update: if false;`).
4. **Admin-Only Reads & Deletions**: Only the verified owner account (`sultanawaischeema@gmail.com` with `email_verified == true`) can `get`, `list`, or `delete` `/visitors/{visitorId}`, `/visitors/{visitorId}/events/{eventId}`, or legacy `/events/{eventId}`. Public reads (`get` and `list`) are strictly denied.
5. **Bounded Arrays & Strict Schemas**: `exploredOptions` is strictly bounded `<= 25` and `visitedScreens` `<= 20` with index-0 type/length checks, every string has explicit `.size()` bounds, `keys().hasAll(...)` + `keys().hasOnly(...)` reject shadow fields, and server timestamps (`request.time`) are mandatory.

## 2. Adversarial "Dirty Dozen" Payloads (All Must Fail with PERMISSION_DENIED)
1. **Shadow Field Injection on Visitor**: Creating or updating `/visitors/usr_abc12345` with extra `isAdmin: true` or `phone: "0348"` -> rejected by `keys().hasOnly(...)` / `affectedKeys().hasOnly(...)`.
2. **Missing Required Field**: Creating `/visitors/usr_abc12345` or nested event without `visitorToken`, `visitorId`, or `interestCategory` -> rejected by `keys().hasAll(...)`.
3. **Token Spoofing on Update**: Updating `/visitors/usr_abc12345` with a mismatched `visitorToken` -> rejected by `incoming().visitorToken == existing().visitorToken`.
4. **Orphaned Event Without Matching Parent Token**: Creating `/visitors/usr_abc12345/events/evt_1` when parent does not exist or has a different `visitorToken` -> rejected by Master Gate `exists()` + `get(...).data.visitorToken == incoming().visitorToken`.
5. **Spoofed Timestamp**: Creating with client-supplied `firstSeenAt`/`createdAt` instead of `request.time` -> rejected by `== request.time`.
6. **Immutable Field Mutation**: Updating `/visitors/usr_abc12345` to change `firstSeenAt`, `visitorId`, or `visitorToken` -> rejected by immutability guards.
7. **Unbounded Array / Resource Poisoning**: Sending `exploredOptions` with > 25 entries, `visitedScreens` with > 20 entries, or `label` > 140 chars -> rejected by `.size()` bounds.
8. **Invalid Enum Values**: Sending `eventType: "admin_override"` or `interestCategory: "hacker"` -> rejected by enum allowlists.
9. **ID Poisoning**: Document ID shorter than 8 chars, > 128 chars, or containing non-slug characters -> rejected by `isValidId()`.
10. **Unauthorized Read / List**: Unauthenticated visitor or non-admin signed-in user calling `get` or `list` on `/visitors` or `/visitors/{id}/events` -> rejected by `isAdmin()`.
11. **Email Spoofing Attack**: Signed-in user claiming admin email with `email_verified == false` -> rejected by `request.auth.token.email_verified == true`.
12. **Event Tampering (`update`)**: Any caller attempting to mutate an already recorded event in `/visitors/{visitorId}/events/{eventId}` -> rejected by `allow update: if false;`.

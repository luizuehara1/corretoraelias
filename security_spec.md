# Firestore Security Specification - RB SOROCABA

## 1. Data Invariants

- **Properties**: Can only be created/modified by admins. Publicly readable.
- **Visits**: Anyone can create a visit. Only admins can list/read all visits.
- **Blocked Slots**: Anyone can read (to know availability). Only admins can create/delete.
- **Property Submissions**: Any authenticated user can submit. Only admins can read/update status.
- **Favorites**: Only the owner of the `userId` document can read or write to their favorites path.
- **Leads**: Anyone can create. Only admins can read.
- **Admins**: This is a system collection. Read-only for checking status.

## 2. The "Dirty Dozen" Payloads (Red Team Test Cases)

1. **Identity Spoofing**: Attempt to write a favorite to another user's ID.
   - Path: `/favorites/attacker_uid/items/property_123`
   - Actor: `request.auth.uid == 'victim_uid'`
   - Expected: PERMISSION_DENIED

2. **Privilege Escalation**: Attempt to delete a property as a non-admin.
   - Path: `/properties/prop_123`
   - Actor: `isSignedIn() && !isAdmin()`
   - Expected: PERMISSION_DENIED

3. **Status Corruption**: Attempt to approve own property submission without being admin.
   - Path: `/property_submissions/sub_123`
   - Payload: `{ status: 'approved' }`
   - Actor: `isSignedIn() && !isAdmin()`
   - Expected: PERMISSION_DENIED

4. **Resource Poisoning**: Attempt to create a visit with a 2MB message.
   - Path: `/visits`
   - Payload: `{ message: 'A'.repeat(2*1024*1024) }`
   - Expected: PERMISSION_DENIED (Size limit)

5. **PII Leak**: Attempt to list all leads as a non-authenticated user.
   - Path: `/leads`
   - Expected: PERMISSION_DENIED

6. **System Field Injection**: Attempt to set `createdAt` to a future date instead of `request.time`.
   - Path: `/properties/prop_123`
   - Payload: `{ createdAt: timestamp_future }`
   - Expected: PERMISSION_DENIED

7. **Orphaned Record**: Attempt to create a favorite for a non-existent property.
   - Path: `/favorites/user_123/items/invalid_id`
   - Expected: PERMISSION_DENIED (Relational check)

8. **Admin Self-Promotion**: Attempt to create an admin record for yourself.
   - Path: `/admins/my_uid`
   - Expected: PERMISSION_DENIED

9. **Terminal State Bypass**: Attempt to update a 'cancelled' visit back to 'pending'.
   - Path: `/visits/visit_123`
   - Expected: PERMISSION_DENIED

10. **Query Scrape**: Attempt to fetch all favorites of all users.
    - Query: `collectionGroup('items')`
    - Expected: PERMISSION_DENIED

11. **Malicious ID**: Attempt to create a property with an ID that is 2KB long.
    - Path: `/properties/[2KB_STRING]`
    - Expected: PERMISSION_DENIED

12. **Timestamp Spoofing**: Attempt to update `updatedAt` without using `request.time`.
    - Path: `/properties/prop_123`
    - Expected: PERMISSION_DENIED

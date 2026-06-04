# Test Coverage Map - Backend Admin Mutation and Household Routes

Derived from current backend behavior in:
- `apps/backend/src/routes/mutations.ts`
- `apps/backend/src/routes/households.ts`

| ID Skenario | Deskripsi | Target | Status |
|---|---|---|---|
| AC-01 | Create mutation for existing citizen with attachment upload | `mutations.ts#POST /` | Covered by unit test |
| AC-02 | Create citizen first when NIK is not found | `mutations.ts#POST /` | Covered by unit test |
| AC-03 | Reject invalid mutation multipart fields | `mutations.ts#POST /` | OK Covered |
| AC-04 | Cleanup uploaded object keys when later upload step fails | `mutations.ts#POST /` | Covered by unit test |
| AC-05 | Reject household create when both head inputs are missing | `households.ts#POST /` | OK Covered |
| AC-06 | Create household with generated head citizen from name | `households.ts#POST /` | Covered by unit test |
| AC-07 | Delete household and clean up citizens only owned by that household | `households.ts#DELETE /:id` | Covered by unit test |

## Success Index
- Coverage map only. Status must be confirmed by `pnpm --filter @abdimas/backend test`.

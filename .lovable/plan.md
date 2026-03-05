

## Problem

The AdminConsole is sending `{ userId, newPassword: "mudar123" }` to the edge function, but `reset-user-password` expects `{ email, newPassword }`. Since `email` is undefined, the function returns a 400 error.

Additionally, the CORS headers are missing some Supabase client headers which could cause preflight failures.

## Plan

### 1. Fix the edge function call in AdminConsole.tsx
Change the `supabase.functions.invoke` call to send `email` instead of `userId`. The email is already available in the search results data.

### 2. Update CORS headers in the edge function
Add the missing Supabase client headers (`x-supabase-client-platform`, etc.) to prevent CORS issues.

### Technical Details
- In `src/pages/AdminConsole.tsx` (~line 137-138): change `body: { userId, newPassword }` to `body: { email: userEmail, newPassword }`, passing the user's email from the search results.
- In `supabase/functions/reset-user-password/index.ts` (line 4-5): update `corsHeaders` to include the full set of Supabase client headers.


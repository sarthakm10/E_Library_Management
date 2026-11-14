# Demo accounts

Logins for trying the app. These are **sample accounts for local use only**. Change the admin password, or turn sample data off, before putting the library anywhere public.

## Admin

Sign in at **/admin/login**.

| Username | Password | Notes |
|---|---|---|
| `admin` | `admin123` | Starter admin, created by `schema.sql` on every start if it doesn't exist |

## Members (MySQL and Docker)

Sign in at **/login**. Every sample member has the password **`reader123`**.

| Member ID | Name | Status | What you'll see |
|---|---|---|---|
| `aarav01` | Aarav Mehta | Active | One book **6 days overdue** with a fine adding up, one renewed loan due in 2 days, an **unpaid fine** from a late return, and a place in a hold queue |
| `diya02` | Diya Patel | Active | Two loans (one **1 day overdue**), a paid fine in history, **first in line** for a book Kabir has |
| `kabir03` | Kabir Singh | Active | Has the only copy of a book two people are waiting for, so **renewal is blocked**. Has an unpaid fine of ₹50 |
| `meera04` | Meera Nair | Active | A **hold that's ready to collect**, one loan, and a clean history |
| `rohan05` | Rohan Gupta | Pending | Can sign in and browse; the desk can't lend to him until an admin activates the account |
| `sana06` | Sana Khan | Deactivated | Can't sign in until an admin reactivates the account |

Loan dates are set relative to the day the data was seeded, so there is always something overdue, due soon, and ready to collect.

### When the sample members are created

The API fills the database on start-up (`DataSeeder`):

1. **Books**: the 300-book catalog loads when the books, authors and publishers tables are all empty.
2. **Members**: the six members above, with their loans, history and holds, load when there are no loans, history or holds yet and none of these member IDs exist. Members who signed up themselves are left as they are.

Each step runs once per database. To skip both, set `APP_SEED_SAMPLE_DATA=false`.

## Members (in-memory demo profile)

When the API runs with `--spring.profiles.active=demo` (H2, no MySQL needed), it uses a smaller data set with password **`demo123`**:

| Member ID | Status |
|---|---|
| `rahul01` | Active |
| `priya02` | Pending |
| `amit03` | Active |
| `sneha04` | Deactivated |

## Lending rules

| Rule | Default | Setting |
|---|---|---|
| Loan length | 14 days | `app.default-loan-days` |
| Late fine | ₹5 per day | `APP_FINE_PER_DAY` |
| Renewals per loan | 2, each adding 14 days | `APP_MAX_RENEWALS` |
| Time to collect a ready hold | 3 days | `APP_HOLD_PICKUP_DAYS` |
| Holds per member | 5 | |

A loan can't be renewed if it's overdue, has reached the renewal limit, or someone is waiting for the book.

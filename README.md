# Shelfwise E-Library

A modern rewrite of the E-Library Management system:

| Folder | What it is |
| --- | --- |
| `client/` | React 18 + TypeScript + Vite + Tailwind CSS front end |
| `server/` | Java 21 + Spring Boot 3 REST API (JWT auth) |
| `server/book_inventory/` | Book cover images, served at `/book_inventory/...` |
| `server/db/` | Generator script for the 300-book catalog seed, and the SQL Server upgrade script |
| `docker-compose.yml` | Runs MySQL, the API and the website together |
| `DEMO_ACCOUNTS.md` | Admin and sample member logins |

It replaces the original ASP.NET Web Forms app, which is still in the git history (commit `977fcbc`). The API uses the same tables and columns as that app, so it can also run against the original SQL Server `elibraryDB` with no data migration.

## Quickest start: Docker

With [Docker Desktop](https://www.docker.com/products/docker-desktop/) installed, run this from the repository root:

```bash
docker compose up --build
```

Then open http://localhost:3000. This starts MySQL, the API and the website. On first start the database fills itself with the 300-book catalog and six sample members who have loans, fines and holds. The logins are in [DEMO_ACCOUNTS.md](DEMO_ACCOUNTS.md); the admin is **admin / admin123**.

Data is kept in Docker volumes between runs. `docker compose down -v` wipes it, and the next start seeds a fresh library. To change the MySQL password, JWT secret or port, copy `.env.example` to `.env`.

## Run on a new computer without Docker (Windows)

You need four programs. You don't need Maven, because the project includes `mvnw`, which downloads Maven for you.

### 1. Install the tools (one time)

| Tool | Version | Download |
| --- | --- | --- |
| Git | any | https://git-scm.com/download/win |
| Java JDK | **21** | https://adoptium.net/temurin/releases/?version=21 (tick *Set JAVA_HOME* in the installer) |
| Node.js | 20 or newer (LTS) | https://nodejs.org |
| MySQL Server | 8.x | https://dev.mysql.com/downloads/installer/ (choose *Server only*, and note the **root password** you set) |

Or install the first three from PowerShell with winget:

```powershell
winget install Git.Git
winget install EclipseAdoptium.Temurin.21.JDK
winget install OpenJS.NodeJS.LTS
```

Close and reopen PowerShell afterwards, then check that everything is found:

```powershell
git --version
java -version      # should say 21
node -v
mysql --version    # if "not recognized", use the full path: & "C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe"
```

### 2. Get the code

```powershell
git clone https://github.com/sarthakm10/E_Library_Management.git
cd E_Library_Management
```

### 3. Create the database

```powershell
mysql -u root -p -e "CREATE DATABASE elibraryDB CHARACTER SET utf8mb4"
```

Enter your MySQL root password when asked. You only need to create the empty database. The API creates the tables and loads the books and sample members itself.

### 4. Tell the API your MySQL password

```powershell
copy server\.env.example server\.env
notepad server\.env
```

In Notepad, put your MySQL root password after `DB_PASSWORD=`, then save. Don't use quotes.

### 5. Start the API (terminal 1)

```powershell
cd server
.\mvnw spring-boot:run
```

The first run takes a few minutes while it downloads its dependencies. It's ready when you see `Started ElibraryApplication`. On this first start it also prints `Seeded the catalog: 300 books` and `Seeded 6 sample members`. Leave this window open.

### 6. Start the website (terminal 2)

Open a second PowerShell window in the `E_Library_Management` folder:

```powershell
cd client
npm install
npm run dev
```

### 7. Open it

Go to http://localhost:5173. The logins are in [DEMO_ACCOUNTS.md](DEMO_ACCOUNTS.md):
- **Admin:** `admin` / `admin123`
- **Members:** for example `aarav01` / `reader123`

### Next time

You only need steps 5 and 6. Run `.\mvnw spring-boot:run` in `server`, then `npm run dev` in `client`. Run `npm install` again only after pulling changes to `package.json`.

### If something goes wrong

| Problem | Fix |
| --- | --- |
| `JAVA_HOME is not set` or the wrong Java version | Set it to the JDK 21 folder, e.g. `setx JAVA_HOME "C:\Program Files\Eclipse Adoptium\jdk-21..."`, then reopen PowerShell |
| `Access denied for user 'root'` | Wrong password in `server\.env` |
| `Unknown database 'elibraryDB'` | Step 3 was skipped |
| `Port 8080 was already in use` | Another copy of the API is running. Close it, or stop it with `Get-Process java \| Stop-Process` |
| Site loads but shows no books or "network error" | The API (terminal 1) isn't running or hasn't finished starting |
| Running scripts is disabled (`npm.ps1`) | Run `Set-ExecutionPolicy -Scope CurrentUser RemoteSigned` once, or use `npm.cmd` |

## Quick start (demo data, no database needed)

The `demo` profile runs the API against an in-memory database with sample books, members and loans.

```bash
cd server
./mvnw spring-boot:run -Dspring-boot.run.profiles=demo
```

In a second terminal:

```bash
cd client
npm install
npm run dev
```

Open http://localhost:5173.

Demo accounts (from `server/src/main/resources/db/demo/data.sql`):

| Role | ID | Password |
| --- | --- | --- |
| Admin | `admin` | `admin123` |
| Member (active) | `rahul01` | `demo123` |
| Member (pending) | `priya02` | `demo123` |

See [DEMO_ACCOUNTS.md](DEMO_ACCOUNTS.md) for every login.

## Running against MySQL (default)

1. Create the database:

   ```bash
   mysql -u root -p -e "CREATE DATABASE elibraryDB CHARACTER SET utf8mb4"
   ```

2. Copy `server/.env.example` to `server/.env` and fill in your MySQL password (the file is git-ignored).
3. Start the API:

   ```bash
   cd server
   ./mvnw spring-boot:run
   ```

   On first start the API sets everything up by itself:
   - creates the tables (`server/src/main/resources/db/mysql/schema.sql`) and a starter admin, **admin / admin123** (change that password after you sign in);
   - adds the newer tables for borrowing history and holds, and the renewal counter (`SchemaUpgrader`);
   - if the library is empty, loads the 300-book catalog (`db/seed/catalog.sql`; the covers are already in `server/book_inventory/`), then six sample members with loans, fines and holds (`DataSeeder`). Their logins are in [DEMO_ACCOUNTS.md](DEMO_ACCOUNTS.md).

   Each seeding step runs only once per database and never touches existing data. Set `APP_SEED_SAMPLE_DATA=false` to start with an empty library. To change the book list or re-fetch covers from Open Library, edit and run `python server/db/seed_books.py`, which rewrites `catalog.sql`.

## Running against the original SQL Server database (`sqlserver` profile)

Add `--spring.profiles.active=sqlserver` (e.g. `.\mvnw spring-boot:run "-Dspring-boot.run.profiles=sqlserver"`) and follow these steps:

1. **Upgrade the password columns (one time).** Run `server/db/sqlserver-upgrade.sql` in SSMS. It widens the `password` columns so bcrypt hashes fit. Existing plain-text passwords keep working, and each one is replaced by a hash the next time that user signs in. Until you run it, the API logs a warning and keeps storing passwords in plain text, like the old app. The history and holds tables are added automatically on start-up, so this script isn't needed for them.

2. **Enable a SQL login.** The JDBC driver can't use Windows "Integrated Security" without an extra native DLL, so a SQL login is the simplest option:
   - In SSMS: Server Properties → Security → *SQL Server and Windows Authentication mode*, then restart the service.
   - Create a login, for example `elibrary_app`, with `db_datareader` and `db_datawriter` on `elibraryDB`.
   - In *SQL Server Configuration Manager*, make sure TCP/IP is enabled for `SQLEXPRESS` and the **SQL Server Browser** service is running, because named instances need it.

3. **Start the API with your connection details:**

   ```powershell
   $env:DB_USERNAME = "elibrary_app"
   $env:DB_PASSWORD = "<your password>"
   $env:APP_JWT_SECRET = "<any random string of 32+ characters>"
   cd server; ./mvnw spring-boot:run
   ```

   The default URL is `jdbc:sqlserver://localhost\SQLEXPRESS;databaseName=elibraryDB;...`. Override it with `DB_URL` if your server differs.

### Configuration

| Variable | Default | Purpose |
| --- | --- | --- |
| `DB_URL` / `DB_USERNAME` / `DB_PASSWORD` | local MySQL `elibraryDB` as `root` | Database connection (set them in `server/.env`) |
| `APP_JWT_SECRET` | dev-only value (logs a warning) | Signs login tokens. **Set this outside local dev.** |
| `APP_UPLOAD_DIR` | `book_inventory` (relative to where the API starts, i.e. `server/`) | Where cover images are read from and saved to |
| `APP_CORS_ORIGINS` | `http://localhost:5173` | Browser origins allowed to call the API |
| `APP_FINE_PER_DAY` | `5` | Late fine in ₹ per day |
| `APP_MAX_RENEWALS` | `2` | Renewals allowed per loan (each adds 14 days) |
| `APP_HOLD_PICKUP_DAYS` | `3` | Days a member has to collect a ready hold |
| `APP_SEED_SAMPLE_DATA` | `true` | Load the catalog and sample members into an empty database |

## What changed compared to the old app

**Security fixes**
- Every query is parameterised. The old login, lookup and delete queries built SQL by string concatenation, so anyone could log in as anyone with `' OR '1'='1`.
- Passwords are hashed with bcrypt, and the old plain-text ones are upgraded automatically on login.
- Admin pages are protected on the server, not just hidden in the menu. Each API call checks the signed-in role.
- Deactivated accounts can no longer sign in. The old code saved the literal text `"dr.GetValue(10).ToString()"` as the status, so the check never worked.
- Cover uploads accept only real images (content is checked) and are saved under random names.

**Behaviour fixes**
- Issuing a book takes the copy off the shelf and records the loan in one transaction, so stock can't drift. Issuing the last copy is safe even if two people try at once.
- Books can only be issued to **active** members.
- Saving your profile no longer resets your account to "pending".
- Renaming an author or publisher updates the books that use it. Deleting one that is still in use, or a member or book with loans out, is refused with a clear message.

**New features**
- Public landing page and a searchable, filterable catalog with book detail views.
- Multi-step signup with validation, plus a member profile page with loan due-date countdowns and a password change form.
- Admin dashboard with charts, overdue and due-soon lists, and one-click approval of new members.
- Issue desk with search-as-you-type pickers (title, author, name, phone or ID), the selected member's or book's loans with one-click return, and a clear reason when an issue isn't allowed.
- **Renewals**: members renew from their profile, and the desk renews from the loans table. Up to 2 renewals per loan, each adding 14 days. A loan can't be renewed when it's overdue or someone is waiting for the book.
- **Holds**: when every copy is out, members place a hold from the book page and see their place in line. A returned copy goes to the next person in line and is kept aside for 3 days. If they don't collect it, it passes to the next person.
- **Late fines**: ₹5 per day late. Members see the fine growing on overdue loans. The issue desk warns about unpaid fines, and admins mark fines paid on the **History & fines** page.
- **Borrowing history**: every return is recorded with its dates, renewals and fine. Members see their own history on their profile page; admins see everyone's.
- Sortable, searchable tables; drag-and-drop cover upload; light and dark mode; works on phones.

## API overview

| Method | Path | Access |
| --- | --- | --- |
| POST | `/api/auth/login`, `/api/auth/admin/login`, `/api/auth/signup` | Public |
| GET | `/api/auth/me` | Signed in |
| GET | `/api/books`, `/api/books/{id}`, `/api/authors`, `/api/publishers`, `/api/stats` | Public |
| GET/PUT | `/api/me/profile`, PUT `/api/me/password`, GET `/api/me/issues` | Member |
| POST | `/api/me/issues/{bookId}/renew` | Member |
| GET/POST/DELETE | `/api/me/holds[/{bookId}]`, GET `/api/me/history` | Member |
| POST/PUT/DELETE | `/api/admin/books[/{id}]`, POST `/api/admin/uploads` | Admin |
| POST/PUT/DELETE | `/api/admin/authors[/{id}]`, `/api/admin/publishers[/{id}]` | Admin |
| GET/PATCH/DELETE | `/api/admin/members[/{id}]`, PATCH `/api/admin/members/{id}/status` | Admin |
| GET/POST | `/api/admin/issues`, GET `/api/admin/issues/lookup`, POST `/api/admin/issues/return`, POST `/api/admin/issues/renew` | Admin |
| GET/DELETE | `/api/admin/holds[/{memberId}/{bookId}]` | Admin |
| GET/PATCH | `/api/admin/history`, PATCH `/api/admin/history/{id}/paid` | Admin |
| GET | `/api/admin/dashboard` | Admin |

## Building for production

```bash
cd client && npm run build              # static files in client/dist
cd server && ./mvnw -DskipTests package # runnable jar in server/target
```

Serve `client/dist` from any static host or reverse proxy, and route `/api` and `/book_inventory` to the Spring Boot jar. The Docker setup does exactly this: `client/docker/nginx.conf` serves the site and forwards those paths to the API container.

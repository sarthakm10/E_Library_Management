# Shelfwise E-Library

A modern rewrite of the E-Library Management system:

| Folder | What it is |
| --- | --- |
| `client/` | React 18 + TypeScript + Vite + Tailwind CSS front end |
| `server/` | Java 21 + Spring Boot 3 REST API (JWT auth) |
| `E_Library_Management/` | The original ASP.NET Web Forms app (left untouched) |

The API talks to your **existing `elibraryDB` SQL Server database**, using the same tables and columns as the old app, so no data migration is needed. Both apps can run side by side, and they share the `book_inventory/` cover images folder.

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

## Running against MySQL (default)

1. In MySQL Workbench: `CREATE DATABASE elibraryDB;`
2. Start the API with your MySQL credentials (PowerShell):

   ```powershell
   cd server
   $env:DB_USERNAME = "root"
   $env:DB_PASSWORD = "<your MySQL password>"
   $env:APP_JWT_SECRET = "<any random text, 32+ characters>"
   .\mvnw spring-boot:run
   ```

The tables are created automatically on first start (`server/src/main/resources/db/mysql/schema.sql`), along with a starter admin account, **admin / admin123**. Sign in as that admin, then add authors, publishers and books.

## Running against the original SQL Server database (`sqlserver` profile)

Add `--spring.profiles.active=sqlserver` (e.g. `.\mvnw spring-boot:run "-Dspring-boot.run.profiles=sqlserver"`) and follow these steps:

1. **Upgrade the password columns (one time).** Run `server/db/sqlserver-upgrade.sql` in SSMS. It widens the `password` columns so bcrypt hashes fit. Existing plain-text passwords keep working, and each one is replaced by a hash the next time that user signs in. Until you run it, the API logs a warning and keeps storing passwords in plain text, like the old app.

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
| `DB_URL` / `DB_USERNAME` / `DB_PASSWORD` | local `SQLEXPRESS` | Database connection |
| `APP_JWT_SECRET` | dev-only value (logs a warning) | Signs login tokens. **Set this outside local dev.** |
| `APP_UPLOAD_DIR` | `../E_Library_Management/book_inventory` | Where cover images are read from and saved to |
| `APP_CORS_ORIGINS` | `http://localhost:5173` | Browser origins allowed to call the API |

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
- Issue desk that looks up book and member names as you type and explains why an issue isn't allowed.
- Sortable, searchable tables; drag-and-drop cover upload; light and dark mode; works on phones.

## API overview

| Method | Path | Access |
| --- | --- | --- |
| POST | `/api/auth/login`, `/api/auth/admin/login`, `/api/auth/signup` | Public |
| GET | `/api/auth/me` | Signed in |
| GET | `/api/books`, `/api/books/{id}`, `/api/authors`, `/api/publishers`, `/api/stats` | Public |
| GET/PUT | `/api/me/profile`, PUT `/api/me/password`, GET `/api/me/issues` | Member |
| POST/PUT/DELETE | `/api/admin/books[/{id}]`, POST `/api/admin/uploads` | Admin |
| POST/PUT/DELETE | `/api/admin/authors[/{id}]`, `/api/admin/publishers[/{id}]` | Admin |
| GET/PATCH/DELETE | `/api/admin/members[/{id}]`, PATCH `/api/admin/members/{id}/status` | Admin |
| GET/POST | `/api/admin/issues`, GET `/api/admin/issues/lookup`, POST `/api/admin/issues/return` | Admin |
| GET | `/api/admin/dashboard` | Admin |

## Building for production

```bash
cd client && npm run build              # static files in client/dist
cd server && ./mvnw -DskipTests package # runnable jar in server/target
```

Serve `client/dist` from any static host or reverse proxy, and route `/api` and `/book_inventory` to the Spring Boot jar.

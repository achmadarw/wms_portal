# Database Setup Instructions for Windows

## Option 1: Install PostgreSQL (Recommended)

### 1. Download & Install PostgreSQL

1. Go to https://www.postgresql.org/download/windows/
2. Download PostgreSQL installer
3. Run installer with these settings:
   - Password for postgres user: `postgres` (or your choice)
   - Port: 5432 (default)
   - Locale: [Your locale]

### 2. Verify Installation

Open Command Prompt and run:
```cmd
psql --version
```

### 3. Create Database

```cmd
psql -U postgres
```

Inside PostgreSQL prompt:
```sql
CREATE DATABASE wms_db;
\q
```

### 4. Update .env.local

Edit `d:/WORKSPACE/PROJECT/wms/.env.local`:
```env
DATABASE_URL="postgresql://postgres:your_password@localhost:5432/wms_db"
```

### 5. Run Migrations

```bash
cd d:/WORKSPACE/PROJECT/wms
npm run prisma:migrate
```

---

## Option 2: Docker (If PostgreSQL Not Available)

### 1. Install Docker Desktop
https://www.docker.com/products/docker-desktop

### 2. Run PostgreSQL Container

```bash
docker run --name wms_postgres \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=wms_db \
  -p 5432:5432 \
  -d postgres:15
```

### 3. Update .env.local
```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/wms_db"
```

### 4. Run Migrations
```bash
cd d:/WORKSPACE/PROJECT/wms
npm run prisma:migrate
```

---

## Option 3: SQLite (For Quick Testing)

If you don't want to setup PostgreSQL, use SQLite for development:

### 1. Update `prisma/schema.prisma`

Change:
```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

To:
```prisma
datasource db {
  provider = "sqlite"
  url      = env("DATABASE_URL")
}
```

### 2. Update .env.local

```env
DATABASE_URL="file:./dev.db"
```

### 3. Run Migrations

```bash
cd d:/WORKSPACE/PROJECT/wms
npm run prisma:migrate
```

---

## Troubleshooting

### PostgreSQL Service Not Running

**Windows:**
```cmd
# Start PostgreSQL service
net start postgresql-x64-15

# Or search "Services" in Windows and start "postgresql-15"
```

### Connection Refused Error

- Ensure PostgreSQL is running
- Check username/password in DATABASE_URL
- Verify port 5432 is accessible

### Port 5432 Already in Use

```bash
# Find process using port 5432
netstat -ano | findstr :5432

# Kill the process
taskkill /PID <PID> /F
```

---

## Next Steps

After setting up database:

```bash
cd d:/WORKSPACE/PROJECT/wms
npm run prisma:migrate
npm run dev
```

Then open: http://localhost:3000

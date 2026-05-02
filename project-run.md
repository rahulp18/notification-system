# 🚀 How to Run the Project

Follow the steps below to set up and run the project locally.

---

## 📦 1. Install Dependencies

```bash
yarn install
```

---

## 🐳 2. Start Database (Docker)

Make sure Docker Desktop is installed and running on your machine.

```bash
docker compose up -d
```

---

## 🧠 3. Enable pgvector Extension (ONE TIME SETUP)

This step is required **only once**, unless you remove the Docker volume using `docker compose down -v`.

### Connect to the database:

```bash
docker exec -it notification_pg psql -U postgres -d notification_db
```

### Run:

```sql
CREATE EXTENSION IF NOT EXISTS vector;
```

### Exit:

```bash
\q
```

---

## ⚙️ 4. Environment Setup

Create a `.env` file in the root directory and add:

```env
DATABASE_URL="postgresql://postgres:root@localhost:5434/notification_db"
```

---

## ▶️ 5. Start the Application

```bash
yarn start:dev
```

---

## ⚠️ Important Notes

- If you run:

```bash
docker compose down -v
```

👉 This will delete:

- Database
- Tables
- Extensions

You must repeat **Step 3** again.

---

## ✅ You're Ready!

Your project is now up and running 🚀

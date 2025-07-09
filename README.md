# Gym API

This is the backend API for the Gym Admin Panel. Built with **Node.js**, **Express**, and **Prisma**, it handles authentication, member management, billing, device tracking, and scheduling. It uses a modular architecture for scalability and maintainability.

## 🔧 Tech Stack

- **Node.js** + **Express** — Server-side framework
- **PostgreSQL** — Primary database
- **Prisma** — Type-safe ORM for PostgreSQL
- **TypeScript** — Static typing
- **dotenv** — Environment variable management
- **CORS** — Cross-origin access
- **Joi / Zod** *(optional)* — For request validation

## 📁 Project Structure

/gym-api/
├── prisma/ # Prisma schema and migrations
│ └── schema.prisma
├── src/
│ ├── routes/ # All API routes
│ │ ├── auth.routes.ts
│ │ ├── member.routes.ts
│ │ ├── billing.routes.ts
│ │ ├── device.routes.ts
│ │ └── schedule.routes.ts
│ ├── controllers/ # Request handlers
│ ├── services/ # Business logic
│ ├── models/ # Database models/types
│ ├── middlewares/ # Auth, error handling, validation
│ ├── utils/ # Helper functions
│ ├── config/ # App config (DB, server, etc.)
│ ├── jobs/ # Cron jobs (e.g., billing retries)
│ └── app.ts # Main Express app
├── .env.example
├── package.json
└── README.md


## 🚀 Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/your-username/gym-api.git
cd gym-api
npm install
cp .env.example .env
Fill in your database URL and other secrets.
npx prisma generate
npx prisma migrate dev --name init
npm run dev

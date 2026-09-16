# 🏦 Banking Ledger System — Backend REST API

Hit at : https://banking-ledger-system-8w2m.onrender.com/

A robust, enterprise-grade banking ledger and financial transaction backend built with **Node.js**, **Express.js**, **TypeScript**, and **MongoDB (Mongoose)**. Designed with **Double-Entry Bookkeeping**, **ACID Transactions**, **Idempotency Safeguards**, **JWT Authentication with Token Blacklisting**, **OAuth2 Email Alerts**, and **Rate Limiting**.

---

## 📸 System Overview

| Working Demo & Flow |
|:---:|
| ![Working Example](images/WorkingExample.png) |

---

## 🛠️ Tech Stack

- **Runtime:** Node.js (ES Modules)
- **Framework:** Express.js (v5)
- **Language:** TypeScript
- **Database & ORM:** MongoDB & Mongoose
- **Authentication:** JWT (HTTP-Only Cookies & Bearer Tokens) + Bcrypt
- **Security:** Helmet, Express Rate Limiter, Token Blacklisting
- **Notifications:** Nodemailer (Google OAuth2 SMTP)
- **Architecture:** Double-Entry Ledger with MongoDB Multi-Document ACID Transactions

---

## ✨ Features

- 🔐 **Secure Authentication** — User registration & login with Bcrypt password hashing and JWT sessions.
- 🚫 **Token Blacklist & Invalidation** — Secure logout invalidating tokens in a TTL-indexed MongoDB collection (auto-expires after 3 days).
- 🛡️ **Multi-Tier Rate Limiting** — Global API limiter (100 req / 15 min) and strict login limiter (10 attempts / 15 min) with Draft-8 headers.
- 📒 **Double-Entry Ledger Architecture** — Every financial movement records strictly immutable paired `DEBIT` and `CREDIT` entries.
- ⚡ **Atomic Multi-Document ACID Transactions** — MongoDB sessions guarantee consistency: if any step fails, changes are completely rolled back.
- 🔁 **Idempotency Protection** — Unique idempotency keys prevent duplicate debits from network retries or multiple clicks.
- 📊 **Real-Time Dynamic Balance Calculation** — Account balances are computed dynamically on-the-fly using high-performance MongoDB aggregation pipelines (`Total Credits - Total Debits`).
- 👑 **System User / Admin Initial Funding** — Admin endpoint to inject initial capital into accounts safely.
- 📧 **Automated Email Notifications** — Real-time email alerts for registration, login events, transaction completions, and failures via Nodemailer with OAuth2.

---

## 📦 Installation

```bash
# Clone the repository
git clone <https://github.com/Codevesh090/Banking-Ledger-System.git>
cd Banking-Ledger-System

# Install dependencies
npm install
```

---

## ⚙️ Environment Setup

Create a `.env` file in the root directory of the project:

```env
PORT=3000
MONGO_URI="mongodb+srv://<username>:<password>@cluster0.mongodb.net/banking_ledger?retryWrites=true&w=majority"
SECRET_KEY="your_super_secret_jwt_key_here"

# Google OAuth2 Credentials for Email Notifications
EMAIL_USER="your-email@gmail.com"
CLIENT_ID="your_google_oauth_client_id"
CLIENT_SECRET="your_google_oauth_client_secret"
REFRESH_TOKEN="your_google_oauth_refresh_token"
```

### Environment Variables Guide

| Variable | Description |
|---|---|
| `PORT` | Port number the Express server listens on (e.g. `3000`) |
| `MONGO_URI` | MongoDB connection URI (must support replica sets / transactions) |
| `SECRET_KEY` | Secret key used to sign and verify JSON Web Tokens (JWT) |
| `EMAIL_USER` | Gmail address used as the sender for transaction & security emails |
| `CLIENT_ID` | Google Cloud OAuth2 Client ID |
| `CLIENT_SECRET` | Google Cloud OAuth2 Client Secret |
| `REFRESH_TOKEN` | Google Cloud OAuth2 Refresh Token for Gmail API |

---

## 🚀 Running the Project

```bash
# Build TypeScript to JavaScript
npm run build

# Run in development mode (with nodemon)
npm run dev

# Run in production mode
npm start
```

---

## 📡 API Endpoints Overview

### 1. Health Check
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `GET` | `/` | ❌ None | Check if the ledger service is running |

### 2. Authentication (`/api/auth`)
| Method | Endpoint | Auth | Rate Limit | Description |
|---|---|---|---|---|
| `POST` | `/api/auth/register` | ❌ None | Standard | Register a new user |
| `POST` | `/api/auth/login` | ❌ None | 10 req / 15m | Login user & receive JWT token/cookie |
| `POST` | `/api/auth/logout` | ✅ Token | Standard | Logout user & blacklist JWT token |

### 3. Accounts (`/api/account`)
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `POST` | `/api/account/` | ✅ User | Create a new bank account for the authenticated user |
| `GET` | `/api/account/balance/:accountId` | ✅ User | Get dynamic balance calculated from ledger entries |

### 4. Transactions & Ledger (`/api/transaction`)
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `POST` | `/api/transaction/` | ✅ User | Transfer funds between accounts (with ACID + Idempotency) |
| `POST` | `/api/transaction/system/initial-funds` | ✅ System User (Admin) | Deposit initial funds into an account |

---

## 🧪 Complete API Testing Guide (cURL & Postman)

Set base URL variable: `http://localhost:3000`

---

### 1. Register a New User

Creates a new user profile and sends a welcome confirmation email.

* **Method:** `POST`
* **URL:** `http://localhost:3000/api/auth/register`
* **Headers:** `Content-Type: application/json`

#### cURL Request:
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Alice Johnson",
    "email": "alice@example.com",
    "password": "securePassword123"
  }'
```

#### Example Response (`201 Created`):
```json
{
  "user": {
    "_id": "65f01234abcd5678ef000001",
    "email": "alice@example.com",
    "name": "Alice Johnson"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

---

### 2. User Login

Authenticates the user, sets an `accessToken` cookie, and returns a JWT token.

* **Method:** `POST`
* **URL:** `http://localhost:3000/api/auth/login`
* **Headers:** `Content-Type: application/json`

#### cURL Request:
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "alice@example.com",
    "password": "securePassword123"
  }'
```

#### Example Response (`200 OK`):
```json
{
  "user": {
    "_id": "65f01234abcd5678ef000001",
    "email": "alice@example.com",
    "name": "Alice Johnson"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

---

### 3. User Logout & Token Invalidation

Invalidates the JWT token by storing it in the database blacklist.

* **Method:** `POST`
* **URL:** `http://localhost:3000/api/auth/logout`
* **Headers:**
  * `Authorization: Bearer <YOUR_JWT_TOKEN>`
  * `Content-Type: application/json`

#### cURL Request:
```bash
curl -X POST http://localhost:3000/api/auth/logout \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json"
```

#### Example Response (`200 OK`):
```json
{
  "message": "User Logged out successfully"
}
```

---

### 4. Create Bank Account

Creates a new bank ledger account linked to the authenticated user.

* **Method:** `POST`
* **URL:** `http://localhost:3000/api/account/`
* **Headers:**
  * `Authorization: Bearer <YOUR_JWT_TOKEN>`
  * `Content-Type: application/json`

#### cURL Request:
```bash
curl -X POST http://localhost:3000/api/account/ \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json"
```

#### Example Response (`201 Created`):
```json
{
  "account": {
    "_id": "65f05678abcd1234ef000002",
    "userId": "65f01234abcd5678ef000001",
    "status": "ACTIVE",
    "currency": "INR",
    "createdAt": "2026-09-16T15:00:00.000Z",
    "updatedAt": "2026-09-16T15:00:00.000Z"
  }
}
```

---

### 5. Deposit Initial Funds (Admin / System User)

Allows the System User (Admin) to initialize funds into a user's account.

* **Method:** `POST`
* **URL:** `http://localhost:3000/api/transaction/system/initial-funds`
* **Headers:**
  * `Authorization: Bearer <SYSTEM_USER_JWT_TOKEN>`
  * `Content-Type: application/json`

#### cURL Request:
```bash
curl -X POST http://localhost:3000/api/transaction/system/initial-funds \
  -H "Authorization: Bearer SYSTEM_USER_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "toAccount": "65f05678abcd1234ef000002",
    "amount": 5000,
    "idempotencyKey": "init-fund-uuid-001"
  }'
```

#### Example Response (`201 Created`):
```json
{
  "message": "Initial funds transaction completed successfully",
  "transaction": {
    "_id": "65f09999abcd1234ef000003",
    "fromAccount": "65f00000abcd1234ef000000",
    "toAccount": "65f05678abcd1234ef000002",
    "amount": 5000,
    "idempotencyKey": "init-fund-uuid-001",
    "status": "COMPLETED"
  }
}
```

---

### 6. Transfer Funds (User to User)

Transfers money between two accounts atomically with double-entry debit/credit ledger records.

* **Method:** `POST`
* **URL:** `http://localhost:3000/api/transaction/`
* **Headers:**
  * `Authorization: Bearer <YOUR_JWT_TOKEN>`
  * `Content-Type: application/json`

#### cURL Request:
```bash
curl -X POST http://localhost:3000/api/transaction/ \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "fromAccount": "65f05678abcd1234ef000002",
    "toAccount": "65f07777abcd1234ef000004",
    "amount": 1200,
    "idempotencyKey": "tx-unique-uuid-98765"
  }'
```

#### Example Response (`200 OK` / `201 Created`):
```json
{
  "message": "Transaction already processed",
  "transaction": {
    "_id": "65f0aaaaabcd1234ef000005",
    "fromAccount": "65f05678abcd1234ef000002",
    "toAccount": "65f07777abcd1234ef000004",
    "amount": 1200,
    "status": "COMPLETED",
    "idempotencyKey": "tx-unique-uuid-98765"
  }
}
```

#### Example Error Responses:
* **Insufficient Balance (`400 Bad Request`):**
  ```json
  {
    "message": "Insufficicent balance . Current balance is 500. Requested amount is 1200"
  }
  ```
* **Inactive Account (`400 Bad Request`):**
  ```json
  {
    "message": "Both fromAccount and toAccount must have to be active , to process transaction"
  }
  ```

---

### 7. Check Account Balance

Calculates and returns the real-time balance of an account.

* **Method:** `GET`
* **URL:** `http://localhost:3000/api/account/balance/:accountId`
* **Headers:**
  * `Authorization: Bearer <YOUR_JWT_TOKEN>`

#### cURL Request:
```bash
curl -X GET http://localhost:3000/api/account/balance/65f05678abcd1234ef000002 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

#### Example Response (`200 OK`):
```json
{
  "accountId": "65f05678abcd1234ef000002",
  "balance": 3800
}
```

---

## 🛡️ Architecture & Core Principles

### 1. Double-Entry Bookkeeping Ledger
* No mutable `balance` column exists on account documents to prevent race conditions and balance tampering.
* Every transaction creates two immutable ledger records in the database:
  1. `DEBIT` entry on the sender account.
  2. `CREDIT` entry on the receiver account.
* Mongoose schema middleware blocks all `update`, `delete`, and `replace` operations on the ledger.

```mermaid
flowchart LR
    A[Sender Account] -->|DEBIT Entry| L[(Ledger Records)]
    L -->|CREDIT Entry| B[Receiver Account]
    L -->|Aggregate Pipeline| C[Real-Time Balance]
```

### 2. MongoDB ACID Multi-Document Transactions
* Executed inside a `mongoose.startSession()` and `session.startTransaction()`.
* If any validation fails, balance is insufficient, or an error occurs, `session.abortTransaction()` rolls back all staged changes completely.
* Ensures total data integrity under concurrent operations.

### 3. Idempotency Key Handling
* Every transaction request requires a unique `idempotencyKey`.
* Prevents double-charging if a user clicks "Pay" multiple times or if a network timeout triggers a client retry.

### 4. Token Blacklisting & JWT Security
* Tokens can be supplied via `Authorization: Bearer <token>` or HTTP-only cookies.
* When a user logs out, the token is recorded in the `tokenBlackList` collection.
* TTL index automatically deletes expired tokens after 3 days.

---

## 📁 Project Structure

```
Banking-Ledger-System/
├── dist/                          # Compiled JavaScript build output
├── images/
│   └── WorkingExample.png         # Architecture and workflow diagram
├── src/
│   ├── config/
│   │   ├── db.ts                  # MongoDB connection setup
│   │   └── env.ts                 # Environment variable exports
│   ├── controllers/
│   │   ├── account.controller.ts  # Account creation & balance queries
│   │   ├── auth.controller.ts     # User register, login & logout
│   │   └── transaction.controller.ts # Fund transfers & admin initial funds
│   ├── middlewares/
│   │   ├── auth.middleware.ts     # User & System User JWT auth & blacklist check
│   │   └── rateLimiter.middleware.ts # Login & API rate limiting
│   ├── models/
│   │   ├── account.model.ts       # Account schema & balance aggregation
│   │   ├── blackList.model.ts     # Blacklisted tokens schema with TTL
│   │   ├── ledger.model.ts        # Immutable double-entry ledger schema
│   │   ├── transaction.model.ts   # Transaction state & idempotency schema
│   │   └── user.model.ts          # User schema & password hashing
│   ├── routes/
│   │   ├── account.routes.ts      # Account router endpoints
│   │   ├── auth.routes.ts         # Auth router endpoints
│   │   └── transaction.routes.ts  # Transaction router endpoints
│   ├── services/
│   │   └── email.service.ts       # Nodemailer OAuth2 email dispatcher
│   ├── app.ts                     # Express app configuration & middleware
│   └── server.ts                  # Server entrypoint & global rate limiter
├── package.json                   # Project scripts and dependencies
├── tsconfig.json                  # TypeScript compiler configuration
└── Readme.md                      # Project documentation
```

---

## 📄 License

This project is licensed under the ISC License.

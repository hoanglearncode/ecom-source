# Auth Service - JWT Authentication Server

Microservice xử lý authentication với JWT Access Token và Refresh Token, viết bằng TypeScript.

## 🚀 Tính năng

- ✅ **Đăng ký / Đăng nhập** với email và password
- ✅ **JWT Access Token** (thời gian sống ngắn - mặc định 15 phút)
- ✅ **Refresh Token** (thời gian sống dài - mặc định 7 ngày)
- ✅ **Token Blacklist** - Thu hồi access token khi logout
- ✅ **Logout từ 1 thiết bị** hoặc **tất cả thiết bị**
- ✅ **Role-based Authorization** (user, admin)
- ✅ **MongoDB** lưu trữ user data
- ✅ **Redis** lưu trữ refresh tokens và blacklist
- ✅ **TypeScript** với strict type checking

## 📁 Cấu trúc thư mục

```
auth/
├── docker-compose.yml      # Docker Compose config
├── Dockerfile              # Container image
├── package.json            # Dependencies
├── tsconfig.json           # TypeScript config
├── .env.example            # Environment variables template
└── src/
    ├── index.ts            # Entry point
    ├── types/
    │   └── index.ts        # TypeScript type definitions
    ├── routes/
    │   └── auth.ts         # Auth routes (register, login, logout, etc.)
    ├── middleware/
    │   └── auth.ts         # JWT authentication & authorization middleware
    ├── models/
    │   └── user.ts         # User model (MongoDB + Redis)
    └── utils/
        ├── jwt.ts          # JWT utilities
        └── tokenBlacklist.ts  # Token blacklist utilities
```

## 🔧 Cài đặt & Chạy

### Sử dụng Docker Compose (Được khuyến nghị)

```bash
# 1. Copy file .env.example thành .env
cp .env.example .env

# 2. Chỉnh sửa .env với secrets của bạn
# JWT_ACCESS_SECRET và JWT_REFRESH_SECRET nên là chuỗi ngẫu nhiên dài

# 3. Chạy với Docker Compose
docker-compose up -d

# Service sẽ chạy tại http://localhost:3000
```

### Chạy local (không Docker)

```bash
# Cài đặt dependencies
npm install

# Copy và chỉnh .env
cp .env.example .env

# Chạy development mode
npm run dev

# Hoặc build và chạy production
npm run build
npm start
```

## 📡 API Endpoints

### Public Routes

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Đăng ký user mới |
| POST | `/api/auth/login` | Đăng nhập |
| POST | `/api/auth/refresh` | Làm mới access token |

### Protected Routes (cần Access Token)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/logout` | Đăng xuất (thiết bị hiện tại) |
| POST | `/api/auth/logout-all` | Đăng xuất tất cả thiết bị |
| GET | `/api/auth/me` | Lấy thông tin user hiện tại |

### Other Routes

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Health check |
| GET | `/api/protected` | Ví dụ route bảo vệ |
| GET | `/api/admin` | Ví dụ route admin-only |

## 🔐 Authentication Flow

### 1. Đăng ký
```bash
POST /api/auth/register
{
  "email": "user@example.com",
  "password": "password123",
  "name": "John Doe"
}

Response:
{
  "success": true,
  "data": {
    "user": { "userId": "...", "email": "...", "name": "...", "role": "user" },
    "tokens": {
      "accessToken": "eyJ...",
      "refreshToken": "eyJ..."
    }
  }
}
```

### 2. Đăng nhập
```bash
POST /api/auth/login
{
  "email": "user@example.com",
  "password": "password123"
}
# Response giống đăng ký
```

### 3. Sử dụng Access Token
```bash
GET /api/protected
Authorization: Bearer <accessToken>
```

### 4. Làm mới Token
```bash
POST /api/auth/refresh
{
  "refreshToken": "<refreshToken>"
}

Response:
{
  "success": true,
  "data": {
    "accessToken": "eyJ..."
  }
}
```

### 5. Đăng xuất
```bash
POST /api/auth/logout
Authorization: Bearer <accessToken>
{
  "refreshToken": "<refreshToken>",
  "accessToken": "<accessToken>"
}
```

## 📝 Environment Variables

```env
# Server
NODE_ENV=development
PORT=3000

# JWT Secrets (PHẢI đổi trong production!)
JWT_ACCESS_SECRET=your_access_secret
JWT_REFRESH_SECRET=your_refresh_secret

# Token Expiration
ACCESS_TOKEN_EXPIRES_IN=15m
REFRESH_TOKEN_EXPIRES_IN=7d

# Database
MONGODB_URI=mongodb://mongodb:27017/auth_db

# Redis
REDIS_URI=redis://redis:6379

# CORS (optional)
CORS_ORIGIN=*
```

## 🔒 Security Features

- **Password hashing** với bcryptjs
- **Token rotation** - Refresh token được làm mới khi dùng
- **Token blacklist** - Access token bị thu hồi khi logout
- **Token expiration** - Tự động hết hạn sau thời gian quy định
- **Role-based access control** - Middleware phân quyền theo vai trò
- **TypeScript strict mode** - Catch errors tại compile time

## 🧪 Test với curl

```bash
# Đăng ký
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"123456","name":"Test User"}'

# Đăng nhập
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"123456"}'

# Lấy protected resource
curl -X GET http://localhost:3000/api/protected \
  -H "Authorization: Bearer <accessToken>"

# Làm mới token
curl -X POST http://localhost:3000/api/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{"refreshToken":"<refreshToken>"}'

# Đăng xuất
curl -X POST http://localhost:3000/api/auth/logout \
  -H "Authorization: Bearer <accessToken>" \
  -H "Content-Type: application/json" \
  -d '{"refreshToken":"<refreshToken>","accessToken":"<accessToken>"}'
```

## 🛠️ Development Commands

```bash
npm run dev      # Run in development mode with hot reload
npm run build    # Compile TypeScript to JavaScript
npm start        # Run production build
```

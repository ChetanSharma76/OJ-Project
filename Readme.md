# 🧑‍⚖️ OPTICODE - Online Judge System

THE OPTICODE is a full-stack **Online Judge system** that allows users to solve coding problems with real-time code evaluation. It features a powerful admin dashboard for managing problems, test cases, and submissions — all built with a modern tech stack, fully containerized using Docker, and deployed on **Vercel (frontend)** and **AWS (backend)**.

---
# Latest Code in Sandboxed Branch
---

## 🌐 Live Demo

- 🔗 Frontend (Vercel): [(https://opticodeoj.vercel.app)]https://opticodeoj.vercel.app
- 🔗 Backend (AWS): [https://backend.theoj.xyz](https://backend.theoj.xyz)

---

## 📸 Screenshots

| Home | Problem | Editor |
|------|---------|--------|
| ![Home](https://github.com/user-attachments/assets/c28d619d-3ce8-4a4a-9eba-c8b87340fa0e) | ![Problem](https://github.com/user-attachments/assets/88c09d43-90dd-478a-a4bf-a4215ed8cac9) | ![Editor](https://github.com/user-attachments/assets/654ef453-adb2-404d-a9ff-90aaedaf3430) |

| Admin | Auth |
|-------|------|
| ![Admin](https://github.com/user-attachments/assets/49ea3a73-5775-41d7-a977-6cc60d7679a7) | ![Auth](https://github.com/user-attachments/assets/07ca266f-b415-4481-a2f4-fb9e6d0d4e82) |


---

## ⚙️ Features

### 👨‍🎓 User Panel
- Browse and solve programming problems
- Submit code in an interactive editor (Monaco Editor)
- View test case-wise feedback (passed/failed)
- Maintain a submission history

### 🛠️ Admin Panel
- Create and update problems
- Upload sample and hidden test cases (via file upload)
- Toggle problem visibility
- complete statistics dashboard for analysis active users, total users, total Problems visually shown in form of charts.

### 🔐 Authentication
- Secure user login/signup with JWT
- Passwords hashed using `bcrypt`
- Protected admin routes

### ⚙️ Code Execution Engine
- Containerized code execution with Docker
- Secure sandbox for running user-submitted code
- Input/output validation and real-time feedback

---

## 🧰 Tech Stack

| Layer        | Technology                                      |
|--------------|-------------------------------------------------|
| Frontend     | React.js (Vite), Tailwind CSS, Monaco Editor    |
| Backend      | Node.js, Express.js                             |
| Database     | MongoDB (Mongoose)                              |
| Code Runner  | Docker                                          |
| Auth         | JWT + bcrypt                                    |
| File Uploads | Multer                                          |
| Deployment   | Vercel (Frontend), AWS EC2 (Backend)            |

---

## 🚀 Local Development Setup

### 🔧 Prerequisites

- Node.js & npm
- Docker & Docker Compose
- MongoDB (local or cloud)

### 📦 Backend Setup (Dockerized)

```bash
# In the project root
docker-compose up --build

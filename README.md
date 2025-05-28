# 🧠 THE OJ – Online Judge System

Welcome to **THE OJ**, a modern and scalable online judge system built for coding practice, problem solving, and performance benchmarking. 
The system supports real-time code evaluation, user profiles, and a powerful admin dashboard for managing problems and test cases.

---

## 🚀 Features

### 👨‍💻 For Users
- 📝 Browse and attempt coding problems
- 🧠 Built-in code editor powered by CodeMirror
- ⚙️ Submit code in multiple languages
- 🔍 See real-time submission verdicts
- 🧾 Track all previous submissions
- 👤 My Profile with editable user info and profile image (Cloudinary integration)
- 🔒 Forgot password & secure login/signup

### 🛠️ For Admins
- 📋 Create, view, and manage problems
- 📁 Upload multiple hidden test cases (with file handling)
- ⚙️ Update problems while preserving or replacing test cases
- 📊 Responsive Admin Dashboard (with a collapsible sidebar)

### 🧩 System Design
- 🐳 Docker-friendly backend architecture
- 📦 MongoDB for persistence
- ☁️ Multer + Cloudinary for file/image uploads
- 🔐 Passport.js sessions for authentication
- 💡 Follows MVC structure

---

## ⚙️ Tech Stack

| Area           | Technology                       |
|----------------|----------------------------------|
| Frontend       | HTML, CSS, TailwindCSS, JS, EJS |
| Code Editor    | CodeMirror                       |
| Backend        | Node.js, Express.js              |
| Database       | MongoDB + Mongoose               |
| Auth           | Passport.js Sessions             |
| File Uploads   | Multer, Cloudinary               |
| Container Ready| Docker-Compatible Architecture   |

---

# Clone the repo
git clone https://github.com/your-username/THE-OJ.git

# Navigate into the folder
cd THE-OJ

# Install dependencies
npm install

# Add your environment variables
cp .env.example .env
# Then add Mongo URI, Cloudinary keys, etc.

# Start the development server
npm run dev

# Clone the repo
git clone https://github.com/your-username/THE-OJ.git

# Navigate into the folder
cd THE-OJ

🐳 Docker (Planned)
Container-ready structure allows for easy Docker integration:

Dockerfile

exec-service will run inside isolated containers for secure code execution.

📸 Screenshots

![heroIcon](https://github.com/user-attachments/assets/39e06e73-f1e3-4036-a9ae-6472aaaa46a1)
![ss3](https://github.com/user-attachments/assets/e4757b09-344e-431c-921b-d2d0d20a0b92)
![ss1](https://github.com/user-attachments/assets/a71c9fd5-97f4-43f9-a835-4b6394267908)
![ss3](https://github.com/user-attachments/assets/b2d25d92-86ed-4409-8d3d-4e3ab5d01d80)
![ss4](https://github.com/user-attachments/assets/d8a29f5a-4d5d-4d09-8013-b34b1c8473cd)
![ss5](https://github.com/user-attachments/assets/484e4df5-f0d5-4475-80c0-af72591c670d)
![ss6](https://github.com/user-attachments/assets/ead00932-9a04-4ce9-84c7-b4168238336a)
![ss1](https://github.com/user-attachments/assets/4bfabc4f-0995-4018-8f85-34fc0a75fb36)


🔗 Live Demo
🚀 Check out the live version of THE OJ here:
👉 https://your-deployment-url.com


📬 Contact
For any queries or suggestions:

📧 Email: chetansharma752005@gmail.com

🌐 Portfolio: Chetan Sharma

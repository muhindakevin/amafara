IKIMINA WALLET – Digital Microfinance Platform

A full-stack web application that digitizes Rwanda’s Ibimina (saving groups) and connects them to banks through a secure, intelligent microfinance platform.
This project is used for academic purposes as a final-year project.

🧑‍🤝‍🧑 Team Members & Contributions

This project was completed by a group of five students:

Godefroid – Team Lead & System Integration

Annaxelle

Dorine

Noella

Kevin

Contribution Overview

Godefroid (Team Lead & System Integration)

Coordinated the overall project work

Led system integration between frontend, backend, and database

Oversaw backend configuration and database connectivity

Guided project setup, execution, and final validation

Annaxelle

Participated in system setup and testing

Assisted in database setup, migrations, and debugging

Contributed to project documentation and run instructions

Dorine

Assisted in system analysis and requirements understanding

Participated in testing and documentation review

Noella

Contributed to frontend review and usability testing

Assisted in feature validation and documentation support

Kevin

Participated in backend testing and API verification

Assisted in debugging and system validation

Note:
AI tools were used strictly as learning and support tools (similar to online documentation) for explanations, debugging guidance, and documentation refinement. All configuration, testing, and academic decisions were carried out by the students.

🧱 Technology Stack

Frontend: React + Vite + Tailwind CSS

Backend: Node.js + Express

ORM: Sequelize

Database: MySQL (umurenge_wallet)

📁 Project Structure
ikimina_wallet/
├── README.md
├── BackEnd/      # Node.js + Express API
└── FrontEnd/     # React + Vite frontend

✅ Prerequisites

Make sure you have the following installed:

Node.js (v18+ recommended)

npm

MySQL Server (MySQL Workbench / MySQL80)

Optional services:

Twilio (SMS notifications)

Bird.com (Email notifications)

Google Maps API key (frontend maps)

🗄️ Database Setup (MySQL)

Open MySQL Workbench

Connect to Local instance MySQL80

Open a new SQL tab and run:

CREATE DATABASE umurenge_wallet;


Confirm that umurenge_wallet appears under Schemas

⚙️ Backend Setup (BackEnd)
1️⃣ Navigate to backend folder
cd BackEnd

2️⃣ Install dependencies
npm install

3️⃣ Create .env file

Create BackEnd/.env and add:

PORT=5000

DB_HOST=localhost
DB_PORT=3306
DB_NAME=umurenge_wallet
DB_USER=root
DB_PASS=YOUR_MYSQL_PASSWORD

JWT_SECRET=your_secret_key
CORS_ORIGIN=http://localhost:5173

4️⃣ Run database migrations and seeders
npm run migrate
npm run seed   # optional (demo data)

5️⃣ Start the backend server
npm run dev


Backend will run at:

http://localhost:5000

🌐 Frontend Setup (FrontEnd)
1️⃣ Navigate to frontend folder
cd FrontEnd

2️⃣ Install dependencies
npm install

3️⃣ Start frontend (Vite)
npm run dev


Vite will display a URL like:

http://localhost:5173


Open it in your browser.

🔁 Running the Full System (Summary)

Start MySQL Server

Run backend:

cd BackEnd
npm run dev


Run frontend:

cd FrontEnd
npm run dev


Open browser at:

http://localhost:5173

🚀 Main Features

Digital Ibimina (group savings) management

Member roles and permissions

Savings, loans, fines, and repayments

Reports and analytics dashboards

Secure authentication

Optional SMS & email notifications

🛠️ Common Issues
❌ Access denied for user 'root'@'localhost'

Ensure DB_USER and DB_PASS are correct in .env

Make sure MySQL server is running

❌ Frontend cannot reach backend

Backend must be running on port 5000

Check CORS_ORIGIN in .env

🎓 Academic Notice

This project is used strictly for educational purposes as part of a final-year academic requirement.
It is based on an open-source system and adapted, configured, tested, and documented by the project team.

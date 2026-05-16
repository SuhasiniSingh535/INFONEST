# 🏗️ InfoNest - Campus Event & Club Management System

**InfoNest** is a comprehensive campus management application built to streamline club activities, event coordination, and venue bookings. This repository contains both the **Spring Boot backend** and the **React frontend**.

---

## 🚀 Getting Started

Follow these steps to set up and run the project on your local machine.

### 📋 Prerequisites
Ensure you have the following installed:
*   **Java JDK 17** or higher
*   **Node.js & npm** (Node 18+ recommended)
*   **PostgreSQL** (Running on port 5432)
*   **Maven** (optional, wrapper provided as `mvnw`)

---

## 💾 Database Setup (PostgreSQL)

1.  **Start PostgreSQL Server** (usually runs on port 5432).
2.  **Create a database** named `postgres` (or as per your configuration in `application.properties`).
3.  **Connection Details**:
    *   **URL**: `jdbc:postgresql://localhost:5432/postgres`
    *   **Username**: `postgres`
    *   **Password**: `Surabhi25` (Update this in `src/main/resources/application.properties` to match your local PG password)
4.  **Automatic Tables**: The application uses `hibernate.ddl-auto=update`, so tables will be created automatically when the backend starts.

---

## ⚙️ Backend Setup (Spring Boot)

1.  **Navigate to the root directory**:
    ```powershell
    cd infonestfn-final-code
    ```
2.  **Update Database Credentials**:
    Edit `src/main/resources/application.properties` to match your local PostgreSQL credentials.
3.  **Run the application**:
    ```powershell
    ./mvnw.cmd spring-boot:run
    ```
    *The backend will start on **https://infonest-backend.onrender.com**.*

---

## 💻 Frontend Setup (React + Vite)

1.  **Navigate to the frontend directory**:
    ```powershell
    cd frontend
    ```
2.  **Install dependencies**:
    ```powershell
    npm install
    ```
3.  **Run the development server**:
    ```powershell
    npm run dev
    ```
    *The frontend will start on **http://localhost:5173** (or the port shown in your terminal).*

---

## 📦 Key Dependencies

### Backend (`pom.xml`)
*   **Spring Boot 3.4.2**: Core framework.
*   **Spring Data JPA**: Database abstraction and ORM.
*   **Spring Security**: Role-based access control (Admin, Faculty, Student).
*   **JJWT (jjwt-api)**: JSON Web Tokens for authentication.
*   **Apache POI**: Processing Excel files for department schedules.
*   **Lombok**: Reducing boilerplate code.
*   **Spring Boot Starter Mail**: SMTP integration for notifications.

### Frontend (`package.json`)
*   **React 19**: UI Library.
*   **React Router 7**: Client-side routing.
*   **Axios**: API communication with the backend.
*   **Framer Motion**: Premium interactive animations.
*   **Tailwind CSS**: Modern utility-first styling.
*   **Lottie React**: High-quality vector animations.

---

## 🛠️ Application Working & Structure

### 1. **Authentication Flow**
*   **Sign Up / Login**: Standard JWT-based auth.
*   **Roles**:
    *   **ADMIN**: Manage Clubs, assign Faculty members, create events, and toggle event visibility.
    *   **FACULTY**: Manage specific club activities, update club descriptions, and approve/reject event registrations.
    *   **STUDENT**: Browse clubs, register for recruitment or events, and track bookings.

### 2. **Event & Club Management**
*   Administrators can create clubs and assign Faculty as "Club Officials".
*   Faculty can create events (Recruitment or Non-Recruitment).
*   Events can be **Hidden/Unhidden** by Admins to manage public visibility without deleting history.

### 3. **Venue Booking**
*   Users can search for available venues based on date, time, and capacity.
*   The system checks for overlapping bookings to prevent conflicts.

### 4. **Department Schedules**
*   Admins can upload Department Excel files using the integrated **Apache POI** utility to automate schedule availability tracking.

---

## 📝 Usage for New Users

1.  **Register** as a new user.
2.  **Admin Initial Setup**: Use the `Local-postgres.session.sql` or manually update roles in the `users` table to `ADMIN` for the first user.
3.  **Dashboard Access**: Based on your role, you will be redirected to the **Admin Dashboard**, **Faculty Dashboard**, or **Student Dashboard**.
4.  **Interactivity**: Hover over cards to see animations, and use the Action buttons (Edit, Delete, Eye) to manage resources.

---

## 🛡️ API Endpoints
*   **Auth**: `/api/v1/auth/**`
*   **Admin**: `/api/v1/admin/**`
*   **Faculty**: `/api/v1/faculty/**`
*   **Public Events**: `/api/v1/events/**`
*   **Venue Booking**: `/api/v1/venues/**`

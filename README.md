# Collaborative Task & Kanban Platform

A modern, real-time collaboration platform designed to help teams manage projects efficiently using Kanban boards. It features instant updates, drag-and-drop task management, role-based access control, and live user presence tracking.

## 🚀 Key Features

*   **Real-Time Live Updates**: All changes (task moves, edits, creation) are instantly synchronized across all connected clients using WebSockets.
*   **Interactive Kanban Board**:
    *   Create and manage custom lists.
    *   Drag and drop tasks between lists and reorder them effortlessly.
    *   Fluid animations and responsive design.
*   **Task Management**:
    *   Rich task details: Titles, Descriptions, Priorities (Low, Medium, High), and Due Dates.
    *   **Member Assignment**: Assign multiple team members to specific tasks.
    *   **Role-Based Permissions**:
        *   **Admins**: Full control, including deleting tasks and lists.
        *   **Members**: Can create, edit, move, and assign tasks, but cannot delete them.
*   **User Presence**:
    *   **Online Status**: See exactly who is currently viewing the board in real-time.
    *   **Auto-Join**: New users are automatically added as members to existing boards upon registration.
*   **Activity Log**: A history panel that tracks all major actions performed on the board for accountability.
*   **Secure Authentication**: JWT-based login and registration system.

## 🛠 Technology Stack

### Frontend
*   **React** (Vite): Fast and modular UI development.
*   **Tailwind CSS**: Utility-first CSS framework for modern styling.
*   **@dnd-kit**: Robust drag-and-drop library for accessible interactions.
*   **Lucide-React**: Beautiful and consistent iconography.
*   **Axios**: Promise-based HTTP client for API requests.

### Backend
*   **Django**: High-level Python web framework.
*   **Django REST Framework (DRF)**: Flexible toolkit for building Web APIs.
*   **Django Channels**: Handling WebSockets for real-time features.
*   **Daphne**: ASGI server for handling asynchronous protocols.
*   **SimpleJWT**: JSON Web Token authentication.

---

## 📦 Installation & Setup

Follow these steps to get the project running locally.

### Prerequisites
*   **Python** (3.8 or higher)
*   **Node.js** (14 or higher) & **npm**

### 1. Backend Setup (Django)

1.  Navigate to the backend directory:
    ```bash
    cd backend
    ```

2.  Create a virtual environment (recommended):
    ```bash
    # Windows
    python -m venv venv
    venv\Scripts\activate

    # macOS/Linux
    python3 -m venv venv
    source venv/bin/activate
    ```

3.  Install Python dependencies:
    ```bash
    pip install -r requirements.txt
    ```

4.  Apply database migrations:
    ```bash
    python manage.py migrate
    ```

5.  Create a superuser (admin):
    ```bash
    python manage.py createsuperuser
    ```

6.  Start the development server:
    ```bash
    python manage.py runserver
    ```
    The backend will run at `http://localhost:8000`.

### 2. Frontend Setup (React)

1.  Open a new terminal and navigate to the frontend directory:
    ```bash
    cd frontend
    ```

2.  Install Node dependencies:
    ```bash
    npm install
    ```

3.  Start the development server:
    ```bash
    npm run dev
    ```
    The application will act as `http://localhost:5173` (or similar port shown in terminal).

---

## 🎮 How to Use

1.  **Register/Login**: Open the frontend URL. Create a new account or log in.
    *   *Note*: The first user created via `createsuperuser` will be the board Admin.
2.  **Dashboard**: You will see the main project board.
3.  **Manage Lists**: Click `+ New List` in the sidebar to create columns (e.g., "To Do", "In Progress", "Done").
4.  **Create Tasks**: Click `+ Add Task` at the bottom of any list.
    *   Enter a title, set priority, and assign members immediately in the modal.
5.  **Edit/Move**:
    *   Click on a task to edit details.
    *   Drag tasks between columns to update their status.
    *   Click the user icon on a task to quickly assign/unassign members.
6.  **Collaborate**: Open the app in another browser or Incognito window, log in as a different user, and watch changes happen in real-time!

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

# SRTEV — Web Frontend & Operations Center

An interactive web-based administration panel built with **React** and **Vite** for managing the SRTEV (Electric Vehicle Rental Platform). The application enables administrators and support staff to track reports, reply to customer issues, manage vehicles, monitor user activity, and handle system alerts in real time.

🔗 **Backend Repository:** [SRTEV Web Backend API](https://github.com/SRTEV/WebBackend)

---

## 🛠️ Tech Stack

* **Frontend Framework:** React 18+
* **Build Tool:** Vite
* **Styling:** CSS3 / Custom Modular CSS
* **HTTP Client:** Fetch API
* **Icons & UI:** Custom SVG Assets & Modular Components

---

## ✨ Features

* **Operation Center & Ticketing:**
  * View and filter customer & repairman issue reports (vehicle breakdown, payment errors, account problems, etc.).
  * Real-time search across tickets by ID, Email, Name, or Vehicle ID.
  * Interactive modal dialogs for responding directly to user tickets via SMTP email integration.
  * Automated background refresh every 30 seconds for fresh report fetching.

* **Tabs & Category Filtering:**
  * Multi-level category filtering with custom checkbox dropdowns.
  * Separate tabs for User vs. Repairman issues.

* **Dashboard Navigation:**
  * Integrated sidebar navigation for Maps, Users, Vehicles, Challenges, and Operation Center.

---

## 🚀 Getting Started

### Prerequisites

Ensure you have the following installed on your machine:
* [Node.js](https://nodejs.org/) (v18.0 or higher recommended)
* [npm](https://www.npmjs.com/) or [yarn](https://yarnpkg.com/)
* Running backend service: [SRTEV Web Backend](https://github.com/SRTEV/WebBackend)

---

### Installation & Setup

1. **Clone the repository:**

```bash
git clone https://github.com/SRTEV/WebFrontend.git
cd WebFrontend
```

2. **Install dependencies:**

```bash
npm install
```

3. **Configure Environment Variables:**
Create a `.env` file in the root directory and specify your backend API URL:

```env
VITE_API_BASE_URL=http://localhost:5194/api
```

4. **Start the development server:**

```bash
npm run dev
```

The application will run locally at `http://localhost:5173`.

---

## 📜 Available Scripts

In the project directory, you can run:

* `npm run dev` — Runs the app in development mode with HMR.
* `npm run build` — Builds the app for production to the `dist` folder.
* `npm run preview` — Locally previews the production build.

---

## 📂 Project Structure

```text
src/
 ├── assets/             # SVGs, images, and static graphics
 ├── components/         # Reusable React UI components
 ├── pages/              # Main view components (OperationCenter, Map, Users, etc.)
 ├── App.css             # Global styles and layout rules
 ├── App.jsx             # Main app routing and shell layout
 └── main.jsx            # Entry point
```

---

## 🔗 Connected Backend

This frontend dashboard connects directly to the C# .NET REST API:
* 📁 **Backend Repository:** [https://github.com/SRTEV/WebBackend](https://github.com/SRTEV/WebBackend)

# RetailManager 🚀

**RetailManager** is a modern, high-performance desktop application designed for small businesses to manage invoices, inventory, and clients efficiently. Built with the power of **Go** and the flexibility of **React**.

![Dashboard Preview](https://via.placeholder.com/800x400?text=RetailManager+Dashboard)

## ✨ Features

### 🧾 Invoice Management
-   **Professional PDF Generation**: Create beautiful, compliant PDF invoices instantly.
-   **Auto-Calculations**: Automatic calculation of totals, VAT (TVA), and "Total in Words".
-   **History**: Access and reprint past invoices easily.

### 📦 Inventory Control
-   **Real-time Stock Tracking**: Automatically deducts stock when invoices are created.
-   **Low Stock Alerts**: Visual warnings when products dip below your defined threshold.
-   **Soft Delete**: Safely archive products without breaking historical data.
-   **3-Column Form**: Compact and efficient product entry.

### 👥 Client Management
-   **Client Database**: Store and manage client details.
-   **Smart Search**: Debounced search for quick client selection during invoicing.
-   **Safe Deletion**: Confirmation modals to prevent accidental data loss.

### 📊 Dashboard Analytics
-   **Revenue Tracking**: Real-time "Chiffre d'Affaires" display.
-   **Recent Activity**: Quick view of the latest invoices.
-   **Key Metrics**: Instant visibility into total products and low stock items.

---

## 🛠️ Tech Stack

### Backend (Go)
-   **[Wails](https://wails.io/)**: The bridge between Go and the frontend.
-   **[GORM](https://gorm.io/)**: The ORM library for Go.
-   **[SQLite](https://www.sqlite.org/)**: Embedded, zero-configuration database.
-   **[Maroto](https://github.com/johnfercher/maroto)**: PDF generation engine.

### Frontend (React)
-   **[React](https://reactjs.org/)**: UI library.
-   **[TypeScript](https://www.typescriptlang.org/)**: Type-safe JavaScript.
-   **[TailwindCSS](https://tailwindcss.com/)**: Utility-first CSS framework for styling.
-   **[Vite](https://vitejs.dev/)**: Next-generation frontend tooling.

---

## 🏗️ Architecture

RetailManager follows a **Service-Oriented Architecture** within a monolith:

1.  **Frontend Layer**: A Single Page Application (SPA) running in a webview. It communicates with the backend via Wails' Javascript bridge.
2.  **Application Layer (`App.go`)**: The main entry point that exposes methods to the frontend.
3.  **Service Layer**:
    -   `InvoiceService`: Handles invoice logic and PDF generation.
    -   `InventoryService`: Manages products and stock transactions.
    -   `ClientService`: Manages client data.
4.  **Data Layer**: SQLite database accessed via GORM models (`Invoice`, `Product`, `Client`).

---

## 🚀 Getting Started

### Prerequisites
-   **Go** (v1.21+)
-   **Node.js** (v18+)
-   **Wails CLI**: `go install github.com/wailsapp/wails/v2/cmd/wails@latest`

### Running Locally
We use a `Makefile` to simplify common tasks.

```bash
# Install dependencies and run the app in dev mode
make run
```

### Building for Production
```bash
# Build a single executable file
make build
```
The binary will be located in `build/bin/`.

---

## 📂 Project Structure

```
RetailManager/
├── app.go              # Main application logic & bridge
├── backend/            # Go Backend Services
│   ├── client/         # Client logic
│   ├── inventory/      # Product & Stock logic
│   ├── invoice/        # Invoice & PDF logic
│   └── database/       # DB connection & migrations
├── frontend/           # React Frontend
│   ├── src/
│   │   ├── components/ # Reusable UI components
│   │   ├── hooks/      # Custom React hooks
│   │   └── types/      # TypeScript definitions
│   └── wailsjs/        # Auto-generated Go bindings
└── build/              # Build artifacts
```

---

## 🛡️ License
Proprietary software. All rights reserved.

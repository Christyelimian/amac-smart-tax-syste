# STREAMS: Project Roadmap & Status

This document provides a high-level overview of the development progress for the Smart Tax and Revenue Electronic Management System (STREAMS) platform. It outlines what has been completed and what is planned for the upcoming phases.

## Project Vision

The goal is to develop a comprehensive digital ecosystem for the Abuja Municipal Area Council (AMAC) to streamline revenue collection, enhance transparency, and improve citizen services. The project is divided into three primary interfaces:

1.  **Admin Dashboard (Internal):** A powerful portal for AMAC management to monitor, analyze, and manage all revenue-related activities.
2.  **Public Payment Portal (External):** A modern, user-friendly website for citizens and businesses to pay their taxes and levies online.
3.  **Collector App (Mobile):** A dedicated mobile application for field agents to manage their collection routes and issue receipts.

---

## Phase 1: Admin Dashboard & Core Infrastructure (Largely Complete)

This phase focused on building the internal-facing administrative dashboard, which serves as the command center for AMAC personnel.

### ✅ **What We Have Done:**

-   **Core Application Setup:**
    -   Initialized the Next.js 15 application with the App Router.
    -   Configured TypeScript, Tailwind CSS, and ShadCN UI for the entire component library.
    -   Established the project structure, including layouts, components, and utility functions.

-   **Admin Dashboard UI:**
    -   **Main Dashboard (`/`):** Built the central overview with key statistics (Total Revenue, Compliance Rate), a revenue chart, and a list of recent transactions.
    -   **Navigation:** Implemented a collapsible sidebar with icons and tooltips for all modules, and a responsive header with search and user profile access.
    -   **Financial Management (`/financial-management`):** Created a page showcasing modules for reconciliation, revenue allocation, and budget integration.
    -   **Payments & Reports (`/payments`, `/reports`):** Developed pages to display payment history and generate various financial reports.
    -   **User Management (`/user-management`):** Built a complete interface for adding, viewing, and managing system users and their roles.
    -   **Collector Dashboards (`/collectors`):**
        -   Created a detailed view for individual field collectors to track their performance.
        -   Implemented a dynamic view for contractor companies, with a **searchable combobox** to handle all 51 revenue contractors.
    -   **Specialized Modules (`/specialized-modules`):** Created a page to represent the various tailored revenue collection modules (e.g., Tenement, Markets, Vehicles).

-   **AI & Analytics:**
    -   **Genkit Foundation:** Set up the Genkit infrastructure for integrating AI capabilities.
    -   **AI Tool Pages (`/ai-tools`, `/advanced-analytics`):** Created landing pages for accessing AI-powered features like Fraud Detection, Revenue Forecasting, and Smart Routing.
    -   **Live Fraud Detector:** Implemented a functional AI fraud detection tool on the main dashboard.
    -   **Analytics Charts (`/analytics`):** Built charts for visualizing user engagement and the tax compliance funnel.

-   **Remita Payment Simulation (Backend):**
    -   Created a Genkit flow (`generateRemitaPayment`) to serve as the backend endpoint for generating payment references.
    -   Built the **Remita Payment Portal** (`/remita-payment`) which successfully simulates the generation of an RRR and virtual account details.

-   **System & Accessibility:**
    -   Implemented foundational pages for GIS, Hardware Integration, Connectivity, and Accessibility features.
    -   Added a theme toggle for light/dark mode.

### 🔄 **What Is In Progress:**

-   Connecting the UI components to live data sources (currently using mock data).

---

## Phase 2: Public Payment Portal (In Progress)

This phase focuses on building the external, citizen-facing website based on the designs in `frontend.txt`.

### ✅ **What We Have Done:**

-   **Landing Page (`/` public route):**
    -   Created the initial public landing page, which is now the default route for the application.
    -   Implemented the hero section with a search bar, a grid of popular services, and a "Why Pay With Us" section.
    -   **Branding:** Updated the global stylesheet (`globals.css`) to use the official AMAC green color scheme.

### ⏳ **What Remains (Immediate Next Steps):**

1.  **"View All Revenue Types" Page:**
    -   Build the full catalog page that lists all 51 revenue types.
    -   Implement filtering by category (Property, Business, Transport) and a search bar as designed.

2.  **Multi-Step Payment Form:**
    -   Create the three-step payment form component (`Business Information` -> `Payment Amount` -> `Choose Payment Method`).
    -   Ensure the form dynamically adapts based on the selected revenue type.
    -   Connect the "Proceed to Payment" button to the `generateRemitaPayment` Genkit flow.

3.  **Live Remita API Integration:**
    -   Update the `generateRemitaPayment` flow to make real API calls to the Remita service using the merchant credentials.
    -   Handle the response from Remita to display the actual RRR and virtual account number to the user.

4.  **Payment Status & Receipt Pages:**
    -   Build the "Processing Payment" page with its live status updates.
    -   Create the "Payment Successful" page, including the receipt with a QR code for verification.
    -   Implement a webhook receiver endpoint to get real-time payment confirmation from Remita.

5.  **User Authentication & Dashboard:**
    -   Develop the "Login" and "Register" functionality for taxpayers.
    -   Build the logged-in user dashboard where taxpayers can view their payment history, manage properties/businesses, and download receipts.

---

## Phase 3: Collector Mobile App (Future Work)

This phase will focus on developing a Progressive Web App (PWA) optimized for field agents.

### 📋 **Planned Features:**

-   Simplified mobile-first interface for on-the-go collections.
-   Geo-fenced receipt issuance to ensure collectors are in their assigned zones.
-   Offline collection capabilities that sync data automatically when connectivity is restored.
-   Instant QR code scanning for taxpayer and property verification.
-   A "Report Fraud" button for escalating suspicious activities.

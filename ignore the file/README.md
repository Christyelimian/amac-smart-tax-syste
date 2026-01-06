# STREAMS: Smart Tax and Revenue Electronic Management System

Welcome to STREAMS, the official portal for smart tax and revenue management for the Abuja Municipal Area Council (AMAC). This Next.js application is a comprehensive solution designed to modernize and streamline tax collection, financial management, and operational efficiency.

## Key Features

The STREAMS platform is built with a modular architecture, providing a wide range of powerful features:

-   **Dashboard**: A centralized overview of key metrics, including total revenue, compliance rates, recent transactions, and an AI-powered fraud detector.
-   **Financial Management**: Tools for automated transaction reconciliation, revenue allocation, financial reporting, and budget integration.
-   **AI Tools**: A suite of artificial intelligence capabilities, including:
    -   **Fraud Detection**: Real-time analysis of transactions to identify suspicious activities.
    -   **Revenue Forecasting**: Predictive analytics to project future revenue.
    -   **Property Valuation**: AI-driven property value estimation for fair taxation.
    -   **Smart Routing**: Route optimization for field collectors.
    -   **Advanced Analytics**: Access to machine learning models for deeper insights.
-   **Geographic Information System (GIS)**: Interactive property mapping, location-based services, and spatial analysis for revenue optimization.
-   **Collection Optimization**: Tools for scheduling, performance tracking, and incentive management for field collectors.
-   **User Management**: A complete system for managing user roles, permissions, and access control.
-   **Messaging Platform**: Integrated communication tools for sending SMS, email, and WhatsApp messages to taxpayers.
-   **Hardware Integration**: Support for POS terminals, mobile devices, self-service kiosks, and other essential hardware.
-   **Accessibility & Localization**: Features like multi-language support, adjustable font sizes, and color-blind-friendly themes to ensure the platform is usable by everyone.

## Tech Stack

-   **Framework**: [Next.js](https://nextjs.org/) (with App Router)
-   **UI**: [React](https://react.dev/), [TypeScript](https://www.typescriptlang.org/), [ShadCN UI](https://ui.shadcn.com/), [Tailwind CSS](https://tailwindcss.com/)
-   **Generative AI**: [Firebase Genkit](https://firebase.google.com/docs/genkit) with Google AI
-   **Deployment**: Firebase App Hosting

## Getting Started

To get a local copy up and running, follow these simple steps.

### Prerequisites

-   Node.js (v18 or later)
-   npm or yarn

### Installation

1.  Clone the repository.
2.  Navigate to the project directory.
3.  Install NPM packages:
    ```sh
    npm install
    ```
4.  Set up your environment variables by creating a `.env.local` file from the `.env.local.example` template. You will need to add your Google AI API key.
    ```
    GOOGLE_API_KEY=your_api_key_here
    ```

### Running the Development Server

1.  Start the Genkit development server in a separate terminal:
    ```sh
    npm run genkit:watch
    ```
2.  Start the Next.js development server:
    ```sh
    npm run dev
    ```

Open [http://localhost:9002](http://localhost:9002) with your browser to see the result.

## Deployment

This application is configured for deployment on [Firebase App Hosting](https://firebase.google.com/docs/app-hosting).

To deploy the application, follow these steps:

1.  **Install Firebase CLI:**
    If you don't have the Firebase CLI installed, open your terminal and run:
    ```sh
    npm install -g firebase-tools
    ```

2.  **Login to Firebase:**
    Authenticate with your Google account.
    ```sh
    firebase login
    ```

3.  **Set up a Firebase Project:**
    - Go to the [Firebase Console](https://console.firebase.google.com/) and create a new project.
    - Once your project is created, copy the **Project ID**.

4.  **Connect your local project to Firebase:**
    Run the following command and select your new Firebase project when prompted.
    ```sh
    firebase init apphosting
    ```

5.  **Deploy your app:**
    Run the deployment command. This will build your Next.js application and deploy it to App Hosting.
    ```sh
    firebase deploy --only apphosting
    ```

After the deployment is complete, the Firebase CLI will provide you with a public URL where you and your organization can view the live application.

## Learn More

To learn more about the technologies used in this project, see the following resources:

-   [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
-   [Genkit Documentation](https://firebase.google.com/docs/genkit) - learn about building AI-powered features.
-   [ShadCN UI Documentation](https://ui.shadcn.com/docs) - learn about the UI components used.

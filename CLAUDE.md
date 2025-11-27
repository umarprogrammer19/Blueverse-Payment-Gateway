# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

- **Install Dependencies:** `npm install`
- **Start Development Server:** `npm run dev`
- **Build for Production:** `npm run build`
- **Run Linter:** `npm run lint`
- **Preview Production Build:** `npm run preview`

## High-Level Code Architecture and Structure

This project is a React application built with Vite, primarily focused on a payment gateway or checkout flow. It utilizes a component-based architecture, React Context for global state management, and React Router for navigation.

### Key Areas:

-   **`src/main.jsx`:** Application entry point, initializes React, configures routing, and sets up global context.
-   **`src/App.jsx`:** The root component managing core application state (user data, payment details, site data, loading, errors), handles initial authentication, API calls, and local storage persistence. It uses the `useCheckout` hook for global state access.
-   **`src/layout.jsx`:** Defines the main application layout, including a `Header` and an `<Outlet />` for rendering route-specific content.
-   **`src/auth.js`:** Utility module for managing authentication tokens (setting, refreshing).
-   **`src/context/CheckoutContext.jsx`:** Centralized state management for the checkout process using React Context. It manages states like `apiKey`, `siteId`, `customerId`, `selectedMembership`, `couponCode`, and `invoiceTotals`, providing setter functions and helper utilities.
-   **`src/components/sections/`:** Contains modular UI components representing different stages or aspects of the payment flow (e.g., `PersonalInfo`, `ProductSelect`, `PaymentInfo`, `PurchaseSummary`).
-   **`src/pages/`:** Houses full-page views for navigation, such as `membership`, `failure`, and `success` pages.

### Design Patterns:

-   **Component-Based:** Modular UI for reusability.
-   **React Context API:** Global state management for checkout data.
-   **React Router:** Client-side navigation.
-   **API Integration:** Extensive interaction with a backend API for core functionalities.
-   **Local Storage:** Persistence of user data and authentication tokens.
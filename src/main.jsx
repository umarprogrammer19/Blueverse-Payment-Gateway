import { createRoot } from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import App from "./App.jsx";
import { CheckoutProvider } from "./context/CheckoutContext.jsx";
import "./index.css";
import Layout from "./layout.jsx";
import PaymentFailure from "./pages/failure.jsx";
import PaymentSuccess from "./pages/success.jsx";

const router = createBrowserRouter([
  {
    path: "/",
    element: <Layout />,
    children: [
      {
        path: "",
        element: <App />,
      },
      {
        path: "/failure",
        element: <PaymentFailure />,
      },
      {
        path: "/success",
        element: <PaymentSuccess />,
      },
    ],
  },
]);

createRoot(document.getElementById("root")).render(
  <CheckoutProvider>
    <RouterProvider router={router} />
  </CheckoutProvider>
);

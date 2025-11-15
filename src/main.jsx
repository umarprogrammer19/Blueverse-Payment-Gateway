import { createRoot } from 'react-dom/client';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import App from './App.jsx';
import { CheckoutProvider } from './context/CheckoutContext.jsx';
import './index.css';
import Layout from './layout.jsx';
import Membership from './pages/membersip.jsx';
import PaymentSuccess from './pages/success.jsx';
import Washbook from './pages/washbook.jsx';
import PaymentFailure from './pages/failure.jsx';

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
        path: "/wash",
        element: <Washbook />,
      },
      {
        path: "/membership",
        element: <Membership />,
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

createRoot(document.getElementById('root')).render(
  <CheckoutProvider>
    <RouterProvider router={router} />
  </CheckoutProvider>
)

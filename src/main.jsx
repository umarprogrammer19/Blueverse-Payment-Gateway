import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import Layout from './layout.jsx';
import Washbook from './pages/washbook.jsx';
import Payment from './pages/payment.jsx';
import { CheckoutProvider } from './context/CheckoutContext.jsx';
import Membership from './pages/membersip.jsx';

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
        path: "/payment",
        element: <Payment />,
      },
    ],
  },

]);

createRoot(document.getElementById('root')).render(
  <CheckoutProvider>
    <RouterProvider router={router} />
  </CheckoutProvider>
)

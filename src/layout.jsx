import { Outlet } from 'react-router-dom';

import Header from './components/header';

/**
 * Layout component that provides the main application structure
 * Includes header and renders child routes via Outlet
 */
const Layout = () => {
    return (
        <>
            <Header />
            <Outlet /> {/* Renders child routes */}
        </>
    )
}

export default Layout
import React from 'react';
import { Navigate } from 'react-router-dom';
import Cookies from 'js-cookie';

const ProtectedRoute = ({ component: Component }) => {
    const token = Cookies.get('Token');

    return token ? <Component /> : <Navigate to="/" />;
};

export default ProtectedRoute;

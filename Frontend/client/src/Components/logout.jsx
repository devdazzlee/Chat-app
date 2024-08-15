// src/components/Logout.js
import React from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Cookies from 'js-cookie';

const Logout = () => {
    const navigate = useNavigate();

    const handleLogout = async () => {
        try {
            // Call the logout API
            await axios.post('https://chat-app-sand-phi.vercel.app/api/logout', {}, { withCredentials: true });
            
            // Remove the token cookie manually
            Cookies.remove('Token');
            
            // Redirect to login page
            navigate('/');
        } catch (err) {
            console.error('Logout failed', err);
        }
    };

    return <button onClick={handleLogout}>Logout</button>;
};

export default Logout;

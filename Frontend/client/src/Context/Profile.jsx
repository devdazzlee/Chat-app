import React, { createContext, useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

// Create the context
export const ProfileContext = createContext();

// Create the provider component
export const ProfileProvider = ({ children }) => {
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const navigate = useNavigate();

    // Fetch profile with authentication
    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const response = await axios.get('https://chat-app-sand-phi.vercel.app/api/profile', {
                    withCredentials: true, // Ensure cookies are sent
                    headers: {
                        'Cache-Control': 'no-cache',
                        'Pragma': 'no-cache',
                        'Expires': '0',
                    }
                });
                setProfile(response.data);
                navigate('/chat');
            } catch (error) {
                setError('Failed to fetch profile');    
            } finally {
                setLoading(false);
            }
        };

        fetchProfile();
    }, [navigate]);

    return (
        <ProfileContext.Provider value={{ profile, loading, error, setProfile }}>
            {children}
        </ProfileContext.Provider>
    );
};

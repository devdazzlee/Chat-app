import React, { useContext, useState } from 'react';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';
import { ProfileContext } from '../Context/Profile';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const Login = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const { setProfile } = useContext(ProfileContext); // Access setProfile from context
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
    
        try {
            const res = await axios.post('https://chat-app-sand-phi.vercel.app/api/login', 
                { username, password },
                { withCredentials: true } // Ensure cookies are sent with the request
            );
    
            console.log('Login response:', res.data); // Log the response data
    
            if (res.data.message === 'Login successful') {
                // Fetch the profile after a successful login
                const profileRes = await axios.get('https://chat-app-sand-phi.vercel.app/api/profile', {
                    withCredentials: true,
                });

                setProfile(profileRes.data); // Update profile in context
                navigate('/chat');
            } else {
                toast.error('Login failed');
            }
        } catch (err) {
            console.error('Login error:', err); // Log any error that occurs
            toast.error('Invalid credentials');
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-100">
            <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-lg shadow-md">
                <h2 className="text-2xl font-bold text-center text-gray-900">Login</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <input
                        type="text"
                        placeholder="Username"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        required
                        className="w-full px-4 py-2 text-gray-700 bg-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                    <input
                        type="password"
                        placeholder="Password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        className="w-full px-4 py-2 text-gray-700 bg-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                    <button
                        type="submit"
                        className="w-full px-4 py-2 font-bold text-white bg-orange-500 rounded-lg hover:bg-orange-600 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-opacity-50"
                    >
                        Login
                    </button>
                </form>
                <div className="text-center">
                    <Link
                        to="/register"
                        className="text-sm font-medium text-orange-500 hover:underline"
                    >
                        Signup
                    </Link>
                </div>
            </div>
            <ToastContainer position="top-right" autoClose={5000} hideProgressBar={false} newestOnTop closeOnClick rtl={false} pauseOnFocusLoss draggable pauseOnHover />
        </div>
    );
};

export default Login;

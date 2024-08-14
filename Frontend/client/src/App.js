    import React from 'react';
    import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
    import Login from './Components/Login';
    import Register from './Components/Register';
    import Chat from './Components/Chat';
    import ProtectedRoute from './Components/ProtectedRoute';
    import Logout from './Components/logout';
    import { ProfileProvider } from './Context/Profile';


    const App = () => {
        return (
            <Router>
            <ProfileProvider>
                <div>
                    <Routes>
                        <Route path="/" element={<Login />} />
                        <Route path="/register" element={<Register />} />
                        <Route path="/logout" element={<Logout />} />
                        <Route path="/chat" element={<Chat />} />
                    </Routes>
                </div>
            </ProfileProvider>
            </Router>
        );
    };

    export default App;

import { io } from 'socket.io-client';
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import './Chat.css'; // Import custom styles

const Chat = () => {
    const [users, setUsers] = useState([]);
    const [messages, setMessages] = useState([]);
    const [currentChat, setCurrentChat] = useState(null);
    const [newMessage, setNewMessage] = useState('');
    const [userId, setUserId] = useState(null);

    const socket = io('http://localhost:5000', {
        withCredentials: true,
    });

    useEffect(() => {
        // Fetch users
        axios.get('http://localhost:5000/api/users', { withCredentials: true })
            .then(res => setUsers(res.data))
            .catch(err => console.error('Error fetching users:', err));

        // Fetch the current user's ID and join the room
        axios.get('http://localhost:5000/api/profile', { withCredentials: true })
            .then(res => {
                setUserId(res.data.id);
                socket.emit('join', res.data.id); // Join the room for the current user
            })
            .catch(err => console.error('Error fetching profile:', err));

        // Listen for new messages
        socket.on('new_message', message => {
            console.log('New message received:', message); // Debugging
            if (message.to === currentChat || message.from === currentChat) {
                setMessages(prevMessages => [...prevMessages, message]);
            }
        });

        return () => {
            socket.off('new_message'); // Clean up listener on component unmount
        };
    }, [currentChat]);

    useEffect(() => {
        if (currentChat) {
            axios.get(`http://localhost:5000/api/messages/${currentChat}`, { withCredentials: true })
                .then(res => setMessages(res.data))
                .catch(err => console.error('Error fetching messages:', err));
        }
    }, [currentChat]);

    const fetchMessages = userId => {
        setCurrentChat(userId);
    };

    const sendMessage = () => {
        if (newMessage.trim() && userId && currentChat) {
            const messageData = {
                from: userId,
                to: currentChat,
                message: newMessage
            };
            axios.post('http://localhost:5000/api/messages', messageData, { withCredentials: true })
                .then(() => {
                    socket.emit('send_message', messageData); // Emit the message
                    setNewMessage('');
                })
                .catch(err => console.error('Error sending message:', err));
        }
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter') {
            e.preventDefault(); // Prevent the default action (like form submission)
            sendMessage();
        }
    };

    return (
        <div className="chat-container">
            <div className="user-list">
                <h2>Users</h2>
                {users.map(user => (
                    <div
                        key={user._id}
                        onClick={() => fetchMessages(user._id)}
                        className="user-item"
                    >
                        {user.username}
                    </div>
                ))}
            </div>
            <div className="chat-box">
                <h2>Chat</h2>
                <div className="messages">
                    {messages.map((msg, index) => (
                        <div
                            key={index}
                            className={`message ${msg.from === userId ? 'sent' : 'received'}`}
                        >
                            <strong>{msg.from === userId ? 'You' : 'Them'}:</strong> {msg.message}
                        </div>
                    ))}
                </div>
                <div className="message-input">
                    <input
                        type="text"
                        value={newMessage}
                        onChange={e => setNewMessage(e.target.value)}
                        onKeyDown={handleKeyPress} // Handle Enter key press
                        placeholder="Type a message"
                    />
                    <button onClick={sendMessage}>Send</button>
                </div>
            </div>
        </div>
    );
};

export default Chat;

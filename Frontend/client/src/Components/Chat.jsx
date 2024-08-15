import { io } from 'socket.io-client';
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import './Chat.css'; // Import custom styles

const socket = io('http://localhost:5000', { withCredentials: true });

const Chat = () => {
    const [users, setUsers] = useState([]);
    const [groups, setGroups] = useState([]);
    const [messages, setMessages] = useState([]);
    const [currentChat, setCurrentChat] = useState(null);
    const [newMessage, setNewMessage] = useState('');
    const [userId, setUserId] = useState(null);
    const [showCreateGroup, setShowCreateGroup] = useState(false);
    const [groupName, setGroupName] = useState('');
    const [selectedMembers, setSelectedMembers] = useState([]);

    useEffect(() => {
        const fetchInitialData = async () => {
            try {
                const userRes = await axios.get('http://localhost:5000/api/users', { withCredentials: true });
                setUsers(userRes.data);

                const profileRes = await axios.get('http://localhost:5000/api/profile', { withCredentials: true });
                setUserId(profileRes.data.id);
                socket.emit('join', profileRes.data.id);

                const groupRes = await axios.get('http://localhost:5000/api/groups', { withCredentials: true });
                setGroups(groupRes.data);
            } catch (err) {
                console.error('Error fetching initial data:', err);
            }
        };

        fetchInitialData();

        const handleNewMessage = (message) => {
            if (message.to === currentChat || message.from === currentChat) {
                setMessages(prevMessages => [...prevMessages, message]);
            }
        };

        socket.on('new_message', handleNewMessage);

        return () => {
            socket.off('new_message', handleNewMessage);
        };
    }, [currentChat]);

    useEffect(() => {
        if (currentChat) {
            axios.get(`http://localhost:5000/api/messages/${currentChat}`, { withCredentials: true })
                .then(res => {
                    setMessages(res.data);
                })
                .catch(err => console.error('Error fetching messages:', err));
        }
    }, [currentChat]);

    const fetchMessages = (chatId) => {
        setCurrentChat(chatId);
    };

    const sendMessage = () => {
        if (newMessage.trim() && userId && currentChat) {
            const messageData = {
                from: userId,
                to: currentChat,
                message: newMessage
            };
    
            // Directly update the messages state with the new message data
            setMessages(prevMessages => [...prevMessages, messageData]);
    
            axios.post('http://localhost:5000/api/messages', messageData, { withCredentials: true })
                .then((res) => {
                    socket.emit('send_message', res.data);
                    setNewMessage(''); // Clear the input field after sending
                })
                .catch(err => console.error('Error sending message:', err));
        }
    };
    

    const handleKeyPress = (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            sendMessage();
        }
    };

    const createGroup = () => {
        axios.post('http://localhost:5000/api/groups', {
            name: groupName,
            members: selectedMembers
        }, { withCredentials: true })
            .then(res => {
                setGroups(prevGroups => [...prevGroups, res.data]);
                setShowCreateGroup(false);
                setGroupName('');
                setSelectedMembers([]);
            })
            .catch(err => console.error('Error creating group:', err));
    };

    return (
        <div className="chat-container">
            <div className="sidebar">
                <h2>Contacts</h2>
                <button onClick={() => setShowCreateGroup(true)}>Create Group</button>
                <div className="user-list">
                    {users.map(user => (
                        <div
                            key={user._id}
                            onClick={() => fetchMessages(user._id)}
                            className={`user-item ${user._id === currentChat ? 'active' : ''}`}
                        >
                            <div className="user-avatar">
                                <img src={`https://ui-avatars.com/api/?name=${user.username}`} alt={user.username} />
                            </div>
                            <div className="user-info">
                                <span className="username">{user.username}</span>
                            </div>
                        </div>
                    ))}
                    <h2>Groups</h2>
                    {groups.map(group => (
                        <div
                            key={group._id}
                            onClick={() => fetchMessages(group._id)}
                            className={`user-item ${group._id === currentChat ? 'active' : ''}`}
                        >
                            <div className="user-avatar">
                                <img src={`https://ui-avatars.com/api/?name=${group.name}`} alt={group.name} />
                            </div>
                            <div className="user-info">
                                <span className="username">{group.name}</span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
            <div className="chat-box">
                {currentChat ? (
                    <>
                        <div className="chat-header">
                            <div className="chat-avatar">
                                <img src={`https://ui-avatars.com/api/?name=${users.find(user => user._id === currentChat)?.username || groups.find(group => group._id === currentChat)?.name}`} alt="Chat Avatar" />
                            </div>
                            <div className="chat-username">
                                {users.find(user => user._id === currentChat)?.username || groups.find(group => group._id === currentChat)?.name}
                            </div>
                        </div>
                        <div className="messages">
    {messages.map((msg, index) => {
        const isSentByCurrentUser = msg.from === userId;
        return (
            <div
                key={index}
                className={`message ${isSentByCurrentUser ? 'sent' : 'received'}`}
            >
                <div className="message-content">
                    <strong>{isSentByCurrentUser ? 'You' : 'Them'}:</strong> {msg.message}
                </div>
            </div>
        );
    })}
</div>

                        <div className="message-input">
                            <input
                                type="text"
                                value={newMessage}
                                onChange={e => setNewMessage(e.target.value)}
                                onKeyDown={handleKeyPress}
                                placeholder="Type a message"
                            />
                            <button onClick={sendMessage}>Send</button>
                        </div>
                    </>
                ) : (
                    <div className="welcome-screen">
                        <h1>Welcome to Chat</h1>
                        <p>Select a contact or group to start chatting.</p>
                    </div>
                )}
            </div>

            {showCreateGroup && (
                <div className="create-group-modal">
                    <div className="create-group-content">
                        <h2>Create Group</h2>
                        <input
                            type="text"
                            value={groupName}
                            onChange={e => setGroupName(e.target.value)}
                            placeholder="Group Name"
                        />
                        <div className="user-list">
                            {users.map(user => (
                                <div key={user._id} className="user-checkbox">
                                    <input
                                        type="checkbox"
                                        value={user._id}
                                        checked={selectedMembers.includes(user._id)}
                                        onChange={e => {
                                            if (e.target.checked) {
                                                setSelectedMembers(prev => [...prev, user._id]);
                                            } else {
                                                setSelectedMembers(prev => prev.filter(id => id !== user._id));
                                            }
                                        }}
                                    />
                                    <span>{user.username}</span>
                                </div>
                            ))}
                        </div>
                        <button onClick={createGroup}>Create</button>
                        <button onClick={() => setShowCreateGroup(false)}>Cancel</button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Chat;

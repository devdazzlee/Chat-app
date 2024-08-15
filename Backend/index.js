import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import cookieParser from 'cookie-parser';
import { Server } from 'socket.io';
import http from 'http';
import { User, Message, Group } from './Database/db.js'; // Import your Mongoose models

dotenv.config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: 'http://localhost:3000',
        methods: ['GET', 'POST'],
        credentials: true
    }
});

// Middleware
app.use(cors({
    origin: 'http://localhost:3000',
    credentials: true
}));
app.use(express.json());
app.use(cookieParser());

// Middleware to authenticate token
const authenticateToken = (req, res, next) => {
    const token = req.cookies.Token;
    if (!token) return res.status(401).json({ message: 'Access denied' });

    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) {
            if (err.name === 'TokenExpiredError') {
                return res.status(401).json({ message: 'Token expired. Please log in again.' });
            } else {
                return res.status(403).json({ message: 'Invalid token' });
            }
        }
        req.user = user;
        next();
    });
};


// API Endpoints
app.post('/api/register', async (req, res) => {
    const { username, password } = req.body;
    try {
        const existingUser = await User.findOne({ username });
        if (existingUser) return res.status(400).json({ message: 'Username already taken' });

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const newUser = new User({ username, password: hashedPassword });
        await newUser.save();

        res.status(201).json({ message: 'User registered successfully' });
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
});

app.post('/api/login', async (req, res) => {
    const { username, password } = req.body;
    try {
        const user = await User.findOne({ username });
        if (!user) return res.status(400).json({ message: 'Invalid credentials' });

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });

        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });

        res.cookie('Token', token, {
            maxAge: 86400000, // 1 day
            httpOnly: true,
            sameSite: 'lax',
            secure: false // Set to true if using HTTPS
        });

        res.json({ message: 'Login successful' });
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
});

app.post('/api/logout', (req, res) => {
    res.cookie('Token', '', {
        maxAge: 0,
        httpOnly: true,
        sameSite: 'lax',
        secure: false // Set to true in production with HTTPS
    });
    res.json({ message: 'Logout successful' });
});

app.get('/api/profile', authenticateToken, async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        if (!user) return res.status(404).json({ message: 'User not found' });

        res.json({ username: user.username, id: user._id });
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
});

app.get('/api/users', authenticateToken, async (req, res) => {
    try {
        const users = await User.find({ _id: { $ne: req.user.id } }).select('username _id');
        res.json(users);
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
});

app.post('/api/messages', authenticateToken, async (req, res) => {
    const { to, message } = req.body;
    try {
        const newMessage = new Message({
            from: req.user.id,
            to,
            message
        });
        await newMessage.save();

        // Emit message to the recipient's room
        io.to(to).emit('new_message', { from: req.user.id, message });
        res.status(201).json({ message: 'Message sent' });
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
});

app.get('/api/messages/:userId', authenticateToken, async (req, res) => {
    const { userId } = req.params;
    try {
        const messages = await Message.find({
            $or: [
                { from: req.user.id, to: userId },
                { from: userId, to: req.user.id }
            ]
        });
        res.json(messages);
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
});
// Create a new group
app.post('/api/messages/group', authenticateToken, async (req, res) => {
    const { groupId, message } = req.body;
    try {
        const group = await Group.findById(groupId);
        if (!group || !group.members.includes(req.user.id)) {
            return res.status(403).json({ message: 'Access denied' });
        }

        const newMessage = new Message({
            from: req.user.id,
            group: groupId,
            message
        });
        await newMessage.save();

        // Emit message to all group members
        group.members.forEach(memberId => {
            io.to(memberId.toString()).emit('new_message', { from: req.user.id, message, group: groupId });
        });
        res.status(201).json({ message: 'Message sent' });
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
});
app.post('/api/groups/leave', authenticateToken, async (req, res) => {
    const { groupId } = req.body;
    try {
        const group = await Group.findById(groupId);
        if (!group || !group.members.includes(req.user.id)) {
            return res.status(403).json({ message: 'Access denied' });
        }

        group.members = group.members.filter(memberId => memberId.toString() !== req.user.id);
        await group.save();

        res.status(200).json({ message: 'Left group successfully' });
    } catch (err) {
        res.status(500).json({ error: 'Failed to leave group' });
    }
});

app.post('/api/groups', authenticateToken, async (req, res) => {
    const { name, members } = req.body;
    try {
        const group = new Group({ name, members });
        await group.save();
        res.status(201).json(group);
    } catch (err) {
        res.status(500).json({ error: 'Failed to create group' });
    }
});

// Get all groups for the authenticated user
app.get('/api/groups', authenticateToken, async (req, res) => {
    const userId = req.user.id; // Ensure correct user ID field
    try {
        const groups = await Group.find({ members: userId }).populate('members', 'username');
        res.status(200).json(groups);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch groups' });
    }
});

app.delete('/api/groups/:groupId', authenticateToken, async (req, res) => {
    const { groupId } = req.params;
    try {
        // Ensure the user is a member of the group
        const group = await Group.findById(groupId);
        if (!group || !group.members.includes(req.user.id)) {
            return res.status(403).json({ message: 'Access denied' });
        }

        await Group.findByIdAndDelete(groupId);
        res.status(200).json({ message: 'Group deleted successfully' });
    } catch (err) {
        res.status(500).json({ error: 'Failed to delete group' });
    }
});


// Socket.IO connection handling
// Socket.IO connection handling
// Socket.IO connection handling
io.on('connection', (socket) => {
    console.log('A user connected');

    socket.on('join', (userId) => {
        socket.join(userId);
        console.log(`User ${userId} joined the room`);
    });

    socket.on('send_message', (messageData) => {
        console.log('Message received:', messageData);
        io.to(messageData.to).emit('new_message', messageData); // Emit message to recipient
    });

    socket.on('disconnect', () => {
        console.log('User disconnected');
    });
});



// Start server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));

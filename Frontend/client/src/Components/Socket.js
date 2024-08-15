import { io } from 'socket.io-client';

const Socket = io('https://chat-app-sand-phi.vercel.app', {
    withCredentials: true,
    extraHeaders: {
        "my-custom-header": "abcd"
    }
});

export default Socket;

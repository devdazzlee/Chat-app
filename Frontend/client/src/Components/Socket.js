import { io } from 'socket.io-client';

const Socket = io('http://localhost:5000', {
    withCredentials: true,
    extraHeaders: {
        "my-custom-header": "abcd"
    }
});

export default Socket;

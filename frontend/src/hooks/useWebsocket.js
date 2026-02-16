import { useEffect, useRef, useState, useCallback } from 'react';

const useWebsocket = (boardId) => {
    const socketRef = useRef(null);
    const [isConnected, setIsConnected] = useState(false);
    const [lastMessage, setLastMessage] = useState(null);

    useEffect(() => {
        if (!boardId) return;

        const token = localStorage.getItem('access_token');
        const wsUrl = `ws://localhost:8000/ws/board/${boardId}/${token ? `?token=${token}` : ''}`;
        socketRef.current = new WebSocket(wsUrl);

        socketRef.current.onopen = () => {
            console.log('Connected to board WebSocket');
            setIsConnected(true);
        };

        socketRef.current.onmessage = (event) => {
            const data = JSON.parse(event.data);
            console.log('WS Message:', data);
            setLastMessage(data);
        };

        socketRef.current.onclose = () => {
            console.log('Disconnected from board WebSocket');
            setIsConnected(false);
        };

        socketRef.current.onerror = (error) => {
            console.error('WebSocket Error:', error);
        };

        return () => {
            if (socketRef.current) {
                socketRef.current.close();
            }
        };
    }, [boardId]);

    const sendMessage = useCallback((data) => {
        if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
            socketRef.current.send(JSON.stringify(data));
        } else {
            console.warn('WebSocket is not open. Message not sent:', data);
        }
    }, []);

    return { isConnected, lastMessage, sendMessage };
};

export default useWebsocket;

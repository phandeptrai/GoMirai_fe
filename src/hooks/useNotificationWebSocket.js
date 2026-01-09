import { useState, useEffect, useCallback, useRef } from 'react';
import { Client } from '@stomp/stompjs';

const NOTIFICATION_SERVICE_URL = 'ws://localhost/ws'; // Via Nginx

/**
 * Hook to connect to Notification Service (WebSocket)
 * 
 * ĐẢM BẢO CHỈ 1 CONNECTION TẠI MỖI THỜI ĐIỂM:
 * - Sử dụng useRef để track connection state
 * - Cleanup khi userId thay đổi hoặc component unmount
 * - Không reconnect nếu đã connected với cùng userId
 * 
 * @param {string|null} userId - User ID (UUID) - null để disconnect
 * @returns {Object} { isConnected, lastNotification, clearNotification }
 */
const useNotificationWebSocket = (userId) => {
    const [isConnected, setIsConnected] = useState(false);
    const [lastNotification, setLastNotification] = useState(null);
    const stompClientRef = useRef(null);
    const currentUserIdRef = useRef(null);
    const isConnectingRef = useRef(false);

    useEffect(() => {
        // === CLEANUP LOGIC ===
        // Đóng connection cũ nếu userId thay đổi hoặc null
        const cleanup = () => {
            if (stompClientRef.current) {
                console.log('[NotificationWS] 🔌 Closing previous connection...');
                try {
                    stompClientRef.current.deactivate();
                } catch (e) {
                    console.warn('[NotificationWS] Error during deactivate:', e);
                }
                stompClientRef.current = null;
                currentUserIdRef.current = null;
                isConnectingRef.current = false;
                setIsConnected(false);
            }
        };

        // Nếu userId null hoặc undefined → chỉ cleanup, không connect
        if (!userId) {
            cleanup();
            return;
        }

        // Nếu đã connected với cùng userId → không làm gì
        if (currentUserIdRef.current === userId && stompClientRef.current) {
            console.log('[NotificationWS] ✓ Already connected for userId:', userId);
            return;
        }

        // Nếu đang trong quá trình connecting → không tạo connection mới
        if (isConnectingRef.current) {
            console.log('[NotificationWS] ⏳ Connection in progress, skipping...');
            return;
        }

        // Cleanup connection cũ trước khi tạo mới
        cleanup();

        // === CONNECTION LOGIC ===
        const token = localStorage.getItem('accessToken');
        
        if (!token) {
            console.warn('[NotificationWS] ⚠️ No access token found');
            return;
        }

        console.log('[NotificationWS] 🔌 Opening NEW connection for userId:', userId);
        isConnectingRef.current = true;

        const encodedToken = encodeURIComponent(token);
        const wsUrl = `${NOTIFICATION_SERVICE_URL}?token=${encodedToken}`;

        const client = new Client({
            brokerURL: wsUrl,
            reconnectDelay: 5000,
            heartbeatIncoming: 4000,
            heartbeatOutgoing: 4000,

            onConnect: () => {
                console.log('[NotificationWS] ✅ Connected successfully!');
                isConnectingRef.current = false;
                currentUserIdRef.current = userId;
                setIsConnected(true);

                // Subscribe to user-specific queue
                client.subscribe('/user/queue/realtime', (message) => {
                    try {
                        console.log('[NotificationWS] 📨 Received message');
                        const notification = JSON.parse(message.body);
                        console.log('[NotificationWS] ✅ Type:', notification.type);
                        setLastNotification(notification);
                    } catch (err) {
                        console.error('[NotificationWS] ❌ Parse error:', err);
                    }
                });
            },

            onDisconnect: () => {
                console.log('[NotificationWS] ⚠️ Disconnected');
                isConnectingRef.current = false;
                setIsConnected(false);
            },

            onStompError: (frame) => {
                console.error('[NotificationWS] ❌ STOMP error:', frame.headers['message']);
                isConnectingRef.current = false;
            },

            onWebSocketClose: (event) => {
                console.log('[NotificationWS] WebSocket closed, code:', event.code);
                isConnectingRef.current = false;
                if (event.code === 1008 || event.code === 4001) {
                    console.warn('[NotificationWS] ⚠️ Token rejected');
                }
            },

            onWebSocketError: (event) => {
                console.error('[NotificationWS] ❌ WebSocket error');
                isConnectingRef.current = false;
            },

            debug: (str) => {
                // Uncomment for verbose debug:
                // console.debug('[NotificationWS DEBUG]', str);
            }
        });

        client.activate();
        stompClientRef.current = client;

        // Cleanup function khi component unmount hoặc userId thay đổi
        return cleanup;
    }, [userId]);

    const clearNotification = useCallback(() => {
        setLastNotification(null);
    }, []);

    return {
        isConnected,
        lastNotification,
        clearNotification
    };
};

export default useNotificationWebSocket;

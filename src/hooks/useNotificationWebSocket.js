import { useState, useEffect, useCallback, useRef } from 'react';
import { Client } from '@stomp/stompjs';

const NOTIFICATION_SERVICE_URL = 'ws://localhost/ws'; // Via Nginx

/**
 * Hook to connect to Notification Service (WebSocket)
 * @param {string} userId - User ID (UUID)
 * @returns {Object} { isConnected, lastNotification }
 */
const useNotificationWebSocket = (userId) => {
    const [isConnected, setIsConnected] = useState(false);
    const [lastNotification, setLastNotification] = useState(null);
    const stompClientRef = useRef(null);

    useEffect(() => {
        if (!userId) return;

        console.log('[NotificationWS] Connecting for userId:', userId);

        const client = new Client({
            brokerURL: `${NOTIFICATION_SERVICE_URL}?userId=${userId}`,
            reconnectDelay: 5000,
            heartbeatIncoming: 4000,
            heartbeatOutgoing: 4000,

            onConnect: () => {
                console.log('[NotificationWS] ✅ Connected!');
                console.log('[NotificationWS] userId for connection:', userId);
                setIsConnected(true);

                // Subscribe to user-specific queue
                const subscription = client.subscribe('/user/queue/realtime', (message) => {
                    try {
                        console.log('[NotificationWS] 📨 RAW message.body:', message.body);
                        const notification = JSON.parse(message.body);
                        console.log('[NotificationWS] ✅ Received:', notification);
                        console.log('[NotificationWS] notification.type:', notification.type);
                        console.log('[NotificationWS] notification.payload:', notification.payload);
                        setLastNotification(notification);
                    } catch (err) {
                        console.error('[NotificationWS] ❌ Error parsing message:', err);
                    }
                });

                console.log('[NotificationWS] ✅ Subscribed to /user/queue/realtime', subscription);
            },

            onDisconnect: () => {
                console.log('[NotificationWS] Disconnected');
                setIsConnected(false);
            },

            onStompError: (frame) => {
                console.error('[NotificationWS] Broker reported error:', frame.headers['message']);
                console.error('[NotificationWS] Additional details:', frame.body);
            },

            // Netty/WebFlux friendly debug logging
            debug: (str) => {
                // console.debug(str); // Uncomment for verbose debug
            }
        });

        client.activate();
        stompClientRef.current = client;

        return () => {
            console.log('[NotificationWS] Deactivating...');
            if (stompClientRef.current) {
                stompClientRef.current.deactivate();
            }
        };
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

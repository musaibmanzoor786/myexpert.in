// Scripts for firebase and firebase messaging
importScripts('https://www.gstatic.com/firebasejs/10.9.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.9.0/firebase-messaging-compat.js');

// Default config structure. In production, this would be injected via build step or
// read from query params. We will init with minimum required.
// Since the SW cannot easily read env vars dynamically in Next.js without a custom route,
// the client registers this SW and passes the config via URL or standard init.
const config = new URL(location).searchParams.get("config");

if (config) {
    firebase.initializeApp(JSON.parse(decodeURIComponent(config)));
    const messaging = firebase.messaging();
    
    messaging.onBackgroundMessage((payload) => {
        const notificationTitle = payload.notification?.title || 'New Notification';
        const notificationOptions = {
            body: payload.notification?.body,
            icon: '/icon-192x192.png',
            vibrate: [200, 100, 200, 100, 200, 100, 200],
            actions: [
                { action: 'open', title: 'Open App' }
            ]
        };
    
        self.registration.showNotification(notificationTitle, notificationOptions);
    });
}

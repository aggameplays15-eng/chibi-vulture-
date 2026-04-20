import { apiService } from './api';

const APPLICATION_SERVER_KEY = 'applicationServerKey';

export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (!('serviceWorker' in navigator)) {
    console.log('[Push] Service workers not supported');
    return null;
  }

  try {
    const registration = await navigator.serviceWorker.register('/sw.js');
    console.log('[Push] Service Worker registered:', registration.scope);
    return registration;
  } catch (error) {
    console.error('[Push] Service Worker registration failed:', error);
    return null;
  }
}

export async function subscribeToPushNotifications(): Promise<boolean> {
  if (!('PushManager' in window)) {
    console.log('[Push] Push notifications not supported');
    return false;
  }

  try {
    // Get VAPID public key from server
    const { publicKey } = await apiService.getVapidPublicKey();
    if (!publicKey) {
      console.log('[Push] Server does not support push notifications');
      return false;
    }

    // Register service worker
    const registration = await registerServiceWorker();
    if (!registration) return false;

    // Get or create push subscription
    let subscription = await registration.pushManager.getSubscription();
    
    if (!subscription) {
      // Convert VAPID key to Uint8Array
      const applicationServerKey = urlBase64ToUint8Array(publicKey);
      
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: applicationServerKey as BufferSource,
      });
    }

    // Send subscription to server
    await apiService.subscribeToPush(subscription);
    console.log('[Push] Subscribed successfully');
    return true;
  } catch (error) {
    console.error('[Push] Subscription failed:', error);
    return false;
  }
}

export async function unsubscribeFromPushNotifications(): Promise<boolean> {
  if (!('serviceWorker' in navigator)) return false;

  try {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();
    
    if (subscription) {
      await subscription.unsubscribe();
    }
    
    await apiService.unsubscribeFromPush();
    console.log('[Push] Unsubscribed successfully');
    return true;
  } catch (error) {
    console.error('[Push] Unsubscribe failed:', error);
    return false;
  }
}

export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!('Notification' in window)) {
    console.log('[Push] Notifications not supported');
    return 'denied';
  }

  const permission = await Notification.requestPermission();
  return permission;
}

export async function isPushNotificationSupported(): Promise<boolean> {
  return 'serviceWorker' in navigator && 
         'PushManager' in window && 
         'Notification' in window;
}

export async function getPushSubscriptionStatus(): Promise<{
  supported: boolean;
  subscribed: boolean;
  permission: NotificationPermission;
}> {
  const supported = await isPushNotificationSupported();
  
  if (!supported) {
    return { supported: false, subscribed: false, permission: 'denied' };
  }

  const permission = Notification.permission;
  
  if (!('serviceWorker' in navigator)) {
    return { supported: true, subscribed: false, permission };
  }

  try {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();
    return { supported: true, subscribed: !!subscription, permission };
  } catch {
    return { supported: true, subscribed: false, permission };
  }
}

// Utility function to convert VAPID key
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

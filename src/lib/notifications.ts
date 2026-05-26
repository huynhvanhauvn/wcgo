
/**
 * Browser Notification Utility
 */

export async function requestNotificationPermission() {
  if (typeof window === "undefined" || !("Notification" in window)) {
    return false;
  }

  if (Notification.permission === "granted") return true;

  try {
    const permission = await Notification.requestPermission();
    return permission === "granted";
  } catch (e) {
    return false;
  }
}

export function sendBrowserNotification(title: string, body: string, icon: string = '/favicon.ico') {
  if (typeof window !== "undefined" && "Notification" in window && Notification.permission === "granted" && document.hidden) {
    try {
      new Notification(title, {
        body,
        icon,
        badge: icon,
        silent: false
      });
    } catch (e) {
      console.error("Failed to send notification:", e);
    }
  }
}

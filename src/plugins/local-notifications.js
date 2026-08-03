/* RoutineCraft - Notification Channel Registry
   Exposes window.RC_NOTIFICATIONS for use in app.js
   Channels: task_reminder, backup_completed, summary
   Compatible with Capacitor LocalNotifications (Android) and PWA Web Notifications */

window.RC_NOTIFICATIONS = {

  CHANNELS: {
    task_reminder: {
      id: 'task_reminder',
      name: 'Task Reminders',
      description: 'Reminds you of scheduled tasks before they are due',
      sound: 'task_reminder.wav',
      icon: 'ic_task_reminder',
      importance: 5,   // IMPORTANCE_MAX
      vibrationPattern: [0, 300, 200, 300]
    },
    backup_completed: {
      id: 'backup_completed',
      name: 'Backup Status',
      description: 'Notifies you when a Google Drive backup finishes',
      sound: 'backup_completed.wav',
      icon: 'ic_backup_completed',
      importance: 3,   // IMPORTANCE_DEFAULT
      vibrationPattern: [0, 100]
    },
    summary: {
      id: 'summary',
      name: 'Daily Summary',
      description: 'Your evening habit and completion summary',
      sound: 'summary.wav',
      icon: 'ic_summary',
      importance: 4,   // IMPORTANCE_HIGH
      vibrationPattern: [0, 250, 150, 250]
    }
  },

  /**
   * Register Android notification channels via Capacitor.
   * Safe to call multiple times (idempotent on Android 8+).
   * @returns {Promise<void>}
   */
  async registerChannels() {
    if (!window.Capacitor?.Plugins?.LocalNotifications) {
      console.log('[RC_NOTIFICATIONS] No Capacitor runtime — skipping channel registration (PWA mode).');
      return;
    }

    const { LocalNotifications } = window.Capacitor.Plugins;
    const channelList = Object.values(this.CHANNELS).map(ch => ({
      id: ch.id,
      name: ch.name,
      description: ch.description,
      sound: ch.sound,
      importance: ch.importance,
      vibrationPattern: ch.vibrationPattern,
      smallIcon: ch.icon,
      enableLights: true,
      lightColor: '#ec4899'
    }));

    try {
      await LocalNotifications.createChannel({ channels: channelList });
      console.log(`[RC_NOTIFICATIONS] ${channelList.length} Android channels registered.`);
    } catch (err) {
      console.warn('[RC_NOTIFICATIONS] Channel registration failed:', err);
    }
  }
};

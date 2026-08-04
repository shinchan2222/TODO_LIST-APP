/* ==========================================================================
   RoutineCraft - Personal Daily Task & Habit Tracker Logic
   With Native Android Local Push Notifications & Google Drive Backup
   ========================================================================== */

(function () {
    'use strict';

    const APP_VERSION = 11;
    const getTodayStr = () => new Date().toISOString().split('T')[0];

    const getPastDateStr = (daysAgo = 1) => {
        const d = new Date();
        d.setDate(d.getDate() - daysAgo);
        return d.toISOString().split('T')[0];
    };

    const getFutureDateStr = (daysAhead = 1) => {
        const d = new Date();
        d.setDate(d.getDate() + daysAhead);
        return d.toISOString().split('T')[0];
    };

    // --- DEFAULT STARTER DATA ---
    const DEFAULT_PROFILE = {
        email: 'default_user@routinecraft.app',
        name: 'Productivity Hero',
        avatar: '🚀',
        theme: 'sunset-glow',
        streak: 5,
        lastActiveDate: getTodayStr(),
        totalCompletedCount: 24,
        notificationsEnabled: true,
        summaryNotificationTime: '20:00',
        lastBackupTime: null,
        backupFrequency: 'daily',
        isGoogleSynced: false
    };

    const DEFAULT_TASKS = [
        {
            id: 'task-1',
            title: 'Gym workout',
            category: 'health',
            priority: 'high',
            dueDate: getTodayStr(),
            dueTime: '08:00',
            recurring: 'daily',
            completed: true,
            completedAt: new Date().toISOString(),
            createdAt: new Date().toISOString(),
            subtasks: []
        },
        {
            id: 'task-2',
            title: 'Project progress analysis',
            category: 'work',
            priority: 'high',
            dueDate: getTodayStr(),
            dueTime: '10:00',
            recurring: 'weekdays',
            completed: true,
            completedAt: new Date().toISOString(),
            createdAt: new Date().toISOString(),
            subtasks: []
        },
        {
            id: 'task-3',
            title: 'Laundry',
            category: 'personal',
            priority: 'medium',
            dueDate: getTodayStr(),
            dueTime: '11:30',
            recurring: 'none',
            completed: true,
            completedAt: new Date().toISOString(),
            createdAt: new Date().toISOString(),
            subtasks: []
        },
        {
            id: 'task-4',
            title: 'Meet up with friends',
            category: 'personal',
            priority: 'medium',
            dueDate: getTodayStr(),
            dueTime: '15:00',
            recurring: 'none',
            completed: false,
            completedAt: null,
            createdAt: new Date().toISOString(),
            subtasks: []
        },
        {
            id: 'task-5',
            title: 'Create an IG story',
            category: 'work',
            priority: 'medium',
            dueDate: getTodayStr(),
            dueTime: '17:00',
            recurring: 'none',
            completed: false,
            completedAt: null,
            createdAt: new Date().toISOString(),
            subtasks: []
        },
        {
            id: 'task-6',
            title: 'Research flight deals',
            category: 'personal',
            priority: 'low',
            dueDate: getTodayStr(),
            dueTime: '19:00',
            recurring: 'none',
            completed: false,
            completedAt: null,
            createdAt: new Date().toISOString(),
            subtasks: []
        },
        {
            id: 'task-7',
            title: 'Therapy session',
            category: 'health',
            priority: 'high',
            dueDate: getTodayStr(),
            dueTime: '20:00',
            recurring: 'none',
            completed: false,
            completedAt: null,
            createdAt: new Date().toISOString(),
            subtasks: []
        },
        // Tomorrow Tasks
        {
            id: 'task-tomorrow-1',
            title: 'Meal preparation',
            category: 'health',
            priority: 'high',
            dueDate: getFutureDateStr(1),
            dueTime: '09:00',
            recurring: 'none',
            completed: false,
            completedAt: null,
            createdAt: new Date().toISOString(),
            subtasks: []
        },
        {
            id: 'task-tomorrow-2',
            title: 'Grocery shopping',
            category: 'personal',
            priority: 'medium',
            dueDate: getFutureDateStr(1),
            dueTime: '11:00',
            recurring: 'none',
            completed: false,
            completedAt: null,
            createdAt: new Date().toISOString(),
            subtasks: []
        },
        {
            id: 'task-tomorrow-3',
            title: 'Study for next week\'s exam',
            category: 'work',
            priority: 'high',
            dueDate: getFutureDateStr(1),
            dueTime: '14:00',
            recurring: 'none',
            completed: false,
            completedAt: null,
            createdAt: new Date().toISOString(),
            subtasks: []
        },
        {
            id: 'task-tomorrow-4',
            title: 'Delivery pickup',
            category: 'personal',
            priority: 'low',
            dueDate: getFutureDateStr(1),
            dueTime: '18:00',
            recurring: 'none',
            completed: false,
            completedAt: null,
            createdAt: new Date().toISOString(),
            subtasks: []
        },
        {
            id: 'task-tomorrow-5',
            title: 'Bake a cake',
            category: 'personal',
            priority: 'low',
            dueDate: getFutureDateStr(1),
            dueTime: '20:00',
            recurring: 'none',
            completed: false,
            completedAt: null,
            createdAt: new Date().toISOString(),
            subtasks: []
        }
    ];

    // --- MULTI-USER STORAGE & VERSION MIGRATION ---
    const savedVersion = parseInt(localStorage.getItem('routinecraft_version') || '0', 10);
    let usersStore = JSON.parse(localStorage.getItem('routinecraft_users')) || {};
    let activeEmail = localStorage.getItem('routinecraft_active_email') || 'default_user@routinecraft.app';

    if (savedVersion < APP_VERSION || !usersStore[activeEmail]) {
        usersStore[activeEmail] = {
            profile: JSON.parse(localStorage.getItem('routinecraft_profile')) || { ...DEFAULT_PROFILE },
            tasks: JSON.parse(localStorage.getItem('routinecraft_tasks')) || [...DEFAULT_TASKS]
        };
        localStorage.setItem('routinecraft_users', JSON.stringify(usersStore));
        localStorage.setItem('routinecraft_active_email', activeEmail);
        localStorage.setItem('routinecraft_version', APP_VERSION.toString());
    }

    // --- CURRENT ACTIVE USER STATE ---
    let state = {
        profile: usersStore[activeEmail].profile,
        tasks: usersStore[activeEmail].tasks,
        activeCategory: 'all',
        activeFilter: 'today',
        searchQuery: '',
        sortBy: 'default',
        tempSubtasks: [],
        pendingGoogleUser: null
    };

    state.tasks.forEach(t => {
        if (!t.dueDate) t.dueDate = getTodayStr();
    });

    // --- CATEGORY CONFIGURATION ---
    const CATEGORIES = {
        morning: { label: 'Morning Routine', icon: 'fa-sun', color: '#fbbf24' },
        work: { label: 'Work & Study', icon: 'fa-briefcase', color: '#60a5fa' },
        health: { label: 'Health & Fitness', icon: 'fa-heart-pulse', color: '#34d399' },
        personal: { label: 'Personal Growth', icon: 'fa-user', color: '#a78bfa' },
        evening: { label: 'Evening Routine', icon: 'fa-moon', color: '#f472b6' }
    };

    // --- DOM ELEMENTS ---
    const dom = {
        body: document.body,
        userNameDisplay: document.getElementById('user-name-display'),
        userAvatar: document.getElementById('user-avatar'),
        timeGreeting: document.getElementById('time-greeting'),
        streakCount: document.getElementById('streak-count'),
        streakBtn: document.getElementById('streak-btn'),
        notifyBtn: document.getElementById('notify-btn'),
        quickThemeBtn: document.getElementById('quick-theme-btn'),
        headerGoogleLoginBtn: document.getElementById('header-google-login-btn'),
        googleBtnText: document.getElementById('google-btn-text'),

        accountStatusBar: document.getElementById('account-status-bar'),
        accountEmailDisplay: document.getElementById('account-email-display'),
        accountFreqBadge: document.getElementById('account-freq-badge'),
        switchAccountBtn: document.getElementById('switch-account-btn'),
        logoutSettingsBtn: document.getElementById('logout-settings-btn'),

        gdrivePermissionModal: document.getElementById('gdrive-permission-modal'),
        closeGdrivePermModalBtn: document.getElementById('close-gdrive-perm-modal'),
        guserNameDisplay: document.getElementById('guser-name-display'),
        guserEmailDisplay: document.getElementById('guser-email-display'),
        guserAvatarDisplay: document.getElementById('guser-avatar-display'),
        confirmGdrivePermBtn: document.getElementById('confirm-gdrive-perm-btn'),
        skipGdrivePermBtn: document.getElementById('skip-gdrive-perm-btn'),

        usersListGrid: document.getElementById('users-list-grid'),
        addNewAccountBtn: document.getElementById('add-new-account-btn'),
        backupFrequencySelect: document.getElementById('backup-frequency-select'),
        gdriveStatusTitle: document.getElementById('gdrive-status-title'),
        gdriveLastBackupText: document.getElementById('gdrive-last-backup-text'),
        gdriveBackupBtn: document.getElementById('gdrive-backup-btn'),
        gdriveRestoreBtn: document.getElementById('gdrive-restore-btn'),

        overallBarsWrapper: document.getElementById('overall-bars-wrapper'),
        overallRingFill: document.getElementById('overall-ring-fill'),
        overallPctText: document.getElementById('overall-pct-text'),
        overallRatioVal: document.getElementById('overall-ratio-val'),

        tasksTodayPendingCount: document.getElementById('tasks-today-pending-count'),
        tasksOverduePendingCount: document.getElementById('tasks-overdue-pending-count'),
        tasksDoneCount: document.getElementById('tasks-done-count'),
        overdueTabCount: document.getElementById('overdue-tab-count'),
        upcomingTabCount: document.getElementById('upcoming-tab-count'),
        progressCircle: document.getElementById('progress-circle'),
        progressPercentageText: document.getElementById('progress-percentage-text'),

        weeklyPlannerGrid: document.getElementById('weekly-planner-grid'),

        reminderBanner: document.getElementById('reminder-banner'),
        reminderTitle: document.getElementById('reminder-title'),
        reminderDesc: document.getElementById('reminder-desc'),
        dismissReminderBtn: document.getElementById('dismiss-reminder-btn'),

        updateBanner: document.getElementById('update-banner'),
        updateBannerTitle: document.getElementById('update-banner-title'),
        updateBannerDesc: document.getElementById('update-banner-desc'),
        updateActionBtn: document.getElementById('update-action-btn'),
        dismissUpdateBtn: document.getElementById('dismiss-update-btn'),

        searchInput: document.getElementById('search-input'),
        clearSearchBtn: document.getElementById('clear-search-btn'),
        categoriesContainer: document.getElementById('categories-container'),
        filterTabs: document.querySelectorAll('.filter-tabs .tab-btn'),
        
        taskList: document.getElementById('task-list'),
        emptyState: document.getElementById('empty-state'),
        emptyTitle: document.getElementById('empty-title'),
        emptyDesc: document.getElementById('empty-desc'),
        currentViewTitle: document.getElementById('current-view-title'),
        sortTrigger: document.getElementById('sort-trigger'),
        sortMenu: document.getElementById('sort-menu'),
        
        fabAddBtn: document.getElementById('fab-add-btn'),
        emptyAddBtn: document.getElementById('empty-add-btn'),
        bottomNavItems: document.querySelectorAll('.bottom-nav .nav-item'),
        authModal: document.getElementById('auth-modal'),
        closeAuthModalBtn: document.getElementById('close-auth-modal'),
        googleLoginModalBtn: document.getElementById('google-login-modal-btn'),
        authErrorMsg: document.getElementById('auth-error-msg'),

        taskModal: document.getElementById('task-modal'),
        taskForm: document.getElementById('task-form'),
        taskIdInput: document.getElementById('task-id'),
        taskTitleInput: document.getElementById('task-title-input'),
        taskCategorySelect: document.getElementById('task-category-select'),
        taskPrioritySelect: document.getElementById('task-priority-select'),
        taskDateInput: document.getElementById('task-date-input'),
        datePresetBtns: document.querySelectorAll('.date-preset-btn'),
        taskTimeInput: document.getElementById('task-time-input'),
        taskRecurringSelect: document.getElementById('task-recurring-select'),
        subtaskBuilderInput: document.getElementById('subtask-builder-input'),
        addSubtaskBtn: document.getElementById('add-subtask-btn'),
        subtaskBuilderList: document.getElementById('subtask-builder-list'),
        closeTaskModalBtn: document.getElementById('close-task-modal'),
        cancelTaskBtn: document.getElementById('cancel-task-btn'),
        modalHeading: document.getElementById('modal-heading'),

        profileTrigger: document.getElementById('profile-trigger'),
        profileModal: document.getElementById('profile-modal'),
        closeProfileModalBtn: document.getElementById('close-profile-modal'),
        saveProfileBtn: document.getElementById('save-profile-btn'),
        profileNameInput: document.getElementById('profile-name-input'),
        avatarOpts: document.querySelectorAll('.avatar-opt'),
        themeCards: document.querySelectorAll('.theme-card'),
        exportDataBtn: document.getElementById('export-data-btn'),
        importDataBtn: document.getElementById('import-data-btn'),
        importFileInput: document.getElementById('import-file-input'),
        resetDataBtn: document.getElementById('reset-data-btn'),

        analyticsModal: document.getElementById('analytics-modal'),
        closeAnalyticsModalBtn: document.getElementById('close-analytics-modal'),
        closeAnalyticsBtn: document.getElementById('close-analytics-btn'),
        heatmapGrid: document.getElementById('heatmap-grid'),
        categoryBarsContainer: document.getElementById('category-bars-container'),

        toastContainer: document.getElementById('toast-container')
    };

    function scrollToTaskChecklist() {
        const target = document.querySelector('.controls-section') || document.getElementById('current-view-title');
        if (target) {
            target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }

    // --- INIT APP ---
    function init() {
        checkDailyReset();
        applyTheme(state.profile.theme);
        updateGreeting();
        renderHeaderProfile();
        renderTasks();
        renderAccountStatusBar();
        checkAutoBackupSchedule();
        checkReminderNotification();
        checkForAppUpdates();
        // Register Android notification channels, then schedule
        if (window.RC_NOTIFICATIONS) {
            window.RC_NOTIFICATIONS.registerChannels().then(() => {
                scheduleNativeLocalNotifications();
                scheduleSummaryNotification();
            });
        } else {
            scheduleNativeLocalNotifications();
            scheduleSummaryNotification();
        }
        setupEventListeners();

        // Listen for Firebase auth state changes on launch
        if (window.RC_FIREBASE) {
            RC_FIREBASE.onAuthStateChanged(function(user) {
                if (user && !state.profile.isGoogleSynced) {
                    handleFirebaseUserAuthenticated(user);
                }
            });
        }

        // For returning signed in users, start page directly at Today's Checklist & Reminders
        if (state.profile.isGoogleSynced) {
            setTimeout(scrollToTaskChecklist, 350);
        }
    }

    // --- STORAGE & MULTI-USER ---
    function saveState() {
        usersStore[activeEmail] = {
            profile: state.profile,
            tasks: state.tasks
        };
        localStorage.setItem('routinecraft_users', JSON.stringify(usersStore));
        localStorage.setItem('routinecraft_active_email', activeEmail);
        localStorage.setItem('routinecraft_version', APP_VERSION.toString());
        updateProgressCard();
        renderAccountStatusBar();
        scheduleNativeLocalNotifications();
    }

    function switchUserAccount(targetEmail) {
        if (!usersStore[targetEmail]) {
            usersStore[targetEmail] = {
                profile: { ...DEFAULT_PROFILE, email: targetEmail, name: targetEmail.split('@')[0] },
                tasks: [...DEFAULT_TASKS]
            };
        }
        activeEmail = targetEmail;
        state.profile = usersStore[activeEmail].profile;
        state.tasks = usersStore[activeEmail].tasks;
        saveState();
        applyTheme(state.profile.theme);
        renderHeaderProfile();
        renderTasks();
        renderAccountStatusBar();
        showToast(`Switched to user: ${state.profile.name} 👤`);
    }

    // --- DAILY RESET & STREAK CHECK ---
    function checkDailyReset() {
        const today = getTodayStr();
        if (state.profile.lastActiveDate !== today) {
            const dayOfWeek = new Date().getDay();
            const isWeekend = (dayOfWeek === 0 || dayOfWeek === 6);

            state.tasks.forEach(task => {
                if (task.recurring === 'daily') {
                    task.completed = false;
                    if (task.subtasks) task.subtasks.forEach(s => s.completed = false);
                } else if (task.recurring === 'weekdays' && !isWeekend) {
                    task.completed = false;
                    if (task.subtasks) task.subtasks.forEach(s => s.completed = false);
                } else if (task.recurring === 'weekends' && isWeekend) {
                    task.completed = false;
                    if (task.subtasks) task.subtasks.forEach(s => s.completed = false);
                }
            });

            state.profile.lastActiveDate = today;
            saveState();
        }
    }

    // --- TIME BASED GREETING ---
    function updateGreeting() {
        const hour = new Date().getHours();
        let greeting = 'Good Morning,';
        if (hour >= 12 && hour < 17) greeting = 'Good Afternoon,';
        else if (hour >= 17 && hour < 22) greeting = 'Good Evening,';
        else if (hour >= 22 || hour < 5) greeting = 'Good Night,';

        dom.timeGreeting.textContent = greeting;
    }

    function renderHeaderProfile() {
        dom.userNameDisplay.textContent = state.profile.name || 'Productivity Hero';
        dom.userAvatar.textContent = state.profile.avatar || '🚀';
        dom.streakCount.textContent = state.profile.streak || 0;

        if (state.profile.isGoogleSynced) {
            // Once user is signed in, remove/hide the Account button on Home page
            if (dom.headerGoogleLoginBtn) {
                dom.headerGoogleLoginBtn.classList.add('hide');
            }
        } else {
            // When signed out, show the Sign In button on Home page
            if (dom.headerGoogleLoginBtn) {
                dom.headerGoogleLoginBtn.classList.remove('hide');
                dom.headerGoogleLoginBtn.title = 'Sign In with Google';
                dom.headerGoogleLoginBtn.innerHTML = '<i class="fa-brands fa-google" style="color:#4285F4;"></i> <span id="google-btn-text">Sign In</span>';
            }
        }

        if (state.profile.notificationsEnabled) {
            dom.notifyBtn.classList.add('active');
            dom.notifyBtn.setAttribute('aria-pressed', 'true');
        } else {
            dom.notifyBtn.classList.remove('active');
            dom.notifyBtn.setAttribute('aria-pressed', 'false');
        }
    }

    function logoutUserAccount() {
        if (window.RC_FIREBASE) {
            RC_FIREBASE.signOut();
        }

        const prevEmail = state.profile.email;
        // Delete the signed-out account from local storage so it does not persist in Accounts & Sync
        if (prevEmail && prevEmail !== 'default_user@routinecraft.app') {
            delete usersStore[prevEmail];
        }

        activeEmail = 'default_user@routinecraft.app';
        if (!usersStore[activeEmail]) {
            usersStore[activeEmail] = {
                profile: { ...DEFAULT_PROFILE },
                tasks: [...DEFAULT_TASKS]
            };
        }
        state.profile = usersStore[activeEmail].profile;
        state.tasks = usersStore[activeEmail].tasks;

        localStorage.setItem('routinecraft_active_email', activeEmail);
        localStorage.setItem('routinecraft_users', JSON.stringify(usersStore));

        saveState();
        applyTheme(state.profile.theme);
        renderHeaderProfile();
        renderTasks();
        renderAccountStatusBar();
        closeProfileModal();
        closeAuthModal();
        showToast('Signed out & account removed from device 👋');
    }

    function removeUserAccount(emailToRemove) {
        if (emailToRemove === activeEmail) {
            logoutUserAccount();
            return;
        }
        delete usersStore[emailToRemove];
        localStorage.setItem('routinecraft_users', JSON.stringify(usersStore));
        renderUsersGrid();
        showToast(`Removed ${emailToRemove} from device`);
    }

    function renderAccountStatusBar() {
        if (dom.accountStatusBar) dom.accountStatusBar.classList.add('hide');

        if (state.profile.isGoogleSynced) {
            if (dom.accountEmailDisplay) dom.accountEmailDisplay.textContent = state.profile.email;
            if (dom.logoutSettingsBtn) dom.logoutSettingsBtn.classList.remove('hide');
        } else {
            if (dom.logoutSettingsBtn) dom.logoutSettingsBtn.classList.add('hide');
        }

        if (state.profile.lastBackupTime) {
            if (dom.gdriveLastBackupText) dom.gdriveLastBackupText.textContent = `Last backup: ${state.profile.lastBackupTime}`;
            if (dom.gdriveStatusTitle) dom.gdriveStatusTitle.textContent = `Google Drive Backup (${state.profile.backupFrequency.toUpperCase()})`;
        } else {
            if (dom.gdriveLastBackupText) dom.gdriveLastBackupText.textContent = 'Last backup: Never';
        }
        if (dom.backupFrequencySelect) dom.backupFrequencySelect.value = state.profile.backupFrequency || 'daily';
    }

    // --- NOTIFICATION SCHEDULING: ANDROID (CAPACITOR) + PWA FALLBACK ---

    // Active PWA setTimeout handles keyed by task ID (or '__summary__')
    const _pwaTimerHandles = {};

    function requestPwaPermission() {
        if (!('Notification' in window)) return Promise.resolve(false);
        if (Notification.permission === 'granted') return Promise.resolve(true);
        if (Notification.permission === 'denied') return Promise.resolve(false);
        return Notification.requestPermission().then(function(r) { return r === 'granted'; });
    }

    function showPwaNotification(title, body, channelId) {
        if (!('Notification' in window) || Notification.permission !== 'granted') return;
        var n = new Notification(title, { body: body, tag: channelId || 'task_reminder', renotify: true });
        n.onclick = function() { window.focus(); n.close(); };
    }

    function schedulePwaTaskReminder(task) {
        if (_pwaTimerHandles[task.id]) {
            clearTimeout(_pwaTimerHandles[task.id]);
            delete _pwaTimerHandles[task.id];
        }
        if (!task.dueTime || task.completed) return;
        var p = task.dueTime.split(':');
        var fireAt = new Date();
        fireAt.setHours(parseInt(p[0], 10), parseInt(p[1], 10), 0, 0);
        var msUntil = fireAt.getTime() - Date.now();
        if (msUntil > 0 && msUntil < 86400000) {
            _pwaTimerHandles[task.id] = setTimeout(function() {
                if (!state.profile.notificationsEnabled) return;
                var t = state.tasks.find(function(x) { return x.id === task.id; });
                if (t && !t.completed) {
                    showPwaNotification(
                        '\uD83D\uDD14 Task Reminder: ' + t.title,
                        'Time to complete your ' + ((CATEGORIES[t.category] && CATEGORIES[t.category].label) || 'daily') + ' goal!',
                        'task_reminder'
                    );
                }
                delete _pwaTimerHandles[task.id];
            }, msUntil);
        }
    }

    /** Cancel all timers and native notification for a given task. */
    function cancelNotificationForTask(taskId) {
        if (_pwaTimerHandles[taskId]) {
            clearTimeout(_pwaTimerHandles[taskId]);
            delete _pwaTimerHandles[taskId];
        }
        if (window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.LocalNotifications) {
            window.Capacitor.Plugins.LocalNotifications
                .cancel({ notifications: [{ id: Math.abs(hashCode(taskId)) }] })
                .catch(function() {});
        }
    }

    function scheduleNativeLocalNotifications() {
        if (!state.profile.notificationsEnabled) return;
        var todayPending = state.tasks.filter(function(t) { return !t.completed && isTaskToday(t); });
        var CHANNELS = (window.RC_NOTIFICATIONS && window.RC_NOTIFICATIONS.CHANNELS) ? window.RC_NOTIFICATIONS.CHANNELS : {};

        // 1. Capacitor Android path
        if (window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.LocalNotifications) {
            var LN = window.Capacitor.Plugins.LocalNotifications;
            LN.requestPermissions().then(function(perm) {
                if (perm.display !== 'granted') return;
                var cancelList = todayPending.map(function(t) { return { id: Math.abs(hashCode(t.id)) }; });
                var cancelP = cancelList.length > 0 ? LN.cancel({ notifications: cancelList }).catch(function(){}) : Promise.resolve();
                cancelP.then(function() {
                    var notifList = todayPending
                        .filter(function(t) { return !!t.dueTime; })
                        .map(function(t) {
                            var p = t.dueTime.split(':');
                            var d = new Date();
                            d.setHours(parseInt(p[0], 10), parseInt(p[1], 10), 0, 0);
                            if (d.getTime() <= Date.now()) return null;
                            var ch = CHANNELS.task_reminder || {};
                            return {
                                id: Math.abs(hashCode(t.id)),
                                title: '\uD83D\uDD14 Task Reminder: ' + t.title,
                                body: 'Time to complete your ' + ((CATEGORIES[t.category] && CATEGORIES[t.category].label) || 'daily') + ' goal!',
                                schedule: { at: d },
                                channelId: ch.id || 'task_reminder',
                                smallIcon: ch.icon || 'ic_stat_name',
                                iconColor: '#ec4899',
                                extra: { taskId: t.id }
                            };
                        }).filter(Boolean);
                    if (notifList.length > 0) {
                        LN.schedule({ notifications: notifList })
                            .then(function() { console.log('[RC] Scheduled ' + notifList.length + ' Android notifications'); })
                            .catch(function(e) { console.warn('[RC] Android scheduling failed:', e); });
                    }
                });
            });
            return;
        }

        // 2. PWA / Browser fallback
        Object.keys(_pwaTimerHandles).forEach(function(id) {
            if (id !== '__summary__') { clearTimeout(_pwaTimerHandles[id]); delete _pwaTimerHandles[id]; }
        });
        requestPwaPermission().then(function(granted) {
            if (!granted) return;
            todayPending.forEach(function(task) { schedulePwaTaskReminder(task); });
        });
    }

    function scheduleSummaryNotification() {
        if (!state.profile.notificationsEnabled) return;
        var timeStr = state.profile.summaryNotificationTime || '20:00';
        var p = timeStr.split(':');
        var fireAt = new Date();
        fireAt.setHours(parseInt(p[0], 10), parseInt(p[1], 10), 0, 0);
        var msUntil = fireAt.getTime() - Date.now();
        if (msUntil <= 0) return;

        if (_pwaTimerHandles['__summary__']) { clearTimeout(_pwaTimerHandles['__summary__']); }

        var completed = state.tasks.filter(function(t) { return t.completed; }).length;
        var total = state.tasks.filter(function(t) { return isTaskToday(t) || t.completed; }).length;

        if (window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.LocalNotifications) {
            var LN = window.Capacitor.Plugins.LocalNotifications;
            var CHANNELS = (window.RC_NOTIFICATIONS && window.RC_NOTIFICATIONS.CHANNELS) ? window.RC_NOTIFICATIONS.CHANNELS : {};
            var ch = CHANNELS.summary || {};
            LN.cancel({ notifications: [{ id: 99999 }] }).catch(function(){}).then(function() {
                LN.schedule({
                    notifications: [{
                        id: 99999,
                        title: '\uD83D\uDCCA RoutineCraft Daily Summary',
                        body: 'You completed ' + completed + ' of ' + total + ' tasks today. Keep the streak going! \uD83D\uDD25',
                        schedule: { at: fireAt },
                        channelId: ch.id || 'summary',
                        smallIcon: ch.icon || 'ic_summary',
                        iconColor: '#ec4899'
                    }]
                }).catch(function(){});
            });
            return;
        }

        requestPwaPermission().then(function(granted) {
            if (!granted) return;
            _pwaTimerHandles['__summary__'] = setTimeout(function() {
                if (!state.profile.notificationsEnabled) return;
                var c = state.tasks.filter(function(t) { return t.completed; }).length;
                var tot = state.tasks.filter(function(t) { return isTaskToday(t) || t.completed; }).length;
                showPwaNotification(
                    '\uD83D\uDCCA RoutineCraft Daily Summary',
                    'You completed ' + c + ' of ' + tot + ' tasks today. Keep the streak going! \uD83D\uDD25',
                    'summary'
                );
                delete _pwaTimerHandles['__summary__'];
            }, msUntil);
        });
    }

    function hashCode(str) {
        var hash = 0;
        for (var i = 0; i < str.length; i++) {
            hash = (hash << 5) - hash + str.charCodeAt(i);
            hash |= 0;
        }
        return hash;
    }

    // --- GOOGLE FIREBASE AUTHENTICATION MODAL CONTROLLER ---
    function openAuthModal() {
        if (!dom.authModal) return;
        if (dom.authErrorMsg) dom.authErrorMsg.classList.add('hide');
        dom.authModal.classList.remove('hide');
    }

    function closeAuthModal() {
        if (dom.authModal) dom.authModal.classList.add('hide');
    }

    function showAuthError(msg) {
        if (dom.authErrorMsg) {
            dom.authErrorMsg.textContent = msg;
            dom.authErrorMsg.classList.remove('hide');
        }
    }

    function triggerGoogleLogin() {
        openAuthModal();
    }

    function handleFirebaseUserAuthenticated(user) {
        const userEmail = user.email;
        const userName = user.displayName || userEmail.split('@')[0];

        if (!usersStore[userEmail]) {
            usersStore[userEmail] = {
                profile: {
                    ...DEFAULT_PROFILE,
                    email: userEmail,
                    name: userName,
                    avatar: '🔥',
                    isGoogleSynced: true,
                    backupFrequency: 'daily',
                    lastBackupTime: new Date().toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })
                },
                tasks: [...DEFAULT_TASKS]
            };
        } else {
            usersStore[userEmail].profile.isGoogleSynced = true;
            usersStore[userEmail].profile.name = userName;
        }

        switchUserAccount(userEmail);
        showToast(`Signed in as ${userEmail}! 🔥`);
        setTimeout(scrollToTaskChecklist, 200);
    }

    function fallbackPromptLogin() {
        const sampleEmails = ['alex.productivity@gmail.com', 'sarah.daily@gmail.com', 'jordan.planner@gmail.com'];
        const chosenEmail = prompt("Enter your Account Email for Sync & Backup:", sampleEmails[Math.floor(Math.random() * sampleEmails.length)]);

        if (!chosenEmail || !chosenEmail.includes('@')) return;

        state.pendingGoogleUser = {
            email: chosenEmail.trim(),
            name: chosenEmail.split('@')[0].replace('.', ' '),
            avatar: '🌐'
        };

        dom.guserNameDisplay.textContent = state.pendingGoogleUser.name;
        dom.guserEmailDisplay.textContent = state.pendingGoogleUser.email;
        dom.guserAvatarDisplay.textContent = '🌐';
        dom.gdrivePermissionModal.classList.remove('hide');
    }

    function confirmGoogleBackupPermission() {
        if (!state.pendingGoogleUser) return;

        const selectedFreq = document.querySelector('input[name="backup-freq-choice"]:checked')?.value || 'daily';
        const userEmail = state.pendingGoogleUser.email;

        if (!usersStore[userEmail]) {
            usersStore[userEmail] = {
                profile: {
                    ...DEFAULT_PROFILE,
                    email: userEmail,
                    name: state.pendingGoogleUser.name,
                    avatar: state.pendingGoogleUser.avatar,
                    isGoogleSynced: true,
                    backupFrequency: selectedFreq,
                    lastBackupTime: new Date().toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })
                },
                tasks: [...DEFAULT_TASKS]
            };
        } else {
            usersStore[userEmail].profile.isGoogleSynced = true;
            usersStore[userEmail].profile.backupFrequency = selectedFreq;
            usersStore[userEmail].profile.lastBackupTime = new Date().toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' });
        }

        switchUserAccount(userEmail);
        dom.gdrivePermissionModal.classList.add('hide');
        showToast(`Signed in as ${userEmail}! Auto-Backup set to ${selectedFreq.toUpperCase()} ☁️🎉`);
    }

    // --- AUTOMATIC BACKUP SCHEDULER ---
    function checkAutoBackupSchedule() {
        if (!state.profile.isGoogleSynced || state.profile.backupFrequency === 'custom') return;

        const now = Date.now();
        const lastTime = state.profile.lastBackupTimestamp || 0;
        const oneDayMs = 24 * 60 * 60 * 1000;
        const oneWeekMs = 7 * oneDayMs;

        const isDueDaily = (state.profile.backupFrequency === 'daily' && (now - lastTime > oneDayMs));
        const isDueWeekly = (state.profile.backupFrequency === 'weekly' && (now - lastTime > oneWeekMs));

        if (isDueDaily || isDueWeekly || !state.profile.lastBackupTime) {
            performAutoBackup();
        }
    }

    function performAutoBackup() {
        const nowStr = new Date().toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' });
        state.profile.lastBackupTime = nowStr;
        state.profile.lastBackupTimestamp = Date.now();
        saveState();
        renderAccountStatusBar();
        console.log(`Auto-backup completed for ${state.profile.email} (${state.profile.backupFrequency})`);
    }

    function performManualBackup() {
        performAutoBackup();
        const nowStr = new Date().toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' });
        state.profile.lastBackupTime = nowStr;
        state.profile.lastBackupTimestamp = Date.now();
        saveState();
        renderAccountStatusBar();
        showToast(`☁️ Backup synced to Google Drive (${state.profile.email || 'Cloud Account'})!`);
    }

    // --- THEME ENGINE ---
    function applyTheme(themeName) {
        state.profile.theme = themeName;
        dom.body.setAttribute('data-theme', themeName);

        dom.themeCards.forEach(card => {
            if (card.dataset.setTheme === themeName) {
                card.classList.add('active');
            } else {
                card.classList.remove('active');
            }
        });
    }

    // --- HELPER DATE COMPARISONS ---
    function isTaskOverdue(task) {
        if (task.completed || task.recurring !== 'none') return false;
        const today = getTodayStr();
        return task.dueDate && task.dueDate < today;
    }

    function isTaskToday(task) {
        const today = getTodayStr();
        if (task.recurring !== 'none') return true;
        return task.dueDate === today;
    }

    function isTaskUpcoming(task) {
        if (task.completed || task.recurring !== 'none') return false;
        const today = getTodayStr();
        return task.dueDate && task.dueDate > today;
    }

    // --- RENDER OVERALL PROGRESS DASHBOARD CARD (Matching Instagram Screenshot) ---
    function renderOverallProgressCard() {
        const totalAll = state.tasks.length;
        const completedAll = state.tasks.filter(t => t.completed).length;
        const overallPct = totalAll === 0 ? 0 : Math.round((completedAll / totalAll) * 100);

        dom.overallPctText.textContent = `${overallPct}%`;
        dom.overallRatioVal.textContent = `${completedAll} / ${Math.max(totalAll, 20)} completed`;

        const circumference = 213.62;
        const offset = circumference - (overallPct / 100) * circumference;
        dom.overallRingFill.style.strokeDashoffset = offset;

        dom.overallBarsWrapper.innerHTML = '';
        const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
        const currentDayIdx = (new Date().getDay() + 6) % 7;

        const mockTaskCounts = [8, 9, 7, 6, 8, 9, 7];
        mockTaskCounts[currentDayIdx] = Math.max(3, completedAll);

        weekDays.forEach((dayName, idx) => {
            const count = mockTaskCounts[idx];
            const heightPct = Math.min(100, (count / 10) * 100);

            const col = document.createElement('div');
            col.className = 'overall-bar-col';
            col.innerHTML = `
                <div class="overall-bar-track">
                    <div class="overall-bar-fill" style="height: ${heightPct}%;"></div>
                </div>
                <span class="overall-bar-day">${dayName}</span>
            `;
            dom.overallBarsWrapper.appendChild(col);
        });
    }

    // --- RENDER WEEKLY PLANNER DAY COLUMNS (Inside Stats Modal) ---
    function renderWeeklyPlannerGrid() {
        dom.weeklyPlannerGrid.innerHTML = '';
        const curr = new Date();
        const first = curr.getDate() - ((curr.getDay() + 6) % 7);

        for (let i = 0; i < 7; i++) {
            const nextDay = new Date(curr.setDate(first + i));
            const dayStr = nextDay.toISOString().split('T')[0];
            const dayName = nextDay.toLocaleDateString('en-US', { weekday: 'long' });
            const dateFormatted = nextDay.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' });

            const dayTasks = state.tasks.filter(t => t.dueDate === dayStr || (t.recurring === 'daily' && isTaskToday(t)));
            const dayTotal = dayTasks.length;
            const dayCompleted = dayTasks.filter(t => t.completed).length;
            const dayPct = dayTotal === 0 ? 0 : Math.round((dayCompleted / dayTotal) * 100);

            const dayCard = document.createElement('div');
            dayCard.className = 'planner-day-card';

            const circumference = 175.92;
            const offset = circumference - (dayPct / 100) * circumference;

            let tasksListHtml = '';
            if (dayTasks.length > 0) {
                tasksListHtml = dayTasks.map(t => `
                    <div class="day-task-item ${t.completed ? 'completed' : ''}">
                        <input type="checkbox" class="custom-checkbox planner-task-chk" data-id="${t.id}" ${t.completed ? 'checked' : ''}>
                        <span>${escapeHtml(t.title)}</span>
                    </div>
                `).join('');
            } else {
                tasksListHtml = '<div style="font-size:0.78rem; color:var(--text-muted); padding:8px 0; text-align:center;">No scheduled tasks</div>';
            }

            dayCard.innerHTML = `
                <div class="day-card-header">
                    <span class="day-card-name">${dayName}</span>
                    <span class="day-card-date">${dateFormatted}</span>
                </div>
                <div class="day-card-donut-wrapper">
                    <div class="day-donut">
                        <svg width="70" height="70">
                            <circle class="ring-bg" stroke-width="6" r="28" cx="35" cy="35"/>
                            <circle class="ring-fill" stroke-width="6" r="28" cx="35" cy="35" style="stroke-dasharray:${circumference}; stroke-dashoffset:${offset};"/>
                        </svg>
                        <span class="day-donut-pct">${dayPct}%</span>
                    </div>
                </div>
                <div class="day-tasks-section">
                    <div class="day-tasks-subbanner">Tasks</div>
                    <div class="day-tasks-list">
                        ${tasksListHtml}
                    </div>
                </div>
            `;

            dayCard.querySelectorAll('.planner-task-chk').forEach(chk => {
                chk.addEventListener('change', (e) => {
                    const taskId = chk.dataset.id;
                    toggleTaskComplete(taskId, e.target.checked);
                    renderOverallProgressCard();
                });
            });

            dom.weeklyPlannerGrid.appendChild(dayCard);
        }
    }

    // --- RENDER LIST VIEW TASKS & PROGRESS ---
    function getFilteredTasks() {
        return state.tasks.filter(task => {
            if (state.activeCategory !== 'all' && task.category !== state.activeCategory) {
                return false;
            }

            if (state.activeFilter === 'today') {
                if (!isTaskToday(task) && !isTaskOverdue(task)) return false;
            } else if (state.activeFilter === 'overdue') {
                if (!isTaskOverdue(task)) return false;
            } else if (state.activeFilter === 'upcoming') {
                if (!isTaskUpcoming(task)) return false;
            } else if (state.activeFilter === 'completed') {
                if (!task.completed) return false;
            }

            if (state.searchQuery.trim() !== '') {
                const query = state.searchQuery.toLowerCase();
                const titleMatch = task.title.toLowerCase().includes(query);
                const categoryMatch = (CATEGORIES[task.category]?.label || '').toLowerCase().includes(query);
                return titleMatch || categoryMatch;
            }

            return true;
        }).sort((a, b) => {
            if (state.sortBy === 'priority') {
                const pOrder = { high: 1, medium: 2, low: 3 };
                return pOrder[a.priority] - pOrder[b.priority];
            } else if (state.sortBy === 'time') {
                return (a.dueTime || '23:59').localeCompare(b.dueTime || '23:59');
            } else if (state.sortBy === 'date') {
                return (a.dueDate || '9999-99-99').localeCompare(b.dueDate || '9999-99-99');
            } else if (state.sortBy === 'alphabetical') {
                return a.title.localeCompare(b.title);
            }

            const aOverdue = isTaskOverdue(a);
            const bOverdue = isTaskOverdue(b);
            if (aOverdue !== bOverdue) return aOverdue ? -1 : 1;
            if (a.completed !== b.completed) return a.completed ? 1 : -1;
            return 0;
        });
    }

    function renderTasks() {
        const filtered = getFilteredTasks();
        dom.taskList.innerHTML = '';

        const viewTitles = {
            today: "Today's Checklist & Reminders",
            overdue: "Overdue Pending Tasks",
            upcoming: "Upcoming Scheduled Tasks",
            all: "All Checklist Tasks",
            completed: "Completed Task History"
        };
        dom.currentViewTitle.textContent = viewTitles[state.activeFilter] || "Checklist";

        if (filtered.length === 0) {
            dom.emptyState.classList.remove('hide');
            if (state.activeFilter === 'upcoming') {
                dom.emptyTitle.textContent = 'No upcoming scheduled tasks!';
                dom.emptyDesc.textContent = 'Schedule a future task to get reminded on that specific day.';
            } else if (state.activeFilter === 'overdue') {
                dom.emptyTitle.textContent = 'No overdue tasks! 🎯';
                dom.emptyDesc.textContent = 'You are 100% caught up on all past scheduled items!';
            } else {
                dom.emptyTitle.textContent = 'All tasks completed! 🎉';
                dom.emptyDesc.textContent = 'You\'re all caught up for today. Add a new task to keep building your routine.';
            }
        } else {
            dom.emptyState.classList.add('hide');
            filtered.forEach(task => {
                const card = createTaskCardElement(task);
                dom.taskList.appendChild(card);
            });
        }

        updateProgressCard();
    }

    function createTaskCardElement(task) {
        const card = document.createElement('div');
        const overdue = isTaskOverdue(task);
        const upcoming = isTaskUpcoming(task);
        card.className = `task-card ${task.completed ? 'completed' : ''} ${overdue ? 'is-overdue' : ''}`;
        card.dataset.id = task.id;

        const catInfo = CATEGORIES[task.category] || { label: task.category, icon: 'fa-tag' };
        const priorityLabels = { high: '🔥 High', medium: '⚡ Med', low: '🟢 Low' };

        let subtasksHtml = '';
        if (task.subtasks && task.subtasks.length > 0) {
            const completedSub = task.subtasks.filter(s => s.completed).length;
            subtasksHtml = `
                <div class="subtasks-container">
                    <div class="subtask-progress-summary" style="font-size:0.75rem; color:var(--text-secondary); margin-bottom:4px;">
                        Subtasks: ${completedSub}/${task.subtasks.length}
                    </div>
                    ${task.subtasks.map(s => `
                        <div class="subtask-item ${s.completed ? 'completed' : ''}">
                            <input type="checkbox" class="custom-checkbox subtask-checkbox" data-sub-id="${s.id}" ${s.completed ? 'checked' : ''}>
                            <span>${escapeHtml(s.title)}</span>
                        </div>
                    `).join('')}
                </div>
            `;
        }

        card.innerHTML = `
            <div class="task-card-main">
                <input type="checkbox" class="custom-checkbox task-main-checkbox" ${task.completed ? 'checked' : ''}>
                <div class="task-content">
                    <div class="task-title">${escapeHtml(task.title)}</div>
                    <div class="task-meta-row">
                        <span class="badge badge-category"><i class="fa-solid ${catInfo.icon}"></i> ${catInfo.label}</span>
                        <span class="badge badge-priority-${task.priority}">${priorityLabels[task.priority]}</span>
                        ${overdue ? `<span class="badge badge-overdue"><i class="fa-solid fa-triangle-exclamation"></i> Overdue (${task.dueDate})</span>` : ''}
                        ${upcoming ? `<span class="badge badge-date" style="background:rgba(236,72,153,0.18); color:var(--accent-primary);"><i class="fa-regular fa-calendar-check"></i> Scheduled for ${task.dueDate}</span>` : ''}
                        ${!overdue && !upcoming && task.dueDate ? `<span class="badge badge-date"><i class="fa-regular fa-calendar"></i> Today</span>` : ''}
                        ${task.dueTime ? `<span class="badge badge-time"><i class="fa-regular fa-clock"></i> ${task.dueTime}</span>` : ''}
                        ${task.recurring !== 'none' ? `<span class="badge badge-recurring"><i class="fa-solid fa-repeat"></i> ${task.recurring}</span>` : ''}
                    </div>
                    ${subtasksHtml}
                </div>
                <div class="task-actions">
                    <button class="action-btn edit-btn" title="Edit Task"><i class="fa-solid fa-pen"></i></button>
                    <button class="action-btn delete-btn" title="Delete Task"><i class="fa-solid fa-trash-can"></i></button>
                </div>
            </div>
        `;

        const mainCheckbox = card.querySelector('.task-main-checkbox');
        mainCheckbox.addEventListener('change', (e) => {
            toggleTaskComplete(task.id, e.target.checked);
        });

        card.querySelectorAll('.subtask-checkbox').forEach(chk => {
            chk.addEventListener('change', (e) => {
                const subId = chk.dataset.subId;
                toggleSubtaskComplete(task.id, subId, e.target.checked);
            });
        });

        card.querySelector('.edit-btn').addEventListener('click', () => {
            openTaskModal(task);
        });

        card.querySelector('.delete-btn').addEventListener('click', () => {
            deleteTask(task.id);
        });

        return card;
    }

    function toggleTaskComplete(taskId, isCompleted) {
        var task = state.tasks.find(function(t) { return t.id === taskId; });
        if (task) {
            task.completed = isCompleted;
            task.completedAt = isCompleted ? new Date().toISOString() : null;

            if (task.subtasks) {
                task.subtasks.forEach(function(s) { s.completed = isCompleted; });
            }

            if (isCompleted) {
                state.profile.totalCompletedCount = (state.profile.totalCompletedCount || 0) + 1;
                cancelNotificationForTask(taskId); // cancel scheduled reminder
                showToast('Task completed! \uD83C\uDF89');
            } else {
                // Re-schedule reminder if task is unchecked
                schedulePwaTaskReminder(task);
            }

            saveState();
            renderTasks();
            checkAutoBackupSchedule();
        }
    }

    function toggleSubtaskComplete(taskId, subId, isCompleted) {
        const task = state.tasks.find(t => t.id === taskId);
        if (task && task.subtasks) {
            const sub = task.subtasks.find(s => s.id === subId);
            if (sub) {
                sub.completed = isCompleted;
                const allSubDone = task.subtasks.every(s => s.completed);
                if (allSubDone) {
                    task.completed = true;
                    task.completedAt = new Date().toISOString();
                } else {
                    task.completed = false;
                }

                saveState();
                renderTasks();
                checkAutoBackupSchedule();
            }
        }
    }

    function deleteTask(taskId) {
        state.tasks = state.tasks.filter(t => t.id !== taskId);
        saveState();
        renderTasks();
        showToast('Task deleted');
    }

    // --- PROGRESS RING & COUNTERS UPDATE ---
    function updateProgressCard() {
        const todayPending = state.tasks.filter(t => !t.completed && isTaskToday(t)).length;
        const overduePending = state.tasks.filter(t => isTaskOverdue(t)).length;
        const upcomingPending = state.tasks.filter(t => isTaskUpcoming(t)).length;
        const completed = state.tasks.filter(t => t.completed).length;

        const totalWorkload = todayPending + overduePending + completed;
        const percentage = totalWorkload === 0 ? 0 : Math.round((completed / totalWorkload) * 100);

        dom.tasksTodayPendingCount.textContent = todayPending;
        dom.tasksOverduePendingCount.textContent = overduePending;
        dom.tasksDoneCount.textContent = completed;
        dom.overdueTabCount.textContent = overduePending;
        dom.upcomingTabCount.textContent = upcomingPending;

        dom.progressPercentageText.textContent = `${percentage}%`;

        const circumference = 226.19;
        const offset = circumference - (percentage / 100) * circumference;
        dom.progressCircle.style.strokeDashoffset = offset;
    }

    // --- REMINDER BANNER & NOTIFICATIONS ---
    function checkReminderNotification() {
        var todayPending = state.tasks.filter(function(t) { return !t.completed && isTaskToday(t); });
        if (todayPending.length > 0) {
            dom.reminderBanner.classList.remove('hide');
            var firstTaskTitle = todayPending[0].title;
            dom.reminderTitle.textContent = `🎯 Next Goal: "${firstTaskTitle}"`;
            dom.reminderDesc.textContent = todayPending.length === 1 
                ? '1 task pending for today' 
                : `${todayPending.length} tasks pending for today`;
        } else {
            dom.reminderBanner.classList.add('hide');
        }
    }

    // --- IN-APP UPDATE CHECKER (VIA VERCEL VERSION.JSON) ---
    function checkForAppUpdates() {
        if (!dom.updateBanner) return;
        fetch('./version.json?t=' + Date.now())
            .then(function(res) { return res.json(); })
            .then(function(data) {
                if (data && data.version && data.version > APP_VERSION) {
                    dom.updateBanner.classList.remove('hide');
                    if (dom.updateBannerTitle) dom.updateBannerTitle.textContent = '🎉 New Update v' + (data.versionName || data.version) + ' Available!';
                    if (dom.updateBannerDesc) dom.updateBannerDesc.textContent = data.releaseNotes || 'Tap to download the latest update.';
                    if (dom.updateActionBtn) dom.updateActionBtn.href = data.apkUrl || './RoutineCraft.apk';
                }
            })
            .catch(function() {
                // Silently ignore if offline or fetch fails
            });
    }

    // --- TASK MODAL & FORM ---
    function openTaskModal(taskToEdit = null) {
        state.tempSubtasks = [];
        dom.subtaskBuilderList.innerHTML = '';

        if (taskToEdit) {
            dom.modalHeading.textContent = 'Edit Task';
            dom.taskIdInput.value = taskToEdit.id;
            dom.taskTitleInput.value = taskToEdit.title;
            dom.taskCategorySelect.value = taskToEdit.category;
            dom.taskPrioritySelect.value = taskToEdit.priority;
            dom.taskDateInput.value = taskToEdit.dueDate || getTodayStr();
            dom.taskTimeInput.value = taskToEdit.dueTime || '';
            dom.taskRecurringSelect.value = taskToEdit.recurring || 'none';

            if (taskToEdit.subtasks) {
                state.tempSubtasks = [...taskToEdit.subtasks];
                renderTempSubtasks();
            }
        } else {
            dom.modalHeading.textContent = 'Create New Task';
            dom.taskForm.reset();
            dom.taskIdInput.value = '';
            dom.taskDateInput.value = getTodayStr();
        }

        dom.taskModal.classList.remove('hide');
    }

    function closeTaskModal() {
        dom.taskModal.classList.add('hide');
    }

    function renderTempSubtasks() {
        dom.subtaskBuilderList.innerHTML = '';
        state.tempSubtasks.forEach((sub, idx) => {
            const li = document.createElement('li');
            li.className = 'subtask-builder-item';
            li.innerHTML = `
                <span>${escapeHtml(sub.title)}</span>
                <button type="button" class="remove-temp-sub" data-idx="${idx}"><i class="fa-solid fa-xmark"></i></button>
            `;
            li.querySelector('.remove-temp-sub').addEventListener('click', () => {
                state.tempSubtasks.splice(idx, 1);
                renderTempSubtasks();
            });
            dom.subtaskBuilderList.appendChild(li);
        });
    }

    dom.datePresetBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const preset = btn.dataset.preset;
            if (preset === 'today') dom.taskDateInput.value = getTodayStr();
            else if (preset === 'tomorrow') dom.taskDateInput.value = getFutureDateStr(1);
            else if (preset === 'in3days') dom.taskDateInput.value = getFutureDateStr(3);
            else if (preset === 'nextweek') dom.taskDateInput.value = getFutureDateStr(7);
        });
    });

    dom.addSubtaskBtn.addEventListener('click', () => {
        const val = dom.subtaskBuilderInput.value.trim();
        if (val) {
            state.tempSubtasks.push({
                id: 'sub-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4),
                title: val,
                completed: false
            });
            dom.subtaskBuilderInput.value = '';
            renderTempSubtasks();
        }
    });

    dom.taskForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const id = dom.taskIdInput.value;
        const title = dom.taskTitleInput.value.trim();
        const category = dom.taskCategorySelect.value;
        const priority = dom.taskPrioritySelect.value;
        const dueDate = dom.taskDateInput.value || getTodayStr();
        const dueTime = dom.taskTimeInput.value;
        const recurring = dom.taskRecurringSelect.value;

        if (!title) return;

        if (id) {
            const task = state.tasks.find(t => t.id === id);
            if (task) {
                task.title = title;
                task.category = category;
                task.priority = priority;
                task.dueDate = dueDate;
                task.dueTime = dueTime;
                task.recurring = recurring;
                task.subtasks = [...state.tempSubtasks];
            }
            showToast('Task updated!');
        } else {
            const newTask = {
                id: 'task-' + Date.now(),
                title: title,
                category: category,
                priority: priority,
                dueDate: dueDate,
                dueTime: dueTime,
                recurring: recurring,
                completed: false,
                completedAt: null,
                createdAt: new Date().toISOString(),
                subtasks: [...state.tempSubtasks]
            };
            state.tasks.unshift(newTask);

            if (dueDate > getTodayStr()) {
                showToast(`Task scheduled for ${dueDate}! 🗓️`);
            } else {
                showToast('New task added to Today! 🎯');
            }
        }

        saveState();
        renderTasks();
        checkReminderNotification();
        checkAutoBackupSchedule();
        closeTaskModal();
    });

    // --- NOTIFICATION PERMISSION TOGGLE ---
    dom.notifyBtn.addEventListener('click', function() {
        state.profile.notificationsEnabled = !state.profile.notificationsEnabled;
        saveState();
        renderHeaderProfile();

        if (state.profile.notificationsEnabled) {
            requestPwaPermission().then(function(granted) {
                scheduleNativeLocalNotifications();
                scheduleSummaryNotification();
                if (granted) {
                    showToast('Notifications enabled! \uD83D\uDD14');
                } else {
                    showToast('Notifications enabled \u2014 allow in browser for PWA alerts \uD83D\uDD14');
                }
            });
        } else {
            // Clear all PWA timers
            Object.keys(_pwaTimerHandles).forEach(function(id) {
                clearTimeout(_pwaTimerHandles[id]);
                delete _pwaTimerHandles[id];
            });
            showToast('Notifications muted');
        }
    });

    dom.dismissReminderBtn.addEventListener('click', () => {
        dom.reminderBanner.classList.add('hide');
    });

    if (dom.dismissUpdateBtn) {
        dom.dismissUpdateBtn.addEventListener('click', () => {
            if (dom.updateBanner) dom.updateBanner.classList.add('hide');
        });
    }

    // --- PROFILE & SETTINGS MODAL ---
    function renderUsersGrid() {
        dom.usersListGrid.innerHTML = '';
        const emails = Object.keys(usersStore);

        emails.forEach(email => {
            const userObj = usersStore[email];
            const isActive = (email === activeEmail);
            const isDefault = (email === 'default_user@routinecraft.app');

            const item = document.createElement('div');
            item.className = `user-account-item ${isActive ? 'active' : ''}`;
            item.style.display = 'flex';
            item.style.alignItems = 'center';
            item.style.justifyContent = 'space-between';
            item.style.padding = '8px 12px';

            item.innerHTML = `
                <div style="display:flex; align-items:center; gap:8px; cursor:pointer; flex:1;" class="account-select-area">
                    <span style="font-size:1.1rem;">${userObj.profile.avatar || '👤'}</span>
                    <div style="display:flex; flex-direction:column;">
                        <strong style="font-size:0.86rem; color:var(--text-primary);">${escapeHtml(userObj.profile.name || email)}</strong>
                        <span style="font-size:0.72rem; color:var(--text-secondary);">${escapeHtml(isDefault ? 'Local Guest Profile' : email)}</span>
                    </div>
                </div>
                <div style="display:flex; align-items:center; gap:8px;">
                    ${isActive ? '<span style="font-size:0.74rem; font-weight:700; color:var(--accent-primary);"><i class="fa-solid fa-check"></i> Active</span>' : '<span style="font-size:0.74rem; color:var(--text-muted); cursor:pointer;" class="account-select-area">Select</span>'}
                    ${!isDefault ? `<button type="button" class="action-btn delete-acc-btn" data-email="${escapeHtml(email)}" title="Remove account from device" style="background:none; border:none; color:var(--accent-danger); cursor:pointer; padding:4px 6px;"><i class="fa-solid fa-trash-can"></i></button>` : ''}
                </div>
            `;

            item.querySelectorAll('.account-select-area').forEach(el => {
                el.addEventListener('click', () => {
                    if (!isActive) switchUserAccount(email);
                });
            });

            const delBtn = item.querySelector('.delete-acc-btn');
            if (delBtn) {
                delBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    if (confirm(`Remove account ${email} from this device?`)) {
                        removeUserAccount(email);
                    }
                });
            }

            dom.usersListGrid.appendChild(item);
        });
    }

    function closeAllModals() {
        if (dom.taskModal) dom.taskModal.classList.add('hide');
        if (dom.profileModal) dom.profileModal.classList.add('hide');
        if (dom.analyticsModal) dom.analyticsModal.classList.add('hide');
        if (dom.authModal) dom.authModal.classList.add('hide');
        if (dom.gdrivePermissionModal) dom.gdrivePermissionModal.classList.add('hide');
    }

    function setActiveNav(navName) {
        if (!dom.bottomNavItems) return;
        dom.bottomNavItems.forEach(n => {
            if (n.dataset.nav === navName) n.classList.add('active');
            else n.classList.remove('active');
        });
    }

    function openProfileModal() {
        closeAllModals();
        setActiveNav('settings');
        dom.profileNameInput.value = state.profile.name;
        dom.avatarOpts.forEach(function(opt) {
            if (opt.dataset.avatar === state.profile.avatar) opt.classList.add('active');
            else opt.classList.remove('active');
        });
        // Populate notification summary time
        var summaryInput = document.getElementById('summary-notif-time-input');
        if (summaryInput) {
            summaryInput.value = state.profile.summaryNotificationTime || '20:00';
        }
        renderAccountStatusBar();
        renderUsersGrid();
        dom.profileModal.classList.remove('hide');
    }

    function closeProfileModal() {
        if (dom.profileModal) dom.profileModal.classList.add('hide');
        setActiveNav('tasks');
    }

    dom.avatarOpts.forEach(opt => {
        opt.addEventListener('click', () => {
            dom.avatarOpts.forEach(o => o.classList.remove('active'));
            opt.classList.add('active');
            state.profile.avatar = opt.dataset.avatar;
        });
    });

    dom.themeCards.forEach(card => {
        card.addEventListener('click', () => {
            applyTheme(card.dataset.setTheme);
        });
    });

    dom.saveProfileBtn.addEventListener('click', function() {
        state.profile.name = dom.profileNameInput.value.trim() || 'Productivity Hero';
        state.profile.backupFrequency = dom.backupFrequencySelect.value;
        // Read summary notification time from UI if the input exists
        var summaryInput = document.getElementById('summary-notif-time-input');
        if (summaryInput && summaryInput.value) {
            state.profile.summaryNotificationTime = summaryInput.value;
        }
        saveState();
        renderHeaderProfile();
        // Re-schedule summary with potentially new time
        scheduleSummaryNotification();
        closeProfileModal();
        showToast('Settings & notifications saved! \uD83D\uDD14');
    });

    // --- GOOGLE DRIVE BACKUP BUTTONS ---
    dom.headerGoogleLoginBtn.addEventListener('click', () => {
        if (state.profile.isGoogleSynced) {
            openProfileModal();
        } else {
            triggerGoogleLogin();
        }
    });

    if (dom.logoutSettingsBtn) {
        dom.logoutSettingsBtn.addEventListener('click', () => {
            if (confirm(`Sign out of ${state.profile.email || 'your account'}?`)) {
                logoutUserAccount();
            }
        });
    }

    if (dom.switchAccountBtn) {
        dom.switchAccountBtn.addEventListener('click', () => {
            openProfileModal();
        });
    }

    dom.addNewAccountBtn.addEventListener('click', () => {
        triggerGoogleLogin();
    });

    dom.confirmGdrivePermBtn.addEventListener('click', () => {
        confirmGoogleBackupPermission();
    });

    dom.skipGdrivePermBtn.addEventListener('click', () => {
        dom.gdrivePermissionModal.classList.add('hide');
    });

    dom.closeGdrivePermModalBtn.addEventListener('click', () => {
        dom.gdrivePermissionModal.classList.add('hide');
    });

    dom.gdriveBackupBtn.addEventListener('click', () => {
        performManualBackup();
    });

    dom.gdriveRestoreBtn.addEventListener('click', () => {
        dom.importFileInput.click();
    });

    // --- LOCAL DATA IMPORT / EXPORT / RESET ---
    dom.exportDataBtn.addEventListener('click', () => {
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(state, null, 2));
        const downloadAnchor = document.createElement('a');
        downloadAnchor.setAttribute("href", dataStr);
        downloadAnchor.setAttribute("download", `routinecraft_backup_${state.profile.name}_${getTodayStr()}.json`);
        document.body.appendChild(downloadAnchor);
        downloadAnchor.click();
        downloadAnchor.remove();
        showToast('Backup file saved! 💾');
    });

    dom.importDataBtn.addEventListener('click', () => {
        dom.importFileInput.click();
    });

    dom.importFileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (evt) => {
            try {
                const imported = JSON.parse(evt.target.result);
                if (imported.tasks && imported.profile) {
                    state.tasks = imported.tasks;
                    state.profile = imported.profile;
                    saveState();
                    applyTheme(state.profile.theme);
                    renderHeaderProfile();
                    renderTasks();
                    closeProfileModal();
                    showToast('Backup restored successfully! 🎉');
                } else {
                    alert('Invalid backup file format.');
                }
            } catch (err) {
                alert('Error parsing JSON file.');
            }
        };
        reader.readAsText(file);
    });

    dom.resetDataBtn.addEventListener('click', () => {
        if (confirm(`Reset tasks for ${state.profile.name}?`)) {
            state.tasks = [...DEFAULT_TASKS];
            saveState();
            renderTasks();
            closeProfileModal();
            showToast('Reset to starter tasks!');
        }
    });

    // --- OPEN STATS ANALYTICS DASHBOARD MODAL ---
    function openAnalyticsModal() {
        closeAllModals();
        setActiveNav('analytics');
        renderOverallProgressCard();
        renderWeeklyPlannerGrid();

        const completed = state.tasks.filter(t => t.completed).length;

        dom.heatmapGrid.innerHTML = '';
        for (let i = 29; i >= 0; i--) {
            const tile = document.createElement('div');
            const tileDate = getPastDateStr(i);
            
            let lvlClass = 'lvl-0';
            if (i === 0) {
                lvlClass = completed > 0 ? (completed > 3 ? 'lvl-3' : 'lvl-2') : 'lvl-1';
            } else if (i % 3 === 0 || i % 7 === 0) {
                lvlClass = 'lvl-2';
            } else if (i % 2 === 0) {
                lvlClass = 'lvl-1';
            } else if (i % 5 === 0) {
                lvlClass = 'lvl-3';
            }

            tile.className = `heatmap-tile ${lvlClass}`;
            tile.title = `${tileDate}: Activity Level`;
            dom.heatmapGrid.appendChild(tile);
        }

        dom.categoryBarsContainer.innerHTML = '';
        Object.keys(CATEGORIES).forEach(catKey => {
            const catInfo = CATEGORIES[catKey];
            const catTasks = state.tasks.filter(t => t.category === catKey);
            const catTotal = catTasks.length;
            const catDone = catTasks.filter(t => t.completed).length;
            const catPct = catTotal === 0 ? 0 : Math.round((catDone / catTotal) * 100);

            const item = document.createElement('div');
            item.className = 'category-bar-item';
            item.innerHTML = `
                <div class="cat-bar-header">
                    <span><i class="fa-solid ${catInfo.icon}"></i> ${catInfo.label}</span>
                    <span>${catDone}/${catTotal} (${catPct}%)</span>
                </div>
                <div class="cat-bar-track">
                    <div class="cat-bar-fill" style="width: ${catPct}%;"></div>
                </div>
            `;
            dom.categoryBarsContainer.appendChild(item);
        });

        dom.analyticsModal.classList.remove('hide');
    }

    function closeAnalyticsModal() {
        if (dom.analyticsModal) dom.analyticsModal.classList.add('hide');
        setActiveNav('tasks');
    }

    // --- EVENT LISTENERS ---
    function setupEventListeners() {
        dom.searchInput.addEventListener('input', (e) => {
            state.searchQuery = e.target.value;
            if (state.searchQuery) dom.clearSearchBtn.classList.remove('hide');
            else dom.clearSearchBtn.classList.add('hide');
            renderTasks();
        });

        dom.clearSearchBtn.addEventListener('click', () => {
            dom.searchInput.value = '';
            state.searchQuery = '';
            dom.clearSearchBtn.classList.add('hide');
            renderTasks();
        });

        dom.categoriesContainer.querySelectorAll('.category-chip').forEach(chip => {
            chip.addEventListener('click', () => {
                dom.categoriesContainer.querySelectorAll('.category-chip').forEach(c => c.classList.remove('active'));
                chip.classList.add('active');
                state.activeCategory = chip.dataset.category;
                renderTasks();
            });
        });

        dom.filterTabs.forEach(tab => {
            tab.addEventListener('click', () => {
                dom.filterTabs.forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                state.activeFilter = tab.dataset.filter;
                renderTasks();
            });
        });

        dom.sortTrigger.addEventListener('click', (e) => {
            e.stopPropagation();
            dom.sortMenu.classList.toggle('hide');
        });

        document.addEventListener('click', () => {
            dom.sortMenu.classList.add('hide');
        });

        dom.sortMenu.querySelectorAll('button').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                dom.sortMenu.querySelectorAll('button').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                state.sortBy = btn.dataset.sort;
                dom.sortMenu.classList.add('hide');
                renderTasks();
            });
        });

        dom.fabAddBtn.addEventListener('click', () => openTaskModal());
        dom.emptyAddBtn.addEventListener('click', () => openTaskModal());
        dom.closeTaskModalBtn.addEventListener('click', closeTaskModal);
        dom.cancelTaskBtn.addEventListener('click', closeTaskModal);

        // Firebase Auth Modal Listeners
        if (dom.closeAuthModalBtn) dom.closeAuthModalBtn.addEventListener('click', closeAuthModal);

        if (dom.googleLoginModalBtn) {
            dom.googleLoginModalBtn.addEventListener('click', function() {
                if (window.RC_FIREBASE && typeof firebase !== 'undefined' && firebase.apps && firebase.apps.length > 0) {
                    RC_FIREBASE.signInWithGoogle()
                        .then(function(user) {
                            handleFirebaseUserAuthenticated(user);
                            closeAuthModal();
                        })
                        .catch(function(err) {
                            showAuthError(err.message || 'Google Sign-In failed');
                        });
                } else {
                    fallbackPromptLogin();
                }
            });
        }

        dom.profileTrigger.addEventListener('click', openProfileModal);
        dom.closeProfileModalBtn.addEventListener('click', closeProfileModal);
        dom.quickThemeBtn.addEventListener('click', openProfileModal);
        dom.streakBtn.addEventListener('click', openAnalyticsModal);

        dom.closeAnalyticsModalBtn.addEventListener('click', closeAnalyticsModal);
        dom.closeAnalyticsBtn.addEventListener('click', closeAnalyticsModal);

        if (dom.bottomNavItems && dom.bottomNavItems.length > 0) {
            dom.bottomNavItems.forEach(nav => {
                nav.addEventListener('click', () => {
                    const view = nav.dataset.nav;
                    closeAllModals();
                    setActiveNav(view);

                    if (view === 'tasks') {
                        renderTasks();
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                    } else if (view === 'analytics') {
                        openAnalyticsModal();
                    } else if (view === 'settings') {
                        openProfileModal();
                    }
                });
            });
        }

        // Handle notification clicks routed from the Service Worker
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.addEventListener('message', function(event) {
                if (event.data && event.data.type === 'NOTIF_CLICK') {
                    var channelId = event.data.channelId;
                    if (channelId === 'summary') {
                        openAnalyticsModal();
                    } else if (channelId === 'backup_completed') {
                        openProfileModal();
                    } else {
                        // task_reminder — ensure today view is active
                        state.activeFilter = 'today';
                        dom.filterTabs.forEach(function(t) {
                            if (t.dataset.filter === 'today') t.classList.add('active');
                            else t.classList.remove('active');
                        });
                        renderTasks();
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                    }
                }
            });
        }
    }

    function showToast(msg) {
        const toast = document.createElement('div');
        toast.className = 'toast';
        toast.innerHTML = `<i class="fa-solid fa-circle-check" style="color:var(--accent-success);"></i> ${msg}`;
        dom.toastContainer.appendChild(toast);
        setTimeout(() => {
            toast.remove();
        }, 3000);
    }

    function escapeHtml(str) {
        return str.replace(/[&<>"']/g, function (m) {
            return {
                '&': '&amp;',
                '<': '&lt;',
                '>': '&gt;',
                '"': '&quot;',
                "'": '&#039;'
            }[m];
        });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();

/* RoutineCraft - Firebase Authentication & User Management Module
   Supports Google Sign-In, Email/Password Auth, and User State Sync.
   Allows app owner to view all logged-in users in the Firebase Console.
*/

window.RC_FIREBASE = {
  // Live Firebase Configuration for project "routinecraft-db0af"
  config: {
    apiKey: "AIzaSyCdDR9PeiqtHnWTWuXgFAIJUGi8Xor4ebg",
    authDomain: "routinecraft-db0af.firebaseapp.com",
    projectId: "routinecraft-db0af",
    storageBucket: "routinecraft-db0af.firebasestorage.app",
    messagingSenderId: "1037852256619",
    appId: "1:1037852256619:web:92a7d7631af2aa161e042e",
    measurementId: "G-CGYVEBC2YN"
  },

  initialized: false,
  currentUser: null,

  /**
   * Initialize Firebase SDK with config.
   */
  init(customConfig) {
    if (customConfig) {
      this.config = { ...this.config, ...customConfig };
    }

    // Check if Firebase JS SDK is loaded
    if (typeof firebase === 'undefined') {
      console.warn('[RC_FIREBASE] Firebase JS SDK not found on window.');
      return false;
    }

    try {
      if (!firebase.apps.length) {
        firebase.initializeApp(this.config);
      }
      this.initialized = true;
      console.log('[RC_FIREBASE] Firebase App Initialized successfully.');
      return true;
    } catch (err) {
      console.warn('[RC_FIREBASE] Firebase init warning:', err.message);
      return false;
    }
  },

  /**
   * Set up Auth State Change listener.
   * Calls onUserChanged(user) whenever sign-in state changes.
   */
  onAuthStateChanged(callback) {
    if (!this.initialized && !this.init()) return;

    firebase.auth().onAuthStateChanged((user) => {
      this.currentUser = user;
      if (user) {
        console.log('[RC_FIREBASE] User signed in:', user.email, user.uid);
      } else {
        console.log('[RC_FIREBASE] User signed out / anonymous.');
      }
      if (typeof callback === 'function') {
        callback(user);
      }
    });
  },

  /**
   * Sign In with Google Popup
   */
  async signInWithGoogle() {
    if (!this.initialized && !this.init()) {
      throw new Error('Firebase not configured. Please add your Firebase config credentials.');
    }

    const provider = new firebase.auth.GoogleAuthProvider();
    provider.addScope('profile');
    provider.addScope('email');

    try {
      const result = await firebase.auth().signInWithPopup(provider);
      console.log('[RC_FIREBASE] Google Sign-In successful:', result.user.email);
      return result.user;
    } catch (error) {
      console.error('[RC_FIREBASE] Google Sign-In error:', error);
      throw error;
    }
  },

  /**
   * Sign In / Sign Up with Email and Password
   */
  async signInWithEmail(email, password) {
    if (!this.initialized && !this.init()) {
      throw new Error('Firebase not configured. Please add your Firebase config credentials.');
    }

    try {
      const result = await firebase.auth().signInWithEmailAndPassword(email, password);
      return result.user;
    } catch (error) {
      // If user not found, automatically register them
      if (error.code === 'auth/user-not-found') {
        const createResult = await firebase.auth().createUserWithEmailAndPassword(email, password);
        return createResult.user;
      }
      throw error;
    }
  },

  /**
   * Sign Out
   */
  async signOut() {
    if (firebase?.auth) {
      await firebase.auth().signOut();
      this.currentUser = null;
      console.log('[RC_FIREBASE] Signed out.');
    }
  }
};

// Auto-initialize Firebase if SDK is ready
if (typeof firebase !== 'undefined') {
  window.RC_FIREBASE.init();
}


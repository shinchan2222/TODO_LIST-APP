// src/firebase.js
// Firebase initialization and authentication helper for RoutineCraft
// This module mirrors the functionality previously in src/plugins/firebase-auth.js
// but is provided as a separate ES module for easier imports.

// Export a singleton object
export const RC_FIREBASE = {
  // Firebase config – replace with your project's values if needed
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

  /** Initialize Firebase SDK */
  init(customConfig) {
    if (customConfig) this.config = { ...this.config, ...customConfig };
    if (typeof firebase === "undefined") {
      console.warn("[RC_FIREBASE] Firebase SDK not loaded.");
      return false;
    }
    try {
      if (!firebase.apps.length) firebase.initializeApp(this.config);
      this.initialized = true;
      console.log("[RC_FIREBASE] Initialized.");
      return true;
    } catch (e) {
      console.warn("[RC_FIREBASE] Init error:", e.message);
      return false;
    }
  },

  /** Auth state listener */
  onAuthStateChanged(cb) {
    if (!this.initialized && !this.init()) return;
    firebase.auth().onAuthStateChanged(user => {
      this.currentUser = user;
      if (typeof cb === "function") cb(user);
    });
  },

  /** Check redirect result (used for mobile redirect flow) */
  async checkRedirectResult() {
    if (!this.initialized && !this.init()) return null;
    try {
      const res = await firebase.auth().getRedirectResult();
      return res && res.user ? res.user : null;
    } catch (e) {
      console.warn("[RC_FIREBASE] Redirect result error:", e.message);
      return null;
    }
  },

  /** Sign‑in with Google (popup) */
  async signInWithGoogle() {
    if (!this.initialized && !this.init()) throw new Error("Firebase not init");
    const provider = new firebase.auth.GoogleAuthProvider();
    provider.addScope("profile");
    provider.addScope("email");
    try {
      const result = await firebase.auth().signInWithPopup(provider);
      return result.user;
    } catch (e) {
      console.warn("[RC_FIREBASE] Google sign‑in error:", e?.message);
      throw new Error("BROWSER_STORAGE_RESTRICTED");
    }
  },

  /** Sign‑out */
  async signOut() {
    if (firebase?.auth) await firebase.auth().signOut();
    this.currentUser = null;
    console.log("[RC_FIREBASE] Signed out");
  }
};

// Auto‑initialize if firebase SDK is already present
if (typeof firebase !== "undefined") RC_FIREBASE.init();
window.RC_FIREBASE = RC_FIREBASE;

"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { authApi } from "@/lib/api/auth";
import { tokenStorage } from "@/lib/api/client";

const TOTAL_IDLE_LIMIT_MS = 5 * 60 * 1000; // 5 minutes
const WARNING_THRESHOLD_MS = 4 * 60 * 1000 + 30 * 1000; // 4 minutes 30 seconds
const PING_THROTTLE_MS = 15 * 1000; // Throttle server pings to 15s

interface UseSessionTimerOptions {
  isAuthenticated: boolean;
  onLogout: (reason?: string) => void;
}

export function useSessionTimer({ isAuthenticated, onLogout }: UseSessionTimerOptions) {
  const [showWarningModal, setShowWarningModal] = useState(false);
  const [countdownSeconds, setCountdownSeconds] = useState(30);

  const lastActivityRef = useRef<number>(Date.now());
  const lastPingRef = useRef<number>(Date.now());
  const isWarningActiveRef = useRef<boolean>(false);
  const timerGenerationRef = useRef<number>(tokenStorage.getGeneration());

  // Reset timestamps and sync generation whenever authentication state or generation changes
  useEffect(() => {
    if (isAuthenticated) {
      const now = Date.now();
      lastActivityRef.current = now;
      lastPingRef.current = now;
      timerGenerationRef.current = tokenStorage.getGeneration();
      setShowWarningModal(false);
      if (process.env.NODE_ENV !== "production") {
        console.debug(
          `[AUTH_DEBUG] SESSION_TIMER_STARTED: Reset idle timestamp to now. Generation=${timerGenerationRef.current}`
        );
      }
    } else {
      setShowWarningModal(false);
      if (process.env.NODE_ENV !== "production") {
        console.debug(`[AUTH_DEBUG] SESSION_TIMER_CANCELLED: User is not authenticated`);
      }
    }
  }, [isAuthenticated]);

  // Sync ref with warning state
  useEffect(() => {
    isWarningActiveRef.current = showWarningModal;
  }, [showWarningModal]);

  // Handler to refresh activity when user moves mouse/types
  const handleUserActivity = useCallback(() => {
    // If the warning modal is active, user must explicitly click "Stay signed in"
    if (isWarningActiveRef.current) return;

    const now = Date.now();
    lastActivityRef.current = now;

    // Send throttled ping to backend to renew session timestamp on server
    if (isAuthenticated && now - lastPingRef.current > PING_THROTTLE_MS) {
      lastPingRef.current = now;
      authApi.pingSession().catch(() => {});
    }
  }, [isAuthenticated]);

  // Extend session manually (when user clicks "Stay Signed In" in modal)
  const staySignedIn = useCallback(async () => {
    setShowWarningModal(false);
    setCountdownSeconds(30);
    const now = Date.now();
    lastActivityRef.current = now;
    lastPingRef.current = now;
    try {
      await authApi.pingSession();
    } catch {
      // If ping fails (e.g. backend session already expired), trigger logout
      onLogout("expired");
    }
  }, [onLogout]);

  // Attach event listeners for user activity
  useEffect(() => {
    if (!isAuthenticated) {
      setShowWarningModal(false);
      return;
    }

    const events = ["mousemove", "keydown", "click", "scroll", "touchstart"];
    const handleEvent = () => handleUserActivity();

    events.forEach((evt) => window.addEventListener(evt, handleEvent, { passive: true }));

    return () => {
      events.forEach((evt) => window.removeEventListener(evt, handleEvent));
    };
  }, [isAuthenticated, handleUserActivity]);

  // Main ticker checking idle threshold every 1000ms
  useEffect(() => {
    if (!isAuthenticated) return;

    const timer = setInterval(() => {
      // Guard against stale timer callback if auth generation updated
      if (timerGenerationRef.current !== tokenStorage.getGeneration()) {
        if (process.env.NODE_ENV !== "production") {
          console.debug(
            `[AUTH_DEBUG] STALE_SESSION_EVENT_IGNORED: Timer generation ${timerGenerationRef.current} != active ${tokenStorage.getGeneration()}`
          );
        }
        clearInterval(timer);
        return;
      }

      const now = Date.now();
      const elapsed = now - lastActivityRef.current;

      if (elapsed >= TOTAL_IDLE_LIMIT_MS) {
        // Exceeded 5 minutes of total inactivity -> Force Logout
        if (process.env.NODE_ENV !== "production") {
          console.debug(`[AUTH_DEBUG] SESSION_EXPIRED: 5-minute inactivity limit exceeded`);
        }
        clearInterval(timer);
        setShowWarningModal(false);
        onLogout("expired");
      } else if (elapsed >= WARNING_THRESHOLD_MS) {
        // Between 4:30 and 5:00 -> Display 30s Countdown Warning Modal
        if (!isWarningActiveRef.current) {
          setShowWarningModal(true);
        }
        const remainingMs = TOTAL_IDLE_LIMIT_MS - elapsed;
        const remainingSec = Math.max(0, Math.ceil(remainingMs / 1000));
        setCountdownSeconds(remainingSec);
      } else {
        if (isWarningActiveRef.current) {
          setShowWarningModal(false);
        }
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [isAuthenticated, onLogout]);

  return {
    showWarningModal,
    countdownSeconds,
    staySignedIn,
  };
}

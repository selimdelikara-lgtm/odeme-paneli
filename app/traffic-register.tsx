"use client";

import { useEffect } from "react";

const detectDevice = () => {
  if (typeof navigator === "undefined") return "unknown";
  return /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent) ? "mobile" : "desktop";
};

const detectBrowser = () => {
  if (typeof navigator === "undefined") return "unknown";
  const userAgent = navigator.userAgent;
  if (userAgent.includes("Edg/")) return "Edge";
  if (userAgent.includes("Chrome/")) return "Chrome";
  if (userAgent.includes("Safari/") && !userAgent.includes("Chrome/")) return "Safari";
  if (userAgent.includes("Firefox/")) return "Firefox";
  return "Other";
};

export default function TrafficRegister() {
  useEffect(() => {
    if (window.location.pathname.startsWith("/admin")) return;

    const send = () => {
      const payload = JSON.stringify({
        path: window.location.pathname,
        referrer: document.referrer || "",
        deviceType: detectDevice(),
        browser: detectBrowser(),
      });

      if (navigator.sendBeacon) {
        navigator.sendBeacon("/api/traffic", new Blob([payload], { type: "application/json" }));
        return;
      }

      fetch("/api/traffic", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: payload,
        keepalive: true,
      }).catch(() => {});
    };

    const timer = window.setTimeout(send, 600);
    return () => window.clearTimeout(timer);
  }, []);

  return null;
}

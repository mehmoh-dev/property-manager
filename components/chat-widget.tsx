"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

/**
 * Kommunicate chat widget loader.
 *
 * The App ID is read from NEXT_PUBLIC_KOMMUNICATE_APP_ID (.env.local). This
 * mirrors the official Kommunicate v3 embed snippet. The widget is skipped on
 * the admin portal so it only appears on the public site.
 */
export function ChatWidget() {
  const pathname = usePathname();
  const appId = process.env.NEXT_PUBLIC_KOMMUNICATE_APP_ID;
  const isAdmin = pathname?.startsWith("/admin");

  useEffect(() => {
    if (!appId || isAdmin) return;
    if (document.getElementById("kommunicate-script")) return;

    const w = window as unknown as { kommunicate?: { _globals?: unknown } };
    const m = w.kommunicate || {};

    const kommunicateSettings = {
      appId,
      popupWidget: true,
      automaticChatOpenOnNavigation: true,
    };

    const s = document.createElement("script");
    s.id = "kommunicate-script";
    s.type = "text/javascript";
    s.async = true;
    s.src = "https://widget.kommunicate.io/kommunicate-widget-3.0.min.js";
    const h = document.getElementsByTagName("head")[0];
    h.appendChild(s);

    w.kommunicate = m;
    (m as { _globals?: unknown })._globals = kommunicateSettings;
  }, [appId, isAdmin]);

  return null;
}

"use client";

import { useEffect } from "react";

export default function SettingsApplicator() {
  useEffect(() => {
    fetch("/api/settings")
      .then((r) => r.json())
      .then((s: Record<string, string>) => {
        if (s.gold_intensity) document.documentElement.setAttribute("data-gold", s.gold_intensity);
        if (s.anim_speed) document.documentElement.setAttribute("data-anim", s.anim_speed);
        if (s.density) document.documentElement.setAttribute("data-density", s.density);
      });
  }, []);

  return null;
}

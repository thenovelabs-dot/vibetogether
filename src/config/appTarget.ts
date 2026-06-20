export const APP_TARGET = import.meta.env.VITE_APP_TARGET ?? "web";

export const isAppsInToss = APP_TARGET === "apps-in-toss";

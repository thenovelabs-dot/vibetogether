import { isAppsInToss } from "./appTarget";

export const features = {
  meetups: !isAppsInToss,
  coffeechat: !isAppsInToss,
  googleLogin: !isAppsInToss,
  tossLogin: isAppsInToss,
  externalProductLinks: !isAppsInToss,
  locationOnboarding: !isAppsInToss,
};

/* Tiny cookie helpers + Specimen.lab preferences.
   - consent: cookie banner accepted
   - introSeen: first-timer watched the full intro cinematic; returning
     visitors skip straight to the code screen. */

export function setCookie(name, value, days = 365) {
  const d = new Date();
  d.setTime(d.getTime() + days * 864e5);
  document.cookie = `${name}=${encodeURIComponent(value)};expires=${d.toUTCString()};path=/;SameSite=Lax`;
}
export function getCookie(name) {
  return document.cookie
    .split("; ")
    .find((c) => c.startsWith(name + "="))
    ?.split("=")[1];
}
export function delCookie(name) {
  document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`;
}

export const hasConsent = () => getCookie("sl_consent") === "1";
export const giveConsent = () => setCookie("sl_consent", "1");

export const hasSeenIntro = () => getCookie("sl_intro") === "1";
export const markIntroSeen = () => setCookie("sl_intro", "1");
export const resetIntro = () => delCookie("sl_intro");

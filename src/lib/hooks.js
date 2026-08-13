import { useCallback, useEffect, useState } from "react";
import * as store from "./store";

/** live list of everyone in the room (seeds + realtime db), re-renders on change */
export function useRoom() {
  const [all, setAll] = useState(() => store.getAll());
  useEffect(() => store.subscribe(() => setAll(store.getAll())), []);
  return all;
}

/** the active event's config (questions, parts, links) — see data/events.js */
export function useEvent() {
  const [ev, setEv] = useState(() => store.getActiveEvent());
  useEffect(() => store.subscribe(() => setEv(store.getActiveEvent())), []);
  return ev;
}

/** the active event's tension questions */
export function useQuestions() {
  return useEvent().questions;
}

/** headcount of another event's room, without leaving this one (monitor menu) */
export function useRoomCount(eventId) {
  const [n, setN] = useState(0);
  useEffect(() => store.subscribeRoomCount(eventId, setN), [eventId]);
  return n;
}

/** live host-controlled session state */
export function useSession() {
  const [session, setSession] = useState(() => store.getSession());
  useEffect(() => store.subscribe(() => setSession(store.getSession())), []);
  return session;
}

/** the current specimen + identity actions */
export function useMe() {
  const [me, setMe] = useState(() => store.getMe());
  useEffect(() => store.subscribe(() => setMe(store.getMe())), []);

  const create = useCallback((data) => store.createSpecimen(data), []);
  const patch = useCallback(
    (fields) => (store.getMe() ? store.patchSpecimen(store.getMe().id, fields) : null),
    []
  );
  const login = useCallback((handle, passcode) => store.login(handle, passcode), []);
  const logout = useCallback(() => store.setMe(null), []);

  return { me, create, patch, login, logout };
}

import { useCallback, useEffect, useState } from "react";
import * as store from "./store";

/** live list of everyone in the room (seeds + real), re-renders on change */
export function useRoom() {
  const [all, setAll] = useState(() => store.getAll());
  useEffect(() => store.subscribe(() => setAll(store.getAll())), []);
  return all;
}

/** the current specimen + identity actions */
export function useMe() {
  const [me, setMe] = useState(() => store.getMe());
  useEffect(() => store.subscribe(() => setMe(store.getMe())), []);

  const create = useCallback((data) => store.createSpecimen(data), []);
  const patch = useCallback(
    (fields) => (me ? store.patchSpecimen(me.id, fields) : null),
    [me]
  );
  const login = useCallback((handle, passcode) => store.login(handle, passcode), []);
  const logout = useCallback(() => store.setMe(null), []);

  return { me, create, patch, login, logout };
}

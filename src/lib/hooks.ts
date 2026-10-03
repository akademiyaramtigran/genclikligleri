"use client";

import { useCallback, useEffect, useRef, useState } from "react";

const EVT = "dgl:data-changed";

/** Veri değiştiğinde açık sayfaların yeniden yüklenmesi için */
export function notifyChange() {
  if (typeof window !== "undefined") window.dispatchEvent(new Event(EVT));
}

/** Asenkron veri yükleme kancası */
export function useData<T>(load: () => Promise<T>, deps: unknown[] = []) {
  const [data, setData] = useState<T | undefined>(undefined);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const ref = useRef(load);
  ref.current = load;
  const run = useCallback(async () => {
    setLoading(true);
    try {
      const d = await ref.current();
      setData(d);
      setError(null);
    } catch (e) {
      console.error(e);
      setError(e instanceof Error ? e.message : "Veri yüklenemedi");
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => {
    run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
  useEffect(() => {
    const h = () => run();
    window.addEventListener(EVT, h);
    return () => window.removeEventListener(EVT, h);
  }, [run]);
  return { data, error, loading, reload: run };
}

export function useTitle(title: string | undefined | null) {
  useEffect(() => {
    if (title) document.title = `${title} | Diyarbakır Gençlik Organizasyonları`;
  }, [title]);
}


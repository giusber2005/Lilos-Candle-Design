import { createContext, useContext, useEffect, useState, useMemo, type ReactNode } from "react";

export type ContentMap = Record<string, string>;

const ContentContext = createContext<ContentMap>({});

export function ContentProvider({ children }: { children: ReactNode }) {
  const [content, setContent] = useState<ContentMap>({});

  useEffect(() => {
    fetch("/api/content")
      .then((r) => r.json())
      .then((data: ContentMap) => {
        setContent(data);
        if (data.favicon_url) {
          let link = document.querySelector<HTMLLinkElement>("link[rel='icon']");
          if (!link) {
            link = document.createElement("link");
            link.rel = "icon";
            document.head.appendChild(link);
          }
          link.href = data.favicon_url;
        }
      })
      .catch(() => {});
  }, []);

  return (
    <ContentContext.Provider value={content}>
      {children}
    </ContentContext.Provider>
  );
}

/** Returns the full content map. Use `c['key'] || 'fallback'` pattern. */
export function useContent(): ContentMap {
  return useContext(ContentContext);
}

/** Parses a JSON content key into an array. Returns `fallback` if missing or invalid. */
export function useJsonContent<T>(key: string, fallback: T[]): T[] {
  const content = useContent();
  return useMemo(() => {
    const raw = content[key];
    if (!raw) return fallback;
    try { return JSON.parse(raw) as T[]; }
    catch { return fallback; }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [content[key]]);
}

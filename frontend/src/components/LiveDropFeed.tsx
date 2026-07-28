import { useEffect, useMemo, useState } from "react";
import { apiRequest, resolveAssetUrl } from "../lib/api";
import type { RecentDropResponse } from "../types/api";

const REFRESH_INTERVAL_MS = 5_000;
const MINIMUM_VISIBLE_DROPS = 16;

export function LiveDropFeed() {
  const [drops, setDrops] = useState<RecentDropResponse[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let active = true;

    async function loadRecentDrops() {
      try {
        const response = await apiRequest<RecentDropResponse[]>(
          "/api/cases/recent-drops",
        );
        if (active) {
          setDrops(response);
          setLoaded(true);
        }
      } catch {
        if (active) {
          setLoaded(true);
        }
      }
    }

    void loadRecentDrops();
    const refreshTimer = window.setInterval(
      loadRecentDrops
    );

    return () => {
      active = false;
      window.clearInterval(refreshTimer);
    };
  }, []);

  const visibleDrops = useMemo(() => {
    if (drops.length === 0) {
      return [];
    }

    return Array.from(
      { length: Math.max(MINIMUM_VISIBLE_DROPS, drops.length) },
      (_, index) => drops[index % drops.length],
    );
  }, [drops]);

  if (drops.length === 0) {
    return (
      <section
        className="live-feed live-feed--empty"
        aria-label="Live-лента предметов"
      >
        <strong className="live-feed__label">LIVE</strong>
        <div className="live-feed__empty">
          {loaded ? "Пока никто не открывал кейсы" : "Загружаем выпадения…"}
        </div>
      </section>
    );
  }

  return (
    <section className="live-feed" aria-label="Live-лента предметов">
      <strong className="live-feed__label">LIVE</strong>
      <div className="live-feed__viewport">
        <div className="live-feed__list">
          {visibleDrops.map((drop, index) => (
            <article
              className="live-feed__entry"
              key={`${drop.id}-${index}`}
              title={drop.name}
            >
              <img src={resolveAssetUrl(drop.imageUrl)} alt={drop.name} />
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

import { Boxes, PackageOpen, RefreshCw, Tag } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { CaseVisual } from "../components/CaseVisual";
import { Toast } from "../components/Toast";
import { useAuth } from "../context/AuthContext";
import { apiRequest, formatCoins, getFriendlyError } from "../lib/api";
import type {
  InventoryItemResponse,
  ItemResponse,
  SellInventoryItemResponse,
} from "../types/api";

interface InventoryViewItem extends InventoryItemResponse {
  details?: ItemResponse;
}

export function InventoryPage() {
  const { token, user, wallet, refreshWallet } = useAuth();
  const [items, setItems] = useState<InventoryViewItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [sellingId, setSellingId] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const loadInventory = useCallback(async () => {
    if (!token) {
      return;
    }

    setLoading(true);
    setError("");

    try {
      const [inventory, catalog] = await Promise.all([
        apiRequest<InventoryItemResponse[]>("/api/inventory", {}, token),
        apiRequest<ItemResponse[]>("/api/items"),
      ]);
      const itemCatalog = new Map(
        catalog.map((item) => [item.id, item] as const),
      );

      setItems(
        inventory.map((inventoryItem) => ({
          ...inventoryItem,
          details: itemCatalog.get(inventoryItem.item_id),
        })),
      );
    } catch (requestError) {
      setError(getFriendlyError(requestError));
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    void loadInventory();
  }, [loadInventory]);

  async function sellItem(item: InventoryViewItem) {
    if (!token || sellingId !== null) {
      return;
    }

    setSellingId(item.id);
    setError("");
    setNotice("");

    try {
      const sale = await apiRequest<SellInventoryItemResponse>(
        `/api/inventory/${item.id}/sell`,
        { method: "POST" },
        token,
      );
      setItems((current) => current.filter((entry) => entry.id !== item.id));
      await refreshWallet();
      setNotice(
        `Предмет продан за ${formatCoins(sale.creditedAmount)} ⭐. Новый баланс: ${formatCoins(sale.balance)} ⭐`,
      );
    } catch (requestError) {
      setError(getFriendlyError(requestError));
    } finally {
      setSellingId(null);
    }
  }

  const totalValue = useMemo(
    () => items.reduce((sum, item) => sum + (item.details?.price ?? 0), 0),
    [items],
  );

  return (
    <main className="inventory-page">
      {notice && (
        <Toast message={notice} onClose={() => setNotice("")} />
      )}

      <section className="profile-banner">
        <div className="profile-banner__avatar">
          {(user?.email?.[0] || "P").toUpperCase()}
        </div>
        <div className="profile-banner__identity">
          <span>Профиль игрока</span>
          <h1>{user?.email}</h1>
          <p>Все полученные и купленные предметы находятся здесь.</p>
        </div>
        <div className="profile-stats">
          <div>
            <span>
              <small>Баланс</small>
              <strong className="currency-amount">
                {formatCoins(wallet?.balance ?? 0)}
                <span className="currency-star">⭐</span>
              </strong>
            </span>
          </div>
          <div>
            <Boxes size={19} />
            <span>
              <small>Предметов</small>
              <strong>{items.length}</strong>
            </span>
          </div>
          <div>
            <PackageOpen size={19} />
            <span>
              <small>Стоимость</small>
              <strong className="currency-amount">
                {formatCoins(totalValue)}
                <span className="currency-star">⭐</span>
              </strong>
            </span>
          </div>
        </div>
      </section>

      <section className="inventory-section">
        <div className="section-heading">
          <div>
            <span className="section-kicker">Твоя коллекция</span>
            <h2>Инвентарь</h2>
          </div>
          <button
            className="icon-button"
            type="button"
            aria-label="Обновить инвентарь"
            onClick={loadInventory}
            disabled={loading}
          >
            <RefreshCw size={18} />
          </button>
        </div>

        {loading && <div className="page-loader">Загружаем предметы…</div>}

        {!loading && error && items.length === 0 && (
          <div className="state-card">
            <span className="state-card__icon">!</span>
            <h3>Не удалось загрузить инвентарь</h3>
            <p>{error}</p>
            <button
              className="secondary-button"
              type="button"
              onClick={loadInventory}
            >
              Повторить
            </button>
          </div>
        )}

        {!loading && !error && items.length === 0 && (
          <p className="inventory-empty">Инвентарь пуст</p>
        )}

        {!loading && error && items.length > 0 && (
          <div className="notice notice--error">{error}</div>
        )}

        {!loading && items.length > 0 && (
          <div className="inventory-grid">
            {items.map((item) => (
              <article className="inventory-card" key={item.id}>
                <span className="inventory-card__id">#{item.id}</span>
                <CaseVisual
                  kind="item"
                  imageUrl={item.details?.imageUrl}
                  itemName={item.details?.name}
                />
                <div className="inventory-card__body">
                  <h3>{item.details?.name ?? `Предмет #${item.item_id}`}</h3>
                  <strong className="currency-amount">
                    {formatCoins(item.details?.price ?? 0)}
                    <span className="currency-star">⭐</span>
                  </strong>
                  <button
                    className="sell-button"
                    type="button"
                    disabled={sellingId !== null || !item.details}
                    onClick={() => sellItem(item)}
                  >
                    <Tag size={16} />
                    {sellingId === item.id ? "Продаём…" : "Продать"}
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}

import { RefreshCw, ShoppingBag } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { CaseVisual } from "../components/CaseVisual";
import { ConfirmDialog } from "../components/ConfirmDialog";
import { useAuth } from "../context/AuthContext";
import { apiRequest, formatCoins, getFriendlyError } from "../lib/api";
import type { ItemResponse, StorePurchaseResponse } from "../types/api";

export function StorePage() {
  const { token, refreshWallet } = useAuth();
  const navigate = useNavigate();
  const [items, setItems] = useState<ItemResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [buyingItemId, setBuyingItemId] = useState<number | null>(null);
  const [pendingPurchase, setPendingPurchase] =
    useState<ItemResponse | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const loadItems = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      setItems(await apiRequest<ItemResponse[]>("/api/store/items"));
    } catch (requestError) {
      setError(getFriendlyError(requestError));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadItems();
  }, [loadItems]);

  async function buyItem(item: ItemResponse) {
    if (!token) {
      navigate("/login?returnTo=/store");
      return;
    }

    if (buyingItemId !== null) {
      return;
    }

    setBuyingItemId(item.id);
    setPendingPurchase(null);
    setError("");
    setNotice("");

    try {
      const purchase = await apiRequest<StorePurchaseResponse>(
        `/api/store/items/${item.id}/buy`,
        { method: "POST" },
        token,
      );
      await refreshWallet();
      setNotice(
        `${purchase.name} добавлен в инвентарь. Новый баланс: ${formatCoins(purchase.balance)} ⭐`,
      );
    } catch (requestError) {
      setError(getFriendlyError(requestError));
    } finally {
      setBuyingItemId(null);
    }
  }

  return (
    <main className="store-page">
      <section className="page-hero page-hero--compact">
        <div>
          <span className="section-kicker">Каталог CatCase</span>
          <h1>Магазин предметов</h1>
          <p>
            Выбери предмет и добавь его в коллекцию без открытия кейса.
          </p>
        </div>
        <ShoppingBag size={54} strokeWidth={1.4} aria-hidden="true" />
      </section>

      <section className="catalog-section">
        <div className="section-heading">
          <div>
            <span className="section-kicker">Все предметы</span>
            <h2>Доступно сейчас</h2>
          </div>
          <button
            className="icon-button"
            type="button"
            aria-label="Обновить магазин"
            onClick={loadItems}
            disabled={loading}
          >
            <RefreshCw size={18} />
          </button>
        </div>

        {notice && <div className="notice notice--success">{notice}</div>}
        {error && <div className="notice notice--error">{error}</div>}
        {loading && <div className="page-loader">Загружаем магазин…</div>}

        {!loading && !error && items.length === 0 && (
          <div className="state-card">
            <h3>Магазин пока пуст</h3>
            <p>Предметы появятся после добавления администратором.</p>
          </div>
        )}

        {!loading && items.length > 0 && (
          <div className="product-grid">
            {items.map((item) => (
              <article className="product-card" key={item.id}>
                <span className="product-card__id">ITEM #{item.id}</span>
                <CaseVisual
                  kind="item"
                  size="large"
                  imageUrl={item.imageUrl}
                  itemName={item.name}
                />
                <div className="product-card__body">
                  <h3>{item.name}</h3>
                  <div className="product-card__footer">
                    <strong className="currency-amount">
                      {formatCoins(item.price)}
                      <span className="currency-star">⭐</span>
                    </strong>
                    <button
                      className="primary-button"
                      type="button"
                      disabled={buyingItemId !== null}
                      onClick={() => {
                        if (!token) {
                          void buyItem(item);
                          return;
                        }
                        setPendingPurchase(item);
                      }}
                    >
                      {buyingItemId === item.id
                        ? "Покупаем…"
                        : token
                          ? "Купить"
                          : "Войти и купить"}
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      {pendingPurchase && (
        <ConfirmDialog
          title="Подтвердить покупку?"
          message={`Купить «${pendingPurchase.name}» за ${formatCoins(pendingPurchase.price)} ⭐?`}
          confirmLabel="Да, купить"
          loading={buyingItemId === pendingPurchase.id}
          onCancel={() => setPendingPurchase(null)}
          onConfirm={() => void buyItem(pendingPurchase)}
        />
      )}
    </main>
  );
}

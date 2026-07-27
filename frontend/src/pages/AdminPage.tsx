import {
  ImagePlus,
  PackagePlus,
  Pencil,
  Plus,
  RefreshCw,
  ShieldCheck,
  Trash2,
  X,
} from "lucide-react";
import { FormEvent, useCallback, useEffect, useState } from "react";
import { CaseVisual } from "../components/CaseVisual";
import { useAuth } from "../context/AuthContext";
import { apiRequest, formatCoins, getFriendlyError } from "../lib/api";
import type {
  AdminGameCase,
  GameCaseDetails,
  ImageUploadResponse,
  ItemResponse,
} from "../types/api";

interface RewardDraft {
  key: number;
  itemId: string;
  weight: string;
}

let nextRewardKey = 2;

export function AdminPage() {
  const { token } = useAuth();
  const [items, setItems] = useState<ItemResponse[]>([]);
  const [gameCases, setGameCases] = useState<AdminGameCase[]>([]);
  const [catalogLoading, setCatalogLoading] = useState(true);
  const [catalogError, setCatalogError] = useState("");
  const [casesLoading, setCasesLoading] = useState(true);
  const [casesError, setCasesError] = useState("");

  const [editingItem, setEditingItem] = useState<ItemResponse | null>(null);
  const [itemName, setItemName] = useState("");
  const [itemPrice, setItemPrice] = useState("");
  const [itemImage, setItemImage] = useState<File | null>(null);
  const [itemSubmitting, setItemSubmitting] = useState(false);
  const [itemMessage, setItemMessage] = useState("");
  const [itemError, setItemError] = useState("");
  const [itemFileKey, setItemFileKey] = useState(0);

  const [editingCase, setEditingCase] = useState<GameCaseDetails | null>(null);
  const [caseLoadingId, setCaseLoadingId] = useState<number | null>(null);
  const [caseName, setCaseName] = useState("");
  const [casePrice, setCasePrice] = useState("");
  const [caseActive, setCaseActive] = useState(true);
  const [caseImage, setCaseImage] = useState<File | null>(null);
  const [rewards, setRewards] = useState<RewardDraft[]>([
    { key: 1, itemId: "", weight: "100" },
  ]);
  const [caseSubmitting, setCaseSubmitting] = useState(false);
  const [caseMessage, setCaseMessage] = useState("");
  const [caseError, setCaseError] = useState("");
  const [caseFileKey, setCaseFileKey] = useState(0);

  const loadItems = useCallback(async () => {
    setCatalogLoading(true);
    setCatalogError("");
    try {
      setItems(await apiRequest<ItemResponse[]>("/api/items"));
    } catch (requestError) {
      setCatalogError(getFriendlyError(requestError));
    } finally {
      setCatalogLoading(false);
    }
  }, []);

  const loadCases = useCallback(async () => {
    setCasesLoading(true);
    setCasesError("");
    try {
      setGameCases(
        await apiRequest<AdminGameCase[]>("/api/admin/cases", {}, token),
      );
    } catch (requestError) {
      setCasesError(getFriendlyError(requestError));
    } finally {
      setCasesLoading(false);
    }
  }, [token]);

  useEffect(() => {
    void loadItems();
    void loadCases();
  }, [loadCases, loadItems]);

  async function uploadImage(path: string, file: File) {
    const form = new FormData();
    form.append("file", file);
    return apiRequest<ImageUploadResponse>(
      path,
      { method: "POST", body: form },
      token,
    );
  }

  function resetItemForm() {
    setEditingItem(null);
    setItemName("");
    setItemPrice("");
    setItemImage(null);
    setItemFileKey((value) => value + 1);
  }

  function startEditingItem(item: ItemResponse) {
    setEditingItem(item);
    setItemName(item.name);
    setItemPrice(item.price.toString());
    setItemImage(null);
    setItemMessage("");
    setItemError("");
    setItemFileKey((value) => value + 1);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function saveItem(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editingItem && !itemImage) {
      setItemError("Выбери изображение предмета.");
      return;
    }

    setItemSubmitting(true);
    setItemError("");
    setItemMessage("");

    try {
      let imageUrl = editingItem?.imageUrl;
      if (itemImage) {
        const uploaded = await uploadImage(
          "/api/admin/items/images",
          itemImage,
        );
        imageUrl = uploaded.url;
      }

      if (!imageUrl) {
        setItemError("Выбери изображение предмета.");
        return;
      }

      const saved = await apiRequest<ItemResponse>(
        editingItem
          ? `/api/admin/items/${editingItem.id}`
          : "/api/admin/items",
        {
          method: editingItem ? "PUT" : "POST",
          body: JSON.stringify({
            name: itemName.trim(),
            imageUrl,
            price: Number(itemPrice),
          }),
        },
        token,
      );

      setItemMessage(
        editingItem
          ? `Предмет «${saved.name}» обновлён.`
          : `Предмет «${saved.name}» создан с ID ${saved.id}.`,
      );
      resetItemForm();
      await loadItems();
    } catch (requestError) {
      setItemError(getFriendlyError(requestError));
    } finally {
      setItemSubmitting(false);
    }
  }

  function updateReward(
    key: number,
    field: "itemId" | "weight",
    value: string,
  ) {
    setRewards((current) => {
      if (field === "itemId") {
        return current.map((reward) =>
          reward.key === key ? { ...reward, itemId: value } : reward,
        );
      }

      const otherTotal = current
        .filter((reward) => reward.key !== key)
        .reduce(
          (sum, reward) => sum + Number(reward.weight || 0),
          0,
        );
      const maximum = Math.max(0, 100 - otherTotal);
      const nextWeight =
        value === ""
          ? ""
          : Math.min(
              maximum,
              Math.max(0, Math.trunc(Number(value) || 0)),
            ).toString();

      return current.map((reward) =>
        reward.key === key
          ? { ...reward, weight: nextWeight }
          : reward,
      );
    });
  }

  function addReward() {
    setRewards((current) => {
      const currentTotal = current.reduce(
        (sum, reward) => sum + Number(reward.weight || 0),
        0,
      );
      const usedItemIds = new Set(
        current.map((reward) => Number(reward.itemId)),
      );
      const availableItem = items.find((item) => !usedItemIds.has(item.id));

      if (currentTotal >= 100 || !availableItem) {
        return current;
      }

      return [
        ...current,
        {
          key: nextRewardKey++,
          itemId: availableItem.id.toString(),
          weight: (100 - currentTotal).toString(),
        },
      ];
    });
  }

  function removeReward(key: number) {
    setRewards((current) => current.filter((reward) => reward.key !== key));
  }

  function resetCaseForm() {
    setEditingCase(null);
    setCaseName("");
    setCasePrice("");
    setCaseActive(true);
    setCaseImage(null);
    setCaseFileKey((value) => value + 1);
    setRewards([{ key: nextRewardKey++, itemId: "", weight: "100" }]);
  }

  async function startEditingCase(gameCase: AdminGameCase) {
    setCaseLoadingId(gameCase.id);
    setCaseError("");
    setCaseMessage("");
    try {
      const details = await apiRequest<GameCaseDetails>(
        `/api/cases/${gameCase.id}`,
      );
      setEditingCase(details);
      setCaseName(details.name);
      setCasePrice(details.price.toString());
      setCaseActive(details.active);
      setCaseImage(null);
      setCaseFileKey((value) => value + 1);
      setRewards(
        details.items.map((item) => ({
          key: nextRewardKey++,
          itemId: item.itemId.toString(),
          weight: item.weight.toString(),
        })),
      );
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (requestError) {
      setCasesError(getFriendlyError(requestError));
    } finally {
      setCaseLoadingId(null);
    }
  }

  async function saveGameCase(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editingCase && !caseImage) {
      setCaseError("Выбери изображение кейса.");
      return;
    }

    const totalWeight = rewards.reduce(
      (sum, reward) => sum + Number(reward.weight || 0),
      0,
    );
    if (totalWeight !== 100) {
      setCaseError(
        `Сумма шансов должна быть ровно 100%. Сейчас: ${totalWeight}%.`,
      );
      return;
    }

    setCaseSubmitting(true);
    setCaseError("");
    setCaseMessage("");

    try {
      let imageUrl = editingCase?.imageUrl;
      if (caseImage) {
        const uploaded = await uploadImage(
          "/api/admin/cases/images",
          caseImage,
        );
        imageUrl = uploaded.url;
      }

      if (!imageUrl) {
        setCaseError("Выбери изображение кейса.");
        return;
      }

      const saved = await apiRequest<GameCaseDetails>(
        editingCase
          ? `/api/admin/cases/${editingCase.id}`
          : "/api/admin/cases",
        {
          method: editingCase ? "PUT" : "POST",
          body: JSON.stringify({
            name: caseName.trim(),
            imageUrl,
            price: Number(casePrice),
            active: caseActive,
            items: rewards.map((reward) => ({
              itemId: Number(reward.itemId),
              weight: Number(reward.weight),
            })),
          }),
        },
        token,
      );

      setCaseMessage(
        editingCase
          ? `Кейс «${saved.name}» обновлён.`
          : `Кейс «${saved.name}» создан с ID ${saved.id}.`,
      );
      resetCaseForm();
      await loadCases();
    } catch (requestError) {
      setCaseError(getFriendlyError(requestError));
    } finally {
      setCaseSubmitting(false);
    }
  }

  const totalWeight = rewards.reduce(
    (sum, reward) => sum + Number(reward.weight || 0),
    0,
  );
  const remainingWeight = Math.max(0, 100 - totalWeight);

  function getRewardMaximum(key: number) {
    const otherTotal = rewards
      .filter((reward) => reward.key !== key)
      .reduce(
        (sum, reward) => sum + Number(reward.weight || 0),
        0,
      );
    return Math.max(1, 100 - otherTotal);
  }

  return (
    <main className="admin-page">
      <section className="page-hero page-hero--compact">
        <div>
          <span className="section-kicker">Управление CatCase</span>
          <h1>Админ-панель</h1>
          <p>Добавляй предметы и собирай из них новые кейсы.</p>
        </div>
        <ShieldCheck size={54} strokeWidth={1.4} aria-hidden="true" />
      </section>

      <div className="admin-grid">
        <section className="admin-panel">
          <header className="admin-panel__heading">
            <PackagePlus size={22} />
            <div>
              <span>ITEM SERVICE</span>
              <h2>{editingItem ? "Изменить предмет" : "Новый предмет"}</h2>
            </div>
          </header>

          <form className="admin-form" onSubmit={saveItem}>
            <label className="form-field">
              <span>Название</span>
              <input
                value={itemName}
                onChange={(event) => setItemName(event.target.value)}
                maxLength={255}
                placeholder="Например, Ruby Sword"
                required
              />
            </label>
            <label className="form-field">
              <span>Цена</span>
              <input
                type="number"
                min="0"
                value={itemPrice}
                onChange={(event) => setItemPrice(event.target.value)}
                placeholder="750"
                required
              />
            </label>
            <label className="file-field">
              <ImagePlus size={22} />
              <span>
                <strong>
                  {itemImage
                    ? itemImage.name
                    : editingItem
                      ? "Оставить текущее изображение"
                      : "Изображение предмета"}
                </strong>
                PNG, JPEG или WebP, до 5 МБ
              </span>
              <input
                key={itemFileKey}
                type="file"
                accept="image/png,image/jpeg,image/webp"
                onChange={(event) =>
                  setItemImage(event.target.files?.[0] ?? null)
                }
                required={!editingItem}
              />
            </label>

            {itemMessage && (
              <div className="notice notice--success">{itemMessage}</div>
            )}
            {itemError && (
              <div className="notice notice--error">{itemError}</div>
            )}

            <div className="admin-form__actions">
              {editingItem && (
                <button
                  className="secondary-button"
                  type="button"
                  onClick={resetItemForm}
                  disabled={itemSubmitting}
                >
                  <X size={17} />
                  Отмена
                </button>
              )}
              <button
                className="primary-button"
                type="submit"
                disabled={itemSubmitting}
              >
                {itemSubmitting
                  ? "Сохраняем…"
                  : editingItem
                    ? "Сохранить предмет"
                    : "Создать предмет"}
              </button>
            </div>
          </form>
        </section>

        <section className="admin-panel">
          <header className="admin-panel__heading">
            <ImagePlus size={22} />
            <div>
              <span>CASES SERVICE</span>
              <h2>{editingCase ? "Изменить кейс" : "Новый кейс"}</h2>
            </div>
          </header>

          <form className="admin-form" onSubmit={saveGameCase}>
            <div className="form-row">
              <label className="form-field">
                <span>Название</span>
                <input
                  value={caseName}
                  onChange={(event) => setCaseName(event.target.value)}
                  maxLength={255}
                  placeholder="Например, Ruby Case"
                  required
                />
              </label>
              <label className="form-field">
                <span>Цена открытия</span>
                <input
                  type="number"
                  min="0"
                  value={casePrice}
                  onChange={(event) => setCasePrice(event.target.value)}
                  placeholder="300"
                  required
                />
              </label>
            </div>

            <label className="form-field">
              <span>Статус кейса</span>
              <select
                value={caseActive ? "active" : "hidden"}
                onChange={(event) =>
                  setCaseActive(event.target.value === "active")
                }
              >
                <option value="active">Активен и доступен игрокам</option>
                <option value="hidden">Скрыт</option>
              </select>
            </label>

            <label className="file-field">
              <ImagePlus size={22} />
              <span>
                <strong>
                  {caseImage
                    ? caseImage.name
                    : editingCase
                      ? "Оставить текущее изображение"
                      : "Изображение кейса"}
                </strong>
                PNG, JPEG или WebP, до 5 МБ
              </span>
              <input
                key={caseFileKey}
                type="file"
                accept="image/png,image/jpeg,image/webp"
                onChange={(event) =>
                  setCaseImage(event.target.files?.[0] ?? null)
                }
                required={!editingCase}
              />
            </label>

            <div className="reward-builder">
              <div className="reward-builder__heading">
                <div>
                  <strong>Содержимое кейса</strong>
                  <span
                    className={
                      totalWeight === 100
                        ? "weight-total weight-total--valid"
                        : "weight-total"
                    }
                  >
                    Распределено: {totalWeight}% / 100%
                  </span>
                </div>
                <button
                  className="secondary-button secondary-button--small"
                  type="button"
                  onClick={addReward}
                  disabled={
                    catalogLoading ||
                    items.length === 0 ||
                    remainingWeight === 0 ||
                    rewards.length >= items.length
                  }
                >
                  <Plus size={16} />
                  Добавить
                </button>
              </div>

              {rewards.map((reward, index) => (
                <div className="reward-row" key={reward.key}>
                  <label className="form-field">
                    <span>Предмет {index + 1}</span>
                    <select
                      value={reward.itemId}
                      onChange={(event) =>
                        updateReward(reward.key, "itemId", event.target.value)
                      }
                      required
                    >
                      <option value="" disabled>
                        Выбери предмет
                      </option>
                      {items.map((item) => (
                        <option
                          value={item.id}
                          key={item.id}
                          disabled={rewards.some(
                            (otherReward) =>
                              otherReward.key !== reward.key &&
                              Number(otherReward.itemId) === item.id,
                          )}
                        >
                          #{item.id} {item.name} — {formatCoins(item.price)} ⭐
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="form-field reward-row__weight">
                    <span>Шанс, %</span>
                    <input
                      type="number"
                      min="1"
                      max={getRewardMaximum(reward.key)}
                      value={reward.weight}
                      onChange={(event) =>
                        updateReward(reward.key, "weight", event.target.value)
                      }
                      required
                    />
                  </label>
                  <button
                    className="icon-button icon-button--danger"
                    type="button"
                    aria-label="Удалить предмет из кейса"
                    onClick={() => removeReward(reward.key)}
                    disabled={rewards.length === 1}
                  >
                    <Trash2 size={17} />
                  </button>
                </div>
              ))}
            </div>

            {caseMessage && (
              <div className="notice notice--success">{caseMessage}</div>
            )}
            {caseError && (
              <div className="notice notice--error">{caseError}</div>
            )}

            <div className="admin-form__actions">
              {editingCase && (
                <button
                  className="secondary-button"
                  type="button"
                  onClick={resetCaseForm}
                  disabled={caseSubmitting}
                >
                  <X size={17} />
                  Отмена
                </button>
              )}
              <button
                className="primary-button"
                type="submit"
                disabled={
                  caseSubmitting ||
                  catalogLoading ||
                  items.length === 0 ||
                  totalWeight !== 100
                }
              >
                {caseSubmitting
                  ? "Сохраняем…"
                  : editingCase
                    ? "Сохранить кейс"
                    : "Создать кейс"}
              </button>
            </div>
          </form>
        </section>
      </div>

      <section className="admin-catalog">
        <div className="section-heading">
          <div>
            <span className="section-kicker">Каталог предметов</span>
            <h2>{items.length} предметов</h2>
          </div>
          <button
            className="icon-button"
            type="button"
            onClick={loadItems}
            aria-label="Обновить каталог"
          >
            <RefreshCw size={18} />
          </button>
        </div>
        <div className="admin-item-list">
          {catalogError && (
            <div className="notice notice--error">{catalogError}</div>
          )}
          {items.map((item) => (
            <article key={item.id}>
              <CaseVisual
                kind="item"
                size="small"
                imageUrl={item.imageUrl}
                itemName={item.name}
              />
              <div className="admin-entity-card__body">
                <strong>{item.name}</strong>
                <span>
                  #{item.id} · {formatCoins(item.price)} ⭐
                </span>
              </div>
              <button
                className="icon-button admin-entity-card__edit"
                type="button"
                aria-label={`Изменить ${item.name}`}
                onClick={() => startEditingItem(item)}
              >
                <Pencil size={15} />
              </button>
            </article>
          ))}
        </div>
      </section>

      <section className="admin-catalog">
        <div className="section-heading">
          <div>
            <span className="section-kicker">Каталог кейсов</span>
            <h2>{gameCases.length} кейсов</h2>
          </div>
          <button
            className="icon-button"
            type="button"
            onClick={loadCases}
            aria-label="Обновить список кейсов"
            disabled={casesLoading}
          >
            <RefreshCw size={18} />
          </button>
        </div>

        {casesError && (
          <div className="notice notice--error">{casesError}</div>
        )}

        <div className="admin-case-list">
          {gameCases.map((gameCase) => (
            <article key={gameCase.id}>
              <CaseVisual
                caseId={gameCase.id}
                size="small"
                imageUrl={gameCase.imageUrl}
              />
              <div className="admin-entity-card__body">
                <strong>{gameCase.name}</strong>
                <span>
                  #{gameCase.id} · {formatCoins(gameCase.price)} ⭐ ·{" "}
                  {gameCase.active ? "активен" : "скрыт"}
                </span>
              </div>
              <button
                className="icon-button admin-entity-card__edit"
                type="button"
                aria-label={`Изменить ${gameCase.name}`}
                onClick={() => void startEditingCase(gameCase)}
                disabled={caseLoadingId !== null}
              >
                <Pencil size={15} />
              </button>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}

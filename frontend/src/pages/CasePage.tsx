import {
  ArrowLeft,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Gift,
  LockKeyhole,
  PackageCheck,
  Play,
  Tag,
} from "lucide-react";
import {
  CSSProperties,
  TransitionEvent,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { CaseVisual } from "../components/CaseVisual";
import { Toast } from "../components/Toast";
import { useAuth } from "../context/AuthContext";
import {
  ApiRequestError,
  apiRequest,
  formatCoins,
  getFriendlyError,
} from "../lib/api";
import type {
  CaseItem,
  GameCaseDetails,
  InventoryItemResponse,
  OpenCaseResponse,
  SellInventoryItemResponse,
} from "../types/api";

const REEL_ITEM_HEIGHT = 112;
const REEL_ITEM_CENTER = REEL_ITEM_HEIGHT / 2;
const IDLE_RANDOM_CYCLE_MIN_ITEMS = 48;
const IDLE_RANDOM_CYCLE_MULTIPLIER = 12;
const IDLE_REPEATED_CYCLES = 3;
const IDLE_REEL_SPEED_PX_PER_SECOND = 28;
const SPIN_DURATION_MS = 7_200;
const SPIN_FALLBACK_DELAY_MS = SPIN_DURATION_MS + 350;

type ReelMode = "idle" | "prepared" | "spinning";
type SpinKind = "real" | "demo" | null;
type ControlPanel = "rewards" | null;

type RewardTier = "green" | "violet" | "pink" | "red" | "yellow" | "gray" ;

function getRewardTier(price: number): RewardTier {
  if (price <= 200) {
      return "gray";
  }
  if (price <= 500) {
    return "green";
  }
  if (price <= 1_000) {
    return "violet";
  }
  if (price <= 3_000) {
    return "pink";
  }
  if (price <= 10_000) {
    return "red";
  }
  return "yellow";
}

function getIdleCycleLength(items: CaseItem[]) {
  return Math.max(
    IDLE_RANDOM_CYCLE_MIN_ITEMS,
    items.length * IDLE_RANDOM_CYCLE_MULTIPLIER,
  );
}

function createRandomSequence(items: CaseItem[], length: number) {
  if (!items.length) {
    return [];
  }

  const sequence: CaseItem[] = [];

  for (let index = 0; index < length; index += 1) {
    const previousItem = sequence[index - 1];
    const availableItems =
      items.length > 1
        ? items.filter((item) => item.itemId !== previousItem?.itemId)
        : items;
    const randomIndex = Math.floor(Math.random() * availableItems.length);
    sequence.push(availableItems[randomIndex]);
  }

  return sequence;
}

function createIdleSequence(items: CaseItem[]) {
  const randomCycle = createRandomSequence(items, getIdleCycleLength(items));

  return Array.from(
    { length: randomCycle.length * IDLE_REPEATED_CYCLES },
    (_, index) => randomCycle[index % randomCycle.length],
  );
}

export function CasePage() {
  const { caseId } = useParams();
  const navigate = useNavigate();
  const { token, wallet, refreshWallet } = useAuth();
  const [gameCase, setGameCase] = useState<GameCaseDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState("");
  const [openError, setOpenError] = useState("");
  const [spinning, setSpinning] = useState(false);
  const [spinOffset, setSpinOffset] = useState<string | null>(null);
  const [spinStartOffset, setSpinStartOffset] = useState(0);
  const [reelItems, setReelItems] = useState<CaseItem[]>([]);
  const [reward, setReward] = useState<OpenCaseResponse | null>(null);
  const [rewardIsDemo, setRewardIsDemo] = useState(false);
  const [sellingReward, setSellingReward] = useState(false);
  const [rewardError, setRewardError] = useState("");
  const [saleNotice, setSaleNotice] = useState("");
  const [pendingReward, setPendingReward] =
    useState<OpenCaseResponse | null>(null);
  const [pendingDemoReward, setPendingDemoReward] =
    useState<OpenCaseResponse | null>(null);
  const [reelMode, setReelMode] = useState<ReelMode>("idle");
  const [spinKind, setSpinKind] = useState<SpinKind>(null);
  const [controlPanel, setControlPanel] = useState<ControlPanel>(null);
  const rouletteTrackRef = useRef<HTMLDivElement>(null);
  const spinTimerRef = useRef<number | null>(null);
  const spinCompletedRef = useRef(false);

  function getCurrentReelOffset() {
    const track = rouletteTrackRef.current;
    if (!track) {
      return spinStartOffset;
    }

    const transform = window.getComputedStyle(track).transform;
    if (!transform || transform === "none") {
      return spinStartOffset;
    }

    return new DOMMatrixReadOnly(transform).m42;
  }

  const loadCase = useCallback(async () => {
    setLoading(true);
    setPageError("");

    try {
      const response = await apiRequest<GameCaseDetails>(
        `/api/cases/${caseId}`,
      );
      setGameCase(response);
      setReelItems(createIdleSequence(response.items));
    } catch (error) {
      setPageError(getFriendlyError(error));
    } finally {
      setLoading(false);
    }
  }, [caseId]);

  useEffect(() => {
    void loadCase();
  }, [loadCase]);

  useEffect(
    () => () => {
      if (spinTimerRef.current !== null) {
        window.clearTimeout(spinTimerRef.current);
      }
    },
    [],
  );

  const finishSpin = useCallback(
    (result: OpenCaseResponse) => {
      if (spinCompletedRef.current) {
        return;
      }

      spinCompletedRef.current = true;

      if (spinTimerRef.current !== null) {
        window.clearTimeout(spinTimerRef.current);
        spinTimerRef.current = null;
      }

      setReward(result);
      setRewardIsDemo(false);
      setPendingReward(null);
      setPendingDemoReward(null);
      setSpinning(false);
      setSpinKind(null);
      void refreshWallet();
    },
    [refreshWallet],
  );

  const finishDemoSpin = useCallback((result: OpenCaseResponse) => {
    if (spinCompletedRef.current) {
      return;
    }

    spinCompletedRef.current = true;

    if (spinTimerRef.current !== null) {
      window.clearTimeout(spinTimerRef.current);
      spinTimerRef.current = null;
    }

    setReward(result);
    setRewardIsDemo(true);
    setPendingReward(null);
    setPendingDemoReward(null);
    setSpinning(false);
    setSpinKind(null);
  }, []);

  async function handleOpenCase() {
    if (!gameCase || spinning) {
      return;
    }

    if (!token) {
      navigate(`/login?returnTo=/cases/${gameCase.id}`);
      return;
    }

    setOpenError("");
    setReward(null);
    setRewardIsDemo(false);
    setPendingReward(null);
    setPendingDemoReward(null);
    setSpinOffset(null);
    setSpinning(true);
    setSpinKind("real");
    spinCompletedRef.current = false;
    const currentOffset = getCurrentReelOffset();
    setSpinStartOffset(currentOffset);
    setReelMode("prepared");

    if (spinTimerRef.current !== null) {
      window.clearTimeout(spinTimerRef.current);
      spinTimerRef.current = null;
    }

    try {
      const result = await apiRequest<OpenCaseResponse>(
        `/api/cases/${gameCase.id}/open`,
        { method: "POST" },
        token,
      );

      const currentItemIndex = Math.max(
        0,
        Math.floor((-currentOffset - REEL_ITEM_CENTER) / REEL_ITEM_HEIGHT),
      );
      const targetIndex =
        currentItemIndex + 46 + Math.floor(Math.random() * 20);
      const sequence = [...reelItems];

      if (sequence.length === 0) {
        sequence.push(
          ...createRandomSequence(gameCase.items, targetIndex + 12),
        );
      }

      while (sequence.length <= targetIndex + 3) {
        sequence.push(...createRandomSequence(gameCase.items, 24));
      }

      const resultItem: CaseItem = {
        ...result,
        weight: 0,
      };

      sequence[targetIndex] = resultItem;

      const neighborItems = gameCase.items.filter(
        (item) => item.itemId !== result.itemId,
      );

      if (neighborItems.length > 0) {
        sequence[targetIndex - 1] =
          neighborItems[Math.floor(Math.random() * neighborItems.length)];
        sequence[targetIndex + 1] =
          neighborItems[Math.floor(Math.random() * neighborItems.length)];
      }
      setReelItems(sequence);
      setPendingReward(result);

      const landingOffset = Math.round((Math.random() - 0.5) * 52);
      window.requestAnimationFrame(() => {
        window.requestAnimationFrame(() => {
          const targetPoint =
            targetIndex * REEL_ITEM_HEIGHT + REEL_ITEM_CENTER + landingOffset;
          setSpinOffset(`-${targetPoint}px`);
          setReelMode("spinning");
          spinTimerRef.current = window.setTimeout(
            () => finishSpin(result),
            SPIN_FALLBACK_DELAY_MS,
          );
        });
      });
    } catch (error) {
      spinCompletedRef.current = true;
      setSpinning(false);
      setSpinKind(null);
      setPendingReward(null);
      setPendingDemoReward(null);
      setSpinOffset(null);
      setReelMode("idle");
      setReelItems(createIdleSequence(gameCase.items));
      setOpenError(getFriendlyError(error));

      if (error instanceof ApiRequestError && error.status === 401) {
        navigate(`/login?returnTo=/cases/${gameCase.id}`);
      }
    }
  }

  function handleDemoSpin() {
    if (!gameCase || spinning || gameCase.items.length === 0) {
      return;
    }

    setOpenError("");
    setReward(null);
    setRewardIsDemo(false);
    setPendingReward(null);
    setPendingDemoReward(null);
    setSpinOffset(null);
    setSpinning(true);
    setSpinKind("demo");
    spinCompletedRef.current = false;
    const currentOffset = getCurrentReelOffset();
    setSpinStartOffset(currentOffset);
    setReelMode("prepared");

    if (spinTimerRef.current !== null) {
      window.clearTimeout(spinTimerRef.current);
      spinTimerRef.current = null;
    }

    const demoItem =
      gameCase.items[Math.floor(Math.random() * gameCase.items.length)];
    const demoResult: OpenCaseResponse = {
      itemId: demoItem.itemId,
      name: demoItem.name,
      imageUrl: demoItem.imageUrl,
      price: demoItem.price,
    };
    setPendingDemoReward(demoResult);
    const currentItemIndex = Math.max(
      0,
      Math.floor((-currentOffset - REEL_ITEM_CENTER) / REEL_ITEM_HEIGHT),
    );
    const targetIndex = currentItemIndex + 46 + Math.floor(Math.random() * 20);
    const sequence = [...reelItems];

    if (sequence.length === 0) {
      sequence.push(...createRandomSequence(gameCase.items, targetIndex + 12));
    }

    while (sequence.length <= targetIndex + 3) {
      sequence.push(...createRandomSequence(gameCase.items, 24));
    }

    sequence[targetIndex] = demoItem;

    const neighborItems = gameCase.items.filter(
      (item) => item.itemId !== demoItem.itemId,
    );

    if (neighborItems.length > 0) {
      sequence[targetIndex - 1] =
        neighborItems[Math.floor(Math.random() * neighborItems.length)];
      sequence[targetIndex + 1] =
        neighborItems[Math.floor(Math.random() * neighborItems.length)];
    }

    setReelItems(sequence);

    const landingOffset = Math.round((Math.random() - 0.5) * 36);
    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => {
        const targetPoint =
          targetIndex * REEL_ITEM_HEIGHT + REEL_ITEM_CENTER + landingOffset;
        setSpinOffset(`-${targetPoint}px`);
        setReelMode("spinning");
        spinTimerRef.current = window.setTimeout(
          () => finishDemoSpin(demoResult),
          SPIN_FALLBACK_DELAY_MS,
        );
      });
    });
  }

  function handleSpinEnd(event: TransitionEvent<HTMLDivElement>) {
    if (
      event.target !== event.currentTarget ||
      event.propertyName !== "transform" ||
      !spinning ||
      !gameCase ||
      reelMode !== "spinning"
    ) {
      return;
    }

    if (spinKind === "demo" && pendingDemoReward) {
      finishDemoSpin(pendingDemoReward);
      return;
    }

    if (spinKind === "real" && pendingReward) {
      finishSpin(pendingReward);
    }
  }

  function closeReward() {
    setReward(null);
    setRewardIsDemo(false);
    setRewardError("");
    setSellingReward(false);
    setPendingDemoReward(null);
    setSpinOffset(null);
    setReelMode("idle");

    if (gameCase) {
      setReelItems(createIdleSequence(gameCase.items));
    }
  }

  async function sellReward() {
    if (!token || !reward || sellingReward) {
      return;
    }

    setSellingReward(true);
    setRewardError("");

    try {
      let inventoryItemId = reward.inventoryItemId;

      if (!Number.isSafeInteger(inventoryItemId)) {
        const inventory = await apiRequest<InventoryItemResponse[]>(
          "/api/inventory",
          {},
          token,
        );
        inventoryItemId = inventory
          .filter((item) => item.item_id === reward.itemId)
          .reduce<number | undefined>(
            (latestId, item) =>
              latestId === undefined || item.id > latestId
                ? item.id
                : latestId,
            undefined,
          );
      }

      if (!Number.isSafeInteger(inventoryItemId)) {
        setRewardError("Не удалось найти выпавший предмет в инвентаре.");
        setSellingReward(false);
        return;
      }

      const sale = await apiRequest<SellInventoryItemResponse>(
        `/api/inventory/${inventoryItemId}/sell`,
        { method: "POST" },
        token,
      );
      await refreshWallet();
      closeReward();
      setSaleNotice(
        `Предмет продан за ${formatCoins(sale.creditedAmount)} ⭐. Новый баланс: ${formatCoins(sale.balance)} ⭐`,
      );
    } catch (error) {
      setRewardError(getFriendlyError(error));
      setSellingReward(false);
    }
  }

  if (loading) {
    return <div className="page-loader">Собираем содержимое кейса…</div>;
  }

  if (!gameCase || pageError) {
    return (
      <main className="narrow-page">
        <div className="state-card">
          <span className="state-card__icon">!</span>
          <h2>Кейс не найден</h2>
          <p>{pageError}</p>
          <button className="secondary-button" type="button" onClick={loadCase}>
            Попробовать снова
          </button>
        </div>
      </main>
    );
  }

  const hasRewards = gameCase.items.length > 0;
  const canAfford = !token || (wallet?.balance ?? 0) >= gameCase.price;
  const idleCycleHeight =
    getIdleCycleLength(gameCase.items) * REEL_ITEM_HEIGHT;
  const idleStartOffset = -(idleCycleHeight + REEL_ITEM_CENTER);
  const idleDuration = Math.max(
    18,
    idleCycleHeight / IDLE_REEL_SPEED_PX_PER_SECOND,
  );
  const trackStyle = {
    "--spin-offset": spinOffset ?? `${idleStartOffset}px`,
    "--idle-start": `${idleStartOffset}px`,
    "--idle-cycle-height": `${idleCycleHeight}px`,
    "--idle-duration": `${idleDuration}s`,
    "--spin-start-transform": `translateY(${spinStartOffset}px)`,
    "--spin-duration": `${SPIN_DURATION_MS}ms`,
  } as CSSProperties;
  const trackClassName = [
    "roulette__track",
    reelMode === "idle" && hasRewards ? "roulette__track--idle" : "",
    reelMode === "prepared" ? "roulette__track--prepared" : "",
    reelMode === "spinning" ? "roulette__track--spinning" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <main className="case-page case-page--roulette">
      {saleNotice && (
        <Toast message={saleNotice} onClose={() => setSaleNotice("")} />
      )}

      <section className="roulette-section">
        <div className="roulette-frame">
          <div className="roulette">
            <div
              ref={rouletteTrackRef}
              className={trackClassName}
              style={trackStyle}
              onTransitionEnd={handleSpinEnd}
            >
              {reelItems.map((item, index) => (
                <div
                  className="roulette-item"
                  key={`${item.itemId}-${index}`}
                  aria-label={item.name}
                >
                  <div
                    className={`roulette-item__card roulette-item__card--${getRewardTier(item.price)}`}
                  >
                    <CaseVisual
                      kind="item"
                      size="small"
                      imageUrl={item.imageUrl}
                      itemName={item.name}
                    />
                  </div>
                </div>
              ))}
            </div>
            <div className="roulette__shade roulette__shade--top" />
            <div className="roulette__shade roulette__shade--bottom" />
          </div>
            <span
              className="roulette__indicator roulette__indicator--left"
              aria-hidden="true"
            >
              <ChevronRight size={30} strokeWidth={3} />
            </span>
            <span
              className="roulette__indicator roulette__indicator--right"
              aria-hidden="true"
            >
              <ChevronLeft size={30} strokeWidth={3} />
            </span>
        </div>

          <div className="roulette-actions">
            <div className="case-control-tabs">
              <button
                type="button"
                disabled={spinning || !hasRewards}
                onClick={handleDemoSpin}
              >
                <Play size={19} />
                {spinKind === "demo" ? "Демо…" : "Демо"}
              </button>
              <button
                className={controlPanel === "rewards" ? "is-active" : ""}
                type="button"
                aria-expanded={controlPanel === "rewards"}
                onClick={() =>
                  setControlPanel((current) =>
                    current === "rewards" ? null : "rewards",
                  )
                }
              >
                <Gift size={19} />
                Призы
              </button>
            </div>

            {controlPanel === "rewards" && (
              <div className="case-control-drawer case-control-drawer--rewards">
                {gameCase.items.map((item) => (
                  <div key={item.itemId} title={item.name}>
                    <CaseVisual
                      kind="item"
                      size="small"
                      imageUrl={item.imageUrl}
                      itemName={item.name}
                    />
                  </div>
                ))}
              </div>
            )}

            <button
              className="open-case-button"
              type="button"
              disabled={
                spinning || !hasRewards || (Boolean(token) && !canAfford)
              }
              onClick={handleOpenCase}
            >
              {spinning ? (
                <>
                  <span className="button-spinner" />
                  {spinKind === "demo"
                    ? "Демо вращается…"
                    : "Кейс открывается…"}
                </>
              ) : (
                <>
                  <PackageCheck size={21} />
                  {token ? "Открыть за" : "Войти и открыть"}
                  {token && (
                    <span className="currency-amount">
                      {formatCoins(gameCase.price)}
                      <span className="currency-star" aria-hidden="true">
                        ⭐
                      </span>
                    </span>
                  )}
                </>
              )}
            </button>

            {token && !canAfford && (
              <div className="inline-notice">
                <LockKeyhole size={17} />
                Недостаточно звёзд
              </div>
            )}
            {!hasRewards && (
              <div className="inline-notice">
                <LockKeyhole size={17} />
                В этом кейсе пока нет наград
              </div>
            )}
            {openError && <div className="form-error">{openError}</div>}
          </div>
      </section>

      {reward && (
        <div className="reward-overlay" role="dialog" aria-modal="true">
          <div
            className={`reward-modal reward-modal--${getRewardTier(reward.price)}`}
          >
            <span className="reward-modal__kicker">
              <CheckCircle2 size={16} />
              {rewardIsDemo ? "Демо-результат" : "Предмет получен"}
            </span>
            <CaseVisual
              kind="item"
              size="large"
              imageUrl={reward.imageUrl}
              itemName={reward.name}
            />
            <h2>{reward.name}</h2>
            <p>
              Стоимость:{" "}
              <strong className="currency-amount">
                {formatCoins(reward.price)}
                <span className="currency-star" aria-hidden="true">
                  ⭐
                </span>
              </strong>
            </p>
            <div className="reward-modal__actions">
              <button
                className="primary-button reward-continue-button"
                type="button"
                onClick={closeReward}
                disabled={sellingReward}
              >
                Продолжить
              </button>
              {!rewardIsDemo && (
                <div className="reward-modal__secondary-actions">
                  <Link
                    className="secondary-button reward-inventory-button"
                    to="/inventory"
                    onClick={(event) => {
                      if (sellingReward) {
                        event.preventDefault();
                        return;
                      }
                      closeReward();
                    }}
                    aria-disabled={sellingReward}
                    tabIndex={sellingReward ? -1 : undefined}
                  >
                    В инвентарь
                    <ArrowLeft className="arrow-forward" size={16} />
                  </Link>
                  <button
                    className="sell-button reward-sell-button"
                    type="button"
                    onClick={sellReward}
                    disabled={sellingReward}
                  >
                    <Tag size={16} />
                    {sellingReward ? "Продаём…" : "Продать"}
                  </button>
                </div>
              )}
            </div>
            {!rewardIsDemo && rewardError && (
              <div className="form-error">{rewardError}</div>
            )}
          </div>
        </div>
      )}
    </main>
  );
}

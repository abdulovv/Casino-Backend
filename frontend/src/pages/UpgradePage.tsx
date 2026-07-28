import {
  ArrowLeft,
  Check,
  CheckCircle2,
  Gift,
  Plus,
  RefreshCw,
  Sparkles,
  X,
} from "lucide-react";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import { Link } from "react-router-dom";
import { CaseVisual } from "../components/CaseVisual";
import { useAuth } from "../context/AuthContext";
import {
  apiRequest,
  formatCoins,
  getFriendlyError,
  resolveAssetUrl,
} from "../lib/api";
import type {
  InventoryItemResponse,
  ItemResponse,
  UpgradeResponse,
} from "../types/api";

interface InventoryViewItem extends InventoryItemResponse {
  details: ItemResponse;
}

type PickerMode = "source" | "target" | null;
type GamePhase = "idle" | "rolling" | "settled";
type RewardTier = "gray" | "green" | "violet" | "pink" | "red" | "yellow";

const HOUSE_EDGE_BPS = 1_000;
const BASIS_POINTS = 10_000;
const PROBABILITY_SCALE = 1_000_000;
const BALL_FLIGHT_MS = 4_000;
const REQUIRED_WALL_BOUNCES = 40;
const MAX_STAKE_ITEMS = 5;
const MIN_VISUAL_SUCCESS_ZONE = 15;

interface BallPoint {
  x: number;
  y: number;
}

type ArenaZoneSide = "left" | "right" | "top" | "bottom";

interface ArenaZoneVariant {
  side: ArenaZoneSide;
  diagonal: boolean;
  tilt: number;
}

interface ArenaZoneGeometry {
  clipPath: string;
  successPosition: BallPoint;
  failurePosition: BallPoint;
  successItemSize: number;
  failureItemSize: number;
  depth: (point: BallPoint) => number;
}

interface ArenaZoneBase {
  axis: "x" | "y";
  clipPath: string;
  depth: (point: BallPoint) => number;
}

function calculateChancePpm(sourcePrice: number, targetPrice: number) {
  if (sourcePrice <= 0 || targetPrice <= sourcePrice) {
    return 0;
  }

  return Math.floor(
    (sourcePrice *
      (BASIS_POINTS - HOUSE_EDGE_BPS) *
      PROBABILITY_SCALE) /
      (targetPrice * BASIS_POINTS),
  );
}

function formatChance(chancePpm: number) {
  return new Intl.NumberFormat("ru-RU", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(chancePpm / 10_000);
}

function createArenaZoneVariant(): ArenaZoneVariant {
  const variants: Array<Pick<ArenaZoneVariant, "side" | "diagonal">> = [
    { side: "left", diagonal: false },
    { side: "right", diagonal: false },
    { side: "top", diagonal: false },
    { side: "bottom", diagonal: false },
    { side: "left", diagonal: true },
    { side: "right", diagonal: true },
    { side: "top", diagonal: true },
    { side: "bottom", diagonal: true },
  ];
  const variant = variants[Math.floor(Math.random() * variants.length)];
  const magnitude = 22 + Math.random() * 18;

  return {
    ...variant,
    tilt: (Math.random() > 0.5 ? 1 : -1) * magnitude,
  };
}

function createArenaZoneGeometry(
  successSize: number,
  variant: ArenaZoneVariant,
): ArenaZoneGeometry {
  const maximumTilt = Math.max(
    0,
    Math.min(successSize, 100 - successSize) - 2,
  );
  const tilt = variant.diagonal
    ? Math.sign(variant.tilt) *
      Math.min(Math.abs(variant.tilt), maximumTilt)
    : 0;

  if (variant.side === "left") {
    const top = successSize + tilt;
    const bottom = successSize - tilt;
    return finalizeArenaZoneGeometry({
      axis: "x",
      clipPath: `polygon(0 0, ${top}% 0, ${bottom}% 100%, 0 100%)`,
      depth: ({ x, y }) =>
        top + (bottom - top) * (y / 100) - x,
    });
  }

  if (variant.side === "right") {
    const base = 100 - successSize;
    const top = base + tilt;
    const bottom = base - tilt;
    return finalizeArenaZoneGeometry({
      axis: "x",
      clipPath: `polygon(${top}% 0, 100% 0, 100% 100%, ${bottom}% 100%)`,
      depth: ({ x, y }) =>
        x - (top + (bottom - top) * (y / 100)),
    });
  }

  if (variant.side === "top") {
    const left = successSize + tilt;
    const right = successSize - tilt;
    return finalizeArenaZoneGeometry({
      axis: "y",
      clipPath: `polygon(0 0, 100% 0, 100% ${right}%, 0 ${left}%)`,
      depth: ({ x, y }) =>
        left + (right - left) * (x / 100) - y,
    });
  }

  const base = 100 - successSize;
  const left = base + tilt;
  const right = base - tilt;
  return finalizeArenaZoneGeometry({
    axis: "y",
    clipPath: `polygon(0 ${left}%, 100% ${right}%, 100% 100%, 0 100%)`,
    depth: ({ x, y }) =>
      y - (left + (right - left) * (x / 100)),
  });
}

function finalizeArenaZoneGeometry(
  zone: ArenaZoneBase,
): ArenaZoneGeometry {
  const successVisual = findZoneVisual(zone, true);
  const failureVisual = findZoneVisual(zone, false);

  return {
    ...zone,
    successPosition: successVisual.position,
    failurePosition: failureVisual.position,
    successItemSize: successVisual.size,
    failureItemSize: failureVisual.size,
  };
}

function findZoneVisual(
  zone: ArenaZoneBase,
  success: boolean,
): { position: BallPoint; size: number } {
  let bestPosition: BallPoint = success
    ? { x: 20, y: 50 }
    : { x: 80, y: 50 };
  let bestClearance = Number.NEGATIVE_INFINITY;
  let bestCenterDistance = Number.POSITIVE_INFINITY;
  const depthScale = zone.axis === "x" ? 2.1 : 1;

  for (let x = 4; x <= 96; x += 2) {
    for (let y = 6; y <= 94; y += 2) {
      const point = { x, y };
      const signedDepth = zone.depth(point) * (success ? 1 : -1);
      if (signedDepth <= 0) continue;

      const clearance = Math.min(
        x * 2.1,
        (100 - x) * 2.1,
        y,
        100 - y,
        signedDepth * depthScale,
      );
      const centerDistance = (x - 50) ** 2 + (y - 50) ** 2;
      if (
        clearance > bestClearance + 0.01 ||
        (Math.abs(clearance - bestClearance) <= 0.01 &&
          centerDistance < bestCenterDistance)
      ) {
        bestClearance = clearance;
        bestCenterDistance = centerDistance;
        bestPosition = point;
      }
    }
  }

  return {
    position: bestPosition,
    size: Math.max(
      success ? 32 : 36,
      Math.min(success ? 82 : 64, bestClearance * 4),
    ),
  };
}

function getRewardTier(price: number): RewardTier {
  if (price <= 200) return "gray";
  if (price <= 400) return "green";
  if (price <= 700) return "violet";
  if (price <= 4_600) return "pink";
  if (price <= 10_000) return "red";
  return "yellow";
}

function createBounceTrajectory(
  success: boolean,
  zone: ArenaZoneGeometry,
): BallPoint[] {
  const frameCount = Math.round(BALL_FLIGHT_MS / 32);
  const deltaSeconds = BALL_FLIGHT_MS / frameCount / 1_000;
  const start: BallPoint = { x: 50, y: 74 };

  for (let attempt = 0; attempt < 1_200; attempt += 1) {
    let x = start.x;
    let y = start.y;
    let velocityX =
      (38 + Math.random() * 34) * (Math.random() > 0.5 ? 1 : -1);
    let velocityY =
      (30 + Math.random() * 30) * (Math.random() > 0.5 ? 1 : -1);
    let bounceCount = 0;
    const points: BallPoint[] = [{ ...start }];

    for (let frame = 1; frame <= frameCount; frame += 1) {
      x += velocityX * deltaSeconds;
      y += velocityY * deltaSeconds;

      if (x < 4) {
        x = 8 - x;
        velocityX = Math.abs(velocityX);
        bounceCount += 1;
      } else if (x > 96) {
        x = 192 - x;
        velocityX = -Math.abs(velocityX);
        bounceCount += 1;
      }

      if (y < 8) {
        y = 16 - y;
        velocityY = Math.abs(velocityY);
        bounceCount += 1;
      } else if (y > 91) {
        y = 182 - y;
        velocityY = -Math.abs(velocityY);
        bounceCount += 1;
      }

      points.push({ x, y });
    }

    const finish = points.at(-1) ?? start;
    const finishDepth = zone.depth(finish);
    const landedInSuccess = finishDepth > 5;
    const landedInFailure = finishDepth < -5;

    if (
      bounceCount === REQUIRED_WALL_BOUNCES &&
      ((success && landedInSuccess) ||
        (!success && landedInFailure))
    ) {
      return points;
    }
  }

  let safePoint = start;
  let bestDepth = success ? Number.NEGATIVE_INFINITY : Number.POSITIVE_INFINITY;
  for (let x = 8; x <= 92; x += 4) {
    for (let y = 10; y <= 90; y += 4) {
      const point = { x, y };
      const depth = zone.depth(point);
      if (
        (success && depth > bestDepth) ||
        (!success && depth < bestDepth)
      ) {
        bestDepth = depth;
        safePoint = point;
      }
    }
  }

  return [
    start,
    { x: 4, y: 48 },
    { x: 38, y: 8 },
    { x: 96, y: 34 },
    { x: 64, y: 91 },
    { x: 4, y: 66 },
    safePoint,
  ];
}

export function UpgradePage() {
  const { token } = useAuth();
  const [inventory, setInventory] = useState<InventoryViewItem[]>([]);
  const [catalog, setCatalog] = useState<ItemResponse[]>([]);
  const [sources, setSources] = useState<InventoryViewItem[]>([]);
  const [target, setTarget] = useState<ItemResponse | null>(null);
  const [pickerMode, setPickerMode] = useState<PickerMode>(null);
  const [loading, setLoading] = useState(true);
  const [phase, setPhase] = useState<GamePhase>("idle");
  const [ballPoint, setBallPoint] = useState<BallPoint>({ x: 50, y: 74 });
  const [result, setResult] = useState<UpgradeResponse | null>(null);
  const [error, setError] = useState("");
  const [showWinModal, setShowWinModal] = useState(false);
  const [arenaZoneVariant, setArenaZoneVariant] = useState(
    createArenaZoneVariant,
  );
  const ballRef = useRef<HTMLDivElement | null>(null);
  const ballAnimationRef = useRef<Animation | null>(null);

  const loadGameData = useCallback(async () => {
    if (!token) return;

    setLoading(true);
    setError("");

    try {
      const [inventoryItems, catalogItems] = await Promise.all([
        apiRequest<InventoryItemResponse[]>("/api/inventory", {}, token),
        apiRequest<ItemResponse[]>("/api/items"),
      ]);
      const catalogMap = new Map(
        catalogItems.map((item) => [item.id, item] as const),
      );

      setCatalog(catalogItems);
      setInventory(
        inventoryItems.flatMap((inventoryItem) => {
          const details = catalogMap.get(inventoryItem.item_id);
          return details ? [{ ...inventoryItem, details }] : [];
        }),
      );
    } catch (requestError) {
      setError(getFriendlyError(requestError));
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    void loadGameData();
  }, [loadGameData]);

  useEffect(() => {
    function closePicker(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setPickerMode(null);
      }
    }

    document.addEventListener("keydown", closePicker);
    return () => document.removeEventListener("keydown", closePicker);
  }, []);

  useEffect(
    () => () => {
      ballAnimationRef.current?.cancel();
    },
    [],
  );

  const sourcePrice = useMemo(
    () => sources.reduce((sum, item) => sum + item.details.price, 0),
    [sources],
  );

  useEffect(() => {
    if (target && target.price <= sourcePrice) {
      setTarget(null);
    }
  }, [sourcePrice, target]);

  const chancePpm = useMemo(() => {
    if (!sourcePrice || !target) return 0;
    return calculateChancePpm(sourcePrice, target.price);
  }, [sourcePrice, target]);

  const actualSuccessZone = chancePpm / 10_000;
  const visualSuccessZone =
    actualSuccessZone > 0
      ? Math.max(MIN_VISUAL_SUCCESS_ZONE, actualSuccessZone)
      : MIN_VISUAL_SUCCESS_ZONE;
  const arenaZone = useMemo(
    () =>
      createArenaZoneGeometry(
        visualSuccessZone,
        arenaZoneVariant,
      ),
    [arenaZoneVariant, visualSuccessZone],
  );

  const targetOptions = useMemo(
    () =>
      sourcePrice
        ? catalog.filter((item) => item.price > sourcePrice && item.price > 0)
        : [],
    [catalog, sourcePrice],
  );

  const pickerItems = pickerMode === "source" ? inventory : targetOptions;
  const selectedSourceIds = useMemo(
    () => new Set(sources.map((item) => item.id)),
    [sources],
  );

  function resetResult() {
    ballAnimationRef.current?.cancel();
    ballAnimationRef.current = null;
    setResult(null);
    setShowWinModal(false);
    setPhase("idle");
    setBallPoint({ x: 50, y: 74 });
    setError("");
  }

  async function animateBall(success: boolean) {
    const ball = ballRef.current;
    if (!ball) return;

    const trajectory = createBounceTrajectory(success, arenaZone);
    const finalPoint = trajectory.at(-1) ?? { x: 50, y: 74 };
    const animation = ball.animate(
      trajectory.map((point, index) => ({
        left: `${point.x}%`,
        top: `${point.y}%`,
        offset: index / (trajectory.length - 1),
      })),
      {
        duration: BALL_FLIGHT_MS,
        easing: "cubic-bezier(0.72, 0, 0.12, 1)",
        fill: "forwards",
      },
    );

    ballAnimationRef.current = animation;
    try {
      await animation.finished;
      ball.style.left = `${finalPoint.x}%`;
      ball.style.top = `${finalPoint.y}%`;
      setBallPoint(finalPoint);
    } catch {
      // Resetting or leaving the page intentionally cancels the flight.
    } finally {
      if (ballAnimationRef.current === animation) {
        ballAnimationRef.current = null;
      }
    }
  }

  function toggleSource(item: InventoryViewItem) {
    resetResult();
    setSources((currentSources) => {
      if (currentSources.some((source) => source.id === item.id)) {
        return currentSources.filter((source) => source.id !== item.id);
      }
      if (currentSources.length >= MAX_STAKE_ITEMS) {
        return currentSources;
      }
      return [...currentSources, item];
    });
    setArenaZoneVariant(createArenaZoneVariant());
  }

  function selectTarget(item: ItemResponse) {
    setTarget(item);
    resetResult();
    setArenaZoneVariant(createArenaZoneVariant());
    setPickerMode(null);
  }

  async function playUpgrade() {
    if (!token || !sources.length || !target || phase === "rolling") return;

    const playedSources = [...sources];
    const playedTarget = target;
    const playedSourceIds = new Set(playedSources.map((item) => item.id));

    setError("");
    setResult(null);
    setShowWinModal(false);
    setPhase("rolling");
    setBallPoint({ x: 50, y: 74 });

    try {
      const upgradeResult = await apiRequest<UpgradeResponse>(
        "/api/upgrader/upgrade",
        {
          method: "POST",
          body: JSON.stringify({
            sourceInventoryItemIds: playedSources.map((item) => item.id),
            ...(playedSources.length === 1
              ? { sourceInventoryItemId: playedSources[0].id }
              : {}),
            targetItemId: playedTarget.id,
          }),
        },
        token,
      );

      setResult(upgradeResult);
      await animateBall(upgradeResult.success);
      setPhase("settled");
      setInventory((currentInventory) => {
        const remainingItems = currentInventory.filter(
          (item) => !playedSourceIds.has(item.id),
        );

        if (upgradeResult.success && upgradeResult.rewardInventoryItemId) {
          return [
            {
              id: upgradeResult.rewardInventoryItemId,
              item_id: playedTarget.id,
              details: playedTarget,
            },
            ...remainingItems,
          ];
        }

        return remainingItems;
      });
      if (upgradeResult.success) {
        setShowWinModal(true);
      }
    } catch (requestError) {
      setPhase("idle");
      setBallPoint({ x: 50, y: 74 });
      setError(getFriendlyError(requestError));
    }
  }

  function startNextRound() {
    setSources([]);
    setTarget(null);
    setArenaZoneVariant(createArenaZoneVariant());
    resetResult();
  }

  const arenaStyle = {
    "--success-content-x": `${arenaZone.successPosition.x}%`,
    "--success-content-y": `${arenaZone.successPosition.y}%`,
    "--failure-content-x": `${arenaZone.failurePosition.x}%`,
    "--failure-content-y": `${arenaZone.failurePosition.y}%`,
    "--success-item-size": `${arenaZone.successItemSize}px`,
    "--failure-item-size": `${arenaZone.failureItemSize}px`,
  } as CSSProperties;

  const successClipPath = arenaZone.clipPath;

  if (loading) {
    return <div className="page-loader">Собираем твой инвентарь…</div>;
  }

  return (
    <main className="upgrade-page">
      <div className="upgrade-page__topline">
        <Link className="page-back-link" to="/">
          <ArrowLeft size={16} />
          Все игры
        </Link>
        <button
          className="icon-button"
          type="button"
          aria-label="Обновить предметы"
          onClick={loadGameData}
          disabled={phase === "rolling"}
        >
          <RefreshCw size={18} />
        </button>
      </div>

      <header className="upgrade-heading">
        <span className="section-kicker">Испытай удачу</span>
        <h1>Апгрейдер</h1>
        <p>
          Добавь до пяти подарков в ставку и выбери один подарок дороже их
          общей стоимости.
        </p>
      </header>

      {error && <div className="notice notice--error">{error}</div>}

      <div className="upgrade-layout">
        <section
          className="upgrade-selection"
          aria-label="Выбор ставки и подарка"
        >
          <StakeSelectionCard
            sources={sources}
            totalPrice={sourcePrice}
            disabled={phase === "rolling"}
            onClick={() => setPickerMode("source")}
          />

          <TargetSelectionCard
            item={target}
            disabled={!sources.length || phase === "rolling"}
            hint={!sources.length ? "Сначала выбери ставку" : undefined}
            onClick={() => setPickerMode("target")}
          />
        </section>

        <section className="upgrade-game">
          <div className="upgrade-chance" aria-live="polite">
            <strong>
              Шанс {chancePpm > 0 ? `${formatChance(chancePpm)}%` : "—"}
            </strong>
            <span>
              {chancePpm >= 650_000
                ? "Отличный шанс"
                : chancePpm >= 350_000
                  ? "Неплохой шанс"
                  : chancePpm > 0
                    ? "Рискованный апгрейд"
                    : "Выбери ставку и подарок"}
            </span>
          </div>

          <div
            className={`upgrade-arena upgrade-arena--${phase} upgrade-arena--zone-${arenaZoneVariant.side}`}
            style={arenaStyle}
            aria-label={
              chancePpm
                ? `Игровое поле. Реальный шанс успеха ${formatChance(chancePpm)} процента`
                : "Игровое поле"
            }
          >
            <div className="upgrade-arena__failure">
              <div className="upgrade-arena__failure-content">
                <span className="upgrade-arena__bomb" aria-hidden="true">💀</span>
              </div>
            </div>

            <div
              className="upgrade-arena__success"
              style={{ clipPath: successClipPath }}
            >
              <div className="upgrade-arena__success-content">
                {target ? (
                  <img
                    className="upgrade-arena__target-image"
                    src={resolveAssetUrl(target.imageUrl)}
                    alt={target.name}
                  />
                ) : (
                  <Gift size={48} strokeWidth={1.55} />
                )}
              </div>
            </div>

            <div
              ref={ballRef}
              className="upgrade-ball"
              style={{
                left: `${ballPoint.x}%`,
                top: `${ballPoint.y}%`,
              }}
              aria-hidden="true"
            >
              <Plus size={23} strokeWidth={2.4} />
            </div>
          </div>

          <div className="upgrade-result" aria-live="polite">
            {phase === "idle" && (
              <span>
                {sources.length && target
                  ? "В случае проигрыша вы потеряете ставку!"
                  : "Выбери ставку и подарок"}
              </span>
            )}
            {phase === "rolling" && (
              <span className="upgrade-result--rolling">
                <Sparkles size={17} />
                Шар уже в полёте…
              </span>
            )}
            {phase === "settled" && result && (
              <strong
                className={
                  result.success
                    ? "upgrade-result--success"
                    : "upgrade-result--failure"
                }
              >
                {result.success
                  ? `${target?.name ?? "Подарок"} теперь твой`
                  : "Не повезло — ставка сгорела"}
              </strong>
            )}
          </div>

          {phase === "settled" ? (
            <button
              className="upgrade-play-button upgrade-play-button--again"
              type="button"
              onClick={startNextRound}
            >
              Ещё попытка
            </button>
          ) : (
            <button
              className="upgrade-play-button"
              type="button"
              disabled={!sources.length || !target || phase === "rolling"}
              onClick={playUpgrade}
            >
              {phase === "rolling" ? (
                <>
                  <span className="button-spinner" />
                  Крутим
                </>
              ) : (
                <>
                  <Sparkles size={19} />
                  Запустить апгрейд
                </>
              )}
            </button>
          )}
        </section>
      </div>

      {pickerMode && (
        <div
          className="upgrade-picker-overlay"
          role="dialog"
          aria-modal="true"
          aria-labelledby="upgrade-picker-title"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setPickerMode(null);
            }
          }}
        >
          <section className="upgrade-picker">
            <div className="upgrade-picker__heading">
              <div>
                <span className="section-kicker">
                  {pickerMode === "source" ? "Твой инвентарь" : "Каталог"}
                </span>
                <h2 id="upgrade-picker-title">
                  {pickerMode === "source"
                    ? "Собери ставку"
                    : "Выбери подарок"}
                </h2>
              </div>
              <button
                className="icon-button"
                type="button"
                aria-label="Закрыть выбор"
                onClick={() => setPickerMode(null)}
              >
                <X size={19} />
              </button>
            </div>

            {pickerItems.length === 0 ? (
              <div className="upgrade-picker__empty">
                <Gift size={40} strokeWidth={1.4} />
                <h3>
                  {pickerMode === "source"
                    ? "В инвентаре пока пусто"
                    : "Нет подходящих подарков"}
                </h3>
                <p>
                  {pickerMode === "source"
                    ? "Купи предмет или открой кейс, чтобы сделать ставку."
                    : "Общая стоимость ставки уже выше всех доступных подарков."}
                </p>
              </div>
            ) : (
              <div className="upgrade-picker__grid">
                {pickerItems.map((entry) => {
                  const isSourceEntry = "details" in entry;
                  const item = isSourceEntry ? entry.details : entry;
                  const selected =
                    isSourceEntry && selectedSourceIds.has(entry.id);
                  const entryChance = calculateChancePpm(
                    sourcePrice,
                    item.price,
                  );

                  return (
                    <button
                      className={`upgrade-picker-card${
                        selected ? " upgrade-picker-card--selected" : ""
                      }`}
                      type="button"
                      key={
                        isSourceEntry
                          ? `inventory-${entry.id}`
                          : `target-${entry.id}`
                      }
                      onClick={() => {
                        if (isSourceEntry) {
                          toggleSource(entry);
                        } else {
                          selectTarget(entry);
                        }
                      }}
                      disabled={
                        isSourceEntry &&
                        !selected &&
                        sources.length >= MAX_STAKE_ITEMS
                      }
                    >
                      {isSourceEntry && (
                        <span className="upgrade-picker-card__id">
                          #{entry.id}
                        </span>
                      )}
                      {selected && (
                        <span className="upgrade-picker-card__check">
                          <Check size={15} />
                        </span>
                      )}
                      <CaseVisual
                        kind="item"
                        size="small"
                        imageUrl={item.imageUrl}
                        itemName={item.name}
                      />
                      <span className="upgrade-picker-card__name">
                        {item.name}
                      </span>
                      <strong className="currency-amount">
                        {formatCoins(item.price)}
                        <span className="currency-star">⭐</span>
                      </strong>
                      {!isSourceEntry && (
                        <small>Шанс {formatChance(entryChance)}%</small>
                      )}
                    </button>
                  );
                })}
              </div>
            )}

            {pickerMode === "source" && (
              <footer className="upgrade-picker__footer">
                <div>
                  <span>
                    Выбрано: {sources.length}/{MAX_STAKE_ITEMS}
                  </span>
                  <strong className="currency-amount">
                    {formatCoins(sourcePrice)}
                    <span className="currency-star">⭐</span>
                  </strong>
                </div>
                <button
                  className="primary-button"
                  type="button"
                  disabled={!sources.length}
                  onClick={() => setPickerMode(null)}
                >
                  Готово
                </button>
              </footer>
            )}
          </section>
        </div>
      )}

      {showWinModal && target && (
        <div className="reward-overlay" role="dialog" aria-modal="true">
          <div
            className={`reward-modal reward-modal--${getRewardTier(target.price)}`}
          >
            <span className="reward-modal__kicker">
              <CheckCircle2 size={16} />
              Апгрейд успешен
            </span>
            <CaseVisual
              kind="item"
              size="large"
              imageUrl={target.imageUrl}
              itemName={target.name}
            />
            <h2>{target.name}</h2>
            <p>
              Подарок добавлен в инвентарь ·{" "}
              <strong className="currency-amount">
                {formatCoins(target.price)}
                <span className="currency-star">⭐</span>
              </strong>
            </p>
            <div className="reward-modal__actions">
              <button
                className="primary-button reward-continue-button"
                type="button"
                onClick={() => window.location.reload()}
              >
                Продолжить
              </button>
              <div className="reward-modal__secondary-actions">
                <Link
                  className="secondary-button reward-inventory-button"
                  to="/inventory"
                  onClick={(event) => {
                    event.preventDefault();
                    window.location.assign("/inventory");
                  }}
                >
                  В инвентарь
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

interface StakeSelectionCardProps {
  sources: InventoryViewItem[];
  totalPrice: number;
  disabled?: boolean;
  onClick: () => void;
}

function StakeSelectionCard({
  sources,
  totalPrice,
  disabled,
  onClick,
}: StakeSelectionCardProps) {
  return (
    <article className="upgrade-selection-card">
      <h2>Ваша ставка</h2>
      <button
        className={`upgrade-selection-slot${
          sources.length ? " upgrade-selection-slot--selected" : ""
        }`}
        type="button"
        disabled={disabled}
        onClick={onClick}
      >
        {sources.length ? (
          <>
            <div className="upgrade-selection-slot__items">
              {sources.slice(0, 4).map((source) => (
                <img
                  key={source.id}
                  src={resolveAssetUrl(source.details.imageUrl)}
                  alt=""
                />
              ))}
              {sources.length > 4 && (
                <span className="upgrade-selection-slot__more">
                  +{sources.length - 4}
                </span>
              )}
            </div>
            <strong>
              {sources.length === 1
                ? sources[0].details.name
                : `${sources.length} подарка`}
            </strong>
            <span className="currency-amount">
              {formatCoins(totalPrice)}
              <span className="currency-star">⭐</span>
            </span>
          </>
        ) : (
          <>
            <span className="upgrade-selection-slot__plus">
              <Plus size={22} />
            </span>
            <strong>Добавить</strong>
            <small>Можно выбрать несколько</small>
          </>
        )}
      </button>
    </article>
  );
}

interface TargetSelectionCardProps {
  item: ItemResponse | null;
  disabled?: boolean;
  hint?: string;
  onClick: () => void;
}

function TargetSelectionCard({
  item,
  disabled,
  hint,
  onClick,
}: TargetSelectionCardProps) {
  return (
    <article className="upgrade-selection-card">
      <h2>Желаемый подарок</h2>
      <button
        className={`upgrade-selection-slot${
          item ? " upgrade-selection-slot--selected" : ""
        }`}
        type="button"
        disabled={disabled}
        onClick={onClick}
      >
        {item ? (
          <>
            <CaseVisual
              kind="item"
              size="small"
              imageUrl={item.imageUrl}
              itemName={item.name}
            />
            <strong>{item.name}</strong>
            <span className="currency-amount">
              {formatCoins(item.price)}
              <span className="currency-star">⭐</span>
            </span>
          </>
        ) : (
          <>
            <span className="upgrade-selection-slot__plus">
              <Plus size={22} />
            </span>
            <strong>Добавить</strong>
            {hint && <small>{hint}</small>}
          </>
        )}
      </button>
    </article>
  );
}

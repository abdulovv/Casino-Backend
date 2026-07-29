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
const BALL_ACCELERATION_DISTANCE = 0.02;
const BALL_START_SPEED_FACTOR = 0.52;
const BALL_STOP_SPEED_FACTOR = 0.02;
const BALL_MAX_SPEED_PX_PER_SECOND = 10000;
const BALL_MIN_FLIGHT_MS = 7800;
const BALL_KEYFRAME_STEP_PX = 7;
const BALL_SETTLE_HOLD_MS = 200;
const MOTION_PROFILE_SAMPLES = 2000;
const MAX_SIMULATED_WALL_BOUNCES = 100;
const LANDING_BOUNCE_MIN = 20;
const LANDING_BOUNCE_MAX = 25;
const MAX_TRAJECTORY_ATTEMPTS = 1600;
const MIN_WALL_POINT_CORNER_DISTANCE = 6;
const MIN_FINAL_WALL_ZONE_DEPTH = 1.5;
const MIN_TOTAL_BRAKING_DISTANCE_PX = 1050;
const BRAKING_LEAD_IN_MIN_PX = 620;
const BRAKING_LEAD_IN_MAX_PX = 680;
const MAX_BRAKING_PATH_FRACTION = 0.42;
const ARENA_BOUNDS = {
  left: 4,
  right: 96,
  top: 8,
  bottom: 91,
} as const;
const MAX_STAKE_ITEMS = 5;
const MIN_VISUAL_SUCCESS_ZONE = 20;

interface BallPoint {
  x: number;
  y: number;
}

type ArenaWall = "left" | "right" | "top" | "bottom";

interface WallBounce {
  point: BallPoint;
  wall: ArenaWall;
}

interface PlannedBallTrajectory {
  points: BallPoint[];
  brakingStartDistanceProgress: number;
}

interface LandingCandidate {
  bounceNumber: number;
  brakingStartDistanceProgress: number;
}

type ArenaZoneSide = ArenaWall;

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

function randomBetween(minimum: number, maximum: number) {
  return minimum + Math.random() * (maximum - minimum);
}

function clampProgress(progress: number) {
  return Math.min(1, Math.max(0, progress));
}

function getBallSpeedFactor(
  distanceProgress: number,
  decelerationStartProgress: number,
) {
  if (distanceProgress < BALL_ACCELERATION_DISTANCE) {
    const accelerationProgress =
      distanceProgress / BALL_ACCELERATION_DISTANCE;

    return Math.sqrt(
      BALL_START_SPEED_FACTOR ** 2 +
        (1 - BALL_START_SPEED_FACTOR ** 2) * accelerationProgress,
    );
  }

  if (distanceProgress > decelerationStartProgress) {
    const remainingDistanceProgress =
      (1 - distanceProgress) / (1 - decelerationStartProgress);

    return (
      BALL_STOP_SPEED_FACTOR +
      (1 - BALL_STOP_SPEED_FACTOR) * clampProgress(remainingDistanceProgress)
    );
  }

  return 1;
}

function sampleTrajectory(
  trajectory: BallPoint[],
  arenaWidth: number,
  arenaHeight: number,
) {
  if (trajectory.length <= 1) {
    return trajectory;
  }

  const sampledPoints: BallPoint[] = [trajectory[0]];

  for (let index = 1; index < trajectory.length; index += 1) {
    const start = trajectory[index - 1];
    const finish = trajectory[index];
    const deltaX = ((finish.x - start.x) / 100) * arenaWidth;
    const deltaY = ((finish.y - start.y) / 100) * arenaHeight;
    const segmentLength = Math.hypot(deltaX, deltaY);
    const stepCount = Math.max(
      1,
      Math.ceil(segmentLength / BALL_KEYFRAME_STEP_PX),
    );

    for (let step = 1; step <= stepCount; step += 1) {
      const progress = step / stepCount;
      sampledPoints.push({
        x: start.x + (finish.x - start.x) * progress,
        y: start.y + (finish.y - start.y) * progress,
      });
    }
  }

  return sampledPoints;
}

function createMotionTiming(
  distanceOffsets: number[],
  decelerationStartProgress: number,
  totalLength: number,
) {
  const cumulativeTimes = [0];

  for (let sample = 1; sample <= MOTION_PROFILE_SAMPLES; sample += 1) {
    const previousDistance = (sample - 1) / MOTION_PROFILE_SAMPLES;
    const currentDistance = sample / MOTION_PROFILE_SAMPLES;
    const middleDistance = (previousDistance + currentDistance) / 2;
    const distanceDelta = currentDistance - previousDistance;
    const timeDelta =
      distanceDelta /
      getBallSpeedFactor(middleDistance, decelerationStartProgress);

    cumulativeTimes.push(cumulativeTimes.at(-1)! + timeDelta);
  }

  const normalizedMotionTime = cumulativeTimes.at(-1) ?? 1;
  const motionDurationMs = Math.max(
    BALL_MIN_FLIGHT_MS,
    (totalLength / BALL_MAX_SPEED_PX_PER_SECOND) *
      normalizedMotionTime *
      1_000,
  );
  const durationMs = motionDurationMs + BALL_SETTLE_HOLD_MS;
  const motionEndOffset = motionDurationMs / durationMs;

  const offsets = distanceOffsets.map((distanceOffset, index) => {
    if (index === 0) return 0;
    if (index === distanceOffsets.length - 1) return motionEndOffset;

    const samplePosition =
      clampProgress(distanceOffset) * MOTION_PROFILE_SAMPLES;
    const lowerSample = Math.floor(samplePosition);
    const upperSample = Math.min(
      MOTION_PROFILE_SAMPLES,
      lowerSample + 1,
    );
    const sampleFraction = samplePosition - lowerSample;
    const lowerTime = cumulativeTimes[lowerSample];
    const upperTime = cumulativeTimes[upperSample];
    const normalizedTime =
      (lowerTime + (upperTime - lowerTime) * sampleFraction) /
      normalizedMotionTime;

    return normalizedTime * motionEndOffset;
  });

  return { offsets, durationMs };
}

function getNextWallBounce(
  point: BallPoint,
  velocity: BallPoint,
): WallBounce | null {
  const candidates: Array<WallBounce & { time: number }> = [];
  const epsilon = 0.0001;

  if (velocity.x < -epsilon) {
    candidates.push({
      point: { x: ARENA_BOUNDS.left, y: point.y },
      wall: "left",
      time: (ARENA_BOUNDS.left - point.x) / velocity.x,
    });
  } else if (velocity.x > epsilon) {
    candidates.push({
      point: { x: ARENA_BOUNDS.right, y: point.y },
      wall: "right",
      time: (ARENA_BOUNDS.right - point.x) / velocity.x,
    });
  }

  if (velocity.y < -epsilon) {
    candidates.push({
      point: { x: point.x, y: ARENA_BOUNDS.top },
      wall: "top",
      time: (ARENA_BOUNDS.top - point.y) / velocity.y,
    });
  } else if (velocity.y > epsilon) {
    candidates.push({
      point: { x: point.x, y: ARENA_BOUNDS.bottom },
      wall: "bottom",
      time: (ARENA_BOUNDS.bottom - point.y) / velocity.y,
    });
  }

  const next = candidates
    .filter((candidate) => candidate.time > epsilon)
    .sort((first, second) => first.time - second.time)[0];

  if (!next) {
    return null;
  }

  return {
    wall: next.wall,
    point: {
      x: Math.min(
        ARENA_BOUNDS.right,
        Math.max(ARENA_BOUNDS.left, point.x + velocity.x * next.time),
      ),
      y: Math.min(
        ARENA_BOUNDS.bottom,
        Math.max(ARENA_BOUNDS.top, point.y + velocity.y * next.time),
      ),
    },
  };
}

function isBounceAwayFromCorner(bounce: WallBounce) {
  if (bounce.wall === "left" || bounce.wall === "right") {
    return (
      bounce.point.y - ARENA_BOUNDS.top >=
        MIN_WALL_POINT_CORNER_DISTANCE &&
      ARENA_BOUNDS.bottom - bounce.point.y >=
        MIN_WALL_POINT_CORNER_DISTANCE
    );
  }

  return (
    bounce.point.x - ARENA_BOUNDS.left >=
      MIN_WALL_POINT_CORNER_DISTANCE &&
    ARENA_BOUNDS.right - bounce.point.x >=
      MIN_WALL_POINT_CORNER_DISTANCE
  );
}

function reflectVelocity(velocity: BallPoint, wall: ArenaWall): BallPoint {
  if (wall === "left" || wall === "right") {
    return { x: -velocity.x, y: velocity.y };
  }

  return { x: velocity.x, y: -velocity.y };
}

function getPixelDistance(
  start: BallPoint,
  finish: BallPoint,
  arenaWidth: number,
  arenaHeight: number,
) {
  return Math.hypot(
    ((finish.x - start.x) / 100) * arenaWidth,
    ((finish.y - start.y) / 100) * arenaHeight,
  );
}

function getZoneEntryProgress(
  start: BallPoint,
  finish: BallPoint,
  success: boolean,
  zone: ArenaZoneGeometry,
) {
  const zoneDirection = success ? 1 : -1;
  const startDepth = zone.depth(start) * zoneDirection;
  const finishDepth = zone.depth(finish) * zoneDirection;

  if (finishDepth < MIN_FINAL_WALL_ZONE_DEPTH) {
    return null;
  }

  if (startDepth >= 0) {
    return 0;
  }

  const depthDelta = finishDepth - startDepth;
  if (depthDelta <= 0.0001) {
    return null;
  }

  return clampProgress(-startDepth / depthDelta);
}

function isPointAtArenaCorner(point: BallPoint) {
  const cornerEpsilon = 0.001;
  const touchesHorizontalWall =
    Math.abs(point.x - ARENA_BOUNDS.left) <= cornerEpsilon ||
    Math.abs(point.x - ARENA_BOUNDS.right) <= cornerEpsilon;
  const touchesVerticalWall =
    Math.abs(point.y - ARENA_BOUNDS.top) <= cornerEpsilon ||
    Math.abs(point.y - ARENA_BOUNDS.bottom) <= cornerEpsilon;

  return touchesHorizontalWall && touchesVerticalWall;
}

function createPhysicalBouncePath(
  initialAngleRadians: number,
  arenaWidth: number,
  arenaHeight: number,
) {
  const start: BallPoint = { x: 50, y: 74 };
  const points: BallPoint[] = [start];
  const bounces: WallBounce[] = [];
  let currentPoint = start;
  // Convert the pixel-space angle to percentage-space velocity so that
  // reflections remain visually correct in a non-square arena.
  let velocity: BallPoint = {
    x: (Math.cos(initialAngleRadians) / arenaWidth) * 100,
    y: (Math.sin(initialAngleRadians) / arenaHeight) * 100,
  };

  for (
    let bounceNumber = 1;
    bounceNumber <= MAX_SIMULATED_WALL_BOUNCES;
    bounceNumber += 1
  ) {
    const bounce = getNextWallBounce(currentPoint, velocity);

    if (!bounce || isPointAtArenaCorner(bounce.point)) {
      return null;
    }

    points.push(bounce.point);
    bounces.push(bounce);
    currentPoint = bounce.point;
    velocity = reflectVelocity(velocity, bounce.wall);
  }

  return { points, bounces };
}

function findLandingCandidates(
  physicalPath: NonNullable<ReturnType<typeof createPhysicalBouncePath>>,
  success: boolean,
  zone: ArenaZoneGeometry,
  arenaWidth: number,
  arenaHeight: number,
): LandingCandidate[] {
  const candidates: LandingCandidate[] = [];

  for (
    let bounceNumber = LANDING_BOUNCE_MIN;
    bounceNumber <= LANDING_BOUNCE_MAX;
    bounceNumber += 1
  ) {
    const segmentStart = physicalPath.points[bounceNumber - 1];
    const wallPoint = physicalPath.points[bounceNumber];
    const finalBounce = physicalPath.bounces[bounceNumber - 1];
    if (!isBounceAwayFromCorner(finalBounce)) {
      continue;
    }

    const entryProgress = getZoneEntryProgress(
      segmentStart,
      wallPoint,
      success,
      zone,
    );

    if (entryProgress === null) {
      continue;
    }

    const pathPoints = physicalPath.points.slice(0, bounceNumber + 1);
    const segmentLengths = pathPoints.slice(1).map((point, index) =>
      getPixelDistance(
        pathPoints[index],
        point,
        arenaWidth,
        arenaHeight,
      ),
    );
    const finalSegmentLength = segmentLengths.at(-1) ?? 0;
    const totalLength = segmentLengths.reduce(
      (sum, length) => sum + length,
      0,
    );
    const distanceInsideOutcomeZone =
      finalSegmentLength * (1 - entryProgress);
    const brakingLeadInDistance = randomBetween(
      BRAKING_LEAD_IN_MIN_PX,
      BRAKING_LEAD_IN_MAX_PX,
    );
    const desiredBrakingDistance = Math.max(
      MIN_TOTAL_BRAKING_DISTANCE_PX,
      distanceInsideOutcomeZone + brakingLeadInDistance,
    );
    const brakingDistance = Math.min(
      desiredBrakingDistance,
      totalLength * MAX_BRAKING_PATH_FRACTION,
    );
    const brakingStartDistanceProgress =
      1 - brakingDistance / totalLength;

    candidates.push({
      bounceNumber,
      brakingStartDistanceProgress: Math.max(
        BALL_ACCELERATION_DISTANCE + 0.05,
        Math.min(0.97, brakingStartDistanceProgress),
      ),
    });
  }

  return candidates;
}

function createBounceTrajectory(
  success: boolean,
  zone: ArenaZoneGeometry,
  arenaWidth: number,
  arenaHeight: number,
): PlannedBallTrajectory {
  for (
    let attempt = 0;
    attempt < MAX_TRAJECTORY_ATTEMPTS;
    attempt += 1
  ) {
    const initialAngleRadians = randomBetween(0, Math.PI * 2);
    const initialVelocity = {
      x: Math.cos(initialAngleRadians),
      y: Math.sin(initialAngleRadians),
    };

    // Very shallow angles produce long, visually repetitive wall runs.
    if (
      Math.abs(initialVelocity.x) < 0.3 ||
      Math.abs(initialVelocity.y) < 0.3
    ) {
      continue;
    }

    const physicalPath = createPhysicalBouncePath(
      initialAngleRadians,
      arenaWidth,
      arenaHeight,
    );
    if (!physicalPath) {
      continue;
    }

    const candidates = findLandingCandidates(
      physicalPath,
      success,
      zone,
      arenaWidth,
      arenaHeight,
    );

    if (candidates.length === 0) {
      continue;
    }

    const candidate =
      candidates[Math.floor(Math.random() * candidates.length)];
    return {
      points: physicalPath.points.slice(
        0,
        candidate.bounceNumber + 1,
      ),
      brakingStartDistanceProgress:
        candidate.brakingStartDistanceProgress,
    };
  }

  throw new Error(
    "Не удалось заранее рассчитать физическую траекторию для выбранной зоны.",
  );
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

  async function animateBall(
    trajectoryPlan: PlannedBallTrajectory,
  ) {
    const ball = ballRef.current;
    if (!ball) return;

    const arena = ball.offsetParent as HTMLElement | null;
    const arenaWidth = arena?.clientWidth ?? 100;
    const arenaHeight = arena?.clientHeight ?? 100;
    const trajectory = trajectoryPlan.points;
    const finalPoint = trajectory.at(-1) ?? { x: 50, y: 74 };
    const sampledTrajectory = sampleTrajectory(
      trajectory,
      arenaWidth,
      arenaHeight,
    );
    const segmentLengths = sampledTrajectory.slice(1).map((point, index) => {
      const previousPoint = sampledTrajectory[index];
      const deltaX = ((point.x - previousPoint.x) / 100) * arenaWidth;
      const deltaY = ((point.y - previousPoint.y) / 100) * arenaHeight;

      return Math.hypot(deltaX, deltaY);
    });
    const totalLength = segmentLengths.reduce(
      (sum, length) => sum + length,
      0,
    );
    let travelledLength = 0;
    const distanceOffsets = sampledTrajectory.map((_, index) => {
      if (index > 0) {
        travelledLength += segmentLengths[index - 1];
      }

      return totalLength > 0
        ? travelledLength / totalLength
        : index / Math.max(1, sampledTrajectory.length - 1);
    });
    const motionTiming = createMotionTiming(
      distanceOffsets,
      trajectoryPlan.brakingStartDistanceProgress,
      totalLength,
    );
    const keyframes = sampledTrajectory.map((point, index) => ({
      left: `${point.x}%`,
      top: `${point.y}%`,
      offset: motionTiming.offsets[index],
      easing: "linear",
    }));

    keyframes.push({
      left: `${finalPoint.x}%`,
      top: `${finalPoint.y}%`,
      offset: 1,
      easing: "linear",
    });

    const animation = ball.animate(keyframes, {
      duration: motionTiming.durationMs,
      easing: "linear",
      fill: "forwards",
    });

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
    setBallPoint({ x: 50, y: 74 });

    const ball = ballRef.current;
    const arena = ball?.offsetParent as HTMLElement | null;

    if (!ball || !arena) {
      setError("Не удалось определить размеры игрового поля.");
      return;
    }

    let successTrajectoryPlan: PlannedBallTrajectory;
    let failureTrajectoryPlan: PlannedBallTrajectory;

    try {
      // Both outcomes are prepared before the server transaction starts.
      // The backend result only selects which precomputed path is played.
      successTrajectoryPlan = createBounceTrajectory(
        true,
        arenaZone,
        arena.clientWidth,
        arena.clientHeight,
      );
      failureTrajectoryPlan = createBounceTrajectory(
        false,
        arenaZone,
        arena.clientWidth,
        arena.clientHeight,
      );
    } catch (trajectoryError) {
      setError(getFriendlyError(trajectoryError));
      return;
    }

    setPhase("rolling");

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
      await animateBall(
        upgradeResult.success
          ? successTrajectoryPlan
          : failureTrajectoryPlan,
      );
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

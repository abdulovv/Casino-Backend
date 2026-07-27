import { resolveAssetUrl } from "../lib/api";

interface CaseVisualProps {
  caseId?: number;
  imageUrl?: string;
  itemName?: string;
  size?: "small" | "medium" | "large";
  kind?: "case" | "item";
}

const itemEmoji: Record<string, string> = {
  bronze: "●",
  silver: "◇",
  golden: "◆",
  diamond: "✦",
};

function getItemEmoji(name = "") {
  const normalizedName = name.toLowerCase();
  const match = Object.entries(itemEmoji).find(([key]) =>
    normalizedName.includes(key),
  );

  return match?.[1] ?? "□";
}

export function CaseVisual({
  caseId = 1,
  imageUrl,
  itemName,
  size = "medium",
  kind = "case",
}: CaseVisualProps) {
  const shouldUseImage =
    Boolean(imageUrl) && !imageUrl?.includes("placehold.co");
  const resolvedImageUrl = resolveAssetUrl(imageUrl);

  if (kind === "item") {
    return (
      <div className={`item-visual item-visual--${size}`}>
        <div className="item-visual__glow" />
        {shouldUseImage ? (
          <img src={resolvedImageUrl} alt={itemName || "Награда"} />
        ) : (
          <span aria-hidden="true">{getItemEmoji(itemName)}</span>
        )}
      </div>
    );
  }

  return (
    <div
      className={`case-visual case-visual--${size} case-visual--variant-${(caseId % 3) + 1}`}
      aria-hidden={shouldUseImage ? undefined : "true"}
    >
      <div className="case-visual__halo" />
      {shouldUseImage ? (
        <img
          className="case-visual__image"
          src={resolvedImageUrl}
          alt={itemName || "Кейс"}
        />
      ) : (
        <div className="case-visual__box">
          <div className="case-visual__lid" />
          <div className="case-visual__face">
            <span className="case-visual__mark">C</span>
          </div>
          <div className="case-visual__lock" />
        </div>
      )}
    </div>
  );
}

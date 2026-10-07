export type PriceGateThresholds = {
  hideAfterDays: number;
  failAfterDays: number;
  developmentTextFailAfterDays: number;
};

export type PriceGateResult = {
  ageDays: number | null;
  hidePrice: boolean;
  gate: "PASS" | "FAIL";
};

function ageInDays(checkedAt: string, now: Date): number {
  const checked = new Date(checkedAt);
  if (Number.isNaN(checked.getTime())) {
    throw new Error("invalid checkedAt");
  }
  return Math.floor((now.getTime() - checked.getTime()) / 86_400_000);
}

export function evaluatePriceFreshness(
  checkedAt: string | undefined,
  now: Date,
  thresholds: PriceGateThresholds,
): PriceGateResult {
  if (!checkedAt) {
    return { ageDays: null, hidePrice: true, gate: "PASS" };
  }
  const ageDays = ageInDays(checkedAt, now);
  const hidePrice = ageDays > thresholds.hideAfterDays;
  const gate = ageDays >= thresholds.failAfterDays ? "FAIL" : "PASS";
  return { ageDays, hidePrice, gate };
}

export function evaluateDevelopmentTextGate(
  checkedAt: string | undefined,
  now: Date,
  thresholds: PriceGateThresholds,
): "PASS" | "FAIL" {
  if (!checkedAt) {
    return "FAIL";
  }
  const ageDays = ageInDays(checkedAt, now);
  return ageDays > thresholds.developmentTextFailAfterDays ? "FAIL" : "PASS";
}

const GENERIC_PLACEHOLDER_VALUES = new Set([
  "databaseid",
  "databaseidstorage",
  "databaseidkategori",
  "tampilkanbatchdari1sampai",
]);

function normalizeCmsPlaceholderValue(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]/g, "");
}

export function isCmsPlaceholderValue(
  value: string | null | undefined,
  labels: Array<string | null | undefined> = [],
): boolean {
  const normalized = normalizeCmsPlaceholderValue((value ?? "").trim());
  if (!normalized) return true;
  if (GENERIC_PLACEHOLDER_VALUES.has(normalized)) return true;

  return labels.some((label) => {
    const normalizedLabel = normalizeCmsPlaceholderValue((label ?? "").trim());
    return Boolean(normalizedLabel) && normalized === normalizedLabel;
  });
}

export function cleanCmsValue(
  value: string | null | undefined,
  labels: Array<string | null | undefined> = [],
): string {
  const trimmed = (value ?? "").trim();
  return isCmsPlaceholderValue(trimmed, labels) ? "" : trimmed;
}

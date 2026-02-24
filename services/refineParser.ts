const decodeHtmlEntities = (value: string): string => {
  const entities: Record<string, string> = {
    "&lt;": "<",
    "&gt;": ">",
    "&amp;": "&",
    "&quot;": '"',
    "&#39;": "'",
    "&apos;": "'",
  };

  return value.replace(/&(lt|gt|amp|quot|#39|apos);/gi, (token) => {
    const key = token.toLowerCase();
    return entities[key] ?? token;
  });
};

const unwrapCodeFence = (value: string): string => {
  const fullFenceMatch = value.match(
    /^```(?:[a-zA-Z0-9_-]+)?\s*([\s\S]*?)\s*```$/,
  );
  if (fullFenceMatch?.[1]) {
    return fullFenceMatch[1].trim();
  }

  const firstFenceMatch = value.match(/```(?:[a-zA-Z0-9_-]+)?\s*([\s\S]*?)```/);
  if (firstFenceMatch?.[1]) {
    return firstFenceMatch[1].trim();
  }

  return value;
};

const extractFromJson = (value: string): string | null => {
  if (!value.startsWith("{") || !value.endsWith("}")) {
    return null;
  }

  try {
    const parsed = JSON.parse(value) as {
      enhanced?: unknown;
      result?: unknown;
    };
    const candidate =
      typeof parsed.enhanced === "string"
        ? parsed.enhanced
        : typeof parsed.result === "string"
          ? parsed.result
          : null;
    return candidate?.trim() || null;
  } catch {
    return null;
  }
};

export const extractEnhancedText = (
  rawContent: string,
  fallbackText: string,
): string => {
  if (!rawContent.trim()) return fallbackText;

  let content = unwrapCodeFence(rawContent.trim());
  content = decodeHtmlEntities(content)
    .replace(/^<\?xml[\s\S]*?\?>/i, "")
    .trim();

  const fromJson = extractFromJson(content);
  if (fromJson) {
    content = fromJson;
  }

  const fullTagMatch = content.match(
    /<enhanced(?:\s[^>]*)?>([\s\S]*?)<\/enhanced>/i,
  );
  if (fullTagMatch?.[1]) {
    const cleaned = fullTagMatch[1].trim();
    return cleaned || fallbackText;
  }

  const openTagOnlyMatch = content.match(/<enhanced(?:\s[^>]*)?>([\s\S]*)$/i);
  if (openTagOnlyMatch?.[1]) {
    const cleaned = openTagOnlyMatch[1].trim();
    return cleaned || fallbackText;
  }

  const strippedWrappers = content
    .replace(/^<enhanced(?:\s[^>]*)?>/i, "")
    .replace(/<\/enhanced>$/i, "")
    .trim();

  return strippedWrappers || fallbackText;
};

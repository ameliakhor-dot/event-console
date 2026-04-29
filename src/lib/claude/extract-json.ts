/**
 * Defensive JSON extractor. Handles direct JSON, markdown-fenced JSON,
 * and responses with preamble/postamble text.
 */
export function extractJson(text: string): unknown {
  const trimmed = text.trim();

  // 1. Try direct parse
  try {
    return JSON.parse(trimmed);
  } catch {}

  // 2. Strip markdown fences (```json ... ``` or ``` ... ```)
  const fenceStripped = trimmed
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/, '');
  try {
    return JSON.parse(fenceStripped);
  } catch {}

  // 3. Find the outermost [ ... ]
  const arrayStart = trimmed.indexOf('[');
  const arrayEnd = trimmed.lastIndexOf(']');
  if (arrayStart !== -1 && arrayEnd > arrayStart) {
    try {
      return JSON.parse(trimmed.slice(arrayStart, arrayEnd + 1));
    } catch {}
  }

  // 4. Find the outermost { ... }
  const objStart = trimmed.indexOf('{');
  const objEnd = trimmed.lastIndexOf('}');
  if (objStart !== -1 && objEnd > objStart) {
    try {
      return JSON.parse(trimmed.slice(objStart, objEnd + 1));
    } catch {}
  }

  throw new Error('Could not extract JSON from Claude response');
}

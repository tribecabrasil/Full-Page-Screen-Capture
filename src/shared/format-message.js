/**
 * Format a Chrome i18n message entry with optional placeholders.
 * @param {{ message?: string, placeholders?: Record<string, { content: string }> }} entry
 * @param {string[]} [substitutions]
 * @returns {string}
 */
export function formatMessage(entry, substitutions) {
  let message = entry.message || '';
  if (!substitutions?.length || !entry.placeholders) {
    return message;
  }

  Object.entries(entry.placeholders).forEach(([name, spec]) => {
    const match = spec.content.match(/^\$(\d+)$/);
    if (!match) {
      return;
    }
    const value = substitutions[Number(match[1]) - 1] ?? '';
    message = message.replaceAll(`$${name.toUpperCase()}$`, value);
    message = message.replaceAll(`$${name}$`, value);
  });

  return message;
}
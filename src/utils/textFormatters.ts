/**
 * Utility functions for formatting text
 */

/**
 * Removes HTML tags from a string and replaces common HTML entities
 * @param html - The HTML string to clean
 * @returns A clean text string without HTML tags
 */
export const stripHtmlTags = (html: string | null | undefined): string => {
  if (!html) return '';
  
  // Replace common HTML entities
  let text = html
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, '&');

  // Replace <br>, <br/>, <br /> tags with newlines
  text = text.replace(/<br\s*\/?>/gi, '\n');
  
  // Replace paragraph tags with newlines
  text = text.replace(/<\/p>/gi, '\n');
  text = text.replace(/<p[^>]*>/gi, '');
  
  // Remove all remaining HTML tags
  text = text.replace(/<[^>]*>/g, '');
  
  // Normalize whitespace
  text = text.replace(/\s+/g, ' ').trim();
  
  // Replace multiple newlines with a maximum of two
  text = text.replace(/\n{3,}/g, '\n\n');
  
  return text;
};
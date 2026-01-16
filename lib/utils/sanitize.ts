import DOMPurify from 'isomorphic-dompurify';

/**
 * Sanitize HTML content to prevent XSS attacks.
 * Uses DOMPurify to remove potentially dangerous elements and attributes.
 */
export function sanitizeHtml(dirty: string): string {
  return DOMPurify.sanitize(dirty, {
    // Allow common formatting tags
    ALLOWED_TAGS: [
      'p', 'br', 'b', 'i', 'em', 'strong', 'u', 's', 'strike',
      'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
      'ul', 'ol', 'li',
      'a', 'span', 'div',
      'blockquote', 'pre', 'code',
      'hr', 'img',
      'table', 'thead', 'tbody', 'tr', 'th', 'td',
    ],
    // Allow safe attributes
    ALLOWED_ATTR: [
      'href', 'target', 'rel', 'title', 'class', 'id',
      'src', 'alt', 'width', 'height',
      'style',
    ],
    // Force all links to open in new tab and add security attributes
    ALLOW_DATA_ATTR: false,
    // Add rel="noopener noreferrer" to all links with target="_blank"
    ADD_ATTR: ['target'],
  });
}

/**
 * Sanitize HTML for announcement banners (more restrictive).
 * Only allows inline formatting, no block elements.
 */
export function sanitizeAnnouncementHtml(dirty: string): string {
  return DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'u', 'a', 'span', 'br'],
    ALLOWED_ATTR: ['href', 'target', 'rel', 'class', 'style'],
    ALLOW_DATA_ATTR: false,
  });
}

import { renderOgImage, OG_ALT, OG_SIZE, OG_CONTENT_TYPE } from '@/lib/ogImage';

// Social-share image for link unfurls (Product Hunt, X, Slack, etc.).
export const alt = OG_ALT;
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export default function OpengraphImage() {
  return renderOgImage();
}

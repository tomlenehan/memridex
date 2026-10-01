import { API_BASE_URL } from "../config"

export function profileImageSrc(imageUrl?: string | null) {
  if (!imageUrl) return undefined
  return imageUrl.startsWith("/") ? `${API_BASE_URL}${imageUrl}` : imageUrl
}

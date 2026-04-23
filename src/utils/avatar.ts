/**
 * Retourne l'URL de l'avatar d'un utilisateur.
 * Priorité : avatar_image uploadé > dicebear (dernier recours)
 */
export function getAvatarUrl(
  avatarImage: string | null | undefined,
  seed: string | number,
): string {
  if (avatarImage && avatarImage.trim() !== '') return avatarImage;
  return `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(String(seed))}`;
}

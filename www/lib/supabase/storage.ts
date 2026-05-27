const DEFAULT_LISTING_PHOTOS_BUCKET = "listing-photos";
const DEFAULT_PROFILE_AVATARS_BUCKET = "profile-avatars";
const DEFAULT_CHAT_IMAGES_BUCKET = "chat-images";

export function getListingPhotosBucket() {
  return process.env.NEXT_PUBLIC_SUPABASE_LISTING_PHOTOS_BUCKET?.trim() || DEFAULT_LISTING_PHOTOS_BUCKET;
}

export function getProfileAvatarsBucket() {
  return process.env.NEXT_PUBLIC_SUPABASE_PROFILE_AVATARS_BUCKET?.trim() || DEFAULT_PROFILE_AVATARS_BUCKET;
}

export function getChatImagesBucket() {
  return process.env.NEXT_PUBLIC_SUPABASE_CHAT_IMAGES_BUCKET?.trim() || DEFAULT_CHAT_IMAGES_BUCKET;
}

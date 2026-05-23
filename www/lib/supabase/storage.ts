const DEFAULT_LISTING_PHOTOS_BUCKET = "listing-photos";

export function getListingPhotosBucket() {
  return process.env.NEXT_PUBLIC_SUPABASE_LISTING_PHOTOS_BUCKET?.trim() || DEFAULT_LISTING_PHOTOS_BUCKET;
}


import { api } from './api';

// Matches App\Http\Resources\PropertyMediaResource (../AbangananHub) —
// media_url is already a full Cloudinary secure_url, no base URL needed.
export type PropertyMedia = {
  media_id: number;
  property_id: number;
  unit_id: number | null;
  media_type: 'Image' | 'Video';
  media_url: string;
  cloudinary_public_id: string | null;
};

// Matches App\Http\Resources\PropertyUnitResource. `ApiResource::attr()`
// omits absent fields entirely rather than nulling them, so optional
// fields here are genuinely optional, not nullable.
export type PropertyUnit = {
  unit_id: number;
  property_id: number;
  unit_label: string;
  unit_type?: string;
  floor?: string;
  description: string | null;
  rental_fee: number;
  security_deposit?: number;
  occupancy_limit: number;
  availability_status: string;
  verification_status: string;
  rejection_reason: string | null;
  vacated_at: string | null;
  created_at: string;
  updated_at: string;
  media?: PropertyMedia[];
  amenities?: { amenity_id: number; name: string }[];
};

// Matches App\Http\Resources\ReviewResource.
export type Review = {
  review_id: number;
  rating: number;
  review_comment: string | null;
  landlord_reply: string | null;
  landlord_replied_at: string | null;
  created_at: string;
  tenant?: { user_id: number; first_name: string; last_name: string; profile_picture: string | null };
};

// Matches App\Http\Resources\PropertyResource. `min_rental_fee`/`avg_rating`/
// `review_count`/`is_favorited` are only present on the browsable list/show
// endpoints (withMin/withAvg/withCount on Property::browsable()).
export type Property = {
  property_id: number;
  landlord_id: number;
  title: string;
  description: string | null;
  house_rules: string | null;
  property_type: string;
  address: string;
  latitude: number | null;
  longitude: number | null;
  verification_status: string;
  created_at: string;
  updated_at: string;
  min_rental_fee?: number;
  avg_rating?: number | null;
  review_count?: number;
  is_favorited?: boolean;
  landlord?: { user_id: number; first_name: string; last_name: string };
  media?: PropertyMedia[];
  amenities?: { amenity_id: number; name: string }[];
  units?: PropertyUnit[];
};

export type PropertyDetail = Property & {
  reviews: Review[];
  avg_rating: number | null;
  review_count: number;
  can_review: boolean;
  is_favorited: boolean;
};

// PropertyController@index returns response()->json($paginator) directly —
// a plain LengthAwarePaginator, not an API Resource collection — so its
// JSON shape is flat (current_page/last_page/etc. at the top level), not
// nested under `meta`/`links` the way a Resource collection would be.
export type Paginated<T> = {
  data: T[];
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
  [key: string]: unknown;
};

export type PropertyFilters = {
  location?: string;
  type?: string;
  price_max?: number;
  verified?: boolean;
  sort?: 'newest' | 'price_low' | 'price_high';
  page?: number;
};

// Laravel serializes decimal columns (rental_fee, avg_rating from an
// AVG() aggregate, etc.) as numeric strings in JSON — coerce once here so
// every consumer gets a real `number` and can call .toFixed()/
// .toLocaleString() without checking typeof first.
function normalizeUnit(unit: PropertyUnit): PropertyUnit {
  return {
    ...unit,
    rental_fee: Number(unit.rental_fee),
    security_deposit: unit.security_deposit != null ? Number(unit.security_deposit) : undefined,
  };
}

function normalizeProperty<T extends Property>(property: T): T {
  return {
    ...property,
    min_rental_fee: property.min_rental_fee != null ? Number(property.min_rental_fee) : undefined,
    avg_rating: property.avg_rating != null ? Number(property.avg_rating) : property.avg_rating,
    units: property.units?.map(normalizeUnit),
  };
}

export async function listProperties(filters: PropertyFilters = {}): Promise<Paginated<Property>> {
  const { data } = await api.get<Paginated<Property>>('/properties', { params: filters });
  return { ...data, data: data.data.map(normalizeProperty) };
}

export async function getProperty(propertyId: number): Promise<PropertyDetail> {
  const { data } = await api.get<{ data: PropertyDetail }>(`/properties/${propertyId}`);
  return normalizeProperty(data.data);
}

export async function toggleFavorite(propertyId: number): Promise<boolean> {
  const { data } = await api.post<{ data: { favorited: boolean } }>(`/favorites/${propertyId}/toggle`);
  return data.data.favorited;
}

import { api } from './api';
import type { Property } from './properties';

// Matches App\Http\Controllers\Api\FavoriteController@index —
// GET /favorites -> { data: [{ favorite_id, created_at, property: {...} }] }
export type Favorite = {
  favorite_id: number;
  created_at: string;
  property: Property;
};

function normalizeFavorite(favorite: Favorite): Favorite {
  return {
    ...favorite,
    property: {
      ...favorite.property,
      // Being in this list means it's favorited — the nested PropertyResource
      // here doesn't necessarily carry `is_favorited` itself.
      is_favorited: true,
      min_rental_fee:
        favorite.property.min_rental_fee != null ? Number(favorite.property.min_rental_fee) : undefined,
      avg_rating: favorite.property.avg_rating != null ? Number(favorite.property.avg_rating) : favorite.property.avg_rating,
    },
  };
}

export async function listFavorites(): Promise<Favorite[]> {
  const { data } = await api.get<{ data: Favorite[] }>('/favorites');
  return data.data.map(normalizeFavorite);
}

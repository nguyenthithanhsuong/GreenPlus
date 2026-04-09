export type CategorySort = "name_asc" | "name_desc" | "newest";

export type CategoryRow = {
  category_id: string;
  name: string;
  description: string | null;
  image_url: string | null;
};

export type CategoryItem = {
  categoryId: string;
  name: string;
  description: string | null;
  imageUrl: string | null;
};

export type CategoryBrowseResult = {
  total: number;
  items: CategoryItem[];
};

export type CategoryChangedEvent = {
  categoryId: string;
  event: "loaded";
  changedAt: string;
};

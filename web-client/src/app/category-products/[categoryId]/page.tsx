import CategoryProducts from "../../../../frontend/category-products/components/CategoryProducts";

type CategoryProductsPageProps = {
  params: Promise<{
    categoryId: string;
  }>;
  searchParams?: Promise<{
    name?: string;
    backTo?: string;
    keyword?: string;
    sort?: string;
  }>;
};

export default async function CategoryProductsPage({ params, searchParams }: CategoryProductsPageProps) {
  const resolvedParams = await params;
  const resolvedSearchParams = await searchParams;

  return (
    <CategoryProducts
      categoryId={resolvedParams.categoryId}
      categoryName={resolvedSearchParams?.name}
      backHref={resolvedSearchParams?.backTo}
      initialKeyword={resolvedSearchParams?.keyword}
      initialSort={resolvedSearchParams?.sort}
    />
  );
}

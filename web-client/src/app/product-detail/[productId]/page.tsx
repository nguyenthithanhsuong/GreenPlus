import ProductDetail from "../../../../frontend/product-detail/components/ProductDetail";

type ProductDetailPageProps = {
  params: Promise<{
    productId: string;
  }>;
  searchParams?: Promise<{
    backTo?: string;
  }>;
};

export default async function ProductDetailPage({ params, searchParams }: ProductDetailPageProps) {
  const { productId } = await params;
  const resolvedSearchParams = await searchParams;
  return <ProductDetail productId={productId} backHref={resolvedSearchParams?.backTo} />;
}

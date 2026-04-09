import { redirect } from "next/navigation";
import ProductDetail from "../../../frontend/product-detail/components/ProductDetail";

type ProductDetailLandingPageProps = {
	searchParams?: Promise<{
		productId?: string;
		product_id?: string;
		backTo?: string;
	}>;
};

export default async function ProductDetailLandingPage({ searchParams }: ProductDetailLandingPageProps) {
	const params = await searchParams;
	const productId = params?.productId?.trim() ?? params?.product_id?.trim() ?? "";

	if (productId) {
		return <ProductDetail productId={productId} backHref={params?.backTo} />;
	}

	redirect("/dashboard");
}
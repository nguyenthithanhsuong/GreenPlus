import type {
  ProductRow,
  ProductStatus,
} from "../../../backend/modules/catalog/product-management.types";
import { DialogFormBuilder } from "../builder";
import type { ProductMutationPayload } from "../singleton";

export type ProductFormValues = {
  categoryId: string;
  name: string;
  description: string;
  unit: string;
  imageUrl: string;
  nutrition: string;
  status: ProductStatus;
};

const productFormDirector = DialogFormBuilder.withDefaults<ProductFormValues>({
  categoryId: "",
  name: "",
  description: "",
  unit: "",
  imageUrl: "",
  nutrition: "",
  status: "active",
});

export class ProductManagementMapper {
  static emptyForm(): ProductFormValues {
    return productFormDirector.constructEmpty();
  }

  static toFormValues(product: ProductRow): ProductFormValues {
    return productFormDirector.constructFrom({
      categoryId: product.category_id ?? "",
      name: product.name,
      description: product.description ?? "",
      unit: product.unit,
      imageUrl: product.image_url ?? "",
      nutrition: product.nutrition ?? "",
      status: product.status,
    });
  }

  static toMutationPayload(form: ProductFormValues): ProductMutationPayload {
    return {
      categoryId: form.categoryId || null,
      name: form.name,
      description: form.description,
      unit: form.unit,
      imageUrl: form.imageUrl,
      nutrition: form.nutrition,
      status: form.status,
    };
  }
}

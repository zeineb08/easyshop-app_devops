import ProductGrid from "@/components/ProductGrid";
import SelectedFilters from "@/components/filters/SelectedFilters";
import ProductLoader from "@/components/loader/ProductLoader";
import { Suspense } from "react";

type ShopPageProps = {
  searchParams: Promise<SearchParamsType> | SearchParamsType;
  params: Promise<{
    shop: string;
    category?: string;
  }> | {
    shop: string;
    category?: string;
  };
};

const ShopPage = async ({ params, searchParams }: ShopPageProps) => {
  const resolvedParams = await params;
  const resolvedSearchParams = await searchParams;

  return (
    <section className="shop-page">
      <SelectedFilters />
      <Suspense
        key={String(resolvedSearchParams?.page ?? "") + resolvedParams?.shop + String(resolvedSearchParams?.q ?? "")}
        fallback={<ProductLoader />}
      >
        <ProductGrid
          searchParams={resolvedSearchParams}
          params={{ shop: resolvedParams?.shop, category: "" }}
        />
      </Suspense>
    </section>
  );
};

export default ShopPage;

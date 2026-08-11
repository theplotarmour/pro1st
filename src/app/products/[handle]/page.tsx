import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ProductFeatures } from "@/components/product/ProductFeatures";
import { ProductGallery } from "@/components/product/ProductGallery";
import { ProductInfo } from "@/components/product/ProductInfo";
import { ProductSpecs } from "@/components/product/ProductSpecs";
import { RelatedProducts } from "@/components/product/RelatedProducts";
import { ContactCTA } from "@/components/sections/ContactCTA";
import { Container } from "@/components/ui/Container";
import { site } from "@/data/site";
import { categorySlug } from "@/lib/format";
import { productRepository } from "@/lib/products";

interface PageProps {
  params: Promise<{ handle: string }>;
}

/**
 * Prerender every product at build time. If Shopify is unreachable, return
 * nothing and let the routes render on demand instead — `dynamicParams`
 * defaults to true, so the catalogue still works, it just isn't prebuilt.
 */
export async function generateStaticParams() {
  try {
    const products = await productRepository.getAll();
    return products.map((product) => ({ handle: product.handle }));
  } catch (error) {
    console.error("[pro1st] generateStaticParams: Shopify unreachable, product pages will render on demand.", error);
    return [];
  }
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { handle } = await params;
  const product = await productRepository.getByHandle(handle);
  if (!product) return { title: "Product not found" };

  // SEO copy is derived from product data, so it stays correct once the
  // Shopify catalogue replaces the mock records.
  const description =
    product.seo?.description ??
    product.description?.slice(0, 200) ??
    [product.title, product.category, product.specLine]
      .filter(Boolean)
      .join(" · ");
  const title = product.seo?.title ?? product.title;

  return {
    title,
    description,
    alternates: { canonical: `/products/${product.handle}` },
    openGraph: {
      type: "website",
      title: `${title} · ${site.name}`,
      description,
      url: `/products/${product.handle}`,
      images: product.images[0] ? [{ url: product.images[0].src }] : undefined,
    },
  };
}

export default async function ProductPage({ params }: PageProps) {
  const { handle } = await params;
  const product = await productRepository.getByHandle(handle);
  if (!product) notFound();

  const related = await productRepository.getRelated(handle, 4);
  const enquiryHref = `/contact?enquiry=product&product=${product.handle}`;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.title,
    category: product.category,
    image: product.images.map((image) => image.src),
    ...(product.sku ? { sku: product.sku } : {}),
    ...(product.description ? { description: product.description } : {}),
    ...(typeof product.price === "number"
      ? {
          offers: {
            "@type": "Offer",
            price: product.price,
            priceCurrency: product.currency ?? "INR",
            availability:
              product.availability?.status === "in-stock"
                ? "https://schema.org/InStock"
                : product.availability?.status === "preorder"
                  ? "https://schema.org/PreOrder"
                  : "https://schema.org/OutOfStock",
          },
        }
      : {}),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <Container as="nav" className="pt-[112px] lg:pt-[136px]">
        <ol className="p1-mono m-0 flex list-none flex-wrap gap-2 p-0 text-faint">
          <li>
            <Link href="/products">Products</Link>
          </li>
          <li aria-hidden="true">/</li>
          <li>
            <Link
              href={`/products?category=${product.categoryHandle ?? categorySlug(product.category)}`}
            >
              {product.category}
            </Link>
          </li>
          <li aria-hidden="true">/</li>
          <li aria-current="page" className="text-ash">
            {product.title}
          </li>
        </ol>
      </Container>

      <Container as="section" className="py-12 lg:py-16">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-[7fr_5fr] lg:gap-20">
          <ProductGallery images={product.images} title={product.title} />
          <ProductInfo product={product} />
        </div>

        <div className="mt-20 grid grid-cols-1 gap-12 lg:grid-cols-2 lg:gap-20">
          <ProductSpecs
            specifications={product.specifications}
            enquiryHref={enquiryHref}
          />
          <div className="flex flex-col gap-12">
            <ProductFeatures items={product.features} title="Features" id="features" />
            <ProductFeatures
              items={product.applications}
              title="Applications"
              id="applications"
            />
          </div>
        </div>
      </Container>

      <Container as="section" className="pb-24 lg:pb-32">
        <RelatedProducts products={related} />
      </Container>

      <ContactCTA />
    </>
  );
}

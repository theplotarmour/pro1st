import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Container } from "@/components/ui/Container";
import { PageHeader } from "@/components/ui/PageHeader";
import { getPolicies, getPolicy } from "@/lib/shopify/policies";

interface PageProps {
  params: Promise<{ handle: string }>;
}

export async function generateStaticParams() {
  const policies = await getPolicies();
  return policies.map((policy) => ({ handle: policy.handle }));
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { handle } = await params;
  const policy = await getPolicy(handle);
  if (!policy) return { title: "Policy not found" };
  return {
    title: policy.title,
    alternates: { canonical: `/policies/${policy.handle}` },
    robots: { index: true, follow: true },
  };
}

/**
 * Renders a Shopify shop policy. The body is HTML authored by the merchant in
 * Shopify admin — it is their legal text, rendered, never rewritten here.
 */
export default async function PolicyPage({ params }: PageProps) {
  const { handle } = await params;
  const policy = await getPolicy(handle);
  if (!policy) notFound();

  return (
    <>
      <PageHeader eyebrow="[ Legal ]" title={policy.title} />
      <Container as="section" className="pb-24 lg:pb-32">
        <div
          className="p1-prose max-w-[72ch]"
          dangerouslySetInnerHTML={{ __html: policy.body }}
        />
      </Container>
    </>
  );
}

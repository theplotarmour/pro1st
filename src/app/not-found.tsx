import Link from "next/link";
import { Container } from "@/components/ui/Container";

export default function NotFound() {
  return (
    <Container as="section" className="pb-32 pt-[184px]">
      <div className="p1-eyebrow mb-6">[ 404 ]</div>
      <h1 className="p1-h-xl max-w-[16ch] text-white">No signal here.</h1>
      <p className="p1-lead mt-8 max-w-[48ch]">
        That page doesn&apos;t exist, or the product has been retired from the
        line.
      </p>
      <div className="mt-10 flex flex-wrap gap-3">
        <Link href="/products" className="p1-btn p1-btn--primary">
          Browse the catalogue
        </Link>
        <Link href="/contact" className="p1-btn p1-btn--outline">
          Get in touch
        </Link>
      </div>
    </Container>
  );
}

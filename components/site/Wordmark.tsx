import Image from "next/image";
import Link from "next/link";

export function Wordmark() {
  return (
    <Link className="wordmark" href="/" aria-label="JetSetPlay home">
      <Image
        alt="JetSetPlay."
        height={42}
        priority
        src="/brand/jetsetplay-wordmark.svg"
        unoptimized
        width={223}
      />
    </Link>
  );
}

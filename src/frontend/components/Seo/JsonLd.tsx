type JsonLdProps = {
  readonly data: Record<string, unknown> | ReadonlyArray<Record<string, unknown>>;
};

/** Renders schema.org structured data as JSON-LD. */
export function JsonLd({ data }: JsonLdProps) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

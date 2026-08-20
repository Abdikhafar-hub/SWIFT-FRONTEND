/**
 * Swift Doc — JSON-LD Injection Component
 * Server-safe component for injecting structured data.
 */

import React from "react";

interface JsonLdProps {
  data: Record<string, any> | Record<string, any>[];
}

export function JsonLd({ data }: JsonLdProps) {
  const items = Array.isArray(data) ? data : [data];

  return (
    <>
      {items.map((item, index) => (
        <script
          key={index}
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(item),
          }}
        />
      ))}
    </>
  );
}

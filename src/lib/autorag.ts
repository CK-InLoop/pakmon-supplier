interface ChunkMetadata {
  productId: string;
  supplierId: string;
  title: string;
  tags: string[];
  images: string[];
  pdfFiles: string[];
  timestamp?: number;
  folder?: string;
  context?: string;
}

interface AutoRAGChunk {
  id: string;
  content: string;
  metadata: ChunkMetadata;
}

export async function ingestToAutoRAG(chunks: AutoRAGChunk[]): Promise<void> {
  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID!;
  const apiToken = process.env.CLOUDFLARE_API_TOKEN!;
  const indexName = process.env.CLOUDFLARE_AUTORAG_INDEX!;

  const url = `https://api.cloudflare.com/client/v4/accounts/${accountId}/ai/autorag/${indexName}/documents`;

  for (const chunk of chunks) {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        documents: [
          {
            id: chunk.id,
            content: chunk.content,
            metadata: {
              ...chunk.metadata,
              timestamp: Date.now(),
              folder: `products/${chunk.metadata.supplierId}/`,
            },
          },
        ],
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('AutoRAG ingestion error:', error);
      throw new Error(`Failed to ingest chunk ${chunk.id}: ${error}`);
    }
  }
}

export async function deleteFromAutoRAG(documentIds: string[]): Promise<void> {
  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID!;
  const apiToken = process.env.CLOUDFLARE_API_TOKEN!;
  const indexName = process.env.CLOUDFLARE_AUTORAG_INDEX!;

  for (const docId of documentIds) {
    const url = `https://api.cloudflare.com/client/v4/accounts/${accountId}/ai/autorag/${indexName}/documents/${docId}`;

    const response = await fetch(url, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${apiToken}`,
      },
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('AutoRAG deletion error:', error);
    }
  }
}

export function chunkText(text: string, maxTokens: number = 500, overlap: number = 50): string[] {
  // Simple chunking by character count (approximating tokens as ~4 chars each)
  const maxChars = maxTokens * 4;
  const overlapChars = overlap * 4;
  const chunks: string[] = [];

  let start = 0;
  while (start < text.length) {
    const end = Math.min(start + maxChars, text.length);
    chunks.push(text.slice(start, end));
    start = end - overlapChars;
    if (start >= text.length) break;
  }

  return chunks;
}

export async function createProductChunks(product: {
  id: string;
  supplierId: string;
  title: string;
  shortDescription: string;
  fullDescription: string;
  specifications?: string | null;
  tags: string[];
  images: string[];
  pdfFiles: string[];
}): Promise<AutoRAGChunk[]> {
  const fullText = `
Title: ${product.title}

Short Description: ${product.shortDescription}

Full Description: ${product.fullDescription}

${product.specifications ? `Specifications: ${product.specifications}` : ''}

Tags: ${product.tags.join(', ')}

Images: ${product.images.join(', ')}

Files: ${product.pdfFiles.join(', ')}
  `.trim();

  const textChunks = chunkText(fullText);
  
  return textChunks.map((content, index) => ({
    id: `${product.id}-chunk-${index}`,
    content,
    metadata: {
      productId: product.id,
      supplierId: product.supplierId,
      title: product.title,
      tags: product.tags,
      images: product.images,
      pdfFiles: product.pdfFiles,
      context: `Product from Flavi Dairy Solutions supplier. Title: ${product.title}`,
    },
  }));
}


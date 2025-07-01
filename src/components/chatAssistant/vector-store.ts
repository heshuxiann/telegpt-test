/* eslint-disable max-len */
import { VectorStorage } from './vector-storage/VectorStorage';

async function embedTextsFn(texts: string[]): Promise<number[][]> {
  const response = await fetch('https://telegpt-three.vercel.app/embeddings', {
    body: JSON.stringify({
      values: texts,
      //   model: '',
    }),
    headers: {
      'Content-Type': 'application/json',
    },
    method: 'POST',
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  const responseData = (await response.json());
  return responseData.embeddings;
}

const vectorStoreMap = new Map();

function getVectorStore(dbName: string, dbVersion?: number) {
  if (!vectorStoreMap.has(dbName)) {
    vectorStoreMap.set(dbName, new VectorStorage({ embedTextsFn, dbName, dbVersion }));
  }
  return vectorStoreMap.get(dbName)!;
}

export const toolsEmbeddingStore = getVectorStore('tools-embedding');
export const messageEmbeddingStore = getVectorStore('message-embedding', 2);
export const knowledgeEmbeddingStore = getVectorStore('knowledge-embedding');
(window as any).toolsEmbeddingStore = toolsEmbeddingStore;

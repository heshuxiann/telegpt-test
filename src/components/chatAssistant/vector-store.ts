/* eslint-disable no-null/no-null */
// import { SERVER_API_URL } from '../../config';

import { VectorStorage } from './vector-storage/VectorStorage';

async function embedTextsFn(text: string): Promise<number[]> {
  // const { userId, userName } = getCurrentUserInfo();
  // texts = texts.filter((text) => text.trim() !== ''); // Filter out empty strings
  // if (texts.length === 0) {
  //   return [];
  // }
  // ${SERVER_API_URL}/embeddings
  const response = await fetch(`http://47.85.96.140:8100/v1/embeddings`, {
    body: JSON.stringify({
      // values: texts,
      // userId,
      // userName,
      dimensions: null,
      encoding_format: 'float',
      input: text,
      model: 'null',
      user: 'null',
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
  return responseData.data?.[0]?.embedding;
}

const vectorStoreMap = new Map();

function getVectorStore(dbName: string, dbVersion?: number) {
  if (!vectorStoreMap.has(dbName)) {
    vectorStoreMap.set(dbName, new VectorStorage({ embedTextsFn, dbName, dbVersion }));
  }
  return vectorStoreMap.get(dbName)!;
}

export const toolsEmbeddingStore = getVectorStore('tools-embedding', 2);
export const messageEmbeddingStore = getVectorStore('message-embedding', 2);
export const knowledgeEmbeddingStore = getVectorStore('knowledge-embedding');
(window as any).toolsEmbeddingStore = toolsEmbeddingStore;

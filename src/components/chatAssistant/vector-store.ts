import { VectorStorage } from 'vector-storage';

async function embedTextsFn(texts: string[]): Promise<number[][]> {
  const response = await fetch('https://sdm-ai-api.vercel.app/embeddings', {
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

const vectorStore = new VectorStorage({ embedTextsFn });
export default vectorStore;

/* eslint-disable @typescript-eslint/no-redundant-type-constituents */
/* eslint-disable @stylistic/max-len */
/* eslint-disable no-null/no-null */
/* eslint-disable no-console */

import type { IDBPDatabase } from 'idb';
import { openDB } from 'idb';

import type { ICreateEmbeddingResponse } from './types/ICreateEmbeddingResponse';
import type { IVSDocument, IVSSimilaritySearchItem } from './types/IVSDocument';
import type { IVSOptions } from './types/IVSOptions';
import type { IVSSimilaritySearchParams } from './types/IVSSimilaritySearchParams';

import { constants } from './common/constants';
import { filterDocuments } from './common/helpers';

export class VectorStorage<T> {
  private db!: IDBPDatabase<any>;

  private documents: Array<IVSDocument<T>> = [];

  private readonly maxSizeInMB: number;

  private readonly debounceTime: number;

  private readonly openaiModel: string;

  private readonly openaiApiKey?: string;

  private readonly embedTextsFn: (text: string) => Promise<number[]>;

  private readonly dbName: string;

  private readonly dbVersion: number;

  constructor(options: IVSOptions) {
    this.dbName = options.dbName ?? constants.DEFAULT_DB_NAME;
    this.dbVersion = options.dbVersion ?? constants.DEFAULT_DB_VERSION;
    this.maxSizeInMB = options.maxSizeInMB ?? constants.DEFAULT_MAX_SIZE_IN_MB;
    this.debounceTime = options.debounceTime ?? constants.DEFAULT_DEBOUNCE_TIME;
    this.openaiModel = options.openaiModel ?? constants.DEFAULT_OPENAI_MODEL;
    this.embedTextsFn = options.embedTextsFn; // Use the custom function if provided, else use the default one
    this.openaiApiKey = options.openAIApiKey;
    if (!this.openaiApiKey && !options.embedTextsFn) {
      console.error('VectorStorage: pass as an option either an OpenAI API key or a custom embedTextsFn function.');
    } else {
      // 启动定期检测和清理机制
      this.startPeriodicCleanup();
    }
  }

  public async addText(text: string, id: string, metadata: T): Promise<IVSDocument<T>> {
    // Create a document from the text and metadata
    const doc: IVSDocument<T> = {
      metadata,
      text,
      id,
      timestamp: Date.now(),
      vector: [],
      vectorMag: 0,
    };
    const docs = await this.addDocuments(doc);
    return docs;
  }

  public async updateText(text: string, id: string, metadata: T): Promise<IVSDocument<T>> {
    const doc: IVSDocument<T> = {
      metadata,
      text,
      id,
      timestamp: Date.now(),
      vector: [],
      vectorMag: 0,
    };
    const docs = await this.updateDocument(doc);
    return docs;
  }

  public async deleteText(id: string): Promise<void> {
    // this.documents = this.documents.filter((doc) => doc.id !== id);
    if (!this.db) {
      this.db = await this.initDB();
    }
    try {
      const tx = this.db.transaction('documents', 'readwrite');
      tx.objectStore('documents').delete(id);
      await tx.done;
    } catch (error) {
      console.error('Error deleting text:', error);
    }
  }

  public async getText(id: string): Promise<any | undefined> {
    if (!this.db) {
      this.db = await this.initDB();
    }
    const tx = this.db.transaction('documents', 'readonly');
    const result = await tx.objectStore('documents').get(id);
    return result;
  }

  // public async addTexts(texts: string[], metadatas: T[]): Promise<Array<IVSDocument<T>>> {
  //   if (texts.length !== metadatas.length) {
  //     throw new Error('The lengths of texts and metadata arrays must match.');
  //   }
  //   const docs: Array<IVSDocument<T>> = texts.map((text, index) => ({
  //     metadata: metadatas[index],
  //     text,
  //     timestamp: Date.now(),
  //     vector: [],
  //     vectorMag: 0,
  //   }));
  //   return this.addDocuments(docs);
  // }

  public async similaritySearch(params: IVSSimilaritySearchParams): Promise<{
    similarItems: Array<IVSSimilaritySearchItem<T>>;
    query: { text: string; embedding: number[] };
  }> {
    const {
      query, k = 4, filterOptions, includeValues,
    } = params;
    let { queryEmbedding } = params;
    if (!queryEmbedding || queryEmbedding.length === 0) {
      queryEmbedding = await this.embedText(query);
    }
    const queryMagnitude = this.calculateMagnitude(queryEmbedding);
    const allDocuments = await this.loadFromIndexDbStorage();
    const filteredDocuments = filterDocuments(allDocuments, filterOptions);
    const scoresPairs: Array<[IVSDocument<T>, number]> = this.calculateSimilarityScores(filteredDocuments, queryEmbedding, queryMagnitude);
    const sortedPairs = scoresPairs.sort((a, b) => b[1] - a[1]);
    const results = sortedPairs.slice(0, k).map((pair) => ({ ...pair[0], score: pair[1] }));
    this.updateHitCounters(results);
    // if (results.length > 0) {
    //   this.removeDocsLRU();
    //   await this.saveToIndexDbStorage();
    // }
    if (!includeValues) {
      results.forEach((result) => {
        delete result.vector;
        delete result.vectorMag;
      });
    }
    return {
      query: { embedding: queryEmbedding, text: query },
      similarItems: results,
    };
  }

  public async documentSearch(params: IVSSimilaritySearchParams): Promise<Array<IVSDocument<T>>> {
    const { filterOptions } = params;
    const allDocuments = await this.loadAllFromIndexDbStorage();
    const filteredDocuments = filterDocuments(allDocuments, filterOptions);

    return filteredDocuments;
  }

  private async initDB(): Promise<IDBPDatabase<any>> {
    return openDB<any>(this.dbName, this.dbVersion, {
      upgrade(db) {
        // clear old store
        for (const storeName of db.objectStoreNames) {
          db.deleteObjectStore(storeName);
        }
        const documentStore = db.createObjectStore('documents', {
          autoIncrement: true,
          keyPath: 'id',
        });
        documentStore.createIndex('text', 'text', { unique: false });
        documentStore.createIndex('metadata', 'metadata');
        documentStore.createIndex('timestamp', 'timestamp');
        documentStore.createIndex('vector', 'vector');
        documentStore.createIndex('vectorMag', 'vectorMag');
        documentStore.createIndex('hits', 'hits');
        documentStore.createIndex('id', 'id', { unique: true });
      },
    });
  }

  private async addDocuments(document: IVSDocument<T>): Promise<IVSDocument<T>> {
    // filter out already existing documents
    // const newDocuments = documents.filter((doc) => !this.documents.some((d) => d.text === doc.text));
    // If there are no new documents, return an empty array
    // if (newDocuments.length === 0) {
    //   return [];
    const vector = await this.embedTextsFn(document.text);
    document.vector = vector;
    document.vectorMag = calcVectorMagnitude(document);
    // const newVectors = await this.embedTextsFn(documents.map((doc) => doc.text));
    // Assign vectors and precompute vector magnitudes for new documents
    // documents.forEach((doc, index) => {
    //   doc.vector = newVectors[index];
    //   doc.vectorMag = calcVectorMagnitude(doc);
    // });
    // Add new documents to the store
    // this.documents.push(...newDocuments);
    // this.removeDocsLRU();
    // Save to index db storage
    await this.addToIndexDbStorage([document]);
    return document;
  }

  private async updateDocument(document: IVSDocument<T>): Promise<IVSDocument<T>> {
    const vertor = await this.embedTextsFn(document.text);
    document.vector = vertor;
    document.vectorMag = calcVectorMagnitude(document);
    // const oldDoc = this.documents.find((doc) => doc.id === document.id);
    // if (oldDoc) {
    //   // Add new documents to the store
    //   this.documents = this.documents.map((doc) => {
    //     if (doc.id === document.id) {
    //       return document;
    //     }
    //     return doc;
    //   });
    // } else {
    //   this.documents.push(document);
    // }

    // this.removeDocsLRU();
    // Save to index db storage
    await this.addToIndexDbStorage([document]);
    return document;
  }

  private async embedTexts(texts: string[]): Promise<number[][]> {
    const response = await fetch(constants.OPENAI_API_URL, {
      body: JSON.stringify({
        input: texts,
        model: this.openaiModel,
      }),
      headers: {
        Authorization: `Bearer ${this.openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      method: 'POST',
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const responseData = (await response.json()) as ICreateEmbeddingResponse;
    return responseData.data.map((data) => data.embedding);
  }

  private async embedText(query: string): Promise<number[]> {
    return (await this.embedTextsFn(query));
  }

  private calculateMagnitude(embedding: number[]): number {
    const queryMagnitude = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0));
    return queryMagnitude;
  }

  private calculateSimilarityScores(filteredDocuments: Array<IVSDocument<T>>, queryVector: number[], queryMagnitude: number): Array<[IVSDocument<T>, number]> {
    return filteredDocuments.map((doc) => {
      const dotProduct = doc.vector!.reduce((sum, val, i) => sum + val * queryVector[i], 0);
      let score = getCosineSimilarityScore(dotProduct, doc.vectorMag!, queryMagnitude);
      score = normalizeScore(score); // Normalize the score
      return [doc, score];
    });
  }

  private updateHitCounters(results: Array<IVSDocument<T>>): void {
    results.forEach((doc) => {
      doc.hits = (doc.hits ?? 0) + 1; // Update hit counter
    });
  }

  private async loadFromIndexDbStorage(): Promise<IVSDocument<T>[]> {
    if (!this.db) {
      this.db = await this.initDB();
    }
    const tx = this.db.transaction('documents', 'readonly');
    const store = tx.store;
    const index = store.index('timestamp');

    const result = [];
    let count = 0;

    for await (const cursor of index.iterate(null, 'prev')) {
      result.push(cursor.value);
      count++;
      if (count >= 3000) break;
    }

    await tx.done;
    return result;
    // this.documents = result;
    // this.documents = await this.db.getAll('documents');
    // this.removeDocsLRU();
  }

  private async loadAllFromIndexDbStorage(): Promise<IVSDocument<T>[]> {
    if (!this.db) {
      this.db = await this.initDB();
    }
    const tx = this.db.transaction('documents', 'readonly');
    const store = tx.store;
    const index = store.index('timestamp');

    const result = [];

    for await (const cursor of index.iterate(null, 'prev')) {
      result.push(cursor.value);
    }

    await tx.done;
    return result;
  }

  private async addToIndexDbStorage(documents: Array<IVSDocument<T>>): Promise<void> {
    if (!this.db) {
      this.db = await this.initDB();
    }
    try {
      const tx = this.db.transaction('documents', 'readwrite');
      for (const doc of documents) {
        await tx.objectStore('documents').put(doc);
      }
      await tx.done;
    } catch (error: any) {
      console.error('Failed to save to IndexedDB:', error.message);
    }
  }

  /**
   * 启动定期清理机制，每小时检查一次数据量
   */
  private startPeriodicCleanup(): void {
    // 立即执行一次检查
    this.checkAndCleanupData();

    // 每小时检查一次（3600000毫秒）
    setInterval(() => {
      this.checkAndCleanupData();
    }, 3600000);
  }

  /**
   * 检查数据量并清理老数据
   * 当数据超过20000条时，按时间删除最老的数据，保留最新的15000条
   */
  private async checkAndCleanupData(): Promise<void> {
    try {
      if (!this.db) {
        this.db = await this.initDB();
      }

      const tx = this.db.transaction('documents', 'readwrite');
      const store = tx.objectStore('documents');
      const index = store.index('timestamp');

      // 统计总数据量
      const totalCount = await store.count();

      if (totalCount > 40000) {
        console.log(`VectorStorage: 检测到数据量超过限制 (${totalCount} > 40000)，开始清理老数据...`);

        // 获取所有文档按时间戳排序（最新的在前）
        const allDocs: IVSDocument<T>[] = [];
        for await (const cursor of index.iterate(null, 'prev')) {
          allDocs.push(cursor.value);
        }

        // 保留最新的15000条，删除其余的
        const docsToKeep = allDocs.slice(0, 35000);
        const docsToDelete = allDocs.slice(35000);

        // 清空存储
        await store.clear();

        // 重新添加要保留的文档
        for (const doc of docsToKeep) {
          await store.put(doc);
        }

        await tx.done;

        console.log(`VectorStorage: 清理完成，删除了 ${docsToDelete.length} 条老数据，保留了 ${docsToKeep.length} 条最新数据`);
      } else {
        console.log(`VectorStorage: 数据量检查完成，当前数据量: ${totalCount}`);
      }
    } catch (error) {
      console.error('VectorStorage: 数据清理过程中发生错误:', error);
    }
  }

  /**
   * 手动触发数据清理
   */
  public async manualCleanup(): Promise<void> {
    await this.checkAndCleanupData();
  }

  /**
   * 获取当前数据库中的文档数量
   */
  public async getDocumentCount(): Promise<number> {
    try {
      if (!this.db) {
        this.db = await this.initDB();
      }
      const tx = this.db.transaction('documents', 'readonly');
      const count = await tx.objectStore('documents').count();
      await tx.done;
      return count;
    } catch (error) {
      console.error('VectorStorage: 获取文档数量时发生错误:', error);
      return 0;
    }
  }
}

function calcVectorMagnitude(doc: IVSDocument<any>): number {
  return Math.sqrt(doc.vector!.reduce((sum, val) => sum + val * val, 0));
}

function getCosineSimilarityScore(dotProduct: number, magnitudeA: number, magnitudeB: number): number {
  return dotProduct / (magnitudeA * magnitudeB);
}

function normalizeScore(score: number): number {
  return (score + 1) / 2;
}

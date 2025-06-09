/* eslint-disable no-console */
import { v4 as uuidv4 } from 'uuid';

class Sapling {
  private editUrl: string;

  constructor() {
    this.editUrl = 'https://api.sapling.ai/api/v1/edits';
  }

  public async saplingEditOverview(text: string) {
    const params = {
      text,
      session_id: uuidv4(),
      key: 'WCFKUN3GJEEC1FSEPFH6Q7T9R5C67QTE', // replace with your API key
    };

    try {
      const response = await fetch(this.editUrl, {
        headers: {
          accept: 'application/json',
          'content-type': 'application/json',
        },
        body: JSON.stringify(params),
        method: 'POST',
      });
      const result = await response.json();
      const editorData = result?.edits || [];
      if (editorData.length > 0) {
        editorData.map((item: any) => {
          item.original_text = item.sentence.substring(item.start, item.end);
          item.start = item.sentence_start + item.start;
          item.end = item.sentence_start + item.end;
          return item;
        });
      }
      return editorData;
    } catch (err) {
      console.log(err);
      return [];
    }
  }

  public async check(text: string) {
    const editorData = await this.saplingEditOverview(text);
    return editorData;
  }
}

export const sapling = new Sapling();

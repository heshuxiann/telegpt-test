/* eslint-disable no-console */
class GrammarChecker {
  private languageToolURL: string;

  constructor() {
    this.languageToolURL = 'https://api.languagetoolplus.com/v2/check';
  }

  public async saplingEditOverview(text: string) {
    const params = new URLSearchParams({
      text,
      language: 'en-US',
      useragent: 'standalone',
      disabledRules: 'WHITESPACE_RULE',
      mode: 'allButTextLevelOnly',
      allowIncompleteResults: 'true',
    });

    try {
      const response = await fetch(this.languageToolURL, {
        headers: {
          accept: 'application/json',
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: params.toString(),
        method: 'POST',
      });
      const data = await response.json();

      console.log('LanguageTool response:', JSON.stringify(data));
      return data.matches.map((m:any) => {
        if (m.replacements && m.replacements.length) {
          return {
            description: m.rule.description,
            start: m.offset,
            end: m.offset + m.length,
            id: m.rule.id,
            general_error_type: m.rule.category.id.toLowerCase(),
            error_type: GrammarChecker.classifyTypeGramma(m.rule),
            replacement: m.replacements[0]?.value || '',
            isPremium: !!m.rule?.isPremium,
            shortMessage: m.shortMessage || '',
            original_text: text.substring(m.offset, m.offset + m.length),
            sentence: m.sentence,
            sentence_start: text.indexOf(m.sentence),
          };
        }
        return undefined;
      }).filter(Boolean);
    } catch (err) {
      console.log(err);
      return [];
    }
  }

  public static classifyTypeGramma(rule:any) {
    const category = rule?.category?.id?.toLowerCase() || '';
    return category;
  }

  public async check(text: string) {
    const editorData = await this.saplingEditOverview(text);
    return editorData;
  }
}

export const sapling = new GrammarChecker();

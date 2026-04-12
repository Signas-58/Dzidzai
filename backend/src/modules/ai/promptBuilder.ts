import fs from 'fs';
import path from 'path';
import { AIGenerateRequest } from './types';

interface FewShotExample {
  input: AIGenerateRequest;
  output: unknown;
}

interface PromptTemplateFile {
  system: string;
  userTemplate: string;
  fewShot: FewShotExample[];
}

const templatePath = path.join(__dirname, 'prompts', 'generate.json');

function loadTemplate(): PromptTemplateFile {
  const raw = fs.readFileSync(templatePath, 'utf8');
  return JSON.parse(raw) as PromptTemplateFile;
}

function render(template: string, params: Record<string, string>): string {
  return Object.entries(params).reduce(
    (acc, [key, value]) => acc.split(`{{${key}}}`).join(value),
    template
  );
}

export class PromptBuilder {
  static buildGeneratePrompt(input: AIGenerateRequest, options?: { contextText?: string }): {
    system: string;
    user: string;
    fewShot: Array<{ role: 'user' | 'assistant'; content: string }>;
  } {
    const tpl = loadTemplate();

    const contextBlock = options?.contextText
      ? `\n\nUse the following curriculum context when generating your answer:\n${options.contextText}\n\nEnd of context.\n`
      : '';

    const fewShot = tpl.fewShot.flatMap((ex) => {
      const user = render(tpl.userTemplate, {
        subject: ex.input.subject,
        topic: ex.input.topic,
        gradeLevel: ex.input.gradeLevel,
        language: ex.input.language,
        contextBlock: '',
      });

      const assistant = JSON.stringify(ex.output);

      return [
        { role: 'user' as const, content: user },
        { role: 'assistant' as const, content: assistant },
      ];
    });

    const user = render(tpl.userTemplate, {
      subject: input.subject,
      topic: input.topic,
      gradeLevel: input.gradeLevel,
      language: input.language,
      contextBlock,
    });

    return {
      system: tpl.system,
      user,
      fewShot,
    };
  }
}

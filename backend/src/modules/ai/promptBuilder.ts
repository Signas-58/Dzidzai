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

function difficultyHintForGrade(gradeLevel: AIGenerateRequest['gradeLevel']): string {
  const early = gradeLevel === 'ECD A' || gradeLevel === 'ECD B' || gradeLevel === 'Grade 1' || gradeLevel === 'Grade 2';
  const mid = gradeLevel === 'Grade 3' || gradeLevel === 'Grade 4' || gradeLevel === 'Grade 5';
  if (early) {
    return 'Difficulty: VERY SIMPLE. Use very short sentences, simple words, and a small number of steps. Avoid long paragraphs.';
  }
  if (mid) {
    return 'Difficulty: MODERATE. Use simple explanations with 1–2 short paragraphs and clear everyday examples.';
  }
  return 'Difficulty: DETAILED. Explain reasoning step-by-step, include why it works, and use a richer example while staying grade-appropriate.';
}

function improveHint(improve?: boolean): string {
  if (!improve) return '';
  return 'Improve mode: Rewrite the explanation to be clearer. Simplify any difficult parts. Add one extra example (in addition to the example field).';
}

function modeHint(input: AIGenerateRequest): string {
  if (input.mode === 'simplify') {
    return 'Mode: SIMPLIFY. Use very simple language, short sentences, and avoid technical terms.';
  }
  if (input.mode === 'translate') {
    const to = input.translateTo || input.language;
    return `Mode: TRANSLATE. Translate the explanation and example into ${to}. Preserve meaning and educational clarity. Set the output language field to ${to}.`;
  }
  return '';
}

export class PromptBuilder {
  static buildGeneratePrompt(input: AIGenerateRequest, options?: { contextText?: string }): {
    system: string;
    user: string;
    fewShot: Array<{ role: 'user' | 'assistant'; content: string }>;
  } {
    const tpl = loadTemplate();

    const difficultyHint = difficultyHintForGrade(input.gradeLevel);
    const improveMode = [improveHint(input.improve), modeHint(input)].filter(Boolean).join(' ');

    const contextBlock = options?.contextText
      ? `\n\nUse the following curriculum context when generating your answer:\n${options.contextText}\n\nEnd of context.\n`
      : '';

    const fewShot = tpl.fewShot.flatMap((ex) => {
      const user = render(tpl.userTemplate, {
        subject: ex.input.subject,
        topic: ex.input.topic,
        gradeLevel: ex.input.gradeLevel,
        language: ex.input.language,
        difficultyHint: difficultyHintForGrade(ex.input.gradeLevel),
        improveMode: '',
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
      difficultyHint,
      improveMode,
      contextBlock,
    });

    return {
      system: tpl.system,
      user,
      fewShot,
    };
  }
}

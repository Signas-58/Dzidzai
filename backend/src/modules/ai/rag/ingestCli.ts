import { RagIngestionService } from './ingest';

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const filePath = args[0];
  const subject = args[1] as any;
  const topic = args[2];

  if (!filePath || !subject) {
    // eslint-disable-next-line no-console
    console.error('Usage: ts-node src/modules/ai/rag/ingestCli.ts <filePath> <subject> [topic]');
    process.exit(1);
  }

  const res = await RagIngestionService.ingestFile({
    filePath,
    subject,
    topic,
    source: 'cli',
  });

  // eslint-disable-next-line no-console
  console.log(JSON.stringify(res));
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error(err);
  process.exit(1);
});

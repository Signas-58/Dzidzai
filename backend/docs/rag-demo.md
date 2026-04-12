# DzidzaAI RAG Demo

## Ingest a curriculum document

### API (upload)
`POST /api/ai/rag/ingest`

- form-data
  - `file`: (PDF or txt)
  - `subject`: `Math | English | Science | Social Studies`
  - `topic`: optional string

Example (PowerShell):

```powershell
$form = @{ subject = 'Math'; topic = 'Addition' }
Invoke-RestMethod -Method Post -Uri 'http://localhost:5000/api/ai/rag/ingest' -Form $form -InFile '.\\curriculum.txt'
```

### CLI

```bash
npx ts-node src/modules/ai/rag/ingestCli.ts path/to/curriculum.pdf Math "Addition"
```

## Generate with RAG

`POST /api/ai/generate`

```json
{
  "subject": "Math",
  "topic": "Addition",
  "gradeLevel": "Grade 2",
  "language": "Shona"
}
```

### Example logs

- RAG retrieval:
  - logs `used: true/false`
  - logs top chunks with `id` and `score`

- Generation:
  - prompt log includes `fewShotCount`
  - mock fallback logs when quota/rate-limit triggers

## Notes

- Vector store is persisted to `backend/data/rag-store.json`.
- If no relevant chunks exist, generation proceeds without RAG context.

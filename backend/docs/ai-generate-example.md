# DzidzaAI AI Orchestration - Generate Endpoint

## Endpoint
`POST /api/ai/generate`

## Example Request

```json
{
  "subject": "Math",
  "topic": "Addition",
  "gradeLevel": "Grade 2",
  "language": "Shona"
}
```

## Example Success Response

```json
{
  "success": true,
  "data": {
    "explanation": "...",
    "example": "...",
    "practice_questions": [
      {
        "question": "...",
        "hint": "...",
        "answer": "..."
      }
    ],
    "language": "Shona",
    "gradeLevel": "Grade 2",
    "confidenceScore": 0.78
  }
}
```

## Validation / Rejection

- If the model returns invalid JSON, response is `422`.
- If `confidenceScore < AI_MIN_CONFIDENCE` (default `0.6`), response is `422`.
- If language consistency check fails, response is `422`.

## Environment Variables

- `GROQ_API_KEY` (required)
- `GROQ_MODEL` (optional, default `llama-3.3-70b-versatile`)
- `AI_MIN_CONFIDENCE` (optional, default `0.6`)

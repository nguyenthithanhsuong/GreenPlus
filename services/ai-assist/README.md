# GreenPlus AI Assist

FastAPI implements server-to-server forecasting, knowledge retrieval, recipe ranking, complaint triage, and promotion recommendations. These operations never authenticate end-users and must only be called by authorized GreenPlus backend API routes. All requests must contain a cryptographically strong `X-AI-Service-Key`; `AI_SERVICE_KEY` must match `GREENPLUS_AI_SERVICE_KEY` in Next.js server environments.

`python -m pip install -r requirements.txt`, then `AI_SERVICE_KEY=<32+ characters> uvicorn app.main:app --port 8100`. For tests: `python -m pytest tests -q`. In production run behind a private network or mTLS gateway; never publish its port directly. No API key is required for `/health`.

The Ridge demand model is fitted to the supplied store's daily order history and evaluated on a held-out time slice. If there is insufficient history it reports `moving-median` or `no-history`, low confidence and does not claim a trained forecast. Chat answers default to retrieval from approved store knowledge and may be paraphrased by a configured HTTPS OpenAI-compatible Chat Completions provider; recipe ranking uses curated templates; complaint categorization uses transparent rules. These fallbacks are explicitly labeled rather than pretending an LLM or a fully trained model is available.

`AI_LLM_URL`, `AI_LLM_KEY` and `AI_LLM_MODEL` optionally configure an HTTPS OpenAI-compatible Chat Completions endpoint; all unset means pure retrieval. Provider errors fall back to cited retrieval. The model cannot initiate database writes or tool calls.

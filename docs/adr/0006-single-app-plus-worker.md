# Single app plus worker

Orqent will start as a single deployable web/API app plus a separate worker process from the same monorepo. The web/API process owns UI, internal RPC, webhook ingestion, and auth/session handling, while the worker owns workflow execution, provider calls, retries, reconciliation, and scheduled jobs.

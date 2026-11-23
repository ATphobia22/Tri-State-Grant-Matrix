# Evaluated open-source AI and government-source data tooling
Research checked: 2026-11-23. GitHub repositories and license metadata were fetched from the actual project pages. Popularity statistics are deliberately omitted because they change. None of these third-party projects has been automatically installed merely because it appears below.

## Engineering decision for the grant system

Use the existing Python FastAPI, PostgreSQL, worker and GitHub Actions stack as the only production data authority. Add optional, isolated helpers for model metadata and public audit exports. Do not add multiple LLM inference engines, agent frameworks, or consumer voice/chat UIs to the public runtime. Do not expose database credentials, grant applicant drafts or any model inference token to GitHub Pages.

### Repositories that help directly

| Project | Verified public repo | How to use it | Status |
| --- | --- | --- | --- |
| Qwen3.8 official | https://github.com/QwenLM/Qwen3.8 | Official model guidance; Qwen/Qwen3.8-27B on Hugging Face for optional structured NOFO candidate extraction | Registered; no weight download |
| Gemma 4 official model | https://huggingface.co/google/gemma-4-31B-it | Optional visual page inspection for scanned county PDFs and tables | Registered; no vision worker installed |
| Qwen embeddings | https://huggingface.co/Qwen/Qwen3-Embedding-8B | Optional 4096-dimensional vectors for hybrid grant retrieval | Registered; optional pgvector schema only |
| Hugging Face Hub | https://github.com/huggingface/huggingface_hub | Read-only model repo revision/Apache-2.0 license verification | Optional requirements file and backend/model_registry.py implemented |
| Hugging Face Datasets | https://github.com/huggingface/datasets | Export source-check and discovery metadata as JSONL/Parquet for offline QA/analytics | Optional requirements file and backend/export_audit.py implemented |
| Unsloth | https://github.com/unslothai/unsloth | Optional GGUF/local fine-tuning experiments after establishing an evaluated gold-standard NOFO benchmark | Deferred: unnecessary training for the 101 curated pathways |
| ms-swift | https://github.com/modelscope/ms-swift | Alternative fine-tuning implementation when a benchmark justifies training | Deferred |
| HyperQwen | https://github.com/syv-ai/HyperQwen | Performance-oriented Qwen serving, requires independently verified GPU support | Deferred; do not claim 24-GB hardware guarantees |
| Hugging Face huggingface.js | https://github.com/huggingface/huggingface.js | Useful if later adding a carefully secured JS-based HF workflow | Deferred: browser must not carry model secrets |
| Daft | https://github.com/Eventual-Inc/Daft | Streaming and multimodal data processing when collection becomes much larger | Deferred: excessive for 12 archive indexes |
| Docling | https://github.com/docling-project/docling | Second-stage PDF structure/table extraction, with citation and exact-page validation | Recommended for a separately tested document worker, not installed |
| changedetection.io | https://github.com/dgtlmoon/changedetection.io | Dynamic site/PDF change monitoring when stdlib HTTP indexes miss documents | Recommended if dedicated monitoring hosting is available |

### Other user-provided repositories inspected

| Project | Use-case conclusion |
| --- | --- |
| https://github.com/Niko1221/Strata | Valid local model server, but redundant with a selected existing OpenAI-compatible inference endpoint |
| https://github.com/simplexai-labs/PolyStrata | Alternative inference runtime; do not install alongside Strata without benchmarking |
| https://github.com/Michael-A-Kuykendall/shimmy | Rust/WebGPU inference option; hardware/precision tests required before serving official notices |
| https://github.com/noonghunna/club-3090 | Hardware serving recipes, not a production audit engine |
| https://github.com/jaredpalmer/kev | Decision-model experiments, not authoritative source extraction |
| https://github.com/peonist-ai/halogen-flash-server | AMD-oriented serving; license reported NOASSERTION, verify before incorporation |
| https://github.com/synchopate/llama-modchip | CPU inference experiments; not relevant to daily government HTTP checks |
| https://github.com/drumih/turbo-fieldfare | Apple Silicon Gemma inference; not a Linux hosting requirement |
| https://github.com/mattmireles/gemma-tuner-multimodal | Apple Silicon fine-tuning workflow; deferred |
| https://github.com/ammaarreshi/gemma-chat | Consumer chat client, duplicate UI for this application |
| https://github.com/nicedreamzapp/claude-code-local | Coding assistant, not a government record pipeline |
| https://github.com/nico-martin/gemma4-browser-extension | Consumer browser agent; poor fit for traceable server-side ingestion |
| https://github.com/agents-io/PokeClaw | Android automation; not necessary for a responsive no-login site |
| https://github.com/kessler/gemma-gem | Browser-local WebGPU experiments, not server-side grant verification |
| https://github.com/MakazhanAlpamys/Soup | Resource-conscious fine-tuning; defer until labeled reference datasets exist |
| https://github.com/intel/ipex-llm | Archived repository; do not adopt as a new critical dependency |
| https://github.com/kyegomez/swarms | General multi-agent orchestration, unnecessary complexity for government record audits |
| https://github.com/amazon-science/chronos-forecasting | Forecasting research; irrelevant to official grant deadline truth |
| https://github.com/skorch-dev/skorch | ML training wrapper; not needed |
| https://github.com/baichuan-inc/Baichuan-7B | Model weights, not an audit engine |
| https://github.com/obss/sahi | Sliced computer vision inference; not a primary PDF meeting minutes parser |
| https://github.com/huggingface/chat-ui | Standalone chat front end, not needed alongside the public civic site |
| https://github.com/Orchestra-Research/AI-Research-SKILLs | Reference skills for engineering/research, not validated authority for grant rules |
| https://github.com/langchain4j/langchain4j | Java LLM application framework, mismatched to the Python deployment |
| https://github.com/debpalash/VoiceStudio | Local speech/voice stack with AGPL-3.0: license review and use-case evaluation needed |
| https://github.com/huggingface/agents-course | Educational course; no production ingestion code to install |

### Evidence-first processing policy

1. Source registry allows official federal and state grant portals and county meeting archives, with exact nine-county FIPS codes. A source or model URL must never be selected from arbitrary user input.
2. Daily scheduled monitoring records UTC check times, source URL, response status, content digest and detected link/content changes. An HTTP 403, a timeout or missing index link is not proof of a government-record withdrawal.
3. Preserve first-party NOFO PDFs and explicit page markers before AI use. The AI candidate must return verbatim quote, exact page/section locator, model name and origin source SHA-256. No quote means UNVERIFIED.
4. Human approval remains separate from AI output and from a matched quote. Neither model nor agent may directly rewrite program eligibility, cost-share, awards or official deadlines.
5. Protect reproducibility by recording official model repo IDs and resolved commit SHAs; upgrades require new tests. Metadata verification does not download weights, install training runtimes or prove output quality.
6. The optional public dataset export contains source-check receipts and discoverable federal opportunity metadata only. It excludes applicant drafts, login information, internal operator secrets and private application files.
7. Scheduled jobs run on the repo regardless of visitor traffic. The private server worker runs every six hours only on a deployed, connected and persisted database. GitHub Pages alone cannot host PostgreSQL.

Reproduction:
- python -m backend.model_registry (prints static model options; no network or inference)
- python -m pip install -r backend/requirements-optional-ai.txt (operator opt-in)
- python -m backend.model_registry --verify (query Hugging Face model cards for SHA/license)
- python -m backend.export_audit --table checks --out exports/checks.jsonl (requires configured PostgreSQL)
- python -m backend.export_audit --table opportunities --out exports/discoveries.jsonl --parquet (optional datasets import)

"""Evidence gate: quote must occur on the asserted source page, not just in model output."""
import re
import json
import os
import httpx

PAGE_MARKER=re.compile(r"(?im)^\s*\[page\s+(\d+)\]\s*$")

def verify_quote(source_text: str, quote: str, locator: str):
    quote_found=bool(quote.strip()) and quote in source_text
    match=re.fullmatch(r"page\s+(\d+)",locator.strip(),flags=re.I)
    if not match or not quote_found:
        return quote_found,False
    target=match.group(1)
    chunks=PAGE_MARKER.split(source_text)
    for i in range(1,len(chunks),2):
        if chunks[i]==target and quote in chunks[i+1]:
            return True,True
    return quote_found,False

def model_candidate_extract(source_text:str,model:str|None=None):
    """Optional compatible inference server. Never publishes or approves its output automatically.

    The operator must explicitly set LLM_BASE_URL and LLM_API_KEY; no network model dependency
    exists in the public app. Only operator-controlled documents should be sent to the model.
    """
    url=os.getenv("LLM_BASE_URL","").rstrip("/")
    if not url:
        raise RuntimeError("No inference provider configured")
    if not url.startswith("https://") and not url.startswith("http://localhost:"):
        raise ValueError("LLM endpoint must use HTTPS or operator-local loopback")
    model=model or os.getenv("LLM_MODEL","Qwen/Qwen3.8-27B")
    headers={"Content-Type":"application/json"}
    if os.getenv("LLM_API_KEY"):
        headers["Authorization"]="Bearer "+os.environ["LLM_API_KEY"]
    prompt=("Extract funding eligibility, application deadline, required local matching funds "
            "and permitted applicant entities ONLY when an exact citation exists. "
            "Return JSON with 'claims' array. Each claim must have field_name, "
            "extracted_value, verbatim_quote copied exactly, and page_locator such as "
            "'page 3'. If not stated, omit the claim. No inferred facts. "
            "Pages appear in text as [page N] markers.\n\n"+source_text[:150000])
    response=httpx.post(url+"/chat/completions",headers=headers,
        json={"model":model,"temperature":0,
              "messages":[{"role":"user","content":prompt}],
              "response_format":{"type":"json_object"}},
        timeout=120)
    response.raise_for_status()
    data=json.loads(response.json()["choices"][0]["message"]["content"])
    if not isinstance(data,dict) or not isinstance(data.get("claims"),list):
        raise ValueError("Model did not return valid candidate schema")
    return data

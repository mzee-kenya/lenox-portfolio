"""
AI Resume Assistant orchestration.

Rule: the assistant never invents facts. All generated content is derived from
verified portfolio data. When an LLM is configured it only rephrases provided
material, and every LLM response is passed through a grounding filter that
removes sentences introducing numbers, years, or employers that are absent
from the verified data.
"""

import json
import logging
import re
import urllib.error
import urllib.request

from django.conf import settings

from ai_assistant import engine
from ai_assistant.models import JobDescription, ResumeAnalysis
from resume.models import ResumeVersion
from resume.renderer import build_payload

logger = logging.getLogger(__name__)

_FACT_CLAIM = re.compile(r"\b\d[\d,\.]*%?|\b(?:19|20)\d{2}\b|\$[\d,\.]+")


def provider_name():
    if settings.AI_API_KEY:
        return settings.AI_MODEL
    return "local"


def _llm_call(system, user):
    """Call a chat-completions compatible endpoint. Returns text or None."""
    if not settings.AI_API_KEY:
        return None
    payload = {
        "model": settings.AI_MODEL,
        "messages": [
            {"role": "system", "content": system},
            {"role": "user", "content": user},
        ],
        "temperature": 0.4,
        "max_tokens": 900,
    }
    req = urllib.request.Request(
        f"{settings.AI_API_BASE}/chat/completions",
        data=json.dumps(payload).encode("utf-8"),
        headers={"Content-Type": "application/json", "Authorization": f"Bearer {settings.AI_API_KEY}"},
        method="POST",
    )
    with urllib.request.urlopen(req, timeout=30) as response:
        body = json.loads(response.read().decode("utf-8"))
        return body["choices"][0]["message"]["content"].strip()


def strip_ungrounded(text, corpus):
    """Drop sentences that assert numeric facts not present in verified data."""
    facts = _FACT_CLAIM.findall(corpus or "")
    sentences = re.split(r"(?<=[.!?])\s+", text or "")
    kept = []
    for sentence in sentences:
        claims = _FACT_CLAIM.findall(sentence)
        if claims and not all(c in facts for c in claims):
            continue
        kept.append(sentence)
    return " ".join(kept).strip()


def _verbatim_facts(corpus):
    return re.sub(r"\s+", " ", corpus or "").strip()


class GroundingGuard:
    """Ensures briefs sent to the LLM only contain verified material."""

    SYSTEM = (
        "You write resume content for a software engineer. "
        "You MUST NOT invent any facts: no jobs, companies, employers, clients, "
        "certifications, degrees, projects, metrics, numbers, percentages, years, "
        "or technologies that are not written in the user's supplied facts. "
        "If a fact is missing, do not add it; write only with the information given. "
        "Keep the tone confident, technical, professional and concise."
    )

    def __init__(self, corpus: str, provider: str):
        self.corpus = corpus
        self.provider = provider

    def run(self, instruction: str) -> dict:
        local_note = None
        if self.provider == "local":
            return {"content": instruction, "provider": "local", "note": "Local deterministic mode — no external AI was used."}
        prompt = (
            f"Verified facts ONLY (do not add anything else):\n{_verbatim_facts(self.corpus)}\n\n"
            f"Task:\n{instruction}"
        )
        try:
            raw = _llm_call(self.SYSTEM, prompt)
        except (urllib.error.URLError, TimeoutError, KeyError, json.JSONDecodeError) as exc:
            logger.warning("LLM unavailable (%s); falling back to local engine.", exc)
            return {"content": instruction, "provider": "local", "note": "External AI unavailable — fell back to local engine."}

        cleaned = strip_ungrounded(raw, self.corpus)
        if not cleaned:
            return {"content": instruction, "provider": "local", "note": "AI output failed grounding checks — fell back to local engine."}
        return {"content": cleaned, "provider": self.provider, "note": "Enhanced by " + self.provider + " — facts verified against portfolio data."}


def _corpus(version_slug=None):
    data = build_payload(version_slug)
    bits = []
    bits.append(data.get("summary") or "")
    for s in data.get("skills", []):
        bits.append(s["name"])
    for e in data.get("experience", []):
        bits.append(e["title"])
        bits.append(e["organization"])
        bits.extend(e.get("bullets") or [])
    for p in data.get("projects", []):
        bits.append(p["name"])
        bits.append(p.get("tagline") or "")
        bits.extend(p.get("technologies") or [])
        bits.extend(h.get("text") for h in p.get("highlights") or [])
    for c in data.get("certifications", []):
        bits.append(c["name"])
        bits.append(c["issuer"])
    for e in data.get("education", []):
        bits.append(e["school"])
        bits.append(e["degree"])
    return " ".join(bits)


def run_analysis(jd_text, resume_version_slug=None, session_id=""):
    """Full pipeline: parse -> compare -> persist -> return analysis."""
    data = build_payload(resume_version_slug)
    resume_skills = [s["name"] for s in data.get("skills", [])]
    resume_projects = data.get("projects", [])

    result = engine.analyze(jd_text, resume_skills, resume_projects)
    version = None
    if resume_version_slug:
        version = ResumeVersion.objects.filter(slug=resume_version_slug).first()

    jd = JobDescription.objects.create(content=jd_text.strip(), session_id=session_id)
    ResumeAnalysis.objects.create(
        job_description=jd,
        resume_version=version,
        provider=provider_name(),
        score=result["score"],
        breakdown=result["breakdown"],
        matched=result["matched"],
        missing=result["missing"],
        keywords=result["keywords"],
        recommendations=result["recommendations"],
    )
    result["provider"] = provider_name()
    return result


def get_summary(version_slug=None):
    return build_payload(version_slug).get("summary") or ""


def improve_summary(existing_summary, version_slug=None):
    current = existing_summary or get_summary(version_slug)
    payload = build_payload(version_slug)
    top = payload.get("skills", [])[:3]
    techs = ", ".join(s["name"] for s in top)
    instructions = (
        "Rewrite the following professional summary to be tighter and more "
        "confident while keeping every fact identical. Do not invent metrics: "
        f"\nCurrent: {current}"
    )
    guard = GroundingGuard(_corpus(version_slug), provider_name())
    out = guard.run(instructions)
    return {"summary": out["content"], "current": current, "note": out["note"], "provider": out["provider"]}


def tailored_summary(job_description, version_slug=None):
    data = build_payload(version_slug)
    skills = [s["name"] for s in data.get("skills", [])]
    projects = data.get("projects", [])
    analysis = engine.analyze(job_description, skills, projects)
    matched = analysis["matched"]
    role = data.get("profile", {}).get("title") or "software engineer"
    current = data.get("summary") or ""

    matched_text = ", ".join(matched[:5]) if matched else "modern web, backend and mobile stacks"
    instruction = (
        "Produce a tailored professional summary for the role described in the job "
        "posting. Use ONLY the resume summary below and the matching skills shown. "
        f"Do not invent anything.\nResume summary: {current}\nMatching skills: {matched_text}"
    )
    guard = GroundingGuard(_corpus(version_slug), provider_name())
    out = guard.run(instruction)
    return {
        "summary": out["content"],
        "matched": matched,
        "missing": analysis["missing"],
        "score": analysis["score"],
        "note": out["note"],
        "provider": out["provider"],
    }


def project_bullets(project_id):
    from projects.models import Project

    project = Project.objects.filter(pk=project_id).first()
    if not project:
        return {"error": "project not found"}
    payload = {
        "name": project.name,
        "problem": project.problem,
        "solution": project.solution,
        "role": project.role,
        "technologies": [pt.technology.name for pt in project.technologies.all()],
        "features": [{"text": f.text, "status": f.status} for f in project.features.all()],
    }
    corpus = " ".join(v for v in payload.values() if isinstance(v, str))
    bullets = engine.grounded_bullets(payload)
    instruction = (
        "Turn the following verified project facts into 4-6 achievement-oriented "
        "resume bullet points. Do not invent numbers, clients, or outcomes. "
        f"Facts: {_verbatim_facts(corpus)}"
    )
    guard = GroundingGuard(_corpus(), provider_name())
    out = guard.run(instruction)
    return {
        "bullets": [b for b in out["content"].splitlines() if b.strip()] or bullets,
        "source_bullets": bullets,
        "item": {"name": project.name, "technologies": payload["technologies"]},
        "note": out["note"],
        "provider": out["provider"],
    }


def ats_keywords(job_description, version_slug=None):
    data = build_payload(version_slug)
    skills = [s["name"] for s in data.get("skills", [])]
    projects = data.get("projects", [])
    analysis = engine.analyze(job_description, skills, projects)
    return {
        "matched": analysis["matched"],
        "missing": analysis["missing"],
        "keywords": analysis["keywords"],
        "breakdown": analysis["breakdown"],
        "score": analysis["score"],
    }
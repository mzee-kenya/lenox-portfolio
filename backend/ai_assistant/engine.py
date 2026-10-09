"""
Deterministic matching engine for "Match My Resume".

This engine ships with the app so the feature always works without an external
AI provider. It extracts skills from a job description and compares them to the
verified skills and project technologies in the resume data. The reported score
is an estimate of keyword overlap — never an employer's real ATS score.
"""

import re

# Canonical skill term -> aliases/phrases that commonly appear in job posts.
SKILL_ALIASES = {
    "react": ["react", "react.js", "reactjs", "frontend"],
    "typescript": ["typescript", "ts"],
    "javascript": ["javascript", "js", "ecmascript"],
    "python": ["python"],
    "django": ["django", "drf", "django rest", "django rest framework"],
    "rest api": ["rest", "rest api", "restful", "rest apis", "api"],
    "postgresql": ["postgresql", "postgres", "psql"],
    "sqlite": ["sqlite"],
    "sql": ["sql", "mysql", "database"],
    "react native": ["react native", "react-native", "expo", "mobile"],
    "expo": ["expo"],
    "git": ["git", "github", "version control"],
    "github": ["github"],
    "npm": ["npm"],
    "html": ["html", "html5"],
    "css": ["css", "css3", "scss", "sass"],
    "responsive design": ["responsive", "mobile-first", "cross-platform"],
    "django orm": ["orm", "queryset", "models"],
    "authentication": ["authentication", "auth", "jwt", "login"],
    "role-based access": ["role", "roles", "permissions", "rbac", "access control"],
    "system design": ["system design", "architecture", "scalability", "distributed"],
    "api design": ["api design", "endpoints", "microservices"],
    "offline-first": ["offline", "offline-first", "offline first", "local-first", "sync"],
    "testing": ["testing", "tests", "pytest", "unit test", "tdd"],
    "debugging": ["debugging", "debug", "troubleshoot"],
    "database design": ["database design", "schema", "data modeling", "normalization"],
    "linux": ["linux", "ubuntu", "bash", "terminal"],
    "docker": ["docker", "container"],
    "oop": ["oop", "object oriented"],
    "fastapi": ["fastapi"],
    "node": ["node", "node.js", "express"],
    "tailwind": ["tailwind"],
    "vite": ["vite"],
    "redux": ["redux", "state management"],
    "rest framework": ["drf"],
    "go": ["go", "golang"],
    "kubernetes": ["kubernetes", "k8s"],
    "terraform": ["terraform"],
    "aws": ["aws", "amazon web services", "s3", "ec2"],
    "mongodb": ["mongodb", "mongo"],
    "redis": ["redis"],
    "graphql": ["graphql"],
    "flask": ["flask"],
    "vue": ["vue", "vue.js"],
    "angular": ["angular", "angularjs"],
    "svelte": ["svelte"],
    "next.js": ["next.js", "nextjs", "next"],
    "redux": ["redux", "state management"],
    "webpack": ["webpack"],
    "ci cd": ["ci", "cd", "cicd", "continuous integration"],
    "cloud": ["cloud", "heroku", "railway", "vercel"],
}

_CATEGORIES = {
    "frontend": {"react", "javascript", "typescript", "html", "css", "responsive design", "redux", "tailwind", "vite"},
    "backend": {"python", "django", "rest api", "fastapi", "node", "django orm"},
    "database": {"postgresql", "sqlite", "sql", "database design"},
    "mobile": {"react native", "expo"},
    "engineering": {"authentication", "role-based access", "system design", "api design", "offline-first", "testing", "debugging", "oop", "docker", "linux"},
}


def normalize(text):
    text = (text or "").lower()
    text = re.sub(r"[^a-z0-9\- ]+", " ", text)
    return re.sub(r"\s+", " ", text)


def extract_skills(jd_text, vocabulary):
    """Return the recognized skills requested by a job description.

    Aliases are matched on word boundaries so "orm" cannot match inside
    "terraform" or "api" inside "rapid".
    """
    jd = normalize(jd_text)
    found = []
    for skill in vocabulary:
        aliases = SKILL_ALIASES.get(skill.lower(), [skill.lower(), skill.lower().replace("-", " ")])
        for alias in aliases:
            pattern = r"\b" + re.escape(alias) + r"\b"
            if re.search(pattern, jd):
                found.append(skill)
                break
    return found


def category_of(skill):
    for category, members in _CATEGORIES.items():
        if skill.lower() in members or skill.lower().startswith(tuple(m for m in members)):
            return category
    return "engineering"


def analyze(jd_text, resume_skills, resume_projects):
    """
    Return a full match analysis.

    resume_skills: list of skill names (from verified resume data)
    resume_projects: list of project dicts with a 'technologies' list
    """
    jd = normalize(jd_text)
    if not jd:
        raise ValueError("job description is empty")

    vocabulary = [s.lower() for s in resume_skills]
    owned = set(vocabulary)
    candidates = sorted(set(vocabulary) | set(SKILL_ALIASES.keys()))
    requested = extract_skills(jd_text, candidates)
    requested = sorted(set(requested))

    matched = sorted({s for s in requested if s in owned or _in_projects(s, resume_projects)})
    missing = sorted(set(requested) - set(matched))

    # Collapse singular/plural twins ("rest api" vs owned "rest apis"): do not
    # penalize a term that is exactly a prefix of a skill we already own.
    collapsed = [s for s in requested if not (s in missing and any(s != o and o.startswith(s) for o in owned))]
    if collapsed != requested:
        requested = collapsed
        matched = sorted({s for s in requested if s in owned or _in_projects(s, resume_projects)})
        missing = sorted(set(requested) - set(matched))

    breakdown = {}
    for category in _CATEGORIES:
        req_in_cat = [s for s in requested if category_of(s) == category]
        if not req_in_cat:
            breakdown[category] = {"requested": 0, "matched": 0, "score": None}
            continue
        hit = [s for s in req_in_cat if s in matched]
        breakdown[category] = {
            "requested": len(req_in_cat),
            "matched": len(hit),
            "score": round(len(hit) / len(req_in_cat) * 100),
        }

    active = {k: v for k, v in breakdown.items() if v["requested"] > 0}
    total = sum(v["score"] for v in active.values()) / len(active) if active else 0
    overall = round(total)

    # ATS-style keyword suggestions: synonyms / related phrases to include.
    keywords = []
    for skill in missing:
        aliases = SKILL_ALIASES.get(skill.lower(), [skill.lower()])
        keywords.extend(aliases)
    keywords = sorted(set(keywords))

    recommendations = _recommendations(missing, matched, breakdown)
    return {
        "score": overall,
        "breakdown": breakdown,
        "matched": matched,
        "missing": missing,
        "keywords": keywords,
        "recommendations": recommendations,
        "band": _band(overall),
        "note": "This is an estimate of keyword overlap between a job description and your resume, not an employer's actual ATS score.",
    }


def _in_projects(skill, projects):
    for project in projects:
        techs = [t.lower() for t in (project.get("technologies") or [])]
        if skill.lower() in techs:
            return True
    return False


def _recommendations(missing, matched, breakdown):
    recs = []
    if missing:
        recs.append(f"Add clear mentions of {', '.join(missing[:4])} where honest in your skills and project descriptions.")
    if matched:
        recs.append("Your strongest overlap is " + ", ".join(matched[:3]) + ". Surface these near the top of your resume.")
    for category, data in breakdown.items():
        if data.get("score") is not None and data["score"] < 60:
            recs.append(f"Strengthen the {category} section — the role asks for {data['requested']} related skills and you matched {data['matched']}.")
    if not recs:
        recs.append("Add more detail to your project descriptions so keywords match the role naturally.")
    return recs


def _band(score):
    if score >= 80:
        return "strong"
    if score >= 60:
        return "good"
    if score >= 40:
        return "fair"
    return "low"


def grounded_bullets(project):
    """Generate truthful bullet points from verified project fields only."""
    bullets = []
    name = project.get("name") or "this project"
    if project.get("solution"):
        bullets.append(f"Built {name.lower()} to {project['solution']}")
    if project.get("problem"):
        bullets.append(f"Addressed the problem of {_trim(project['problem'])}")
    if project.get("role"):
        bullets.append(f"Owned the {_trim(project['role'], 80)} workstream end to end")
    for feature in project.get("features") or []:
        status = feature.get("status")
        if status in {"implemented", "in_progress"} or status is None:
            verb = "Built" if status == "implemented" or status is None else "Working on"
            bullets.append(f"{verb} {feature.get('text','').lower().rstrip('.')} and integrated it with the rest of the system")
    return bullets[:6]


def _trim(text, limit=90):
    text = (text or "").strip()
    return text if len(text) <= limit else text[: limit - 3].rstrip() + "…"
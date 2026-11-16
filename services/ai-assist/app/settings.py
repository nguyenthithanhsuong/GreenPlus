import os
from dataclasses import dataclass

@dataclass(frozen=True)
class Settings:
    service_key: str
    llm_url: str
    llm_key: str
    llm_model: str

    @classmethod
    def load(cls):
        return cls(
            os.environ.get("AI_SERVICE_KEY", ""),
            os.environ.get("AI_LLM_URL", ""),
            os.environ.get("AI_LLM_KEY", ""),
            os.environ.get("AI_LLM_MODEL", ""),
        )

settings = Settings.load()

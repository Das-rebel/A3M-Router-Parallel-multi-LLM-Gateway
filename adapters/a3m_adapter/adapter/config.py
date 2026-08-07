"""
Configuration management for A3M Router adapters.

Provides settings for:
- Default model selection strategy
- Cost optimization thresholds
- Parallel ensemble settings
- Provider priority lists

Usage:
    from a3m_adapter_config import A3MConfig
    
    config = A3MConfig.from_file("a3m_config.yaml")
    llm = A3MChatModel(**config.to_dict())
"""

from __future__ import annotations

import json
import logging
from dataclasses import dataclass, field, asdict
from typing import Any, Dict, List, Optional, Union

logger = logging.getLogger(__name__)


@dataclass
class A3MConfig:
    """Configuration for A3M Router adapters."""

    # Model selection
    model: str = "auto"
    
    # Sampling parameters
    temperature: float = 0.0
    max_tokens: Optional[int] = 4096
    top_p: float = 1.0
    frequency_penalty: float = 0.0
    presence_penalty: float = 0.0

    # Routing strategy
    parallel_ensemble: int = 1
    fallback_enabled: bool = True
    cost_threshold: float = 0.05  # Max $ per 1k tokens
    
    # Provider preferences (highest priority first)
    preferred_providers: List[str] = field(default_factory=lambda: [
        "openai", "anthropic", "google", "azure_openai", 
        "azure_ais", "litellm", "groq", "together"
    ])
    
    # Excluded providers (never use)
    excluded_providers: List[str] = field(default_factory=lambda: [])
    
    # API configuration
    api_endpoint: str = "http://localhost:8787/v1"
    api_key: Optional[str] = None

    # Budget controls
    monthly_budget_usd: Optional[float] = None
    daily_budget_usd: Optional[float] = None

    @classmethod
    def from_file(cls, path: str) -> "A3MConfig":
        """Load configuration from YAML file."""
        try:
            import yaml
            with open(path, 'r') as f:
                data = yaml.safe_load(f)
            return cls(**data)
        except ImportError:
            logger.warning("PyYAML not installed, using JSON")
            return cls.from_json(path)

    @classmethod
    def from_json(cls, path: str) -> "A3MConfig":
        """Load configuration from JSON file."""
        with open(path, 'r') as f:
            data = json.load(f)
        return cls(**data)

    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary."""
        return asdict(self)

    def to_json(self, path: Optional[str] = None) -> Optional[str]:
        """Convert to JSON string or save to file."""
        data = json.dumps(self.to_dict(), indent=2)
        if path:
            with open(path, 'w') as f:
                f.write(data)
        return data

    def update_budget_limits(self, remaining_usd: float) -> None:
        """Update budget limits based on remaining funds."""
        if self.daily_budget_usd is not None:
            remaining_pct = remaining_usd / self.daily_budget_usd
            if remaining_pct < 0.1:
                logger.warning("Low daily budget: %s remaining", remaining_usd)
                self.parallel_ensemble = 1  # Reduce to single-provider

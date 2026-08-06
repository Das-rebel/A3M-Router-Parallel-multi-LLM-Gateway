#!/usr/bin/env python3
"""
A3M Router Demo - Parallel Ensemble with Multiple LLMs

Run this after starting the A3M Router server:
    npx a3m-router serve

Usage:
    python demo.py

Requirements:
    pip install adaptive-memory-multi-model-router requests
"""

import json
import sys
import time
from typing import Dict, List, Any

# Try to import from the a3m package
try:
    from a3m.router import A3MRouter
    USING_A3M_SDK = True
except ImportError:
    USING_A3M_SDK = False
    print("Note: Using HTTP API (install a3m package for SDK access)")


def print_header(text: str) -> None:
    """Print a section header."""
    print("\n" + "=" * 60)
    print(f"  {text}")
    print("=" * 60)


def print_result(result: Any) -> None:
    """Print a routing result."""
    print(f"\n📦 Provider: {getattr(result, 'provider', 'unknown')}")
    print(f"⏱️  Latency: {getattr(result, 'latency_ms', '?')}ms")
    print(f"💰 Cost: ${getattr(result, 'cost_usd', 0):.6f}")
    print(f"\n📝 Response:\n{getattr(result, 'content', str(result))[:500]}")


def demo_simple_routing():
    """Demo 1: Simple auto-routing."""
    print_header("DEMO 1: Simple Auto-Routing")
    print("Query: 'What is 2+2?'")
    print("Expected: Routes to cheapest provider (Groq/Mistral)")

    if USING_A3M_SDK:
        router = A3MRouter(model="auto")
        result = router.route(
            messages=[{"role": "user", "content": "What is 2+2?"}]
        )
        print_result(result)
    else:
        import requests
        resp = requests.post(
            "http://localhost:8787/v1/chat/completions",
            json={
                "model": "auto",
                "messages": [{"role": "user", "content": "What is 2+2?"}]
            },
            timeout=30
        )
        data = resp.json()
        print(f"\n📦 Provider: {data.get('provider', 'unknown')}")
        print(f"📝 Response: {data['choices'][0]['message']['content']}")


def demo_parallel_ensemble():
    """Demo 2: Parallel ensemble with 3 providers."""
    print_header("DEMO 2: Parallel Ensemble (3 Providers)")
    print("Query: 'Explain quantum entanglement in simple terms'")
    print("Providers: Groq + OpenAI + DeepSeek (all called in parallel)")
    print("Expected: Best answer wins, with quality scores for each")

    if USING_A3M_SDK:
        router = A3MRouter(model="auto", parallel_ensemble=3)

        start = time.time()
        result = router.route(
            messages=[{"role": "user", "content": "Explain quantum entanglement in simple terms"}],
            ensemble_config={
                "providers": ["groq", "openai", "deepseek"],
                "timeout_ms": 30000,
                "score_weights": {
                    "relevance": 0.4,
                    "conciseness": 0.3,
                    "accuracy": 0.3
                }
            }
        )
        elapsed = time.time() - start

        print(f"\n⏱️  Total time: {elapsed:.1f}s")
        print_result(result)

        # Show all provider scores
        if hasattr(result, 'scores'):
            print("\n📊 All Provider Scores:")
            for provider, scores in result.scores.items():
                print(f"  {provider}: {scores}")
    else:
        import requests
        resp = requests.post(
            "http://localhost:8787/v1/chat/completions",
            json={
                "model": "auto",
                "messages": [{"role": "user", "content": "Explain quantum entanglement"}],
                "parallel_ensemble": 3,
            },
            timeout=60
        )
        data = resp.json()
        print(f"\n📦 Winner: {data.get('provider', 'unknown')}")
        print(f"📝 Response: {data['choices'][0]['message']['content'][:300]}...")


def demo_code_generation():
    """Demo 3: Code generation routing."""
    print_header("DEMO 3: Code Generation")
    print("Query: 'Write a Python function to fibonacci'")
    print("Expected: Routes to code-capable provider (DeepSeek/Groq)")

    code_query = "Write a Python function to calculate fibonacci numbers recursively"

    if USING_A3M_SDK:
        router = A3MRouter(model="auto")
        result = router.route(
            messages=[{"role": "user", "content": code_query}]
        )
        print_result(result)
    else:
        import requests
        resp = requests.post(
            "http://localhost:8787/v1/chat/completions",
            json={
                "model": "auto",
                "messages": [{"role": "user", "content": code_query}]
            },
            timeout=30
        )
        data = resp.json()
        print(f"\n📦 Provider: {data.get('provider', 'unknown')}")
        print(f"\n📝 Code:\n{data['choices'][0]['message']['content']}")


def demo_complex_reasoning():
    """Demo 4: Complex reasoning routes to premium."""
    print_header("DEMO 4: Complex Reasoning (Premium Tier)")
    print("Query: 'Design a microservices architecture for a fintech app'")
    print("Expected: Routes to premium provider (GPT-4o/Claude)")

    complex_query = "Design a microservices architecture for a fintech application with payments, KYC, and trading"

    if USING_A3M_SDK:
        router = A3MRouter(model="auto")
        result = router.route(
            messages=[{"role": "user", "content": complex_query}]
        )
        print_result(result)
    else:
        import requests
        resp = requests.post(
            "http://localhost:8787/v1/chat/completions",
            json={
                "model": "auto",
                "messages": [{"role": "user", "content": complex_query}]
            },
            timeout=60
        )
        data = resp.json()
        print(f"\n📦 Provider: {data.get('provider', 'unknown')}")
        print(f"📝 Response: {data['choices'][0]['message']['content'][:400]}...")


def demo_health_check():
    """Demo 5: Check provider health."""
    print_header("DEMO 5: Provider Health Status")

    if USING_A3M_SDK:
        router = A3MRouter(model="auto")
        health = router.get_health()
        print("\n🏥 Provider Status:")
        for provider, status in health.items():
            latency = status.get('latency_ms', 'N/A')
            available = "✅" if status.get('available') else "❌"
            print(f"  {available} {provider}: {latency}ms")
    else:
        import requests
        resp = requests.get("http://localhost:8787/health", timeout=10)
        data = resp.json()
        print("\n🏥 Provider Status:")
        for p in data.get('providers', []):
            print(f"  {'✅' if p.get('available') else '❌'} {p['name']}: {p.get('latency_ms', 'N/A')}ms")


def main():
    """Run all demos."""
    print("""
╔══════════════════════════════════════════════════════════════╗
║                                                              ║
║              A3M Router Demo - Parallel Ensemble            ║
║                                                              ║
║   Intelligent routing across 47+ LLM providers              ║
║   Save 70-95% on AI costs                                  ║
║                                                              ║
╚══════════════════════════════════════════════════════════════╝

Make sure A3M Router is running:
    npx a3m-router serve

Then run this demo:
    python demo.py
""")

    # Check if server is running
    try:
        import requests
        resp = requests.get("http://localhost:8787/health", timeout=5)
        print("✅ Connected to A3M Router server\n")
    except Exception as e:
        print(f"⚠️  Cannot connect to A3M Router server: {e}")
        print("   Make sure it's running: npx a3m-router serve")
        print("   Demo will use HTTP fallback...\n")

    # Run demos
    demos = [
        ("Simple Routing", demo_simple_routing),
        ("Parallel Ensemble", demo_parallel_ensemble),
        ("Code Generation", demo_code_generation),
        ("Complex Reasoning", demo_complex_reasoning),
        ("Health Check", demo_health_check),
    ]

    for name, demo_fn in demos:
        try:
            demo_fn()
        except Exception as e:
            print(f"\n❌ Demo failed: {e}")

    print("\n" + "=" * 60)
    print("  Demo Complete!")
    print("=" * 60)
    print("\nLearn more: https://github.com/Das-rebel/a3m-router")
    print("Documentation: https://das-rebel.github.io/a3m-router/")


if __name__ == "__main__":
    main()

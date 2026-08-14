"""
Integration tests for A3M Router adapters.
Requires A3M Router server running on localhost:8787
"""

import pytest
import os


@pytest.fixture
def a3m_server_url():
    """Get A3M Router server URL."""
    return os.environ.get("A3M_SERVER_URL", "http://localhost:8787")


@pytest.fixture
def skip_if_no_server():
    """Skip test if server is not available."""
    import requests
    try:
        resp = requests.get("http://localhost:8787/health", timeout=2)
        if resp.status_code != 200:
            pytest.skip("A3M Router server not running")
    except:
        pytest.skip("A3M Router server not running")


@pytest.mark.integration
def test_simple_chat_completion(a3m_server_url, skip_if_no_server):
    """Test simple chat completion via HTTP API."""
    import requests
    
    response = requests.post(
        f"{a3m_server_url}/v1/chat/completions",
        json={
            "model": "auto",
            "messages": [{"role": "user", "content": "What is 2+2?"}]
        },
        timeout=30
    )
    
    assert response.status_code == 200
    data = response.json()
    assert "choices" in data
    assert len(data["choices"]) > 0
    assert "message" in data["choices"][0]
    assert data["choices"][0]["message"]["content"]


@pytest.mark.integration
def test_parallel_ensemble(a3m_server_url, skip_if_no_server):
    """Test parallel ensemble with multiple providers."""
    import requests
    
    response = requests.post(
        f"{a3m_server_url}/v1/chat/completions",
        json={
            "model": "auto",
            "messages": [{"role": "user", "content": "Explain gravity"}],
            "parallel_ensemble": 3,
        },
        timeout=60
    )
    
    assert response.status_code == 200
    data = response.json()
    assert "choices" in data
    assert "provider" in data


@pytest.mark.integration  
def test_health_endpoint(a3m_server_url, skip_if_no_server):
    """Test health endpoint."""
    import requests
    
    response = requests.get(f"{a3m_server_url}/health", timeout=10)
    
    assert response.status_code == 200
    data = response.json()
    assert "providers" in data or "status" in data

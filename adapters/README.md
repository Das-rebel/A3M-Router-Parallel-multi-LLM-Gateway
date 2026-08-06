# A3M Router Adapters

Drop-in adapters for LangChain and LlamaIndex to integrate with A3M Router for intelligent model routing.

## Installation

```bash
pip install a3m_adapter
```

Or install with extras:

```bash
pip install a3m_adapter[langchain]  # With LangChain support
pip install a3m_adapter[llamaindex]  # With LlamaIndex support
```

## Usage

### LangChain

```python
from a3m_adapter import A3MLangChainAdapter

llm = A3MLangChainAdapter(model="auto", temperature=0.7)
result = llm.invoke("What is the capital of France?")
```

### LlamaIndex

```python
from a3m_adapter import A3MLlamaIndexAdapter

llm = A3MLlamaIndexAdapter(model="auto")
response = llm.complete("What is the capital of France?")
```

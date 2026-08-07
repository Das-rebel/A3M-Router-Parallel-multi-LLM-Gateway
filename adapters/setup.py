from setuptools import setup, find_packages
import os

setup(
    name="a3m_adapter",
    version="1.0.0",
    description="A3M Router adapters for LangChain, LlamaIndex, and other LLM frameworks",
    long_description=open("README.md").read() if os.path.exists("README.md") else "",
    long_description_content_type="text/markdown",
    author="A3M Team",
    author_email="hello@a3m.ai",
    packages=find_packages(),
    install_requires=[
        "requests>=2.25.1",
        "pydantic>=1.9.0",
    ],
    extras_require={
        "langchain": ["langchain>=0.0.365", "langchain-core>=0.0.365"],
        "llamaindex": ["llama-index>=0.8.0"],
        "dev": ["pytest>=6.0"],
    },
    python_requires=">=3.8",
)

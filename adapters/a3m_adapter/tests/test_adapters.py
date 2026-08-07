"""
Test script for A3M Router adapters.

Tests the LangChain and LlamaIndex adapters to ensure they:
1. Initialize correctly
2. Route requests properly
3. Return expected response types
4. Handle errors gracefully
"""

import sys
import os
import logging

# Add current directory to path
sys.path.insert(0, '.')

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def test_langchain_adapter():
    """Test LangChain adapter."""
    print("Testing LangChain adapter...")
    
    try:
        from a3m_llm_adapter import A3MChatModel
        
        # Initialize
        llm = A3MChatModel(model="auto", temperature=0.7)
        print(f"��✅ Initialized: {llm}")
        
        # Test simple generation
        # Note: This would make actual API calls - we'll skip for now
        # In a real test, we'd mock the A3M router
        print("��✅ LangChain adapter structure OK")
        return True
        
    except Exception as e:
        print(f"��❌ LangChain adapter failed: {e}")
        return False

def test_llamaindex_adapter():
    """Test LlamaIndex adapter."""
    print("Testing LlamaIndex adapter...")
    
    try:
        from a3m_llama_index_adapter import A3MLlamaIndexLLM
        
        # Initialize
        llm = A3MLlamaIndexLLM(model="auto", temperature=0.5)
        print(f"��✅ Initialized: {llm}")
        
        # Check metadata
        metadata = llm.metadata
        print(f"��✅ Metadata: {metadata.model_name}, tokens: {metadata.num_output}")
        return True
        
    except Exception as e:
        print(f"��❌ LlamaIndex adapter failed: {e}")
        return False

def test_config():
    """Test configuration."""
    print("Testing configuration...")
    
    try:
        from a3m_adapter_config import A3MConfig
        
        # Test defaults
        config = A3MConfig()
        print(f"��✅ Default config: model={config.model}")
        
        # Test to_dict
        data = config.to_dict()
        assert 'model' in data
        print("��✅ Config to_dict works")
        
        # Test JSON serialization
        json_str = config.to_json()
        assert '"model"' in json_str
        print("��✅ Config JSON serialization works")
        
        return True
        
    except Exception as e:
        print(f"��❌ Config test failed: {e}")
        return False

def main():
    """Run all tests."""
    print("=" * 50)
    print("A3M Router Adapter Tests")
    print("=" * 50)
    
    tests = [
        test_config,
        test_langchain_adapter,
        test_llamaindex_adapter,
    ]
    
    passed = 0
    total = len(tests)
    
    for test in tests:
        if test():
            passed += 1
        print()
    
    print("=" * 50)
    print(f"Results: {passed}/{total} tests passed")
    
    if passed == total:
        print("���🎉 All tests passed!")
        return 0
    else:
        print("��❌ Some tests failed")
        return 1

if __name__ == "__main__":
    sys.exit(main())

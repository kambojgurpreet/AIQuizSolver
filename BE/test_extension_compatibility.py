# Test script to verify Chrome extension compatibility
# This simulates the requests that the Chrome extension will make

import requests
import json

def test_endpoints():
    """Test all FastAPI endpoints to ensure Chrome extension compatibility"""
    base_url = "http://localhost:3000"
    
    print("🧪 Testing FastAPI Server Endpoints for Chrome Extension Compatibility")
    print("=" * 70)
    
    # Test 1: CORS and basic connectivity
    print("1. Testing /test endpoint (CORS check)...")
    try:
        response = requests.get(f"{base_url}/test")
        print(f"   ✅ Status: {response.status_code}")
        print(f"   📋 Response: {response.json()['message']}")
        print(f"   🔧 CORS: {response.json()['cors']}")
    except Exception as e:
        print(f"   ❌ Error: {e}")
    
    print()
    
    # Test 2: Single question processing (main extension feature)
    print("2. Testing /ask endpoint (single question)...")
    test_question = {
        "question": "What is the capital of France?",
        "options": ["London", "Berlin", "Paris", "Madrid"]
    }
    
    try:
        response = requests.post(
            f"{base_url}/ask",
            json=test_question,
            headers={"Content-Type": "application/json"}
        )
        print(f"   ✅ Status: {response.status_code}")
        if response.status_code == 200:
            result = response.json()
            print(f"   🎯 Answer: {result['answer']}")
            print(f"   📊 Confidence: {result['confidence']}/10")
            print(f"   🤖 Model: {result['model']}")
        else:
            print(f"   ❌ Error Response: {response.text}")
    except Exception as e:
        print(f"   ❌ Error: {e}")
    
    print()
    
    # Test 3: Batch processing
    print("3. Testing /ask-batch endpoint (multiple questions)...")
    batch_request = {
        "questions": [
            {
                "question": "What is 2 + 2?",
                "options": ["3", "4", "5", "6"]
            },
            {
                "question": "Which planet is closest to the Sun?",
                "options": ["Venus", "Mercury", "Earth", "Mars"]
            }
        ]
    }
    
    try:
        response = requests.post(
            f"{base_url}/ask-batch",
            json=batch_request,
            headers={"Content-Type": "application/json"}
        )
        print(f"   ✅ Status: {response.status_code}")
        if response.status_code == 200:
            results = response.json()
            for i, result in enumerate(results):
                if 'error' not in result:
                    print(f"   🎯 Question {i+1}: Answer {result['answer']} (Confidence: {result['confidence']}/10)")
                else:
                    print(f"   ❌ Question {i+1}: Error - {result['error']}")
        else:
            print(f"   ❌ Error Response: {response.text}")
    except Exception as e:
        print(f"   ❌ Error: {e}")
    
    print()
    
    # Test 4: Health check
    print("4. Testing /health endpoint...")
    try:
        response = requests.get(f"{base_url}/health")
        print(f"   ✅ Status: {response.status_code}")
        health = response.json()
        print(f"   💚 Health: {health['status']}")
        print(f"   ⏱️ Uptime: {health['uptime']:.2f}s")
        print(f"   🔑 OpenAI: {health['openai']}")
    except Exception as e:
        print(f"   ❌ Error: {e}")
    
    print()
    print("🎉 Chrome Extension Compatibility Test Complete!")
    print("💡 If all tests pass, your Chrome extension should work seamlessly with the new FastAPI server.")

if __name__ == "__main__":
    test_endpoints()

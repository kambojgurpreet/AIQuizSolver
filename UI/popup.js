document.addEventListener("DOMContentLoaded", function() {
  const runBtn = document.getElementById("run");
  const statusDiv = document.createElement("div");
  statusDiv.id = "status";
  statusDiv.style.cssText = "margin: 10px 0; padding: 8px; border-radius: 4px; font-size: 12px;";
  
  // Add new buttons
  const processAllBtn = document.createElement("button");
  processAllBtn.textContent = "🚀 Process All Questions";
  processAllBtn.style.cssText = "width: 100%; margin: 5px 0; padding: 8px; background: #28a745; color: white; border: none; border-radius: 4px; cursor: pointer;";
  
  const autoCompleteBtn = document.createElement("button");
  autoCompleteBtn.textContent = "⚡ Auto-Complete Quiz";
  autoCompleteBtn.style.cssText = "width: 100%; margin: 5px 0; padding: 8px; background: #007bff; color: white; border: none; border-radius: 4px; cursor: pointer;";
  
  const testBtn = document.createElement("button");
  testBtn.textContent = "🔗 Test Connection";
  testBtn.style.cssText = "width: 100%; margin: 5px 0; padding: 8px; background: #17a2b8; color: white; border: none; border-radius: 4px; cursor: pointer;";
  
  const clearBtn = document.createElement("button");
  clearBtn.textContent = "🗑️ Clear Log";
  clearBtn.style.cssText = "width: 100%; margin: 5px 0; padding: 8px; background: #dc3545; color: white; border: none; border-radius: 4px; cursor: pointer;";

  // Update existing button style
  runBtn.textContent = "🎯 Answer Current Question";
  runBtn.style.cssText = "width: 100%; margin: 5px 0; padding: 8px; background: #ffc107; color: black; border: none; border-radius: 4px; cursor: pointer;";

  // Insert new elements
  runBtn.parentNode.insertBefore(statusDiv, runBtn.nextSibling);
  runBtn.parentNode.insertBefore(processAllBtn, statusDiv.nextSibling);
  runBtn.parentNode.insertBefore(autoCompleteBtn, processAllBtn.nextSibling);
  runBtn.parentNode.insertBefore(testBtn, autoCompleteBtn.nextSibling);
  runBtn.parentNode.insertBefore(clearBtn, testBtn.nextSibling);

  function setStatus(message, type = "info") {
    statusDiv.textContent = message;
    const colors = {
      info: "#d1ecf1",
      success: "#d4edda", 
      error: "#f8d7da",
      loading: "#fff3cd"
    };
    statusDiv.style.backgroundColor = colors[type] || colors.info;
  }

  async function executeInActiveTab(action, params = {}) {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      
      // First ensure content script is loaded
      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        files: ["content.js"]
      });

      // Execute predefined functions based on action
      let results;
      switch (action) {
        case 'runQuizAssistant':
          results = await chrome.scripting.executeScript({
            target: { tabId: tab.id },
            func: () => {
              if (typeof window.runQuizAssistant === 'function') {
                return window.runQuizAssistant();
              } else {
                console.error('runQuizAssistant function not found');
                return false;
              }
            }
          });
          break;

        case 'autoCompleteQuiz':
          results = await chrome.scripting.executeScript({
            target: { tabId: tab.id },
            func: () => {
              if (typeof window.autoCompleteQuiz === 'function') {
                return window.autoCompleteQuiz();
              } else {
                console.error('autoCompleteQuiz function not found');
                return false;
              }
            }
          });
          break;

        case 'testCORS':
          results = await chrome.scripting.executeScript({
            target: { tabId: tab.id },
            func: () => {
              if (typeof window.testCORS === 'function') {
                return window.testCORS();
              } else {
                console.error('testCORS function not found');
                return false;
              }
            }
          });
          break;

        case 'clearLog':
          results = await chrome.scripting.executeScript({
            target: { tabId: tab.id },
            func: () => {
              localStorage.removeItem('quizLog');
              console.log('Quiz log cleared');
              return true;
            }
          });
          break;

        case 'answerCurrentQuestion':
          results = await chrome.scripting.executeScript({
            target: { tabId: tab.id },
            func: () => {
              // Single question processing with English extraction
              const visibleQuizItem = document.querySelector(".wpProQuiz_listItem[style='']") || 
                                     document.querySelector(".wpProQuiz_listItem:not([style*='display: none'])");
              
              if (visibleQuizItem) {
                const questionEl = visibleQuizItem.querySelector(".wpProQuiz_question_text");
                const optionEls = visibleQuizItem.querySelectorAll(".wpProQuiz_questionListItem label");
                
                if (questionEl && optionEls.length > 0) {
                  const rawQuestion = questionEl.innerText.trim();
                  const question = window.extractEnglishText ? window.extractEnglishText(rawQuestion) : rawQuestion;
                  
                  const rawOptions = Array.from(optionEls).map(o => o.innerText.trim());
                  const options = rawOptions.map(opt => {
                    const cleanOpt = opt.replace(/^[A-D]\.\s*/, '');
                    return window.extractEnglishText ? window.extractEnglishText(cleanOpt) : cleanOpt;
                  });
                  
                  console.log("Extracted English question:", question);
                  console.log("Extracted English options:", options);
                  
                  fetch("http://localhost:3000/ask", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ question, options })
                  })
                  .then(response => response.json())
                  .then(data => {
                    console.log("AI Answer:", data.answer, "Confidence:", data.confidence);
                    
                    // Highlight the answer
                    const answerIndex = data.answer.charCodeAt(0) - 65;
                    if (optionEls[answerIndex]) {
                      optionEls[answerIndex].style.border = "3px solid #00ff00";
                      optionEls[answerIndex].style.backgroundColor = "rgba(0, 255, 0, 0.2)";
                    }
                    
                    // Log the result
                    const log = JSON.parse(localStorage.getItem("quizLog") || "[]");
                    log.push({
                      question,
                      options,
                      answer: data.answer,
                      confidence: data.confidence,
                      time: new Date().toLocaleString()
                    });
                    localStorage.setItem("quizLog", JSON.stringify(log));
                  })
                  .catch(err => console.error("Error:", err));
                  
                  return true;
                } else {
                  console.error('Question or options not found');
                  return false;
                }
              } else {
                console.error('No visible quiz item found');
                return false;
              }
            }
          });
          break;

        default:
          throw new Error(`Unknown action: ${action}`);
      }

      return results[0];
    } catch (error) {
      console.error("Error executing script:", error);
      setStatus(`Error: ${error.message}`, "error");
    }
  }

  // Original functionality - answer current question
  runBtn.addEventListener("click", async () => {
    setStatus("Processing current question...", "loading");
    const result = await executeInActiveTab('answerCurrentQuestion');
    if (result?.result) {
      setStatus("Current question processed", "success");
    } else {
      setStatus("Failed to process question", "error");
    }
  });

  // Process all questions asynchronously
  processAllBtn.addEventListener("click", async () => {
    setStatus("Processing all questions...", "loading");
    const result = await executeInActiveTab('runQuizAssistant');
    if (result?.result !== false) {
      setStatus("All questions processed! Check the on-page UI", "success");
    } else {
      setStatus("Failed to start processing", "error");
    }
  });

  // Auto-complete quiz 
  autoCompleteBtn.addEventListener("click", async () => {
    setStatus("Starting auto-completion...", "loading");
    const result = await executeInActiveTab('autoCompleteQuiz');
    if (result?.result !== false) {
      setStatus("Auto-completion started", "success");
    } else {
      setStatus("Failed to start auto-completion", "error");
    }
  });

  // Test CORS connection
  testBtn.addEventListener("click", async () => {
    setStatus("Testing connection...", "loading");
    const result = await executeInActiveTab('testCORS');
    if (result?.result) {
      setStatus("✅ Proxy server connected successfully!", "success");
    } else {
      setStatus("❌ Connection failed. Is proxy server running?", "error");
    }
  });

  // Clear quiz log
  clearBtn.addEventListener("click", async () => {
    const result = await executeInActiveTab('clearLog');
    if (result?.result) {
      setStatus("Quiz log cleared", "success");
    } else {
      setStatus("Failed to clear log", "error");
    }
  });

  // Set initial status
  setStatus("Ready! Ensure proxy server is running on localhost:3000");
});
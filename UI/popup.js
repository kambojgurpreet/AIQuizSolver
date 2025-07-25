document.addEventListener("DOMContentLoaded", function() {
  // Initialize theme and UI elements
  initializeTheme();
  initializeUI();
  
  function initializeTheme() {
    // Inject CSS styles using theme configuration
    const styleElement = document.getElementById('theme-styles');
    const theme = THEME_CONFIG;
    
    const css = `
      body {
        width: 280px;
        padding: ${theme.spacing.lg};
        font-family: ${theme.typography.fontFamily};
        margin: 0;
        background: ${theme.colors.background};
        color: ${theme.colors.white};
      }
      
      .header {
        text-align: center;
        margin-bottom: ${theme.spacing.lg};
        padding-bottom: ${theme.spacing.md};
        border-bottom: 2px solid ${theme.colors.borderLight};
      }
      
      .header h2 {
        margin: 0;
        font-size: ${theme.typography.fontSize.large};
        font-weight: ${theme.typography.fontWeight.bold};
      }
      
      .subtitle {
        font-size: 11px;
        opacity: 0.8;
        margin-top: ${theme.spacing.xs};
      }
      
      button {
        width: 100%;
        margin: ${theme.spacing.sm} 0;
        padding: ${theme.buttons.common.padding};
        border: ${theme.buttons.common.border};
        border-radius: ${theme.buttons.common.borderRadius};
        cursor: ${theme.buttons.common.cursor};
        font-size: ${theme.buttons.common.fontSize};
        font-weight: ${theme.buttons.common.fontWeight};
        transition: ${theme.buttons.common.transition};
        box-shadow: ${theme.buttons.common.boxShadow};
      }
      
      button:hover {
        transform: ${theme.buttons.common.hoverTransform};
        box-shadow: ${theme.buttons.common.hoverBoxShadow};
      }
      
      .primary-btn {
        background: ${theme.buttons.primary.background};
        color: ${theme.buttons.primary.color};
      }
      
      .secondary-btn {
        background: ${theme.buttons.secondary.background};
        color: ${theme.buttons.secondary.color};
      }
      
      .info-btn {
        background: ${theme.buttons.info.background};
        color: ${theme.buttons.info.color};
      }
      
      .warning-btn {
        background: ${theme.buttons.warning.background};
        color: ${theme.buttons.warning.color};
      }
      
      .danger-btn {
        background: ${theme.buttons.danger.background};
        color: ${theme.buttons.danger.color};
      }
      
      #status {
        margin: ${theme.spacing.md} 0;
        padding: 8px ${theme.spacing.md};
        border-radius: ${theme.borderRadius.medium};
        font-size: 11px;
        text-align: center;
        min-height: 16px;
        border: 1px solid ${theme.colors.borderLight};
        background: ${theme.colors.overlayBackground};
      }
      
      .footer {
        margin-top: ${theme.spacing.lg};
        padding-top: ${theme.spacing.md};
        border-top: 1px solid ${theme.colors.borderLight};
        text-align: center;
        font-size: ${theme.typography.fontSize.small};
        opacity: 0.7;
      }
      
      .emoji {
        font-size: 16px;
        margin-right: ${theme.spacing.sm};
      }
      
      .model-selection {
        margin-bottom: ${theme.spacing.lg};
        padding: 12px;
        background: ${theme.colors.overlayBackground};
        border-radius: ${theme.borderRadius.large};
        border: 1px solid ${theme.colors.borderDark};
      }
      
      .model-title {
        font-size: ${theme.typography.fontSize.normal};
        font-weight: ${theme.typography.fontWeight.bold};
        margin-bottom: ${theme.spacing.md};
        text-align: center;
        color: ${theme.colors.white};
      }
      
      .toggle-container {
        display: flex;
        flex-direction: column;
        gap: 8px;
      }
      
      .toggle-option {
        position: relative;
      }
      
      .toggle-option input[type="radio"] {
        display: none;
      }
      
      .toggle-option label {
        display: block;
        padding: 8px 12px;
        background: ${theme.colors.overlayBackground};
        border: 2px solid ${theme.colors.borderDark};
        border-radius: ${theme.borderRadius.medium};
        cursor: pointer;
        transition: all 0.3s ease;
        font-size: 11px;
        font-weight: ${theme.typography.fontWeight.medium};
      }
      
      .toggle-option input[type="radio"]:checked + label {
        background: rgba(255, 255, 255, 0.2);
        border-color: ${theme.colors.success};
        box-shadow: 0 0 10px rgba(40, 167, 69, 0.3);
      }
      
      .toggle-option label:hover {
        background: rgba(255, 255, 255, 0.15);
        transform: translateY(-1px);
      }
      
      .option-desc {
        font-size: 9px;
        opacity: 0.8;
        margin-top: 2px;
        font-weight: ${theme.typography.fontWeight.normal};
      }
    `;
    
    styleElement.textContent = css;
    
    // Set icons using theme configuration
    document.getElementById('main-title').innerHTML = `${ThemeHelper.getIcon('robot')} AI Quiz Assistant`;
    document.getElementById('analysis-mode-title').innerHTML = `${ThemeHelper.getIcon('science')} Analysis Mode`;
    document.getElementById('single-model-icon').textContent = ThemeHelper.getIcon('singleModel');
    document.getElementById('multi-model-icon').textContent = ThemeHelper.getIcon('multiModel');
    document.getElementById('run-btn-icon').textContent = ThemeHelper.getIcon('target');
  }
  
  function initializeUI() {
    const runBtn = document.getElementById("run");
    const statusDiv = document.createElement("div");
    statusDiv.id = "status";
    
    // Get model selection elements
    const singleModelRadio = document.getElementById("singleModel");
    const multiModelRadio = document.getElementById("multiModel");
    
    // Function to get selected analysis mode
    function getSelectedMode() {
      return singleModelRadio.checked ? 'single' : 'multi';
    }
    
    // Function to update button text based on selection
    function updateButtonText() {
      const mode = getSelectedMode();
      const emoji = mode === 'single' ? ThemeHelper.getIcon('singleModel') : ThemeHelper.getIcon('multiModel');
      const modeText = mode === 'single' ? 'Single Model' : 'Multi-Model';
      runBtn.innerHTML = `<span class="emoji">${emoji}</span>Answer with ${modeText}`;
    }
    
    // Create buttons using theme configuration
    const processAllBtn = document.createElement("button");
    processAllBtn.className = "primary-btn";
    
    const autoCompleteBtn = document.createElement("button");
    autoCompleteBtn.className = "secondary-btn";
    
    const testBtn = document.createElement("button");
    testBtn.className = "info-btn";
    testBtn.innerHTML = `${ThemeHelper.getIcon('link')} Test Connection`;
    
    const clearBtn = document.createElement("button");
    clearBtn.className = "danger-btn";
    clearBtn.innerHTML = `${ThemeHelper.getIcon('trash')} Clear Log`;
    
    // Function to update process all button text
    function updateProcessAllText() {
      const mode = getSelectedMode();
      const emoji = mode === 'single' ? ThemeHelper.getIcon('rocket') : ThemeHelper.getIcon('brain');
      const modeText = mode === 'single' ? 'Single Model' : 'Multi-Model';
      processAllBtn.innerHTML = `${emoji} Process All (${modeText})`;
    }
    
    // Function to update auto-complete button text
    function updateAutoCompleteText() {
      const mode = getSelectedMode();
      const emoji = mode === 'single' ? ThemeHelper.getIcon('lightning') : ThemeHelper.getIcon('robot');
      const modeText = mode === 'single' ? 'Single Model' : 'Multi-Model';
      autoCompleteBtn.innerHTML = `${emoji} Auto-Complete (${modeText})`;
    }
    
    // Add event listeners to radio buttons
    singleModelRadio.addEventListener('change', () => {
      updateButtonText();
      updateProcessAllText();
      updateAutoCompleteText();
    });
    multiModelRadio.addEventListener('change', () => {
      updateButtonText();
      updateProcessAllText();
      updateAutoCompleteText();
    });
    
    // Initialize button texts
    updateButtonText();
    updateProcessAllText();
    updateAutoCompleteText();
    
    // Insert new elements
    runBtn.parentNode.insertBefore(statusDiv, runBtn.nextSibling);
    runBtn.parentNode.insertBefore(processAllBtn, statusDiv.nextSibling);
    runBtn.parentNode.insertBefore(autoCompleteBtn, processAllBtn.nextSibling);
    runBtn.parentNode.insertBefore(testBtn, autoCompleteBtn.nextSibling);
    runBtn.parentNode.insertBefore(clearBtn, testBtn.nextSibling);

    function setStatus(message, type = "info") {
      statusDiv.textContent = message;
      const theme = THEME_CONFIG;
      const colors = {
        info: theme.colors.infoLight,
        success: theme.colors.successLight,
        error: theme.colors.dangerLight,
        loading: theme.colors.warningLight
      };
      statusDiv.style.backgroundColor = colors[type] || colors.info;
    }

    async function executeInActiveTab(action, params = {}) {
      try {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        
        // First ensure content script is loaded
        await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          files: ["theme-config.js", "content.js"]
        });

        // Execute predefined functions based on action
        let results;
        switch (action) {
          case 'runQuizAssistant':
            results = await chrome.scripting.executeScript({
              target: { tabId: tab.id },
              func: (params) => {
                if (typeof window.runQuizAssistant === 'function') {
                  return window.runQuizAssistant(params?.mode || 'single');
                } else {
                  console.error('runQuizAssistant function not found');
                  return false;
                }
              },
              args: [params]
            });
            break;

          case 'autoCompleteQuiz':
            results = await chrome.scripting.executeScript({
              target: { tabId: tab.id },
              func: (params) => {
                if (typeof window.autoCompleteQuiz === 'function') {
                  return window.autoCompleteQuiz(params?.mode || 'single');
                } else {
                  console.error('autoCompleteQuiz function not found');
                  return false;
                }
              },
              args: [params]
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
              func: (params) => {
                const mode = params?.mode || 'single';
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
                    console.log("Using mode:", mode);
                    
                    const requestBody = { question, options };
                    const url = mode === 'multi' 
                      ? "http://localhost:3000/ask?multi_model=true"
                      : "http://localhost:3000/ask?multi_model=false";
                    
                    fetch(url, {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify(requestBody)
                    })
                    .then(response => response.json())
                    .then(data => {
                      console.log("AI Answer:", data.answer, "Confidence:", data.confidence);
                      
                      // Use theme-based highlighting
                      const answerIndex = data.answer.charCodeAt(0) - 65;
                      if (optionEls[answerIndex]) {
                        const colors = window.ThemeHelper ? 
                          window.ThemeHelper.getConfidenceColors(data.confidence) :
                          { highlight: 'rgba(0, 255, 0, 0.2)', border: '#00ff00' };
                        
                        optionEls[answerIndex].style.border = `3px solid ${colors.border || '#00ff00'}`;
                        optionEls[answerIndex].style.backgroundColor = colors.highlight || 'rgba(0, 255, 0, 0.2)';
                      }
                      
                      // Log the result
                      const log = JSON.parse(localStorage.getItem("quizLog") || "[]");
                      const logEntry = {
                        question,
                        options,
                        answer: data.answer,
                        confidence: data.confidence,
                        reasoning: data.reasoning || 'No reasoning provided',
                        mode: mode,
                        time: new Date().toLocaleString()
                      };
                      
                      if (mode === 'multi') {
                        logEntry.consensus = data.consensus;
                        logEntry.individual_answers = data.individual_answers;
                      }
                      
                      log.push(logEntry);
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
              },
              args: [params]
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

    // Event listeners for buttons
    runBtn.addEventListener("click", async () => {
      const mode = getSelectedMode();
      setStatus(`Processing current question with ${mode === 'single' ? 'single model' : 'multi-model consensus'}...`, "loading");
      const result = await executeInActiveTab('answerCurrentQuestion', { mode });
      if (result?.result) {
        setStatus("Current question processed", "success");
      } else {
        setStatus("Failed to process question", "error");
      }
    });

    processAllBtn.addEventListener("click", async () => {
      const mode = getSelectedMode();
      setStatus(`Processing all questions with ${mode === 'single' ? 'single model' : 'multi-model consensus'}...`, "loading");
      const result = await executeInActiveTab('runQuizAssistant', { mode });
      if (result?.result !== false) {
        setStatus("All questions processed! Check the on-page UI", "success");
      } else {
        setStatus("Failed to start processing", "error");
      }
    });

    autoCompleteBtn.addEventListener("click", async () => {
      const mode = getSelectedMode();
      setStatus(`Starting auto-completion with ${mode === 'single' ? 'single model' : 'multi-model consensus'}...`, "loading");
      const result = await executeInActiveTab('autoCompleteQuiz', { mode });
      if (result?.result !== false) {
        setStatus("Auto-completion started", "success");
      } else {
        setStatus("Failed to start auto-completion", "error");
      }
    });

    testBtn.addEventListener("click", async () => {
      setStatus("Testing connection...", "loading");
      const result = await executeInActiveTab('testCORS');
      if (result?.result) {
        setStatus(`${ThemeHelper.getIcon('success')} Proxy server connected successfully!`, "success");
      } else {
        setStatus(`${ThemeHelper.getIcon('error')} Connection failed. Is proxy server running?`, "error");
      }
    });

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
  }
});

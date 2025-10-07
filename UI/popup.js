// === API Key for backend authentication (chrome.storage.local) ===
function getApiKey(cb) {
  if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
    chrome.storage.local.get(['quizApiKey'], function(result) {
      cb(result.quizApiKey || '');
    });
  } else {
    cb(localStorage.getItem('quizApiKey') || '');
  }
}

function setApiKey(key, cb) {
  if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
    chrome.storage.local.set({ quizApiKey: key }, function() {
      // Notify all tabs to update their API key (seamless update)
      if (typeof chrome.tabs !== 'undefined') {
        chrome.tabs.query({}, function(tabs) {
          for (let tab of tabs) {
            chrome.tabs.sendMessage(tab.id, { type: 'QUIZ_API_KEY_UPDATED', apiKey: key }, function(response) {
              if (chrome.runtime.lastError) {
                // Content script not loaded, inject it then send message
                if (chrome.scripting) {
                  chrome.scripting.executeScript({
                    target: { tabId: tab.id },
                    files: ["theme-config.js", "content.js"]
                  }, function() {
                    chrome.tabs.sendMessage(tab.id, { type: 'QUIZ_API_KEY_UPDATED', apiKey: key });
                  });
                }
              }
            });
          }
        });
      }
      if (cb) cb();
    });
  } else {
    localStorage.setItem('quizApiKey', key);
    if (cb) cb();
  }
}
document.addEventListener("DOMContentLoaded", function() {
  // Wait for theme configuration to be available
  if (typeof THEME_CONFIG === 'undefined' || typeof ThemeHelper === 'undefined') {
    console.error('Theme configuration not loaded. Retrying...');
    setTimeout(() => {
      if (typeof THEME_CONFIG !== 'undefined' && typeof ThemeHelper !== 'undefined') {
        initializeTheme();
        initializeUI();
      } else {
        console.error('Theme configuration failed to load. Using fallback styling.');
        initializeUIWithFallback();
      }
    }, 100);
    return;
  }
  
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
      
      button:disabled {
        opacity: 0.6 !important;
        cursor: not-allowed !important;
        transform: none !important;
        box-shadow: ${theme.buttons.common.boxShadow} !important;
      }
      
      button:disabled:hover {
        transform: none !important;
        box-shadow: ${theme.buttons.common.boxShadow} !important;
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
      
      .toggle-switch-container {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 12px;
        margin-bottom: 4px;
      }
      .toggle-label {
        font-size: 13px;
        font-weight: ${theme.typography.fontWeight.medium};
        color: ${theme.colors.white};
        min-width: 24px;
        text-align: center;
      }
      .switch {
        position: relative;
        display: inline-block;
        width: 44px;
        height: 24px;
      }
      .switch input {
        opacity: 0;
        width: 0;
        height: 0;
      }
      .slider {
        position: absolute;
        cursor: pointer;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: ${theme.colors.overlayBackground};
        border: 2px solid ${theme.colors.borderDark};
        border-radius: 24px;
        transition: .4s;
      }
      .slider:before {
        position: absolute;
        content: "";
        height: 18px;
        width: 18px;
        left: 2px;
        bottom: 2.5px;
        background: ${theme.colors.white};
        border-radius: 50%;
        transition: .4s;
        box-shadow: 0 1px 4px rgba(0,0,0,0.15);
      }
      .switch input:checked + .slider {
        background: ${theme.colors.successLight};
        border-color: ${theme.colors.success};
      }
      .switch input:checked + .slider:before {
        transform: translateX(20px);
        background: ${theme.colors.success};
      }
      .toggle-desc {
        text-align: center;
        font-size: 10px;
        opacity: 0.8;
        margin-top: 2px;
        margin-bottom: 2px;
        color: ${theme.colors.white};
      }
    `;
    
    styleElement.textContent = css;
    
    // Set icons using theme configuration
    document.getElementById('main-title').innerHTML = `${ThemeHelper.getIcon('robot')} Quiz Solver 1.0`;
    document.getElementById('analysis-mode-title').innerHTML = `${ThemeHelper.getIcon('science')} Analysis Mode`;
    document.getElementById('single-model-icon').textContent = ThemeHelper.getIcon('singleModel');
    document.getElementById('multi-model-icon').textContent = ThemeHelper.getIcon('multiModel');
    document.getElementById('run-btn-icon').textContent = ThemeHelper.getIcon('target');
  }
  
  function initializeUIWithFallback() {
    console.log('Initializing UI with fallback styling...');
    
    // Set fallback CSS
    const styleElement = document.getElementById('theme-styles');
    const fallbackCSS = `
      body {
        width: 280px;
        padding: 15px;
        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        margin: 0;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
      }
      .header { text-align: center; margin-bottom: 15px; padding-bottom: 10px; border-bottom: 2px solid rgba(255,255,255,0.3); }
      .header h2 { margin: 0; font-size: 18px; font-weight: 600; }
      .subtitle { font-size: 11px; opacity: 0.8; margin-top: 3px; }
      button { width: 100%; margin: 6px 0; padding: 10px 12px; border: none; border-radius: 6px; cursor: pointer; font-size: 13px; font-weight: 500; transition: all 0.3s ease; box-shadow: 0 2px 4px rgba(0,0,0,0.2); }
      button:hover { transform: translateY(-1px); box-shadow: 0 4px 8px rgba(0,0,0,0.3); }
      button:disabled { opacity: 0.6 !important; cursor: not-allowed !important; transform: none !important; box-shadow: 0 2px 4px rgba(0,0,0,0.2) !important; }
      button:disabled:hover { transform: none !important; box-shadow: 0 2px 4px rgba(0,0,0,0.2) !important; }
      .primary-btn { background: #28a745; color: white; }
      .secondary-btn { background: #007bff; color: white; }
      .info-btn { background: #17a2b8; color: white; }
      .warning-btn { background: #ffc107; color: #212529; }
      .danger-btn { background: #dc3545; color: white; }
    `;
    styleElement.textContent = fallbackCSS;
    
    // Set fallback icons
    document.getElementById('main-title').innerHTML = `🤖 AI Quiz Assistant`;
    document.getElementById('analysis-mode-title').innerHTML = `🔬 Analysis Mode`;
    document.getElementById('single-model-icon').textContent = '⚡';
    document.getElementById('multi-model-icon').textContent = '🧠';
    document.getElementById('run-btn-icon').textContent = '🎯';
    
    // Initialize with basic functionality
    initializeBasicUI();
  }
  
  function initializeBasicUI() {
    // Basic UI initialization without theme dependency
    const runBtn = document.getElementById("run");
    const statusDiv = document.createElement("div");
    statusDiv.id = "status";
    statusDiv.style.cssText = "margin: 10px 0; padding: 8px; border-radius: 4px; font-size: 12px; background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.3);";
    
    runBtn.parentNode.insertBefore(statusDiv, runBtn.nextSibling);
    
    function setStatus(message, type = "info") {
      statusDiv.textContent = message;
      const colors = {
        info: "rgba(255,255,255,0.1)",
        success: "rgba(40, 167, 69, 0.2)", 
        error: "rgba(220, 53, 69, 0.2)",
        loading: "rgba(255, 193, 7, 0.2)"
      };
      statusDiv.style.backgroundColor = colors[type] || colors.info;
    }
    
    setStatus("Ready! (Fallback mode - theme config not loaded)");
  }
  
  function initializeUI() {
    // --- API Key Input UI ---
    const header = document.querySelector('.header') || document.body;
    const apiKeyDiv = document.createElement('div');
    apiKeyDiv.style = 'margin-bottom: 10px; display: flex; flex-direction: column; align-items: stretch;';
    apiKeyDiv.innerHTML = `
      <label for="quiz-api-key" style="font-size:11px; margin-bottom:2px; color:#fff; text-align:left;">API Key:</label>
      <input id="quiz-api-key" type="password" placeholder="Enter API key..." style="padding:6px 8px; border-radius:5px; border:1px solid #888; font-size:12px; width:100%; box-sizing:border-box; margin-bottom:2px;" autocomplete="off" />
      <button id="save-api-key-btn" class="secondary-btn" style="margin-top:4px;">Save API Key</button>
    `;
    header.parentNode.insertBefore(apiKeyDiv, header.nextSibling);

    // Set input value from storage
    const apiKeyInput = apiKeyDiv.querySelector('#quiz-api-key');
    const saveApiKeyBtn = apiKeyDiv.querySelector('#save-api-key-btn');
    // Load API key from chrome.storage.local
    getApiKey(function(key) {
      apiKeyInput.value = key;
    });

    saveApiKeyBtn.addEventListener('click', () => {
      setApiKey(apiKeyInput.value.trim(), function() {
        saveApiKeyBtn.textContent = 'Saved!';
        setTimeout(() => { saveApiKeyBtn.textContent = 'Save API Key'; }, 1200);
      });
    });
    const runBtn = document.getElementById("run");
    const statusDiv = document.createElement("div");
    statusDiv.id = "status";
    
    // Toggle switch for analysis mode
    const analysisModeToggle = document.getElementById("analysisModeToggle");
    const toggleDesc = document.getElementById("toggle-desc");
    const singleModelLabel = document.getElementById("single-model-label");
    const multiModelLabel = document.getElementById("multi-model-label");

    // Function to get selected analysis mode
    function getSelectedMode() {
      return analysisModeToggle && analysisModeToggle.checked ? 'multi' : 'single';
    }

    // Function to update button text and description based on toggle
    function updateButtonText() {
      const mode = getSelectedMode();
      const emoji = mode === 'single' ? ThemeHelper.getIcon('singleModel') : ThemeHelper.getIcon('multiModel');
      const modeText = mode === 'single' ? 'Single Model' : 'Multi-Model';
      runBtn.innerHTML = `<span class="emoji">${emoji}</span>Answer with ${modeText}`;
      // Update description
      if (toggleDesc) {
        toggleDesc.textContent = mode === 'single' ? 'Single Model (Fast & Efficient)' : 'Multi-Model (Higher Accuracy)';
      }
    }

    // Set label text
    if (singleModelLabel) singleModelLabel.innerHTML = `<span class="emoji" id="single-model-icon"></span>`;
    if (multiModelLabel) multiModelLabel.innerHTML = `<span class="emoji" id="multi-model-icon"></span>`;

    // Create buttons using theme configuration
    const processAllBtn = document.createElement("button");
    processAllBtn.className = "primary-btn";
    
    const autoCompleteBtn = document.createElement("button");
    autoCompleteBtn.className = "secondary-btn";
    autoCompleteBtn.disabled = true; // Initially disabled until questions are processed
    autoCompleteBtn.style.opacity = "0.6";
    autoCompleteBtn.style.cursor = "not-allowed";
    
    const testBtn = document.createElement("button");
    testBtn.className = "info-btn";
    testBtn.innerHTML = `${ThemeHelper.getIcon('link')} Test Connection`;
    
    // const clearBtn = document.createElement("button");
    // clearBtn.className = "danger-btn";
    // clearBtn.innerHTML = `${ThemeHelper.getIcon('trash')} Clear Log`;
    
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
    
    // Function to check if quiz data is available and update button states
    async function checkQuizDataAvailability() {
      try {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        const result = await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          func: () => {
            // Check if quiz data is available
            const hasQuizData = window.allQuizData && window.allQuizData.length > 0;
            const isProcessing = window.isProcessing || false;
            return {
              hasData: hasQuizData,
              dataLength: window.allQuizData ? window.allQuizData.length : 0,
              isProcessing: isProcessing
            };
          }
        });
        
        const dataInfo = result[0]?.result;
        updateAutoCompleteButtonState(dataInfo);
        return dataInfo;
      } catch (error) {
        console.log('Could not check quiz data availability:', error.message);
        return { hasData: false, dataLength: 0, isProcessing: false };
      }
    }
    
    // Function to update auto-complete button state
    function updateAutoCompleteButtonState(dataInfo) {
      if (dataInfo?.hasData && !dataInfo?.isProcessing) {
        // Enable button - questions are processed and available
        autoCompleteBtn.disabled = false;
        autoCompleteBtn.style.opacity = "1";
        autoCompleteBtn.style.cursor = "pointer";
        autoCompleteBtn.title = `Ready to auto-complete ${dataInfo.dataLength} questions`;
      } else if (dataInfo?.isProcessing) {
        // Disable button - processing in progress
        autoCompleteBtn.disabled = true;
        autoCompleteBtn.style.opacity = "0.6";
        autoCompleteBtn.style.cursor = "not-allowed";
        autoCompleteBtn.title = "Processing questions... Please wait.";
      } else {
        // Disable button - no data available
        autoCompleteBtn.disabled = true;
        autoCompleteBtn.style.opacity = "0.6";
        autoCompleteBtn.style.cursor = "not-allowed";
        autoCompleteBtn.title = "No quiz data available. Process questions first using 'Process All' button.";
      }
    }
    
    // Add event listener to toggle switch
    if (analysisModeToggle) {
      analysisModeToggle.addEventListener('change', () => {
        updateButtonText();
        updateProcessAllText();
        updateAutoCompleteText();
      });
    }

    // Initialize button texts and check initial state
    updateButtonText();
    updateProcessAllText();
    updateAutoCompleteText();

    // Check quiz data availability on popup open
    checkQuizDataAvailability();
    
    // Insert new elements
    runBtn.parentNode.insertBefore(statusDiv, runBtn.nextSibling);
    runBtn.parentNode.insertBefore(processAllBtn, statusDiv.nextSibling);
    runBtn.parentNode.insertBefore(autoCompleteBtn, processAllBtn.nextSibling);
    runBtn.parentNode.insertBefore(testBtn, autoCompleteBtn.nextSibling);
    // runBtn.parentNode.insertBefore(clearBtn, testBtn.nextSibling);

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
        
        // First, check if the content script is already loaded
        let scriptsLoaded = false;
        try {
          const testResults = await chrome.scripting.executeScript({
            target: { tabId: tab.id },
            func: () => {
              // Test if content script functions are available
              const hasRunQuizAssistant = typeof window.runQuizAssistant === 'function';
              const hasThemeConfig = typeof window.THEME_CONFIG !== 'undefined';
              const hasTestFunction = typeof window.testQuizAssistant === 'function';
              
              console.log('Content script availability check:', {
                runQuizAssistant: hasRunQuizAssistant,
                themeConfig: hasThemeConfig,
                testFunction: hasTestFunction,
                url: window.location.href
              });
              
              if (hasTestFunction) {
                // Run the test function to get detailed info
                return window.testQuizAssistant();
              }
              
              return {
                loaded: hasRunQuizAssistant && hasThemeConfig,
                functions: {
                  runQuizAssistant: hasRunQuizAssistant,
                  themeConfig: hasThemeConfig
                }
              };
            }
          });
          
          const testResult = testResults[0]?.result;
          scriptsLoaded = testResult?.loaded === true;
          console.log('Script loading test result:', testResult);
          
        } catch (e) {
          console.log('Content script not loaded, will inject manually. Error:', e.message);
        }
        
        // If content script is not loaded (not on quiz page), inject it manually
        if (!scriptsLoaded) {
          console.log('Injecting content scripts manually...');
          await chrome.scripting.executeScript({
            target: { tabId: tab.id },
            files: ["theme-config.js", "content.js"]
          });
          
          // Wait a moment for scripts to initialize
          await new Promise(resolve => setTimeout(resolve, 500));
        }
        
        // Execute predefined functions based on action
        let results;
        switch (action) {
          case 'runQuizAssistant':
            results = await chrome.scripting.executeScript({
              target: { tabId: tab.id },
              func: (params) => {
                console.log('Checking for runQuizAssistant function...');
                console.log('Available functions:', Object.keys(window).filter(key => key.includes('Quiz') || key.includes('quiz')));
                console.log('THEME_CONFIG available:', typeof window.THEME_CONFIG !== 'undefined');
                console.log('runQuizAssistant available:', typeof window.runQuizAssistant === 'function');
                
                if (typeof window.runQuizAssistant === 'function') {
                  console.log('Calling runQuizAssistant with mode:', params?.mode || 'single');
                  try {
                    const result = window.runQuizAssistant(params?.mode || 'single');
                    console.log('runQuizAssistant called successfully');
                    return result;
                  } catch (error) {
                    console.error('Error calling runQuizAssistant:', error);
                    return { error: error.message };
                  }
                } else {
                  console.error('runQuizAssistant function not found');
                  console.log('Current URL:', window.location.href);
                  console.log('Available window properties:', Object.keys(window).filter(key => typeof window[key] === 'function' && key.toLowerCase().includes('quiz')));
                  return { error: 'runQuizAssistant function not found' };
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
                    // Fetch API key asynchronously
                    function doFetch(apiKey) {
                      fetch(url, {
                        method: "POST",
                        headers: {
                          "Content-Type": "application/json",
                          "X-API-Key": apiKey
                        },
                        body: JSON.stringify(requestBody)
                      })
                      .then(response => response.json())
                      .then(data => {
                        // ...existing code...
                        console.log("AI Answer:", data.answer, "Confidence:", data.confidence);
                        // Use theme-based highlighting
                        const answerIndex = data.answer.charCodeAt(0) - 65;
                        if (optionEls[answerIndex]) {
                          let colors = window.ThemeHelper ? 
                            window.ThemeHelper.getConfidenceColors(data.confidence) :
                            { highlight: 'rgba(0, 255, 0, 0.2)', border: '#00ff00' };
                          // Modify colors based on consensus for multi-model responses
                          if (mode === 'multi' && data.consensus === false) {
                            // Use orange/red colors to indicate no consensus
                            colors = {
                              highlight: 'rgba(255, 152, 0, 0.3)', // Orange background
                              border: '#FF9800' // Orange border
                            };
                            // Add a consensus indicator to the option
                            const consensusIndicator = document.createElement('span');
                            consensusIndicator.textContent = ' ⚠️ No Consensus';
                            consensusIndicator.style.fontSize = '0.8em';
                            consensusIndicator.style.color = '#FF9800';
                            consensusIndicator.style.fontWeight = 'bold';
                            optionEls[answerIndex].appendChild(consensusIndicator);
                          } else if (mode === 'multi' && data.consensus === true) {
                            // Add a consensus indicator for confirmed consensus
                            const consensusIndicator = document.createElement('span');
                            consensusIndicator.textContent = ' ✓ Consensus';
                            consensusIndicator.style.fontSize = '0.8em';
                            consensusIndicator.style.color = '#4CAF50';
                            consensusIndicator.style.fontWeight = 'bold';
                            optionEls[answerIndex].appendChild(consensusIndicator);
                          }
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
                    }
                    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
                      chrome.storage.local.get(['quizApiKey'], function(result) {
                        doFetch(result.quizApiKey || '');
                      });
                    } else {
                      doFetch(localStorage.getItem('quizApiKey') || '');
                    }
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
        console.error("Error details:", {
          message: error.message,
          stack: error.stack,
          action: action,
          params: params
        });
        setStatus(`Error: ${error.message}`, "error");
        return { error: error.message, result: false };
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
      
      // Disable auto-complete button during processing
      updateAutoCompleteButtonState({ hasData: false, isProcessing: true });
      
      try {
        const result = await executeInActiveTab('runQuizAssistant', { mode });
        console.log('Process All result:', result);
        
        if (result?.error) {
          setStatus(`Error: ${result.error}`, "error");
        } else if (result?.result !== false) {
          setStatus("All questions processed! Check the on-page UI", "success");
          
          // Wait a moment for processing to complete, then check data availability
          setTimeout(async () => {
            await checkQuizDataAvailability();
          }, 1000);
        } else {
          setStatus("Failed to start processing - check browser console for details", "error");
        }
      } catch (error) {
        console.error('Process All button error:', error);
        setStatus(`Process All failed: ${error.message}`, "error");
      }
    });

    autoCompleteBtn.addEventListener("click", async () => {
      // Check if button is disabled
      if (autoCompleteBtn.disabled) {
        setStatus("Auto-complete not available. Process questions first.", "error");
        return;
      }
      
      // Double-check data availability before proceeding
      const dataInfo = await checkQuizDataAvailability();
      if (!dataInfo?.hasData) {
        setStatus("No quiz data available. Process questions first using 'Process All' button.", "error");
        updateAutoCompleteButtonState(dataInfo);
        return;
      }
      
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
      setStatus("Testing content script and connection...", "loading");
      
      try {
        // First test if content script is loaded
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        const scriptTestResult = await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          func: () => {
            if (typeof window.testQuizAssistant === 'function') {
              return window.testQuizAssistant();
            } else {
              return {
                loaded: false,
                error: 'Content script not loaded',
                functions: {
                  runQuizAssistant: typeof window.runQuizAssistant === 'function',
                  autoCompleteQuiz: typeof window.autoCompleteQuiz === 'function',
                  testCORS: typeof window.testCORS === 'function'
                }
              };
            }
          }
        });
        
        const scriptResult = scriptTestResult[0]?.result;
        console.log('Content script test result:', scriptResult);
        
        if (!scriptResult?.loaded) {
          setStatus(`Content script not loaded. Available functions: ${JSON.stringify(scriptResult?.functions)}`, "error");
          return;
        }
        
        // Check quiz data availability
        const dataInfo = await checkQuizDataAvailability();
        
        // If content script is loaded, test the CORS connection
        const corsResult = await executeInActiveTab('testCORS');
        if (corsResult?.result) {
          const dataStatus = dataInfo?.hasData ? `& ${dataInfo.dataLength} questions processed` : '& no quiz data';
          setStatus(`${ThemeHelper.getIcon('success')} Content script loaded, proxy connected ${dataStatus}!`, "success");
        } else {
          setStatus(`Content script loaded but proxy server connection failed`, "warning");
        }
        
      } catch (error) {
        console.error('Test button error:', error);
        setStatus(`Test failed: ${error.message}`, "error");
      }
    });

    // clearBtn.addEventListener("click", async () => {
    //   const result = await executeInActiveTab('clearLog');
    //   if (result?.result) {
    //     setStatus("Quiz log cleared", "success");
    //   } else {
    //     setStatus("Failed to clear log", "error");
    //   }
    // });

    // Set initial status
    setStatus("Ready! Ensure proxy server is running on localhost:3000");
  }
});

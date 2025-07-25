// Quiz Assistant Content Script - Enhanced Version with Web Search
(function() {
'use strict';

console.log("Loading Enhanced Quiz Assistant content script...");

// Prevent multiple loading of the same script
if (window.quizAssistantLoaded) {
  console.log("Quiz Assistant already loaded, skipping...");
  return;
}
window.quizAssistantLoaded = true;

// Global variables
let allQuizData = window.allQuizData || [];
let currentQuestionIndex = window.currentQuestionIndex || 0;
let isProcessing = window.isProcessing || false;

// Store references on window for persistence
window.allQuizData = allQuizData;
window.currentQuestionIndex = currentQuestionIndex;
window.isProcessing = isProcessing;

// Function to extract English text from bilingual content
function extractEnglishText(text) {
  if (!text) return '';
  
  // Remove Hindi text patterns - text after / or before /
  let englishText = text;
  
  // Pattern 1: English / Hindi - keep text before /
  englishText = englishText.replace(/\s*\/\s*[\u0900-\u097F\s]+/g, '');
  
  // Pattern 2: Hindi / English - keep text after /
  englishText = englishText.replace(/[\u0900-\u097F\s]+\s*\/\s*/g, '');
  
  // Remove any remaining Hindi characters
  englishText = englishText.replace(/[\u0900-\u097F]/g, '');
  
  // Clean up extra spaces and punctuation
  englishText = englishText.replace(/\s+/g, ' ').trim();
  
  return englishText;
}

// Function to format confidence level for display
function formatConfidence(confidence) {
  // Handle both numerical (1-10) and text (High/Medium/Low) confidence
  if (typeof confidence === 'number') {
    return `${confidence}/10`;
  }
  
  // Handle legacy text format
  if (typeof confidence === 'string') {
    const conf = confidence.toLowerCase();
    if (conf.includes('high')) return 'High';
    if (conf.includes('medium')) return 'Medium';
    if (conf.includes('low')) return 'Low';
  }
  
  return 'Unknown';
}

// Function to get confidence color based on level
function getConfidenceColor(confidence) {
  // Use theme configuration if available, otherwise fallback to hardcoded values
  if (window.ThemeHelper && window.ThemeHelper.getConfidenceColors) {
    return window.ThemeHelper.getConfidenceColors(confidence);
  }
  
  // Fallback colors if theme is not loaded
  if (typeof confidence === 'number') {
    if (confidence >= 8) return { bg: '#d4edda', text: 'green', highlight: 'rgba(0, 255, 0, 0.3)' };
    if (confidence >= 5) return { bg: '#fff3cd', text: 'orange', highlight: 'rgba(255, 165, 0, 0.3)' };
    return { bg: '#f8d7da', text: 'red', highlight: 'rgba(255, 0, 0, 0.3)' };
  } else if (typeof confidence === 'string') {
    const normalizedConf = confidence.toLowerCase();
    if (normalizedConf === 'high') return { bg: '#d4edda', text: 'green', highlight: 'rgba(0, 255, 0, 0.3)' };
    if (normalizedConf === 'medium') return { bg: '#fff3cd', text: 'orange', highlight: 'rgba(255, 165, 0, 0.3)' };
    if (normalizedConf === 'low') return { bg: '#f8d7da', text: 'red', highlight: 'rgba(255, 0, 0, 0.3)' };
  }
  return { bg: '#f8f9fa', text: 'gray', highlight: 'rgba(128, 128, 128, 0.3)' };
}

// Function to determine highlighting type for multi-model responses
function getHighlightingType(questionData) {
  if (questionData.mode !== 'multi') {
    return 'consensus'; // Single model always gets green
  }
  
  // Check for model failures
  const hasFailedModels = questionData.individual_answers && 
    Object.values(questionData.individual_answers).some(data => data.error === true);
  
  if (questionData.consensus === true) {
    return 'consensus'; // All models agree
  }
  
  if (hasFailedModels) {
    // Determine if we have partial consensus despite failures
    const workingModels = questionData.individual_answers ? 
      Object.values(questionData.individual_answers).filter(data => !data.error) : [];
    
    if (workingModels.length >= 2) {
      // Check if working models agree
      const workingAnswers = workingModels.map(model => model.answer);
      const uniqueAnswers = [...new Set(workingAnswers)];
      
      if (uniqueAnswers.length === 1) {
        return 'partial'; // Partial consensus - working models agree
      } else {
        return 'error'; // Failed models + disagreement = error highlighting
      }
    } else {
      return 'error'; // Too few working models
    }
  } else {
    return 'disagreement'; // All models responded but disagreed
  }
}

// Function to get multi-model highlighting colors with nuanced logic
function getMultiModelColors(highlightType) {
  // Use theme configuration if available
  if (window.ThemeHelper && window.ThemeHelper.getMultiModelColors) {
    return window.ThemeHelper.getMultiModelColors(highlightType);
  }
  
  // Fallback colors if theme is not loaded
  switch (highlightType) {
    case 'consensus':
      return { bg: '#d4edda', text: 'green', highlight: 'rgba(0, 255, 0, 0.3)', border: '#28a745' };
    case 'disagreement':
      return { bg: '#fff3cd', text: 'orange', highlight: 'rgba(255, 193, 7, 0.3)', border: '#ffc107' };
    case 'error':
      return { bg: '#f8d7da', text: 'red', highlight: 'rgba(220, 53, 69, 0.3)', border: '#dc3545' };
    case 'partial':
      return { bg: '#d1ecf1', text: 'blue', highlight: 'rgba(23, 162, 184, 0.3)', border: '#17a2b8' };
    case 'multiple':
      return { bg: '#fff3cd', text: 'orange', highlight: 'rgba(255, 255, 0, 0.4)', border: '#ffc107' };
    default:
      return { bg: '#d4edda', text: 'green', highlight: 'rgba(0, 255, 0, 0.3)', border: '#28a745' };
  }
}

// Function to highlight multiple answers for multi-model conflicts
function highlightMultipleAnswers(visibleQuizItem, conflictingAnswers, confidence) {
  console.log('Highlighting multiple conflicting answers:', conflictingAnswers);
  
  const optionLabels = visibleQuizItem.querySelectorAll(".wpProQuiz_questionListItem label");
  const colors = getMultiModelColors('multiple');
  
  // Highlight all conflicting answers in yellow/orange
  conflictingAnswers.forEach(answer => {
    const answerIndex = answer.charCodeAt(0) - 65;
    if (optionLabels[answerIndex]) {
      optionLabels[answerIndex].style.backgroundColor = colors.highlight;
      optionLabels[answerIndex].style.border = `2px solid ${colors.border}`;
      optionLabels[answerIndex].style.borderRadius = '4px';
    }
  });
}

// Make helper functions available globally for popup.js
window.extractEnglishText = extractEnglishText;
window.formatConfidence = formatConfidence;
window.getConfidenceColor = getConfidenceColor;

// Function to extract all quiz questions at once
function extractAllQuestions() {
  console.log("Extracting all quiz questions...");
  
  const allQuestions = [];
  const allQuizItems = document.querySelectorAll(".wpProQuiz_listItem");
  
  allQuizItems.forEach((item, index) => {
    const questionEl = item.querySelector(".wpProQuiz_question_text");
    const optionEls = item.querySelectorAll(".wpProQuiz_questionListItem label");
    
    if (questionEl && optionEls.length > 0) {
      const rawQuestion = questionEl.innerText.trim();
      const question = extractEnglishText(rawQuestion);
      
      const rawOptions = Array.from(optionEls).map(o => o.innerText.trim());
      const options = rawOptions.map(opt => extractEnglishText(opt.replace(/^[A-D]\.\s*/, '')));
      
      allQuestions.push({
        index: index,
        question: question,
        rawQuestion: rawQuestion,
        options: options,
        rawOptions: rawOptions,
        element: item,
        status: 'pending'
      });
    }
  });
  
  console.log(`Extracted ${allQuestions.length} questions`);
  return allQuestions;
}

// Function to process all questions asynchronously using batch API
async function processAllQuestionsAsync(mode = 'single') {
  if (isProcessing) {
    console.log("Already processing questions...");
    return;
  }
  
  console.log(`Processing questions with ${mode === 'single' ? 'single model' : 'multi-model consensus'} mode using batch API`);
  
  isProcessing = true;
  window.isProcessing = isProcessing;
  allQuizData = extractAllQuestions();
  window.allQuizData = allQuizData;
  
  if (allQuizData.length === 0) {
    console.error("No questions found!");
    isProcessing = false;
    window.isProcessing = isProcessing;
    return;
  }
  
  // Show processing UI
  showProcessingUI();
  
  try {
    // Prepare batch request
    const batchRequest = {
      questions: allQuizData.map(questionData => ({
        question: questionData.question,
        options: questionData.options
      }))
    };
    
    // Add multi_model parameter for multi-model analysis
    const url = mode === 'multi' 
      ? "http://localhost:3000/ask-batch?multi_model=true"
      : "http://localhost:3000/ask-batch?multi_model=false";
    
    console.log(`Sending batch request with ${allQuizData.length} questions...`);
    
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(batchRequest)
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const batchResults = await response.json();
    
    // Process batch results and update allQuizData
    batchResults.forEach((result, index) => {
      if (result.error) {
        console.error(`Error processing question ${index + 1}:`, result.error);
        allQuizData[index].status = 'error';
        allQuizData[index].error = result.error;
      } else {
        allQuizData[index].answer = result.answer;
        allQuizData[index].confidence = result.confidence;
        allQuizData[index].rawResponse = result.raw;
        allQuizData[index].reasoning = result.reasoning || 'No reasoning provided';
        allQuizData[index].mode = mode;
        allQuizData[index].status = 'completed';
        
        // Store multi-model specific data if available
        if (mode === 'multi' && result.consensus !== undefined) {
          allQuizData[index].consensus = result.consensus;
          allQuizData[index].individual_answers = result.individual_answers;
          allQuizData[index].highlight_type = result.consensus ? 'consensus' : 'conflict';
        } else {
          allQuizData[index].highlight_type = 'single';
        }
        
        const modeText = mode === 'single' ? 'Single' : 'Multi';
        let consensusText = '';
        if (mode === 'multi' && result.consensus !== undefined) {
          if (result.consensus) {
            consensusText = '✅ Consensus';
          } else {
            // Check if any models failed
            const hasFailedModels = result.individual_answers && Object.values(result.individual_answers).some(data => data.error === true);
            if (hasFailedModels) {
              const failedCount = Object.values(result.individual_answers).filter(data => data.error === true).length;
              consensusText = `❌ No Consensus (${failedCount} failed)`;
            } else {
              consensusText = '⚠️ No Consensus (disagree)';
            }
          }
        }
        console.log(`Q${index + 1} [${modeText}]: ${result.answer} (${formatConfidence(result.confidence)}) ${consensusText}`);
      }
    });
    
    updateProcessingUI();
    
  } catch (error) {
    console.error("Error in batch processing:", error);
    
    // Mark all questions as error
    allQuizData.forEach((questionData, index) => {
      if (questionData.status !== 'completed') {
        questionData.status = 'error';
        questionData.error = error.message;
      }
    });
    
    // Show error notification
    showErrorNotification(`Batch processing failed: ${error.message}`);
  }
  
  isProcessing = false;
  window.isProcessing = isProcessing;
  showResultsUI();
  console.log("All questions processed!");
}

// Function to process a single question (used for individual question processing from popup)
async function processQuestion(questionData, mode = 'single', retryCount = 0) {
  const maxRetries = 2; // Allow up to 2 retries
  
  try {
    questionData.status = 'processing';
    
    const requestBody = { 
      question: questionData.question, 
      options: questionData.options 
    };
    
    // Add multi_model parameter for multi-model analysis
    const url = mode === 'multi' 
      ? "http://localhost:3000/ask?multi_model=true"
      : "http://localhost:3000/ask?multi_model=false";
    
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }

    const data = await response.json();
    
    questionData.answer = data.answer;
    questionData.confidence = data.confidence;
    questionData.rawResponse = data.raw;
    questionData.reasoning = data.reasoning || 'No reasoning provided';
    questionData.mode = mode;
    questionData.status = 'completed';
    
    // Store multi-model specific data
    if (mode === 'multi') {
      questionData.consensus = data.consensus;
      questionData.individual_answers = data.individual_answers;
      questionData.highlight_type = data.consensus ? 'consensus' : 'conflict';
    } else {
      questionData.highlight_type = 'single';
    }
    
    const modeText = mode === 'single' ? 'Single' : 'Multi';
    let consensusText = '';
    if (mode === 'multi') {
      if (data.consensus) {
        consensusText = '✅ Consensus';
      } else {
        // Check if any models failed
        const hasFailedModels = data.individual_answers && Object.values(data.individual_answers).some(modelData => modelData.error === true);
        if (hasFailedModels) {
          const failedCount = Object.values(data.individual_answers).filter(modelData => modelData.error === true).length;
          consensusText = `❌ No Consensus (${failedCount} failed)`;
        } else {
          consensusText = '⚠️ No Consensus (disagree)';
        }
      }
    }
    console.log(`Q${questionData.index + 1} [${modeText}]: ${data.answer} (${formatConfidence(data.confidence)}) ${consensusText}`);
    
    // Clear any previous retry counts
    if (questionData.retryCount) delete questionData.retryCount;
    
  } catch (error) {
    console.error(`Error processing question ${questionData.index + 1} (attempt ${retryCount + 1}):`, error);
    
    // Check if we should retry
    if (retryCount < maxRetries) {
      console.log(`Retrying question ${questionData.index + 1} (attempt ${retryCount + 2}/${maxRetries + 1})`);
      questionData.retryCount = retryCount + 1;
      
      // Wait before retry (exponential backoff)
      await new Promise(resolve => setTimeout(resolve, 1000 * (retryCount + 1)));
      
      // Recursive retry
      return await processQuestion(questionData, mode, retryCount + 1);
    }
    
    // Max retries reached or no retry needed
    questionData.status = 'error';
    questionData.error = error.message;
    questionData.retryCount = retryCount;
    
    // Show user-friendly error notification for individual retries
    if (retryCount > 0) {
      showErrorNotification(`Question ${questionData.index + 1} failed after ${retryCount + 1} attempts: ${error.message}`);
    }
  }
}

// Enhanced Quiz Assistant Function
window.runQuizAssistant = async function(mode = 'single') {
  console.log(`Enhanced Quiz Assistant function called with ${mode} mode`);
  await processAllQuestionsAsync(mode);
};

// Test function to verify content script is loaded
window.testQuizAssistant = function() {
  console.log('Quiz Assistant content script is loaded and working!');
  console.log('Available functions:', {
    runQuizAssistant: typeof window.runQuizAssistant,
    autoCompleteQuiz: typeof window.autoCompleteQuiz,
    testCORS: typeof window.testCORS,
    processAllQuestionsAsync: typeof processAllQuestionsAsync
  });
  return {
    loaded: true,
    functions: {
      runQuizAssistant: typeof window.runQuizAssistant === 'function',
      autoCompleteQuiz: typeof window.autoCompleteQuiz === 'function',
      testCORS: typeof window.testCORS === 'function'
    }
  };
};

// Function to perform web search for a question
window.searchQuestion = function(questionData, questionIndex) {
  try {
    // Construct search query with question and options
    let searchQuery = questionData.question || '';
    
    // Add options to search query for better context
    if (questionData.options && questionData.options.length > 0) {
      const optionsText = questionData.options.join(' ');
      searchQuery += ` ${optionsText}`;
    }
    
    // Clean and encode the search query
    searchQuery = extractEnglishText(searchQuery);
    searchQuery = encodeURIComponent(searchQuery.trim());
    
    // Create Google search URL
    const googleSearchURL = `https://www.google.com/search?q=${searchQuery}`;
    
    // Open in new tab
    chrome.runtime.sendMessage({
      action: 'openTab',
      url: googleSearchURL,
      questionIndex: questionIndex + 1
    });
    
    console.log(`Web search opened for Q${questionIndex + 1}: ${questionData.question}`);
  } catch (error) {
    console.error('Error opening web search:', error);
  }
};

// Function to search all questions at once
window.searchAllQuestions = function() {
  try {
    // Open searches for all questions with a small delay between each
    allQuizData.forEach((questionData, index) => {
      setTimeout(() => {
        window.searchQuestion(questionData, index);
      }, index * 500); // 500ms delay between each search to avoid overwhelming the browser
    });
    
    console.log(`Opened web searches for all ${allQuizData.length} questions`);
  } catch (error) {
    console.error('Error opening web searches for all questions:', error);
  }
};

// Function to auto-complete the quiz
window.autoCompleteQuiz = function(mode = 'single') {
  if (allQuizData.length === 0) {
    console.error("No quiz data available. Run processAllQuestionsAsync first.");
    return;
  }
  
  console.log(`🚀 Starting auto-completion of ${allQuizData.length} questions with ${mode === 'single' ? 'single model' : 'multi-model consensus'}...`);
  console.log("📋 The extension will stop at the last question for manual review and submission.");
  
  // Start from the current visible question
  let currentIndex = 0;
  const visibleQuizItem = document.querySelector(".wpProQuiz_listItem[style='']") || 
                          document.querySelector(".wpProQuiz_listItem:not([style*='display: none'])");
  
  if (visibleQuizItem) {
    const allItems = document.querySelectorAll(".wpProQuiz_listItem");
    currentIndex = Array.from(allItems).indexOf(visibleQuizItem);
  }
  
  console.log(`Starting from question ${currentIndex + 1} of ${allQuizData.length}`);
  completeQuestionAndNext(currentIndex);
};

// Function to complete current question and move to next
function completeQuestionAndNext(index) {
  if (index >= allQuizData.length) {
    console.log("All questions completed! Quiz is ready for manual submission.");
    return;
  }
  
  const questionData = allQuizData[index];
  if (!questionData || questionData.status !== 'completed') {
    console.log(`Question ${index + 1} not ready, skipping...`);
    setTimeout(() => completeQuestionAndNext(index + 1), 100);
    return;
  }
  
  // Find the current visible question
  const visibleQuizItem = document.querySelector(".wpProQuiz_listItem[style='']") || 
                          document.querySelector(".wpProQuiz_listItem:not([style*='display: none'])");
  
  if (!visibleQuizItem) {
    console.error("No visible question found");
    return;
  }
  
  // Select the answer
  const answerIndex = questionData.answer.charCodeAt(0) - 65;
  const optionInputs = visibleQuizItem.querySelectorAll(".wpProQuiz_questionInput");
  
  if (optionInputs[answerIndex]) {
    optionInputs[answerIndex].click();
    console.log(`Q${index + 1}: Selected ${questionData.answer} (${formatConfidence(questionData.confidence)})`);
    
    // Handle multi-model highlighting based on consensus
    const optionLabels = visibleQuizItem.querySelectorAll(".wpProQuiz_questionListItem label");
    if (optionLabels[answerIndex]) {
      if (questionData.mode === 'multi') {
        const highlightType = getHighlightingType(questionData);
        const colors = getMultiModelColors(highlightType);
        
        optionLabels[answerIndex].style.backgroundColor = colors.highlight;
        optionLabels[answerIndex].style.border = `3px solid ${colors.border}`;
        optionLabels[answerIndex].style.borderRadius = '4px';
        
        // Enhanced logging based on highlight type
        switch (highlightType) {
          case 'consensus':
            console.log(`Q${index + 1}: ✅ Multi-model consensus on answer ${questionData.answer}`);
            break;
          case 'disagreement':
            console.log(`Q${index + 1}: ⚠️ Multi-model disagreement - selected best answer ${questionData.answer}`);
            break;
          case 'partial':
            console.log(`Q${index + 1}: 🔄 Partial consensus - working models agree on ${questionData.answer}`);
            break;
          case 'error':
            console.log(`Q${index + 1}: ❌ Model errors affected consensus - selected answer ${questionData.answer}`);
            break;
        }
        
        // Log individual model answers for debugging
        if (questionData.individual_answers) {
          console.log(`Q${index + 1}: Individual answers:`, questionData.individual_answers);
        }
      } else {
        // Single model: Standard green highlighting
        const colors = getMultiModelColors('consensus');
        optionLabels[answerIndex].style.backgroundColor = colors.highlight;
        optionLabels[answerIndex].style.border = `3px solid ${colors.border}`;
        optionLabels[answerIndex].style.borderRadius = '4px';
      }
    }
  }
  
  // Check if this is the last question
  const isLastQuestion = (index + 1) >= allQuizData.length;
  
  if (isLastQuestion) {
    console.log("🎯 LAST QUESTION COMPLETED! Extension stopped for manual review and submission.");
    console.log("📝 Please review your answers and manually submit the quiz when ready.");
    
    // Show a notification in the UI
    setTimeout(() => {
      const ui = document.getElementById('quizAssistantUI');
      if (ui) {
        const notification = document.createElement('div');
        notification.style.cssText = `
          position: fixed; 
          top: 50%; 
          left: 50%; 
          transform: translate(-50%, -50%); 
          background: #28a745; 
          color: white; 
          padding: 20px; 
          border-radius: 10px; 
          z-index: 10001; 
          text-align: center;
          font-weight: bold;
          box-shadow: 0 4px 8px rgba(0,0,0,0.3);
        `;
        notification.innerHTML = `
          ✅ All Questions Completed!<br>
          🔍 Please review and submit manually<br>
          <button onclick="this.parentElement.remove()" style="margin-top: 10px; padding: 5px 10px; background: white; color: #28a745; border: none; border-radius: 5px; cursor: pointer;">
            OK
          </button>
        `;
        document.body.appendChild(notification);
        
        // Auto-remove notification after 10 seconds
        setTimeout(() => {
          if (notification.parentElement) {
            notification.remove();
          }
        }, 1000);
      }
    }, 100);
    
    return; // Stop here - don't proceed to next question
  }
  
  // Move to next question after a short delay (only if not the last question)
  setTimeout(() => {
    const nextBtn = visibleQuizItem.querySelector("input[name='next']") || 
                   document.querySelector("input[name='next'].wpProQuiz_button") ||
                   document.querySelector(".wpProQuiz_button[value*='Next']");
    
    if (nextBtn) {
      nextBtn.click();
      setTimeout(() => completeQuestionAndNext(index + 1), 150);
    } else {
      console.log("Next button not found, quiz may be complete");
    }
  }, 100);
}

// Function to make popup draggable - ONLY from header
function makeDraggable() {
  const popup = document.getElementById('quizAssistantPopup');
  const dragHeader = document.getElementById('dragHeader');
  
  if (!popup || !dragHeader) return;
  
  let isDragging = false;
  let currentX;
  let currentY;
  let initialX;
  let initialY;
  let xOffset = 0;
  let yOffset = 0;
  
  // Get initial position
  const rect = popup.getBoundingClientRect();
  xOffset = rect.left;
  yOffset = rect.top;
  
  // ONLY add drag events to the header
  dragHeader.addEventListener('mousedown', dragStart);
  document.addEventListener('mousemove', drag);
  document.addEventListener('mouseup', dragEnd);
  
  // Add hover effects ONLY to header
  dragHeader.addEventListener('mouseenter', () => {
    if (!isDragging) {
      dragHeader.style.background = '#0056b3';
      dragHeader.style.cursor = 'grab';
    }
  });
  
  dragHeader.addEventListener('mouseleave', () => {
    if (!isDragging) {
      dragHeader.style.background = '#007cba';
      dragHeader.style.cursor = 'grab';
    }
  });
  
  // Also add touch support for mobile
  dragHeader.addEventListener('touchstart', dragStart);
  document.addEventListener('touchmove', drag);
  document.addEventListener('touchend', dragEnd);
  
  function dragStart(e) {
    // STRICT CHECK: Only allow dragging if the event target is within the header
    if (!dragHeader.contains(e.target)) {
      return; // Don't start drag if not clicking on header
    }
    
    e.preventDefault(); // Prevent text selection
    
    if (e.type === "touchstart") {
      initialX = e.touches[0].clientX - xOffset;
      initialY = e.touches[0].clientY - yOffset;
    } else {
      initialX = e.clientX - xOffset;
      initialY = e.clientY - yOffset;
    }
    
    isDragging = true;
    dragHeader.style.cursor = 'grabbing';
    dragHeader.style.background = '#0056b3';
    popup.style.boxShadow = '0 8px 16px rgba(0,0,0,0.4)';
    popup.style.transform = 'scale(1.02)';
    
    // Add visual feedback that we're dragging
    document.body.style.userSelect = 'none'; // Prevent text selection while dragging
  }
  
  function drag(e) {
    if (!isDragging) return;
    
    e.preventDefault();
    
    if (e.type === "touchmove") {
      currentX = e.touches[0].clientX - initialX;
      currentY = e.touches[0].clientY - initialY;
    } else {
      currentX = e.clientX - initialX;
      currentY = e.clientY - initialY;
    }
    
    xOffset = currentX;
    yOffset = currentY;
    
    // Constrain to viewport
    const maxX = window.innerWidth - popup.offsetWidth;
    const maxY = window.innerHeight - popup.offsetHeight;
    
    xOffset = Math.max(0, Math.min(xOffset, maxX));
    yOffset = Math.max(0, Math.min(yOffset, maxY));
    
    popup.style.left = xOffset + 'px';
    popup.style.top = yOffset + 'px';
    popup.style.right = 'auto'; // Remove right positioning
  }
  
  function dragEnd(e) {
    if (!isDragging) return;
    
    initialX = currentX;
    initialY = currentY;
    isDragging = false;
    
    // Reset cursor and styling
    dragHeader.style.cursor = 'grab';
    dragHeader.style.background = '#007cba';
    popup.style.boxShadow = '0 4px 8px rgba(0,0,0,0.3)';
    popup.style.transform = 'scale(1)';
    
    // Re-enable text selection
    document.body.style.userSelect = '';
  }
}

// UI Functions
function showProcessingUI() {
  removeExistingUI();
  
  // Get theme configuration or use fallback values
  const theme = window.THEME_CONFIG || {
    colors: {
      popupBackground: 'white',
      primary: '#007cba',
      lightGray: '#f0f0f0',
      white: 'white'
    },
    icons: {
      robot: '🤖',
      pin: '📌',
      close: '✕'
    },
    shadows: {
      medium: '0 4px 8px rgba(0,0,0,0.3)'
    },
    borderRadius: {
      xl: '10px',
      large: '8px'
    },
    spacing: {
      lg: '15px',
      md: '10px'
    },
    zIndex: {
      popup: 10000
    }
  };
  
  const ui = document.createElement('div');
  ui.id = 'quizAssistantUI';
  ui.innerHTML = `
    <div id="quizAssistantPopup" style="position: fixed; top: 200px; right: 800px; background: ${theme.colors.popupBackground}; border: 2px solid ${theme.colors.primary}; 
                border-radius: ${theme.borderRadius.xl}; padding: ${theme.spacing.lg}; z-index: ${theme.zIndex.popup}; max-width: 450px; min-width: 350px; box-shadow: ${theme.shadows.medium}; cursor: default; transition: box-shadow 0.2s, transform 0.2s;">
      <div id="dragHeader" style="margin: -${theme.spacing.lg} -${theme.spacing.lg} ${theme.spacing.md} -${theme.spacing.lg}; padding: ${theme.spacing.md} ${theme.spacing.lg}; background: ${theme.colors.primary}; color: ${theme.colors.white}; border-radius: ${theme.borderRadius.large} ${theme.borderRadius.large} 0 0; cursor: grab; user-select: none; transition: background 0.2s; border-bottom: 1px solid rgba(255,255,255,0.1);">
        <h3 style="margin: 0; color: ${theme.colors.white}; display: flex; justify-content: space-between; align-items: center;">
          <span>${theme.icons.robot} Quiz Assistant</span>
          <div style="display: flex; align-items: center; gap: ${theme.spacing.md};">
            <span style="font-size: 12px; opacity: 0.8;">${theme.icons.pin} Drag header to move</span>
            <button id="closePopup" style="background: none; border: none; color: ${theme.colors.white}; font-size: 18px; cursor: pointer; padding: 0; opacity: 0.8; transition: opacity 0.2s, transform 0.2s;" title="Close">${theme.icons.close}</button>
          </div>
        </h3>
      </div>
      <div id="processingStatus">Processing questions...</div>
      <div id="progressBar" style="width: 100%; height: 20px; background: ${theme.colors.lightGray}; border-radius: ${theme.borderRadius.xl}; margin: ${theme.spacing.md} 0;">
        <div id="progressFill" style="height: 100%; background: ${theme.colors.primary}; border-radius: ${theme.borderRadius.xl}; width: 0%; transition: width 0.3s;"></div>
      </div>
      <div id="questionsList" style="max-height: 300px; overflow-y: auto;"></div>
    </div>
  `;
  document.body.appendChild(ui);
  
  // Make the popup draggable
  makeDraggable();
  
  // Add close button functionality
  const closeBtn = document.getElementById('closePopup');
  if (closeBtn) {
    closeBtn.addEventListener('click', (e) => {
      e.stopPropagation(); // Prevent drag start
      e.preventDefault();  // Prevent any default behavior
      removeExistingUI();
    });
    
    // Prevent drag events on close button
    closeBtn.addEventListener('mousedown', (e) => {
      e.stopPropagation(); // Stop the drag from starting
    });
    
    closeBtn.addEventListener('mouseenter', () => {
      closeBtn.style.opacity = '1';
      closeBtn.style.transform = 'scale(1.1)';
    });
    
    closeBtn.addEventListener('mouseleave', () => {
      closeBtn.style.opacity = '0.8';
      closeBtn.style.transform = 'scale(1)';
    });
  }
}

function updateProcessingUI() {
  const completedCount = allQuizData.filter(q => q.status === 'completed').length;
  const totalCount = allQuizData.length;
  const percentage = Math.round((completedCount / totalCount) * 100);
  
  const progressFill = document.getElementById('progressFill');
  const processingStatus = document.getElementById('processingStatus');
  
  if (progressFill) progressFill.style.width = `${percentage}%`;
  if (processingStatus) processingStatus.textContent = `Processing: ${completedCount}/${totalCount} (${percentage}%)`;
}

function showResultsUI() {
  const questionsList = document.getElementById('questionsList');
  if (!questionsList) return;
  
  // Calculate confidence statistics dynamically to support both number and text formats
  const highConfidence = allQuizData.filter(q => {
    if (typeof q.confidence === 'number') return q.confidence >= 8;
    return q.confidence === 'High';
  }).length;
  
  const mediumConfidence = allQuizData.filter(q => {
    if (typeof q.confidence === 'number') return q.confidence >= 5 && q.confidence < 8;
    return q.confidence === 'Medium';
  }).length;
  
  const lowConfidence = allQuizData.filter(q => {
    if (typeof q.confidence === 'number') return q.confidence < 5;
    return q.confidence === 'Low';
  }).length;
  
  // Calculate multi-model statistics with enhanced categorization
  const multiModelQuestions = allQuizData.filter(q => q.mode === 'multi').length;
  
  // Count each category using the new highlighting logic
  let consensusQuestions = 0;
  let disagreementQuestions = 0;
  let partialQuestions = 0;
  let errorQuestions = 0;
  
  allQuizData.forEach(q => {
    if (q.mode === 'multi') {
      const highlightType = getHighlightingType(q);
      switch (highlightType) {
        case 'consensus':
          consensusQuestions++;
          break;
        case 'disagreement':
          disagreementQuestions++;
          break;
        case 'partial':
          partialQuestions++;
          break;
        case 'error':
          errorQuestions++;
          break;
      }
    }
  });
  
  // Count general processing errors (different from model failures)
  const processingErrors = allQuizData.filter(q => q.status === 'error').length;
  
  let statsHTML = `
    <div style="margin-bottom: 10px; font-weight: bold;">
      📊 Confidence Summary:<br>
      🟢 High: ${highConfidence} | 🟡 Medium: ${mediumConfidence} | 🔴 Low: ${lowConfidence}
      ${processingErrors > 0 ? `| ❌ Processing Errors: ${processingErrors}` : ''}
    </div>`;
  
  if (multiModelQuestions > 0) {
    statsHTML += `
      <div style="margin-bottom: 10px; font-weight: bold; color: #007bff;">
        🧠 Multi-Model Analysis:<br>
        <span style="color: #28a745;">✅ Consensus: ${consensusQuestions}</span> | 
        <span style="color: #17a2b8;">🔄 Partial: ${partialQuestions}</span> | 
        <span style="color: #ffc107;">⚠️ Disagreement: ${disagreementQuestions}</span> | 
        <span style="color: #dc3545;">❌ Errors: ${errorQuestions}</span>
      </div>
      <div style="margin-bottom: 10px; font-size: 10px; background: rgba(0, 123, 255, 0.1); padding: 6px; border-radius: 4px;">
        <strong>Highlighting Legend:</strong><br>
        🟢 <span style="color: #28a745;">Green</span> = Full consensus | 
        🔵 <span style="color: #17a2b8;">Blue</span> = Partial consensus<br>
        🟡 <span style="color: #ffc107;">Yellow</span> = Disagreement | 
        🔴 <span style="color: #dc3545;">Red</span> = Model errors
      </div>`;
  }
  
  questionsList.innerHTML = statsHTML + `
    <div style="display: flex; gap: 5px; margin-bottom: 10px;">
      <button id="autoCompleteBtn" 
              style="flex: 1; padding: 8px; background: #28a745; color: white; border: none; border-radius: 5px; cursor: pointer; font-size: 11px;">
        🚀 Auto-Fill (Stop at Last)
      </button>
      <button id="searchAllBtn" 
              style="flex: 1; padding: 8px; background: #007bff; color: white; border: none; border-radius: 5px; cursor: pointer; font-size: 11px;">
        🔍 Search All Questions
      </button>
      ${(processingErrors + errorQuestions) > 0 ? `
      <button id="retryFailedBtn" 
              style="flex: 1; padding: 8px; background: #dc3545; color: white; border: none; border-radius: 5px; cursor: pointer; font-size: 11px;">
        🔄 Retry Failed (${processingErrors + errorQuestions})
      </button>` : ''}
    </div>
    <div style="font-size: 11px; max-height: 200px; overflow-y: auto;">
      ${allQuizData.map((q, i) => {
        const colors = getConfidenceColor(q.confidence);
        const answerLetter = q.answer || 'N/A';
        const answerText = q.options && q.options[answerLetter.charCodeAt(0) - 65] 
          ? q.options[answerLetter.charCodeAt(0) - 65] 
          : 'N/A';
        
        // Multi-model analysis display with enhanced categorization
        let multiModelInfo = '';
        if (q.mode === 'multi') {
          const highlightType = getHighlightingType(q);
          const hasFailedModels = q.individual_answers && 
            Object.values(q.individual_answers).some(data => data.error === true);
          
          switch (highlightType) {
            case 'consensus':
              multiModelInfo = `
                <div style="margin-top: 4px; padding: 4px; background: rgba(0, 255, 0, 0.1); border-radius: 3px; font-size: 9px;">
                  ✅ <strong>Full consensus</strong> - All models agree
                </div>`;
              break;
            case 'disagreement':
              multiModelInfo = `
                <div style="margin-top: 4px; padding: 4px; background: rgba(255, 193, 7, 0.1); border-radius: 3px; font-size: 9px;">
                  ⚠️ <strong>Model disagreement</strong> - Selected best answer
                </div>`;
              break;
            case 'partial':
              const failedCount = Object.values(q.individual_answers).filter(data => data.error === true).length;
              multiModelInfo = `
                <div style="margin-top: 4px; padding: 4px; background: rgba(23, 162, 184, 0.1); border-radius: 3px; font-size: 9px;">
                  🔄 <strong>Partial consensus</strong> - ${failedCount} model(s) failed, others agree
                </div>`;
              break;
            case 'error':
              const errorCount = Object.values(q.individual_answers).filter(data => data.error === true).length;
              multiModelInfo = `
                <div style="margin-top: 4px; padding: 4px; background: rgba(220, 53, 69, 0.1); border-radius: 3px; font-size: 9px;">
                  ❌ <strong>Error impact</strong> - ${errorCount} model(s) failed, no reliable consensus
                </div>`;
              break;
          }
          
          if (q.individual_answers && Object.keys(q.individual_answers).length > 0) {
            multiModelInfo += `
              <div style="margin-top: 6px;">
                <button class="individualAnswersBtn" data-question-index="${i}" 
                        style="padding: 3px 6px; font-size: 9px; background: #007cba; color: white; border: none; border-radius: 3px; cursor: pointer;">
                  📊 View Individual Model Responses
                </button>
                <div id="individual-${i}" style="display: none; margin-top: 6px; font-size: 10px;">
                  ${Object.entries(q.individual_answers).map(([model, data]) => {
                    const isError = data.error === true;
                    const borderColor = isError ? '#dc3545' : '#007cba';
                    const bgColor = isError ? 'rgba(220, 53, 69, 0.05)' : 'rgba(0, 123, 186, 0.05)';
                    const modelIcon = isError ? '❌' : '🤖';
                    const modelStatus = isError ? 'ERROR' : model.toUpperCase();
                    
                    return `
                    <div style="margin: 4px 0; padding: 6px; background: ${bgColor}; border: 1px solid ${borderColor}; border-radius: 4px; ${isError ? 'border-left: 4px solid #dc3545;' : ''}">
                      <div style="font-weight: bold; color: ${borderColor}; margin-bottom: 3px; display: flex; justify-content: space-between; align-items: center;">
                        <span>${modelIcon} ${modelStatus}</span>
                        ${isError ? '<span style="font-size: 8px; background: #dc3545; color: white; padding: 1px 4px; border-radius: 2px;">FAILED</span>' : ''}
                      </div>
                      <div style="margin-bottom: 2px;">
                        <strong>Answer:</strong> ${data.answer} 
                        <span style="color: #666;">(Confidence: ${data.confidence})</span>
                        ${isError ? '<span style="color: #dc3545; font-size: 9px; margin-left: 5px;">⚠️ Fallback</span>' : ''}
                      </div>
                      ${data.reasoning ? `
                        <div style="margin-top: 4px; padding: 4px; background: ${isError ? 'rgba(220, 53, 69, 0.1)' : 'rgba(40, 167, 69, 0.05)'}; border-radius: 3px; font-size: 9px; color: ${isError ? '#721c24' : '#155724'};">
                          <strong>Reasoning:</strong> ${data.reasoning.length > 150 ? data.reasoning.substring(0, 150) + '...' : data.reasoning}
                          ${data.reasoning.length > 150 ? `<button class="fullReasoningBtn" data-model="${model}" data-question-index="${i}" style="margin-left: 5px; padding: 1px 4px; font-size: 8px; background: ${isError ? '#dc3545' : '#28a745'}; color: white; border: none; border-radius: 2px; cursor: pointer;">Full</button>` : ''}
                        </div>
                      ` : ''}
                    </div>
                  `}).join('')}
                </div>
              </div>`;
          }
        } else if (q.mode === 'single') {
          multiModelInfo = `
            <div style="margin-top: 4px; padding: 4px; background: rgba(0, 123, 255, 0.1); border-radius: 3px; font-size: 9px;">
              🚀 <strong>Single model analysis</strong>
            </div>`;
        }
        
        // Add reasoning section for all questions with improved readability
        const reasoningSection = q.reasoning && q.reasoning !== 'No reasoning provided' ? `
          <div style="margin-top: 6px;">
            <button class="reasoningBtn" data-question-index="${i}" 
                    style="padding: 4px 8px; font-size: 10px; background: #28a745; color: white; border: none; border-radius: 4px; cursor: pointer; display: flex; align-items: center; gap: 4px;">
              💡 Show Reasoning
            </button>
            <div id="reasoning-${i}" style="display: none; margin-top: 6px; padding: 8px; background: rgba(40, 167, 69, 0.05); border: 1px solid #28a745; border-radius: 4px; font-size: 11px; line-height: 1.4; color: #155724;">
              ${q.reasoning}
            </div>
          </div>` : '';
        
        // Check if this question has an error
        const hasError = q.status === 'error';
        const errorDisplay = hasError ? `
          <div style="margin-top: 6px; padding: 6px; background: rgba(220, 53, 69, 0.1); border: 1px solid #dc3545; border-radius: 4px;">
            <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 4px;">
              <span style="color: #dc3545; font-weight: bold; font-size: 10px;">❌ ERROR: ${q.error || 'Unknown error'}</span>
              <button class="retryQuestionBtn" data-question-index="${i}" 
                      style="padding: 3px 8px; font-size: 9px; background: #dc3545; color: white; border: none; border-radius: 3px; cursor: pointer;">
                🔄 Retry
              </button>
            </div>
            <div style="font-size: 9px; color: #721c24;">
              This question failed to process. Click retry to attempt again.
            </div>
          </div>` : '';
        
        return `
          <div style="margin: 5px 0; padding: 8px; background: ${hasError ? 'rgba(220, 53, 69, 0.05)' : colors.bg}; border-radius: 5px; border-left: 4px solid ${hasError ? '#dc3545' : colors.text}; ${hasError ? 'border: 1px solid #dc3545;' : ''}">
            <div style="font-weight: bold; margin-bottom: 4px; ${hasError ? 'color: #dc3545;' : ''}">
              Q${i+1}: ${q.question || 'Question not available'} ${hasError ? '⚠️' : ''}
            </div>
            <div style="margin-bottom: 4px; font-size: 10px; color: #666;">
              Options: ${q.options ? q.options.map((opt, idx) => `${String.fromCharCode(65 + idx)}. ${opt}`).join(' | ') : 'N/A'}
            </div>
            ${!hasError ? `
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <div style="display: flex; align-items: center; gap: 8px;">
                <span style="font-weight: bold;">
                  Answer: <span style="color: ${colors.text};">${answerLetter}</span> - ${answerText}
                </span>
                <button class="searchQuestionBtn" data-question-index="${i}" 
                        style="padding: 2px 6px; font-size: 9px; background: #007bff; color: white; border: none; border-radius: 3px; cursor: pointer;">
                  🔍
                </button>
              </div>
              <span style="font-size: 10px; color: ${colors.text};">
                ${formatConfidence(q.confidence)}
              </span>
            </div>
            ${multiModelInfo}
            ${reasoningSection}
            ` : ''}
            ${errorDisplay}
          </div>
        `;
      }).join('')}
    </div>
  `;
  
  // Add event listeners after DOM is created
  const autoCompleteBtn = document.getElementById('autoCompleteBtn');
  const searchAllBtn = document.getElementById('searchAllBtn');
  const retryFailedBtn = document.getElementById('retryFailedBtn');
  const searchQuestionBtns = document.querySelectorAll('.searchQuestionBtn');
  const reasoningBtns = document.querySelectorAll('.reasoningBtn');
  const individualAnswersBtns = document.querySelectorAll('.individualAnswersBtn');
  const fullReasoningBtns = document.querySelectorAll('.fullReasoningBtn');
  const retryQuestionBtns = document.querySelectorAll('.retryQuestionBtn');
  
  if (autoCompleteBtn) {
    autoCompleteBtn.addEventListener('click', function() {
      console.log('Auto-complete button clicked');
      if (typeof window.autoCompleteQuiz === 'function') {
        window.autoCompleteQuiz();
      } else {
        console.error('window.autoCompleteQuiz is not a function');
      }
    });
  }
  
  if (searchAllBtn) {
    searchAllBtn.addEventListener('click', function() {
      console.log('Search all button clicked');
      if (typeof window.searchAllQuestions === 'function') {
        window.searchAllQuestions();
      } else {
        console.error('window.searchAllQuestions is not a function');
      }
    });
  }
  
  // Add retry failed questions button event listener
  if (retryFailedBtn) {
    retryFailedBtn.addEventListener('click', async function() {
      const failedQuestions = allQuizData.filter(q => q.status === 'error');
      
      if (failedQuestions.length === 0) {
        showSuccessNotification('No failed questions to retry!');
        return;
      }
      
      // Show progress
      this.textContent = `⏳ Retrying ${failedQuestions.length} questions...`;
      this.disabled = true;
      this.style.background = '#6c757d';
      
      let successCount = 0;
      let failCount = 0;
      
      try {
        // Process failed questions one by one
        for (const question of failedQuestions) {
          try {
            const mode = question.mode || 'single';
            await processQuestion(question, mode);
            successCount++;
            
            // Update UI after each successful retry
            showResultsUI();
            
          } catch (error) {
            console.error(`Retry failed for question ${question.index + 1}:`, error);
            failCount++;
          }
        }
        
        // Show summary notification
        if (successCount > 0) {
          showSuccessNotification(`Retry completed: ${successCount} successful, ${failCount} failed`);
        } else {
          showErrorNotification(`All retries failed. Please check your connection and try again.`);
        }
        
      } catch (error) {
        console.error('Error during bulk retry:', error);
        showErrorNotification(`Bulk retry failed: ${error.message}`);
      }
      
      // Refresh the UI to show final results
      showResultsUI();
    });
  }
  
  searchQuestionBtns.forEach(btn => {
    btn.addEventListener('click', function() {
      const questionIndex = parseInt(this.getAttribute('data-question-index'));
      console.log(`Search question button clicked for index: ${questionIndex}`);
      if (typeof window.searchQuestion === 'function' && allQuizData[questionIndex]) {
        window.searchQuestion(allQuizData[questionIndex], questionIndex);
      } else {
        console.error('window.searchQuestion is not a function or question data not found');
      }
    });
  });
  
  // Add reasoning button event listeners
  reasoningBtns.forEach(btn => {
    btn.addEventListener('click', function() {
      const questionIndex = parseInt(this.getAttribute('data-question-index'));
      const reasoningDiv = document.getElementById(`reasoning-${questionIndex}`);
      const question = allQuizData[questionIndex];
      
      if (reasoningDiv) {
        if (reasoningDiv.style.display === 'none') {
          // Check if reasoning is very long (more than 500 characters)
          if (question.reasoning && question.reasoning.length > 500) {
            // Show in modal for very long reasoning
            showReasoningModal(question, questionIndex);
          } else {
            // Show inline for shorter reasoning
            reasoningDiv.style.display = 'block';
            this.textContent = '🔼 Hide Reasoning';
            this.style.background = '#dc3545';
          }
        } else {
          reasoningDiv.style.display = 'none';
          this.innerHTML = '💡 Show Reasoning';
          this.style.background = '#28a745';
        }
      }
    });
  });
  
  // Add individual answers button event listeners
  individualAnswersBtns.forEach(btn => {
    btn.addEventListener('click', function() {
      const questionIndex = parseInt(this.getAttribute('data-question-index'));
      const individualDiv = document.getElementById(`individual-${questionIndex}`);
      
      if (individualDiv) {
        if (individualDiv.style.display === 'none') {
          individualDiv.style.display = 'block';
          this.textContent = '🔼 Hide Individual Responses';
          this.style.background = '#dc3545';
        } else {
          individualDiv.style.display = 'none';
          this.textContent = '📊 View Individual Model Responses';
          this.style.background = '#007cba';
        }
      }
    });
  });
  
  // Add full reasoning button event listeners
  fullReasoningBtns.forEach(btn => {
    btn.addEventListener('click', function() {
      const questionIndex = parseInt(this.getAttribute('data-question-index'));
      const model = this.getAttribute('data-model');
      const question = allQuizData[questionIndex];
      
      if (question.individual_answers && question.individual_answers[model]) {
        const modelData = question.individual_answers[model];
        showModelReasoningModal(question, questionIndex, model, modelData);
      }
    });
  });
  
  // Add retry button event listeners
  retryQuestionBtns.forEach(btn => {
    btn.addEventListener('click', async function() {
      const questionIndex = parseInt(this.getAttribute('data-question-index'));
      const question = allQuizData[questionIndex];
      
      if (question) {
        // Show retry in progress
        this.textContent = '⏳ Retrying...';
        this.disabled = true;
        this.style.background = '#6c757d';
        
        try {
          // Determine the mode used for this question (default to single if not specified)
          const mode = question.mode || 'single';
          
          // Retry the question
          await processQuestion(question, mode);
          
          // Refresh the UI to show updated results
          showResultsUI();
          
          console.log(`Question ${questionIndex + 1} retried successfully`);
          
        } catch (error) {
          console.error(`Retry failed for question ${questionIndex + 1}:`, error);
          
          // Reset button state
          this.textContent = '🔄 Retry';
          this.disabled = false;
          this.style.background = '#dc3545';
          
          // Show error notification
          showErrorNotification(`Retry failed: ${error.message}`);
        }
      }
    });
  });
}

// Function to show error notifications
function showErrorNotification(message) {
  // Remove any existing notification
  const existingNotification = document.getElementById('errorNotification');
  if (existingNotification) {
    existingNotification.remove();
  }
  
  // Create notification
  const notification = document.createElement('div');
  notification.id = 'errorNotification';
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: #dc3545;
    color: white;
    padding: 12px 16px;
    border-radius: 6px;
    z-index: 10004;
    box-shadow: 0 4px 8px rgba(0,0,0,0.3);
    max-width: 300px;
    font-size: 12px;
  `;
  
  notification.innerHTML = `
    <div style="display: flex; align-items: center; gap: 8px;">
      <span>❌</span>
      <span>${message}</span>
      <button onclick="this.parentElement.parentElement.remove()" 
              style="background: none; border: none; color: white; font-size: 16px; cursor: pointer; margin-left: auto;">
        ✕
      </button>
    </div>
  `;
  
  document.body.appendChild(notification);
  
  // Auto-remove notification after 5 seconds
  setTimeout(() => {
    if (notification.parentElement) {
      notification.remove();
    }
  }, 5000);
}

// Function to show success notifications
function showSuccessNotification(message) {
  // Remove any existing notification
  const existingNotification = document.getElementById('successNotification');
  if (existingNotification) {
    existingNotification.remove();
  }
  
  // Create notification
  const notification = document.createElement('div');
  notification.id = 'successNotification';
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: #28a745;
    color: white;
    padding: 12px 16px;
    border-radius: 6px;
    z-index: 10004;
    box-shadow: 0 4px 8px rgba(0,0,0,0.3);
    max-width: 300px;
    font-size: 12px;
  `;
  
  notification.innerHTML = `
    <div style="display: flex; align-items: center; gap: 8px;">
      <span>✅</span>
      <span>${message}</span>
      <button onclick="this.parentElement.parentElement.remove()" 
              style="background: none; border: none; color: white; font-size: 16px; cursor: pointer; margin-left: auto;">
        ✕
      </button>
    </div>
  `;
  
  document.body.appendChild(notification);
  
  // Auto-remove notification after 3 seconds
  setTimeout(() => {
    if (notification.parentElement) {
      notification.remove();
    }
  }, 3000);
}

// Function to show reasoning in a modal dialog for better readability
function showReasoningModal(question, questionIndex) {
  // Remove any existing modal
  const existingModal = document.getElementById('reasoningModal');
  if (existingModal) {
    existingModal.remove();
  }
  
  // Create modal
  const modal = document.createElement('div');
  modal.id = 'reasoningModal';
  modal.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.7);
    z-index: 10002;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 20px;
    box-sizing: border-box;
  `;
  
  // Create modal content
  const modalContent = document.createElement('div');
  modalContent.style.cssText = `
    background: white;
    border-radius: 12px;
    max-width: 800px;
    max-height: 80vh;
    overflow-y: auto;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
    position: relative;
  `;
  
  const modeText = question.mode === 'multi' ? 'Multi-Model' : 'Single Model';
  const consensusText = question.mode === 'multi' && question.consensus !== undefined 
    ? (question.consensus ? ' (✅ Consensus)' : ' (⚠️ Conflict)') 
    : '';
  
  modalContent.innerHTML = `
    <div style="padding: 20px; border-bottom: 1px solid #eee;">
      <div style="display: flex; justify-content: between; align-items: flex-start; gap: 15px;">
        <div style="flex: 1;">
          <h3 style="margin: 0 0 10px 0; color: #333; font-size: 18px;">
            💡 AI Reasoning - Question ${questionIndex + 1}
          </h3>
          <div style="font-size: 12px; color: #666; margin-bottom: 10px;">
            ${modeText} Analysis${consensusText}
          </div>
          <div style="font-size: 14px; color: #555; font-weight: 500; background: #f8f9fa; padding: 10px; border-radius: 6px;">
            ${question.question || 'Question not available'}
          </div>
        </div>
        <button onclick="this.closest('#reasoningModal').remove()" 
                style="background: #dc3545; color: white; border: none; border-radius: 50%; width: 30px; height: 30px; cursor: pointer; font-size: 16px; display: flex; align-items: center; justify-content: center;">
          ✕
        </button>
      </div>
    </div>
    <div style="padding: 20px;">
      <div style="background: rgba(40, 167, 69, 0.05); border: 1px solid #28a745; border-radius: 8px; padding: 15px;">
        <h4 style="margin: 0 0 12px 0; color: #28a745; font-size: 16px;">🧠 AI Reasoning Process:</h4>
        <div style="font-size: 14px; line-height: 1.6; color: #333; white-space: pre-wrap; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif;">
${question.reasoning}
        </div>
      </div>
      
      ${question.answer ? `
        <div style="margin-top: 15px; padding: 12px; background: rgba(0, 123, 255, 0.05); border: 1px solid #007bff; border-radius: 8px;">
          <strong style="color: #007bff;">📝 Selected Answer:</strong> 
          <span style="font-size: 16px; font-weight: bold; color: #007bff;">${question.answer}</span>
          <span style="margin-left: 10px; font-size: 14px; color: #666;">
            (${formatConfidence(question.confidence)})
          </span>
        </div>
      ` : ''}
      
      <div style="margin-top: 20px; text-align: right;">
        <button onclick="this.closest('#reasoningModal').remove()" 
                style="padding: 8px 16px; background: #6c757d; color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 14px;">
          Close
        </button>
      </div>
    </div>
  `;
  
  modal.appendChild(modalContent);
  document.body.appendChild(modal);
  
  // Close modal when clicking outside
  modal.addEventListener('click', function(e) {
    if (e.target === modal) {
      modal.remove();
    }
  });
  
  // Close modal with Escape key
  const escapeHandler = function(e) {
    if (e.key === 'Escape') {
      modal.remove();
      document.removeEventListener('keydown', escapeHandler);
    }
  };
  document.addEventListener('keydown', escapeHandler);
}

// Function to show individual model reasoning in a modal dialog
function showModelReasoningModal(question, questionIndex, model, modelData) {
  // Remove any existing modal
  const existingModal = document.getElementById('modelReasoningModal');
  if (existingModal) {
    existingModal.remove();
  }
  
  // Create modal
  const modal = document.createElement('div');
  modal.id = 'modelReasoningModal';
  modal.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.7);
    z-index: 10003;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 20px;
    box-sizing: border-box;
  `;
  
  // Create modal content
  const modalContent = document.createElement('div');
  modalContent.style.cssText = `
    background: white;
    border-radius: 12px;
    max-width: 700px;
    max-height: 80vh;
    overflow-y: auto;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
    position: relative;
  `;
  
  modalContent.innerHTML = `
    <div style="padding: 20px; border-bottom: 1px solid #eee;">
      <div style="display: flex; justify-content: between; align-items: flex-start; gap: 15px;">
        <div style="flex: 1;">
          <h3 style="margin: 0 0 10px 0; color: #333; font-size: 18px;">
            🤖 ${model.toUpperCase()} Model Reasoning - Question ${questionIndex + 1}
          </h3>
          <div style="font-size: 14px; color: #555; font-weight: 500; background: #f8f9fa; padding: 10px; border-radius: 6px; margin-bottom: 10px;">
            ${question.question || 'Question not available'}
          </div>
          <div style="background: rgba(0, 123, 186, 0.1); padding: 8px; border-radius: 6px;">
            <strong style="color: #007cba;">Model Answer:</strong> 
            <span style="font-size: 16px; font-weight: bold; color: #007cba;">${modelData.answer}</span>
            <span style="margin-left: 10px; font-size: 14px; color: #666;">
              (${modelData.confidence})
            </span>
          </div>
        </div>
        <button onclick="this.closest('#modelReasoningModal').remove()" 
                style="background: #dc3545; color: white; border: none; border-radius: 50%; width: 30px; height: 30px; cursor: pointer; font-size: 16px; display: flex; align-items: center; justify-content: center;">
          ✕
        </button>
      </div>
    </div>
    <div style="padding: 20px;">
      <div style="background: rgba(40, 167, 69, 0.05); border: 1px solid #28a745; border-radius: 8px; padding: 15px;">
        <h4 style="margin: 0 0 12px 0; color: #28a745; font-size: 16px;">🧠 ${model.toUpperCase()} Reasoning Process:</h4>
        <div style="font-size: 14px; line-height: 1.6; color: #333; white-space: pre-wrap; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif;">
${modelData.reasoning}
        </div>
      </div>
      
      <div style="margin-top: 20px; text-align: right;">
        <button onclick="this.closest('#modelReasoningModal').remove()" 
                style="padding: 8px 16px; background: #6c757d; color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 14px;">
          Close
        </button>
      </div>
    </div>
  `;
  
  modal.appendChild(modalContent);
  document.body.appendChild(modal);
  
  // Close modal when clicking outside
  modal.addEventListener('click', function(e) {
    if (e.target === modal) {
      modal.remove();
    }
  });
  
  // Close modal with Escape key
  const escapeHandler = function(e) {
    if (e.key === 'Escape') {
      modal.remove();
      document.removeEventListener('keydown', escapeHandler);
    }
  };
  document.addEventListener('keydown', escapeHandler);
}

function removeExistingUI() {
  const existingUI = document.getElementById('quizAssistantUI');
  if (existingUI) existingUI.remove();
}

// Test function to check CORS
window.testCORS = async function() {
  try {
    console.log("Testing CORS connection to proxy server...");
    const response = await fetch("http://localhost:3000/test");
    const data = await response.json();
    console.log("CORS test successful:", data);
    return true;
  } catch (error) {
    console.error("CORS test failed:", error);
    return false;
  }
};

// Make functions available immediately
console.log("Enhanced Quiz Assistant content script loaded successfully");
console.log("Available functions: runQuizAssistant(), autoCompleteQuiz(), searchQuestion(), searchAllQuestions(), testCORS()");

// Ensure functions are properly available on window object
console.log("Verifying function availability:");
console.log("window.searchQuestion:", typeof window.searchQuestion);
console.log("window.searchAllQuestions:", typeof window.searchAllQuestions);
console.log("window.autoCompleteQuiz:", typeof window.autoCompleteQuiz);

// Also make the function available on the global window object for direct console access
if (typeof window !== 'undefined') {
  window.quizAssistant = {
    run: window.runQuizAssistant,
    autoComplete: window.autoCompleteQuiz,
    testCORS: window.testCORS,
    searchQuestion: window.searchQuestion,
    searchAllQuestions: window.searchAllQuestions,
    extractAll: () => extractAllQuestions(),
    processAll: processAllQuestionsAsync,
    extractEnglish: extractEnglishText,
    formatConfidence: formatConfidence,
    getConfidenceColor: getConfidenceColor
  };
  console.log("Functions also available as: quizAssistant.run(), quizAssistant.autoComplete(), quizAssistant.searchQuestion(), quizAssistant.searchAllQuestions()");
}

})(); // End of IIFE to prevent variable conflicts

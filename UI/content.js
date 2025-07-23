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

// Function to process all questions asynchronously
async function processAllQuestionsAsync() {
  if (isProcessing) {
    console.log("Already processing questions...");
    return;
  }
  
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
  
  // Process all questions in parallel with rate limiting
  const BATCH_SIZE = 3; // Process 3 questions at a time to avoid rate limits
  
  for (let i = 0; i < allQuizData.length; i += BATCH_SIZE) {
    const batch = allQuizData.slice(i, i + BATCH_SIZE);
    const promises = batch.map(questionData => processQuestion(questionData));
    
    try {
      await Promise.all(promises);
      updateProcessingUI();
    } catch (error) {
      console.error("Error processing batch:", error);
    }
    
    // Small delay between batches
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  isProcessing = false;
  window.isProcessing = isProcessing;
  showResultsUI();
  console.log("All questions processed!");
}

// Function to process a single question
async function processQuestion(questionData) {
  try {
    questionData.status = 'processing';
    
    const response = await fetch("http://localhost:3000/ask", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ 
        question: questionData.question, 
        options: questionData.options 
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    
    questionData.answer = data.answer;
    questionData.confidence = data.confidence;
    questionData.rawResponse = data.raw;
    questionData.status = 'completed';
    
    console.log(`Q${questionData.index + 1}: ${data.answer} (${formatConfidence(data.confidence)})`);
    
  } catch (error) {
    console.error(`Error processing question ${questionData.index + 1}:`, error);
    questionData.status = 'error';
    questionData.error = error.message;
  }
}

// Enhanced Quiz Assistant Function
window.runQuizAssistant = async function() {
  console.log("Enhanced Quiz Assistant function called");
  await processAllQuestionsAsync();
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
window.autoCompleteQuiz = function() {
  if (allQuizData.length === 0) {
    console.error("No quiz data available. Run processAllQuestionsAsync first.");
    return;
  }
  
  console.log(`🚀 Starting auto-completion of ${allQuizData.length} questions...`);
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
    
    // Highlight the selected answer
    const optionLabels = visibleQuizItem.querySelectorAll(".wpProQuiz_questionListItem label");
    if (optionLabels[answerIndex]) {
      const colors = getConfidenceColor(questionData.confidence);
      optionLabels[answerIndex].style.backgroundColor = colors.highlight;
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

// UI Functions
function showProcessingUI() {
  removeExistingUI();
  
  const ui = document.createElement('div');
  ui.id = 'quizAssistantUI';
  ui.innerHTML = `
    <div style="position: fixed; top: 200px; right: 800px; background: white; border: 2px solid #007cba; 
                border-radius: 10px; padding: 15px; z-index: 10000; max-width: 450px; min-width: 350px; box-shadow: 0 4px 8px rgba(0,0,0,0.3);">
      <h3 style="margin: 0 0 10px 0; color: #007cba;">🤖 Quiz Assistant</h3>
      <div id="processingStatus">Processing questions...</div>
      <div id="progressBar" style="width: 100%; height: 20px; background: #f0f0f0; border-radius: 10px; margin: 10px 0;">
        <div id="progressFill" style="height: 100%; background: #007cba; border-radius: 10px; width: 0%; transition: width 0.3s;"></div>
      </div>
      <div id="questionsList" style="max-height: 300px; overflow-y: auto;"></div>
    </div>
  `;
  document.body.appendChild(ui);
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
  
  questionsList.innerHTML = `
    <div style="margin-bottom: 10px; font-weight: bold;">
      📊 Confidence Summary:<br>
      🟢 High: ${highConfidence} | 🟡 Medium: ${mediumConfidence} | 🔴 Low: ${lowConfidence}
    </div>
    <div style="display: flex; gap: 5px; margin-bottom: 10px;">
      <button id="autoCompleteBtn" 
              style="flex: 1; padding: 8px; background: #28a745; color: white; border: none; border-radius: 5px; cursor: pointer; font-size: 11px;">
        🚀 Auto-Fill (Stop at Last)
      </button>
      <button id="searchAllBtn" 
              style="flex: 1; padding: 8px; background: #007bff; color: white; border: none; border-radius: 5px; cursor: pointer; font-size: 11px;">
        🔍 Search All Questions
      </button>
    </div>
    <div style="font-size: 11px; max-height: 200px; overflow-y: auto;">
      ${allQuizData.map((q, i) => {
        const colors = getConfidenceColor(q.confidence);
        const answerLetter = q.answer || 'N/A';
        const answerText = q.options && q.options[answerLetter.charCodeAt(0) - 65] 
          ? q.options[answerLetter.charCodeAt(0) - 65] 
          : 'N/A';
        
        return `
          <div style="margin: 5px 0; padding: 8px; background: ${colors.bg}; border-radius: 5px; border-left: 4px solid ${colors.text};">
            <div style="font-weight: bold; margin-bottom: 4px;">
              Q${i+1}: ${q.question || 'Question not available'}
            </div>
            <div style="margin-bottom: 4px; font-size: 10px; color: #666;">
              Options: ${q.options ? q.options.map((opt, idx) => `${String.fromCharCode(65 + idx)}. ${opt}`).join(' | ') : 'N/A'}
            </div>
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <div style="display: flex; align-items: center; gap: 8px;">
                <span style="font-weight: bold;">
                  Answer: <span style="color: ${colors.text};">${answerLetter}</span> - ${answerText}
                </span>
                <button class="searchQuestionBtn" data-question-index="${i}" 
                        style="padding: 2px 6px; background: #17a2b8; color: white; border: none; border-radius: 3px; cursor: pointer; font-size: 9px;">
                  🔍 Search
                </button>
              </div>
              <span style="color: ${colors.text}; font-weight: bold;">
                (${formatConfidence(q.confidence)})
              </span>
            </div>
          </div>
        `;
      }).join('')}
    </div>
  `;
  
  // Add event listeners after DOM is created
  const autoCompleteBtn = document.getElementById('autoCompleteBtn');
  const searchAllBtn = document.getElementById('searchAllBtn');
  const searchQuestionBtns = document.querySelectorAll('.searchQuestionBtn');
  
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

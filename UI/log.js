// Quiz Log Display Script
document.addEventListener('DOMContentLoaded', function() {
  const logTableBody = document.querySelector('#logTable tbody');
  const clearLogBtn = document.getElementById('clearLog');
  
  // Function to display the log
  function displayLog() {
    const log = JSON.parse(localStorage.getItem('quizLog') || '[]');
    logTableBody.innerHTML = '';
    
    if (log.length === 0) {
      const row = logTableBody.insertRow();
      const cell = row.insertCell(0);
      cell.colSpan = 5;
      cell.textContent = 'No quiz data logged yet.';
      cell.style.textAlign = 'center';
      cell.style.fontStyle = 'italic';
      cell.style.color = '#666';
      return;
    }
    
    log.forEach((entry, index) => {
      const row = logTableBody.insertRow();
      
      // Check if this is a multi-model entry without consensus
      const isMultiModelNoConsensus = entry.mode === 'multi' && entry.consensus === false;
      
      // Apply highlighting for non-consensus rows
      if (isMultiModelNoConsensus) {
        row.className = 'no-consensus';
        row.title = 'No consensus achieved between AI models';
      }
      
      // Time cell
      const timeCell = row.insertCell(0);
      timeCell.textContent = entry.time;
      timeCell.style.fontSize = '0.85em';
      
      // Question & Options cell
      const questionCell = row.insertCell(1);
      let questionHtml = `<strong>Q:</strong> ${entry.question}<br>`;
      entry.options.forEach((option, i) => {
        const letter = String.fromCharCode(65 + i);
        const isSelected = letter === entry.answer;
        questionHtml += `<span style="${isSelected ? 'font-weight: bold; color: #2196F3;' : ''}">${letter}. ${option}</span><br>`;
      });
      questionCell.innerHTML = questionHtml;
      
      // Answer cell
      const answerCell = row.insertCell(2);
      answerCell.innerHTML = `<strong style="color: #2196F3; font-size: 1.2em;">${entry.answer}</strong>`;
      answerCell.style.textAlign = 'center';
      
      // Confidence cell
      const confidenceCell = row.insertCell(3);
      const confidenceColor = getConfidenceColor(entry.confidence);
      confidenceCell.innerHTML = `<span style="color: ${confidenceColor}; font-weight: bold;">${entry.confidence}/10</span>`;
      confidenceCell.style.textAlign = 'center';
      
      // Model cell
      const modelCell = row.insertCell(4);
      if (entry.mode === 'multi') {
        let modelHtml = `<strong>Multi-Model</strong><br>`;
        
        // Add consensus indicator
        if (entry.consensus === true) {
          modelHtml += `<span class="consensus-indicator consensus-yes">✓ Consensus</span><br>`;
        } else if (entry.consensus === false) {
          modelHtml += `<span class="consensus-indicator consensus-no">✗ No Consensus</span><br>`;
        }
        
        // Add individual model responses if available
        if (entry.individual_answers) {
          modelHtml += '<div class="model-details">';
          Object.entries(entry.individual_answers).forEach(([model, data]) => {
            const shortModelName = getShortModelName(model);
            const statusIcon = data.error ? '❌' : '✅';
            const answerDisplay = data.error ? 'Error' : data.answer;
            const confidenceDisplay = data.error ? '0' : data.confidence;
            
            modelHtml += `<div>${statusIcon} ${shortModelName}: ${answerDisplay} (${confidenceDisplay})</div>`;
          });
          modelHtml += '</div>';
        }
        
        modelCell.innerHTML = modelHtml;
      } else {
        modelCell.innerHTML = '<strong>Single Model</strong><br><span style="font-size: 0.85em;">GPT-4.1</span>';
      }
      
      // Add reasoning tooltip
      if (entry.reasoning) {
        row.title = (row.title ? row.title + '\n\n' : '') + 'Reasoning: ' + entry.reasoning;
      }
    });
  }
  
  // Function to get confidence color
  function getConfidenceColor(confidence) {
    if (confidence >= 8) return '#4CAF50'; // Green
    if (confidence >= 6) return '#FF9800'; // Orange
    if (confidence >= 4) return '#FF5722'; // Red-orange
    return '#f44336'; // Red
  }
  
  // Function to get short model name
  function getShortModelName(model) {
    const modelMap = {
      'gpt-4.1': 'GPT',
      'gemini-2.5-pro': 'Gemini',
      'grok-4': 'Grok'
    };
    return modelMap[model] || model;
  }
  
  // Clear log functionality
  clearLogBtn.addEventListener('click', function() {
    if (confirm('Are you sure you want to clear all quiz log data?')) {
      localStorage.removeItem('quizLog');
      displayLog();
    }
  });
  
  // Initial display
  displayLog();
  
  // Refresh the log periodically to catch new entries
  setInterval(displayLog, 2000);
});

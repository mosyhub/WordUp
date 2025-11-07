import jsPDF from "jspdf";

// Generate PDF for speech reports
export const generateSpeechPDF = (speech, userName) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  const contentWidth = pageWidth - (margin * 2);

  // Header Background - Purple gradient effect
  doc.setFillColor(109, 40, 217); // Purple
  doc.rect(0, 0, pageWidth, 50, 'F');
  
  // Accent line
  doc.setFillColor(139, 92, 246); // Lighter purple
  doc.rect(0, 50, pageWidth, 3, 'F');

  // WordUP Logo/Title
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(28);
  doc.setFont(undefined, 'bold');
  doc.text('WordUP', margin, 25);
  
  doc.setFontSize(12);
  doc.setFont(undefined, 'normal');
  doc.text('Speech Practice Report', margin, 38);

  // Speech Title Box
  let yPos = 70;
  doc.setFillColor(249, 250, 251); // Light gray background
  doc.roundedRect(margin, yPos, contentWidth, 25, 3, 3, 'F');
  
  doc.setTextColor(17, 24, 39); // Dark gray
  doc.setFontSize(18);
  doc.setFont(undefined, 'bold');
  doc.text(speech.title, margin + 5, yPos + 12);
  
  doc.setFontSize(10);
  doc.setFont(undefined, 'normal');
  doc.setTextColor(107, 114, 128);
  doc.text(`Created: ${new Date(speech.createdAt).toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  })}`, margin + 5, yPos + 20);

  // User Info Section
  yPos += 40;
  doc.setFillColor(243, 232, 255); // Light purple
  doc.roundedRect(margin, yPos, contentWidth / 2 - 5, 20, 2, 2, 'F');
  
  doc.setTextColor(109, 40, 217);
  doc.setFontSize(10);
  doc.setFont(undefined, 'bold');
  doc.text('STUDENT', margin + 5, yPos + 8);
  
  doc.setTextColor(17, 24, 39);
  doc.setFontSize(12);
  doc.setFont(undefined, 'normal');
  doc.text(userName || 'Unknown', margin + 5, yPos + 15);

  // Practice Stats Section
  doc.setFillColor(254, 243, 199); // Light yellow
  doc.roundedRect(pageWidth / 2 + 5, yPos, contentWidth / 2 - 5, 20, 2, 2, 'F');
  
  doc.setTextColor(217, 119, 6);
  doc.setFontSize(10);
  doc.setFont(undefined, 'bold');
  doc.text('PRACTICE SESSIONS', pageWidth / 2 + 10, yPos + 8);
  
  doc.setTextColor(17, 24, 39);
  doc.setFontSize(12);
  doc.setFont(undefined, 'normal');
  doc.text(`${speech.practiceCount} session${speech.practiceCount !== 1 ? 's' : ''} completed`, 
    pageWidth / 2 + 10, yPos + 15);

  // Original Draft Section
  yPos += 35;
  doc.setDrawColor(109, 40, 217);
  doc.setLineWidth(0.5);
  doc.line(margin, yPos, pageWidth - margin, yPos);
  
  yPos += 8;
  doc.setTextColor(109, 40, 217);
  doc.setFontSize(14);
  doc.setFont(undefined, 'bold');
  doc.text('Original Draft', margin, yPos);
  
  yPos += 10;
  doc.setTextColor(55, 65, 81);
  doc.setFontSize(10);
  doc.setFont(undefined, 'normal');
  
  const originalLines = doc.splitTextToSize(speech.originalDraft || 'No original draft available', contentWidth);
  const maxLinesFirstPage = Math.floor((pageHeight - yPos - 20) / 5);
  
  let currentLine = 0;
  while (currentLine < originalLines.length) {
    if (currentLine > 0 && currentLine % maxLinesFirstPage === 0) {
      doc.addPage();
      yPos = 20;
      
      // Add header on new page
      doc.setFontSize(10);
      doc.setTextColor(156, 163, 175);
      doc.text(`${speech.title} - Continued`, margin, yPos);
      yPos += 10;
      doc.setTextColor(55, 65, 81);
    }
    
    doc.text(originalLines[currentLine], margin, yPos);
    yPos += 5;
    currentLine++;
    
    if (yPos > pageHeight - 20) {
      doc.addPage();
      yPos = 20;
    }
  }

  // Improved Version Section (if exists)
  if (speech.improvedVersion) {
    yPos += 10;
    
    if (yPos > pageHeight - 60) {
      doc.addPage();
      yPos = 20;
    }
    
    doc.setDrawColor(34, 197, 94);
    doc.setLineWidth(0.5);
    doc.line(margin, yPos, pageWidth - margin, yPos);
    
    yPos += 8;
    doc.setTextColor(34, 197, 94);
    doc.setFontSize(14);
    doc.setFont(undefined, 'bold');
    doc.text('AI-Improved Version', margin, yPos);
    
    yPos += 10;
    doc.setTextColor(55, 65, 81);
    doc.setFontSize(10);
    doc.setFont(undefined, 'normal');
    
    const improvedLines = doc.splitTextToSize(speech.improvedVersion, contentWidth);
    const maxLinesPerPage = Math.floor((pageHeight - 40) / 5);
    
    currentLine = 0;
    while (currentLine < improvedLines.length) {
      if (yPos > pageHeight - 20) {
        doc.addPage();
        yPos = 20;
        
        doc.setFontSize(10);
        doc.setTextColor(156, 163, 175);
        doc.text(`${speech.title} - AI-Improved Version (Continued)`, margin, yPos);
        yPos += 10;
        doc.setTextColor(55, 65, 81);
      }
      
      doc.text(improvedLines[currentLine], margin, yPos);
      yPos += 5;
      currentLine++;
    }
  }

  // Footer on last page
  const finalYPos = pageHeight - 15;
  doc.setDrawColor(229, 231, 235);
  doc.setLineWidth(0.3);
  doc.line(margin, finalYPos - 5, pageWidth - margin, finalYPos - 5);
  
  doc.setFontSize(8);
  doc.setTextColor(156, 163, 175);
  doc.setFont(undefined, 'normal');
  doc.text('Generated by WordUP - Your English Fluency Partner', margin, finalYPos);
  doc.text(`Report Date: ${new Date().toLocaleDateString()}`, pageWidth - margin - 40, finalYPos);

  // Save the PDF
  const fileName = `WordUP_${speech.title.replace(/[^a-z0-9]/gi, '_')}_${Date.now()}.pdf`;
  doc.save(fileName);
};

// Generate PDF for practice session
export const generatePracticeSessionPDF = (session) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  const contentWidth = pageWidth - (margin * 2);

  // Header Background - Purple gradient effect
  doc.setFillColor(109, 40, 217); // Purple
  doc.rect(0, 0, pageWidth, 50, 'F');
  
  // Accent line
  doc.setFillColor(236, 72, 153); // Pink
  doc.rect(0, 50, pageWidth, 3, 'F');

  // WordUP Logo/Title
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(28);
  doc.setFont(undefined, 'bold');
  doc.text('WordUP', margin, 25);
  
  doc.setFontSize(12);
  doc.setFont(undefined, 'normal');
  doc.text('Practice Session Report', margin, 38);

  // Session Date Box
  let yPos = 70;
  doc.setFillColor(249, 250, 251); // Light gray background
  doc.roundedRect(margin, yPos, contentWidth, 25, 3, 3, 'F');
  
  doc.setTextColor(17, 24, 39); // Dark gray
  doc.setFontSize(18);
  doc.setFont(undefined, 'bold');
  doc.text('Practice Session', margin + 5, yPos + 12);
  
  doc.setFontSize(10);
  doc.setFont(undefined, 'normal');
  doc.setTextColor(107, 114, 128);
  const sessionDate = new Date(session.date).toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
  doc.text(`Session Date: ${sessionDate}`, margin + 5, yPos + 20);

  // Stats Section - Word Count
  yPos += 40;
  doc.setFillColor(243, 232, 255); // Light purple
  doc.roundedRect(margin, yPos, contentWidth / 2 - 5, 20, 2, 2, 'F');
  
  doc.setTextColor(109, 40, 217);
  doc.setFontSize(10);
  doc.setFont(undefined, 'bold');
  doc.text('WORD COUNT', margin + 5, yPos + 8);
  
  doc.setTextColor(17, 24, 39);
  doc.setFontSize(12);
  doc.setFont(undefined, 'normal');
  doc.text(`${session.wordCount} words`, margin + 5, yPos + 15);

  // Stats Section - Sentence Count
  doc.setFillColor(254, 243, 199); // Light yellow
  doc.roundedRect(pageWidth / 2 + 5, yPos, contentWidth / 2 - 5, 20, 2, 2, 'F');
  
  doc.setTextColor(217, 119, 6);
  doc.setFontSize(10);
  doc.setFont(undefined, 'bold');
  doc.text('SENTENCE COUNT', pageWidth / 2 + 10, yPos + 8);
  
  doc.setTextColor(17, 24, 39);
  doc.setFontSize(12);
  doc.setFont(undefined, 'normal');
  doc.text(`${session.sentenceCount} sentences`, pageWidth / 2 + 10, yPos + 15);

  // Transcript Section
  yPos += 35;
  doc.setDrawColor(109, 40, 217);
  doc.setLineWidth(0.5);
  doc.line(margin, yPos, pageWidth - margin, yPos);
  
  yPos += 8;
  doc.setTextColor(109, 40, 217);
  doc.setFontSize(14);
  doc.setFont(undefined, 'bold');
  doc.text('Transcript', margin, yPos);
  
  yPos += 10;
  doc.setTextColor(55, 65, 81);
  doc.setFontSize(10);
  doc.setFont(undefined, 'normal');
  
  const transcriptLines = doc.splitTextToSize(session.transcript || 'No transcript available', contentWidth);
  const maxLinesFirstPage = Math.floor((pageHeight - yPos - 20) / 5);
  
  let currentLine = 0;
  while (currentLine < transcriptLines.length) {
    if (currentLine > 0 && currentLine % maxLinesFirstPage === 0) {
      doc.addPage();
      yPos = 20;
      
      // Add header on new page
      doc.setFontSize(10);
      doc.setTextColor(156, 163, 175);
      doc.text('Practice Session - Continued', margin, yPos);
      yPos += 10;
      doc.setTextColor(55, 65, 81);
    }
    
    doc.text(transcriptLines[currentLine], margin, yPos);
    yPos += 5;
    currentLine++;
    
    if (yPos > pageHeight - 20) {
      doc.addPage();
      yPos = 20;
    }
  }

  // AI Feedback Section (if exists)
  if (session.feedback) {
    yPos += 15;
    
    if (yPos > pageHeight - 80) {
      doc.addPage();
      yPos = 20;
    }
    
    // Section header with background
    doc.setFillColor(238, 242, 255); // Light indigo background
    doc.roundedRect(margin, yPos, contentWidth, 15, 2, 2, 'F');
    
    doc.setTextColor(99, 102, 241);
    doc.setFontSize(14);
    doc.setFont(undefined, 'bold');
    doc.text('AI Feedback & Analysis', margin + 5, yPos + 10);
    
    yPos += 25;
    
    // Try to parse JSON feedback
    let feedbackData;
    try {
      feedbackData = typeof session.feedback === 'string' 
        ? JSON.parse(session.feedback) 
        : session.feedback;
    } catch (e) {
      // If not JSON, treat as plain text
      feedbackData = null;
    }
    
    if (feedbackData && feedbackData.overallScore !== undefined) {
      // Display JSON formatted feedback
      
      // Overall Score Box
      doc.setFillColor(109, 40, 217);
      doc.roundedRect(margin, yPos, 50, 20, 3, 3, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(24);
      doc.setFont(undefined, 'bold');
      doc.text(feedbackData.overallScore.toString(), margin + 25, yPos + 14, { align: 'center' });
      
      doc.setFontSize(9);
      doc.setTextColor(109, 40, 217);
      doc.text('OVERALL SCORE', margin + 55, yPos + 10);
      
      yPos += 30;
      
      // Performance Metrics
      if (feedbackData.metrics) {
        doc.setFillColor(249, 250, 251);
        doc.roundedRect(margin, yPos - 2, contentWidth, 8, 1, 1, 'F');
        doc.setTextColor(109, 40, 217);
        doc.setFontSize(12);
        doc.setFont(undefined, 'bold');
        doc.text('PERFORMANCE METRICS', margin + 3, yPos + 4);
        yPos += 15;
        
        Object.keys(feedbackData.metrics).forEach(metricKey => {
          const metric = feedbackData.metrics[metricKey];
          const metricName = metricKey.charAt(0).toUpperCase() + metricKey.slice(1).replace(/([A-Z])/g, ' $1');
          
          if (yPos > pageHeight - 40) {
            doc.addPage();
            yPos = 20;
          }
          
          // Metric name and score
          doc.setFontSize(11);
          doc.setFont(undefined, 'bold');
          doc.setTextColor(55, 65, 81);
          doc.text(`${metricName}: ${metric.score}/100`, margin + 5, yPos);
          
          // Score bar
          const barWidth = 80;
          const barHeight = 4;
          const scoreWidth = (metric.score / 100) * barWidth;
          
          // Background bar
          doc.setFillColor(229, 231, 235);
          doc.roundedRect(pageWidth - margin - barWidth, yPos - 4, barWidth, barHeight, 1, 1, 'F');
          
          // Score bar with color based on score
          let barColor;
          if (metric.score >= 80) barColor = [34, 197, 94]; // Green
          else if (metric.score >= 60) barColor = [234, 179, 8]; // Yellow
          else barColor = [239, 68, 68]; // Red
          
          doc.setFillColor(...barColor);
          doc.roundedRect(pageWidth - margin - barWidth, yPos - 4, scoreWidth, barHeight, 1, 1, 'F');
          
          yPos += 8;
          
          // Feedback text
          doc.setFontSize(9);
          doc.setFont(undefined, 'normal');
          doc.setTextColor(75, 85, 99);
          const feedbackLines = doc.splitTextToSize(metric.feedback, contentWidth - 10);
          feedbackLines.forEach(line => {
            if (yPos > pageHeight - 15) {
              doc.addPage();
              yPos = 20;
            }
            doc.text(line, margin + 8, yPos);
            yPos += 5;
          });
          
          yPos += 8;
        });
      }
      
      // Strengths Section
      if (feedbackData.strengths && feedbackData.strengths.length > 0) {
        if (yPos > pageHeight - 40) {
          doc.addPage();
          yPos = 20;
        }
        
        yPos += 5;
        doc.setFillColor(220, 252, 231);
        doc.roundedRect(margin, yPos - 2, contentWidth, 8, 1, 1, 'F');
        doc.setTextColor(22, 163, 74);
        doc.setFontSize(12);
        doc.setFont(undefined, 'bold');
        doc.text('STRENGTHS', margin + 3, yPos + 4);
        yPos += 15;
        
        feedbackData.strengths.forEach(strength => {
          if (yPos > pageHeight - 15) {
            doc.addPage();
            yPos = 20;
          }
          
          doc.setTextColor(22, 163, 74);
          doc.circle(margin + 7, yPos - 1.5, 1.5, 'F');
          doc.setTextColor(55, 65, 81);
          doc.setFontSize(10);
          doc.setFont(undefined, 'normal');
          
          const lines = doc.splitTextToSize(strength, contentWidth - 15);
          lines.forEach(line => {
            if (yPos > pageHeight - 15) {
              doc.addPage();
              yPos = 20;
            }
            doc.text(line, margin + 12, yPos);
            yPos += 6;
          });
        });
        
        yPos += 5;
      }
      
      // Improvements Section
      if (feedbackData.improvements && feedbackData.improvements.length > 0) {
        if (yPos > pageHeight - 40) {
          doc.addPage();
          yPos = 20;
        }
        
        yPos += 5;
        doc.setFillColor(254, 243, 199);
        doc.roundedRect(margin, yPos - 2, contentWidth, 8, 1, 1, 'F');
        doc.setTextColor(217, 119, 6);
        doc.setFontSize(12);
        doc.setFont(undefined, 'bold');
        doc.text('AREAS FOR IMPROVEMENT', margin + 3, yPos + 4);
        yPos += 15;
        
        feedbackData.improvements.forEach(improvement => {
          if (yPos > pageHeight - 15) {
            doc.addPage();
            yPos = 20;
          }
          
          doc.setTextColor(217, 119, 6);
          doc.circle(margin + 7, yPos - 1.5, 1.5, 'F');
          doc.setTextColor(55, 65, 81);
          doc.setFontSize(10);
          doc.setFont(undefined, 'normal');
          
          const lines = doc.splitTextToSize(improvement, contentWidth - 15);
          lines.forEach(line => {
            if (yPos > pageHeight - 15) {
              doc.addPage();
              yPos = 20;
            }
            doc.text(line, margin + 12, yPos);
            yPos += 6;
          });
        });
        
        yPos += 5;
      }
      
      // Stats Section
      if (feedbackData.stats) {
        if (yPos > pageHeight - 40) {
          doc.addPage();
          yPos = 20;
        }
        
        yPos += 5;
        doc.setFillColor(249, 250, 251);
        doc.roundedRect(margin, yPos - 2, contentWidth, 8, 1, 1, 'F');
        doc.setTextColor(99, 102, 241);
        doc.setFontSize(12);
        doc.setFont(undefined, 'bold');
        doc.text('SESSION STATISTICS', margin + 3, yPos + 4);
        yPos += 15;
        
        const stats = [
          { label: 'Word Count', value: feedbackData.stats.wordCount },
          { label: 'Sentence Count', value: feedbackData.stats.sentenceCount },
          { label: 'Filler Words', value: feedbackData.stats.fillerWordCount || 0 },
          { label: 'Words Per Minute', value: feedbackData.stats.wordsPerMinute?.toFixed(1) || 'N/A' },
          { label: 'Duration', value: feedbackData.stats.duration ? `${feedbackData.stats.duration.toFixed(1)}s` : 'N/A' }
        ];
        
        stats.forEach((stat, index) => {
          if (index % 2 === 0 && yPos > pageHeight - 15) {
            doc.addPage();
            yPos = 20;
          }
          
          const xPos = index % 2 === 0 ? margin + 5 : pageWidth / 2 + 5;
          
          doc.setFontSize(9);
          doc.setFont(undefined, 'bold');
          doc.setTextColor(107, 114, 128);
          doc.text(stat.label + ':', xPos, yPos);
          
          doc.setFont(undefined, 'normal');
          doc.setTextColor(55, 65, 81);
          doc.text(stat.value.toString(), xPos + 50, yPos);
          
          if (index % 2 === 1) yPos += 8;
        });
      }
      
    } else {
      // Plain text feedback (fallback)
      let cleanFeedback = session.feedback
        .replace(/[\u{1F300}-\u{1F9FF}]/gu, '')
        .replace(/[^\x00-\x7F]/g, '')
        .replace(/\*\*/g, '')
        .replace(/#{1,6}\s/g, '')
        .replace(/%%%+/g, '')
        .trim();
      
      const lines = cleanFeedback.split('\n');
      
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        
        if (!line) {
          yPos += 3;
          continue;
        }
        
        const isHeader = /^[A-Z\s:]{10,}:?$/.test(line) || 
                        (line.endsWith(':') && line.length < 50);
        
        if (isHeader) {
          if (yPos > pageHeight - 30) {
            doc.addPage();
            yPos = 20;
          }
          
          yPos += 5;
          doc.setFillColor(249, 250, 251);
          doc.roundedRect(margin, yPos - 2, contentWidth, 8, 1, 1, 'F');
          doc.setTextColor(109, 40, 217);
          doc.setFontSize(11);
          doc.setFont(undefined, 'bold');
          doc.text(line, margin + 3, yPos + 4);
          yPos += 15;
        } else {
          doc.setTextColor(55, 65, 81);
          doc.setFontSize(10);
          doc.setFont(undefined, 'normal');
          
          const wrappedLines = doc.splitTextToSize(line, contentWidth - 10);
          
          for (let j = 0; j < wrappedLines.length; j++) {
            if (yPos > pageHeight - 20) {
              doc.addPage();
              yPos = 20;
            }
            
            const currentLine = wrappedLines[j].trim();
            
            if (currentLine.startsWith('-') || currentLine.startsWith('*')) {
              doc.setTextColor(99, 102, 241);
              doc.circle(margin + 7, yPos - 1.5, 1, 'F');
              doc.setTextColor(55, 65, 81);
              doc.text(currentLine.substring(1).trim(), margin + 12, yPos);
            } else {
              doc.text(currentLine, margin + 5, yPos);
            }
            
            yPos += 6;
          }
          
          yPos += 2;
        }
      }
    }
  }

  // Footer on last page
  const finalYPos = pageHeight - 15;
  doc.setDrawColor(229, 231, 235);
  doc.setLineWidth(0.3);
  doc.line(margin, finalYPos - 5, pageWidth - margin, finalYPos - 5);
  
  doc.setFontSize(8);
  doc.setTextColor(156, 163, 175);
  doc.setFont(undefined, 'normal');
  doc.text('Generated by WordUP - Your English Fluency Partner', margin, finalYPos);
  doc.text(`Report Date: ${new Date().toLocaleDateString()}`, pageWidth - margin - 40, finalYPos);

  // Save the PDF
  const fileName = `WordUP_Practice_${session.id}_${Date.now()}.pdf`;
  doc.save(fileName);
};
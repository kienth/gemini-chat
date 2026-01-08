export const formatTextForSummary = (text: string): string => {
  // Clean up the text and add helpful context for the AI
  let cleanedText = text
    .replace(/"/g, "") // Remove extra quotes
    .replace(/ABSENT/g, "\n[ABSENT DAY]\n") // Mark absent days clearly
    .replace(/- /g, "\n• ") // Convert dashes to bullet points
    .trim();

  // Add a helpful prompt for the AI
  const prompt = `Please analyze this daily work log and provide a comprehensive summary. Organize the information by:

1. **Key Achievements & Features Developed**
2. **Bug Fixes & Issues Resolved** 
3. **System Enhancements & Improvements**
4. **Meetings & Collaboration**
5. **Infrastructure & Technical Work**

Work Log:
${cleanedText}

Please provide a detailed summary with clear categorization and highlight the most significant accomplishments.`;

  return prompt;
};

export const preprocessLongText = (text: string): string => {
  // If text is very long, format it for better AI processing
  if (text.length > 1500) {
    return formatTextForSummary(text);
  }
  return text;
};

export const getTextStatistics = (text: string) => {
  const wordCount = text.split(/\s+/).filter((word) => word.length > 0).length;
  const charCount = text.length;
  const lineCount = text.split("\n").length;

  return {
    words: wordCount,
    characters: charCount,
    lines: lineCount,
    isLong: charCount > 1500,
  };
};

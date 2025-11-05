
import { GoogleGenAI } from "@google/genai";
import { Language, ChartData } from '../types';

const getGeminiPrompt = (currentCode: string, historyCode: string[], language: Language, csvContent?: string): string => {
  if (language === 'python') {
    const csvLoaderCode = csvContent
      ? `
# An uploaded CSV is available. Loading it into pandas DataFrame \`df\`.
import pandas as pd
import io
csv_data = r"""${csvContent}"""
try:
    df = pd.read_csv(io.StringIO(csv_data))
except Exception as e:
    print(f"[AI CodeBook] Error reading uploaded CSV: {e}")
    df = pd.DataFrame() # Define df as empty to avoid NameError

`
      : '';

    const fullCode = [
      ...historyCode,
      currentCode
    ].join('\n\n# --- End of Cell ---\n\n');

    return `
      Act as a Python interpreter in a Jupyter notebook environment with a persistent state.
      The following libraries are available: pandas, numpy, matplotlib, seaborn, scikit-learn, and the standard statistics library.
      Execute the following sequence of Python code cells as if they were in a single script.
      
      *** VERY IMPORTANT INSTRUCTIONS ***
      1. Your response MUST ONLY contain the output of the FINAL code cell.
      2. If the final cell generates text output (e.g., from a print statement), provide ONLY the raw text. Do not add explanation.
      3. If the final cell generates an error, provide ONLY the Python traceback and error message. Do not add explanation.
      4. If the final cell generates a plot (e.g., calling plt.show(), sns.lineplot(), df.plot()), respond with ONLY a valid 'recharts' JSON object. The JSON must be perfectly structured like: {"chartType": "bar" | "line" | "pie" | "scatter", "data": [...], "dataKey": "...", "xAxisKey": "..."}.
      5. If the final cell executes successfully but produces no visible output (e.g., variable assignment), respond with the exact text "[No output]".
      6. Do not wrap your response in markdown backticks or any other formatting.

      Python Code to execute:
      \`\`\`python
      ${csvLoaderCode}
      ${fullCode}
      \`\`\`
    `;
  } else { // cpp (remains stateless)
    return `
      Act as a C++ compiler (g++) and runtime environment.
      The following headers are considered included: <iostream>, <vector>, <string>, <cmath>, and <bits/stdc++.h>.
      Compile and run the following C++ code snippet.

      *** VERY IMPORTANT INSTRUCTIONS ***
      1. If the code successfully compiles and runs, provide ONLY the raw text output sent to stdout. Do not add explanation.
      2. If the code has a compilation error or a runtime error, provide ONLY the compiler error message or runtime error details. Do not add explanation.
      3. If the code compiles and runs but produces no visible output, respond with the exact text "[No output]".
      4. Your entire response must be ONLY the output, error, or "[No output]" text. Do not wrap it in markdown backticks.

      C++ Code to execute:
      \`\`\`cpp
      ${currentCode}
      \`\`\`
    `;
  }
};

export const executeCode = async (currentCode: string, historyCode: string[], language: Language, csvContent?: string): Promise<string | ChartData> => {
  if (!process.env.API_KEY) {
    throw new Error("API_KEY environment variable not set. Please set it in your development environment.");
  }

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  const model = 'gemini-2.5-flash';
  const prompt = getGeminiPrompt(currentCode, historyCode, language, csvContent);

  const response = await ai.models.generateContent({
    model: model,
    contents: prompt,
  });
  
  const textOutput = response.text.trim();

  // Try to parse as JSON first, for charts
  try {
    if (textOutput.startsWith('{') && textOutput.endsWith('}')) {
      const parsedJson = JSON.parse(textOutput);
      if (parsedJson.chartType && parsedJson.data) {
        return parsedJson as ChartData;
      }
    }
  } catch (e) {
    // Not valid JSON, so treat it as plain text. This is expected.
  }
  
  return textOutput;
};

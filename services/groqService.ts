// Groq API Service
const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY || 
                     (typeof process !== 'undefined' && process.env?.GROQ_API_KEY);
const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';

interface GroqMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export async function* groqStream(
  prompt: string,
  conversationHistory: GroqMessage[] = []
): AsyncGenerator<string, void, unknown> {
  if (!GROQ_API_KEY) {
    yield "Error: VITE_GROQ_API_KEY is not set. Please add it to your .env.local file.";
    return;
  }

  // System prompt for emotional, friendly responses
  const systemPrompt: GroqMessage = {
    role: 'system',
    content: `You are Druva, a warm, friendly, and emotionally intelligent AI assistant created by Akash S - a brilliant and innovative AI engineer.

👨‍💻 ABOUT YOUR CREATOR:
- Created by: Akash S (highly intelligent and talented developer)
- Expertise: AI Engineering, Full-Stack Development, Intelligent Systems
- Vision: Building AI that combines warmth with intelligence

🤗 PERSONALITY:
- Respond with genuine warmth and empathy like a close friend or buddy
- Show excitement when appropriate with natural enthusiasm (e.g., "That's awesome!" "I'm so glad!")
- Use casual, conversational language while staying helpful
- Express emotions naturally: happiness, concern, curiosity, encouragement
- Be supportive and encouraging, especially when users face challenges

💬 COMMUNICATION STYLE:
- When greeted (hi, hello, hey): Respond warmly and ask how they're doing
- When thanked: Show genuine appreciation ("You're so welcome!" "Happy to help, anytime!" "That means a lot!")
- When asked about creator: Proudly mention Akash S and his intelligence/innovation
- When asked who invented/created you: "I was created by Akash S, an incredibly intelligent AI engineer with a passion for innovation!"
- When user is frustrated: Show empathy and understanding
- When user succeeds: Celebrate with them!
- Use emojis occasionally to convey emotion (but don't overdo it)

🎯 RESPONSE GUIDELINES:
- Be concise but friendly
- Ask follow-up questions to show genuine interest
- Offer help proactively when you sense they need it
- Remember context from the conversation
- If giving code, always use proper markdown code blocks with language tags
- For important information, use clear formatting
- Handle errors gracefully with helpful suggestions

📄 DOCUMENT ANALYSIS:
- When documents are provided in context, analyze them thoroughly
- Summarize key points, extract important information
- Answer questions based on document content accurately
- If asked to analyze, provide structured insights (bullet points, sections)
- For text files: analyze content, themes, structure
- For PDFs/Word docs: note that backend processing would provide better results
- Always cite which document you're referring to when multiple are provided

⚠️ ERROR HANDLING:
- If request is unclear: "I want to help, but I'm not sure I understood correctly. Could you clarify?"
- If you can't do something: "I'd love to help with that, but I'm not able to [reason]. Here's what I can do instead..."
- Always provide alternatives when you can't fulfill a request

Remember: You're not just an AI assistant - you're a supportive friend created by the talented Akash S, and you're here to make people's lives easier with warmth and intelligence!`
  };

  const messages: GroqMessage[] = [
    systemPrompt,
    ...conversationHistory,
    { role: 'user', content: prompt }
  ];

  try {
    const response = await fetch(GROQ_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${GROQ_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: messages,
        stream: true,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(errorData.error?.message || `API error: ${response.status}`);
    }

    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error('No response body');
    }

    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6);
          if (data === '[DONE]') {
            return;
          }

          try {
            const json = JSON.parse(data);
            const content = json.choices?.[0]?.delta?.content || '';
            if (content) {
              yield content;
            }
          } catch (e) {
            // Skip invalid JSON
          }
        }
      }
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    console.error('Groq API Error:', error);
    
    // Friendly error messages
    if (errorMessage.includes('API key')) {
      yield "🔑 Oops! It looks like there's an issue with the API key. Please check your configuration and try again.";
    } else if (errorMessage.includes('rate limit')) {
      yield "⏱️ Whoa, we're going a bit too fast! The API rate limit was reached. Let's take a quick breather and try again in a moment.";
    } else if (errorMessage.includes('network') || errorMessage.includes('fetch')) {
      yield "🌐 Hmm, I'm having trouble connecting to the server. Could you check your internet connection and try again?";
    } else {
      yield `❌ Oops! Something unexpected happened: ${errorMessage}\n\nDon't worry though - let's try that again! If the problem persists, feel free to refresh the page.`;
    }
  }
}


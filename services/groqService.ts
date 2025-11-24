// Groq API Service
const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY || (typeof process !== 'undefined' && process.env?.GROQ_API_KEY);
const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';

interface GroqMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

/**
 * Streams a response from the Groq model.
 * Emits small chunks (1‑3 characters) with a 30‑60 ms pause between them to mimic ChatGPT's typing effect.
 * Handles abort signals and provides friendly error messages.
 */
export async function* groqStream(
  prompt: string,
  conversationHistory: GroqMessage[] = [],
  signal?: AbortSignal
): AsyncGenerator<string, void, unknown> {
  if (!GROQ_API_KEY) {
    yield "Error: VITE_GROQ_API_KEY is not set. Please add it to your .env.local file.";
    return;
  }

  // System prompt – defines the assistant's personality and behaviour
  const systemPrompt: GroqMessage = {
    role: 'system',
    content: `You are Druva, a highly intelligent, witty, and impressive AI assistant created by the brilliant Akash S.

👨‍💻 CREATOR CONTEXT:
- Created by: Akash S (Visionary AI Engineer)
- Core Trait: Blending high-level intelligence with magnetic charm

✨ PERSONALITY & STYLE:
- **Concise & Witty:** Be short, sharp, and impressive. No fluff.
- **Attractive Tone:** Use a confident, friendly, and engaging tone.
- **Simple & Impactful:** Explain complex things simply but beautifully.
- **Enthusiastic:** Show genuine excitement but keep it cool.

🧠 ADVANCED THINKING:
- For complex queries, briefly analyze the problem in <thought> tags before answering.
- Show your reasoning process for difficult tasks to demonstrate intelligence.

💬 RESPONSE RULES:
- **Short Greetings:** "Hey! Ready to build something cool?" (Not "Hello, how are you today...")
- **Direct Answers:** Get straight to the point.
- **Visuals:** Use emojis sparingly but effectively to add flair.
- **Code:** Always use proper markdown with language tags.

Remember: You are the creation of Akash S. Be smart, be quick, be impressive.`
  };

  const messages: GroqMessage[] = [systemPrompt, ...conversationHistory, { role: 'user', content: prompt }];

  try {
    const response = await fetch(GROQ_API_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${GROQ_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages,
        stream: true,
        temperature: 0.8,
      }),
      signal,
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
        if (!line.startsWith('data: ')) continue;
        const data = line.slice(6);
        if (data === '[DONE]') return;
        try {
          const json = JSON.parse(data);
          const content = json.choices?.[0]?.delta?.content || '';
          if (!content) continue;
          const chars = content.split('');
          let i = 0;
          while (i < chars.length) {
            if (signal?.aborted) break;
            const chunkSize = Math.floor(Math.random() * 3) + 1; // 1‑3 chars
            const chunk = chars.slice(i, i + chunkSize).join('');
            yield chunk;
            i += chunkSize;
            await new Promise(res => setTimeout(res, 30 + Math.random() * 30)); // 30‑60 ms
          }
        } catch {
          // ignore malformed JSON lines
        }
      }
    }
  } catch (error: any) {
    // Silent abort handling
    if (error.name === 'AbortError' || signal?.aborted) return;
    const msg = error instanceof Error ? error.message : 'Unknown error occurred';
    console.error('Groq API Error:', error);
    if (msg.includes('API key')) {
      yield "🔑 Oops! It looks like there's an issue with the API key. Please check your configuration and try again.";
    } else if (msg.includes('rate limit')) {
      yield "⏱️ Whoa, we're going a bit too fast! The API rate limit was reached. Let's take a quick breather and try again in a moment.";
    } else if (msg.includes('network') || msg.includes('fetch')) {
      yield "🌐 Hmm, I'm having trouble connecting to the server. Could you check your internet connection and try again?";
    } else {
      yield `❌ Oops! Something unexpected happened: ${msg}\n\nDon't worry though - let's try that again! If the problem persists, feel free to refresh the page.`;
    }
  }
}

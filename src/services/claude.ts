import { getApiKey as getCachedApiKey } from '@/lib/dataSync';

const MODEL = 'claude-sonnet-4-20250514';
const API_URL = 'https://api.anthropic.com/v1/messages';
const API_VERSION = '2023-06-01';

function getApiKey(): string {
  const key = getCachedApiKey();
  if (!key) throw new Error('API key not configured');
  return key;
}

export async function createMessage(
  systemPrompt: string,
  messages: Array<{ role: string; content: string }>,
  maxTokens: number = 4096
): Promise<string> {
  const apiKey = getApiKey();

  const response = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': API_VERSION,
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: maxTokens,
      system: systemPrompt,
      messages,
    }),
  });

  const data = await response.json();

  if (data.error) {
    throw new Error(data.error.message || 'Claude API error');
  }

  return data.content[0].text;
}

export async function streamMessage(
  systemPrompt: string,
  messages: Array<{ role: string; content: string }>,
  onText: (text: string) => void,
  onComplete: () => void,
  onError: (error: Error) => void,
  maxTokens: number = 2048
): Promise<void> {
  const apiKey = getApiKey();

  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': API_VERSION,
        'anthropic-dangerous-direct-browser-access': 'true',
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: maxTokens,
        stream: true,
        system: systemPrompt,
        messages,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || `API error: ${response.status}`);
    }

    const reader = response.body?.getReader();
    if (!reader) throw new Error('No response body');

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
          const data = line.slice(6).trim();
          if (data === '[DONE]') continue;

          try {
            const event = JSON.parse(data);
            if (
              event.type === 'content_block_delta' &&
              event.delta?.type === 'text_delta'
            ) {
              onText(event.delta.text);
            }
          } catch {
            // Skip malformed JSON lines
          }
        }
      }
    }

    onComplete();
  } catch (error) {
    onError(error instanceof Error ? error : new Error(String(error)));
  }
}

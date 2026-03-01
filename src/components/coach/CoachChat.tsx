import { useEffect, useRef, useState } from 'react';
import { Send, Trash2, AlertCircle } from 'lucide-react';
import { useChatStore } from '@/stores/useChatStore';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';

interface CoachChatProps {
  pid: string;
  maxHeight?: string;
}

export default function CoachChat({ pid, maxHeight = '400px' }: CoachChatProps) {
  const {
    messages,
    isStreaming,
    streamingText,
    error,
    loadMessages,
    sendMessage,
    clearChat,
  } = useChatStore();

  const [input, setInput] = useState('');
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadMessages(pid);
  }, [pid, loadMessages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamingText]);

  function handleSend() {
    const trimmed = input.trim();
    if (!trimmed || isStreaming) return;
    setInput('');
    sendMessage(pid, trimmed);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  function handleClearConfirm() {
    clearChat(pid);
    setShowClearConfirm(false);
  }

  return (
    <div className="flex flex-col" style={{ maxHeight }}>
      {/* Header with clear button */}
      <div className="flex items-center justify-end px-2 pb-2 flex-shrink-0">
        <button
          onClick={() => setShowClearConfirm(true)}
          className="cursor-pointer rounded-lg p-1.5 text-muted hover:text-danger transition-all duration-200"
          title="Clear Chat"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="mx-2 mb-2 flex items-center gap-2 rounded-xl bg-danger/15 border border-danger/20 px-3 py-2 flex-shrink-0">
          <AlertCircle className="h-4 w-4 text-danger flex-shrink-0" />
          <p className="text-xs text-danger">{error}</p>
        </div>
      )}

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto px-2 space-y-3 min-h-0">
        {messages.length === 0 && !isStreaming && (
          <div className="flex flex-col items-center justify-center py-8 text-center px-4">
            <p className="text-muted text-sm mb-1">No messages yet.</p>
            <p className="text-xs text-muted">
              Ask your coach about training, schedule changes, or fitness goals.
            </p>
          </div>
        )}

        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[85%] rounded-2xl px-4 py-3 ${
                msg.role === 'user'
                  ? 'bg-primary text-white rounded-br-md'
                  : 'glass text-text rounded-bl-md'
              }`}
            >
              <p className="text-sm whitespace-pre-wrap break-words">
                {msg.content}
              </p>
              <p
                className={`text-xs mt-1 ${
                  msg.role === 'user' ? 'text-white/60' : 'text-muted'
                }`}
              >
                {new Date(msg.timestamp).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </p>
            </div>
          </div>
        ))}

        {/* Streaming message */}
        {isStreaming && streamingText && (
          <div className="flex justify-start">
            <div className="max-w-[85%] rounded-2xl rounded-bl-md glass text-text px-4 py-3">
              <p className="text-sm whitespace-pre-wrap break-words">
                {streamingText}
              </p>
              <span className="inline-block w-2 h-2 rounded-full bg-primary animate-pulse mt-1" />
            </div>
          </div>
        )}

        {/* Streaming indicator */}
        {isStreaming && !streamingText && (
          <div className="flex justify-start">
            <div className="rounded-2xl rounded-bl-md glass px-4 py-3">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-muted animate-pulse" />
                <span className="w-2 h-2 rounded-full bg-muted animate-pulse [animation-delay:150ms]" />
                <span className="w-2 h-2 rounded-full bg-muted animate-pulse [animation-delay:300ms]" />
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="flex-shrink-0 px-2 pt-2">
        <div className="flex items-center gap-2">
          <input
            ref={inputRef}
            type="text"
            placeholder="Ask your coach..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            className="bg-white/5 text-text border border-white/10 rounded-xl px-4 py-3 flex-1 focus:ring-2 focus:ring-primary/50 focus:border-primary/50 focus:outline-none transition-all text-sm"
            disabled={isStreaming}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isStreaming}
            className="bg-gradient-to-r from-primary to-indigo-500 text-white rounded-xl p-3 cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed hover:brightness-110 shadow-lg shadow-primary/25 transition-all duration-200 active:scale-[0.98]"
          >
            <Send className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Clear Chat Modal */}
      <Modal
        open={showClearConfirm}
        onClose={() => setShowClearConfirm(false)}
        title="Clear Chat"
      >
        <div className="flex flex-col gap-4">
          <p className="text-muted">
            Are you sure you want to clear your entire chat history? This cannot
            be undone.
          </p>
          <div className="flex gap-3 justify-end">
            <Button
              title="Cancel"
              variant="outline"
              size="sm"
              onClick={() => setShowClearConfirm(false)}
            />
            <Button
              title="Clear"
              variant="danger"
              size="sm"
              onClick={handleClearConfirm}
            />
          </div>
        </div>
      </Modal>
    </div>
  );
}

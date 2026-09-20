import { ArrowLeft, BadgeCheck, Send } from 'lucide-react';
import { useState } from 'react';
import type { ContractorProfile } from './ContractorCard';

interface ChatMessage {
  id: string;
  author: 'customer' | 'contractor';
  text: string;
}

interface InAppChatProps {
  contractor: ContractorProfile;
  onClose: () => void;
}

const initialMessages: ChatMessage[] = [
  { id: 'message-1', author: 'customer', text: 'Hi, what time will you arrive?' },
  { id: 'message-2', author: 'contractor', text: 'I will be there at 2 PM.' },
  { id: 'message-3', author: 'customer', text: 'Great, thank you.' },
];

export function InAppChat({ contractor, onClose }: InAppChatProps) {
  const [messages, setMessages] = useState(initialMessages);
  const [draft, setDraft] = useState('');

  function sendMessage() {
    const text = draft.trim();
    if (!text) return;
    setMessages((current) => [...current, { id: `message-${Date.now()}`, author: 'customer', text }]);
    setDraft('');
  }

  return (
    <section className="fixed inset-0 z-50 flex items-end bg-foreground/25 p-0 sm:items-center sm:justify-center sm:p-6" role="dialog" aria-modal="true" aria-label={`Chat with ${contractor.name}`}>
      <div className="flex h-[min(42rem,90vh)] w-full max-w-lg flex-col rounded-t-xl border border-border bg-card shadow-xl sm:rounded-xl">
        <header className="flex items-center gap-3 border-b border-border p-4">
          <button type="button" onClick={onClose} className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground" aria-label="Close chat" title="Close chat">
            <ArrowLeft aria-hidden="true" className="size-5" />
          </button>
          <div>
            <p className="font-bold text-foreground">{contractor.name}</p>
            <p className="mt-0.5 inline-flex items-center gap-1 text-xs font-medium text-emerald-700"><BadgeCheck aria-hidden="true" className="size-3.5" /> ID Verified</p>
          </div>
        </header>

        <div className="flex-1 space-y-3 overflow-y-auto p-4" aria-live="polite">
          {messages.map((message) => (
            <div key={message.id} className={`flex ${message.author === 'customer' ? 'justify-end' : 'justify-start'}`}>
              <p className={`max-w-[80%] rounded-lg px-3 py-2 text-sm ${message.author === 'customer' ? 'bg-primary text-primary-foreground' : 'bg-muted text-foreground'}`}>{message.text}</p>
            </div>
          ))}
        </div>

        <form onSubmit={(event) => { event.preventDefault(); sendMessage(); }} className="flex gap-2 border-t border-border p-3">
          <input value={draft} onChange={(event) => setDraft(event.target.value)} placeholder="Write a message" className="min-w-0 flex-1 rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30" />
          <button type="submit" className="inline-flex items-center justify-center rounded-lg bg-primary px-3 text-primary-foreground transition-colors hover:bg-primary/90" aria-label="Send message" title="Send message">
            <Send aria-hidden="true" className="size-4" />
          </button>
        </form>
      </div>
    </section>
  );
}
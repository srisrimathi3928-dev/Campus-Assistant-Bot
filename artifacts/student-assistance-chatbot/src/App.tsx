import { type FormEvent, type KeyboardEvent, type ReactNode, useEffect, useRef, useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { getGetStudentTopicsQueryKey, useAskStudentAssistant, useGetStudentTopics } from '@workspace/api-client-react';
import {
  ArrowUp,
  BookOpen,
  CalendarDays,
  Check,
  ChevronRight,
  CircleHelp,
  ClipboardList,
  Clock3,
  Copy,
  GraduationCap,
  HeartPulse,
  LibraryBig,
  ListRestart,
  LoaderCircle,
  MessageCircle,
  RotateCcw,
  Sparkles,
  WalletCards,
  type LucideIcon,
} from 'lucide-react';
import { ErrorBoundary } from '@/components/error-boundary';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import NotFound from '@/pages/not-found';
import { Route, Switch, useLocation, Router as WouterRouter } from 'wouter';

const queryClient = new QueryClient();

type ChatTurn = {
  id: string;
  question: string;
  answer?: string;
  topic?: string;
  suggestedQuestions?: string[];
  status: 'pending' | 'answered' | 'error';
};

const topicIcons: LucideIcon[] = [
  BookOpen,
  CalendarDays,
  ClipboardList,
  WalletCards,
  HeartPulse,
  LibraryBig,
];

const topicTints = [
  'bg-[#eee8ff] text-[#6843bd]',
  'bg-[#fff0e5] text-[#ad5d32]',
  'bg-[#e7f5f0] text-[#2e7e68]',
  'bg-[#fbe8ef] text-[#a3486b]',
  'bg-[#e8efff] text-[#496bb2]',
  'bg-[#f6edda] text-[#92702e]',
];

function AnswerText({ answer }: { answer: string }) {
  return (
    <div className="space-y-3 text-[15px] leading-7 text-[#4d4860]">
      {answer.split(/\n{2,}/).map((paragraph, index) => (
        <p key={`${paragraph.slice(0, 12)}-${index}`}>{paragraph}</p>
      ))}
    </div>
  );
}

function TopicIcon({ index }: { index: number }) {
  const Icon = topicIcons[index % topicIcons.length];
  return <Icon className="h-[18px] w-[18px]" strokeWidth={1.8} />;
}

function Sidebar({
  turns,
  onNewConversation,
  onQuestionSelect,
}: {
  turns: ChatTurn[];
  onNewConversation: () => void;
  onQuestionSelect: (question: string) => void;
}) {
  return (
    <aside className="relative hidden w-[274px] shrink-0 flex-col overflow-hidden bg-sidebar px-5 py-6 text-sidebar-foreground lg:flex">
      <div className="pointer-events-none absolute -right-20 -top-20 h-56 w-56 rounded-full border border-white/10" />
      <div className="pointer-events-none absolute -bottom-24 -left-16 h-52 w-52 rounded-full bg-[#9d80df]/10 blur-2xl" />
      <div className="relative flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-[13px] bg-sidebar-primary text-sidebar-primary-foreground shadow-[0_7px_18px_rgba(34,20,67,.25)]">
          <GraduationCap className="h-5 w-5" strokeWidth={2.2} />
        </div>
        <div>
          <p className="font-display text-[17px] leading-none text-white">Campus guide</p>
          <p className="mt-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-sidebar-foreground/60">Student assistance</p>
        </div>
      </div>

      <button
        type="button"
        onClick={onNewConversation}
        data-testid="button-new-conversation-sidebar"
        className="mt-10 flex w-full items-center justify-between rounded-xl border border-white/15 bg-white/[.08] px-3.5 py-3 text-left text-sm font-semibold text-white transition duration-200 hover:bg-white/[.14] active:scale-[.98]"
      >
        <span className="flex items-center gap-2.5"><MessageCircle className="h-4 w-4 text-sidebar-primary" /> New conversation</span>
        <span className="rounded-md border border-white/10 px-1.5 py-0.5 text-[10px] text-white/45">N</span>
      </button>

      <div className="mt-10">
        <div className="flex items-center justify-between px-1">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-sidebar-foreground/50">This session</p>
          {turns.length > 0 && <span className="text-[11px] text-sidebar-foreground/40">{turns.length}</span>}
        </div>
        <div className="mt-3 space-y-1.5">
          {turns.length === 0 ? (
            <div className="rounded-xl border border-dashed border-white/12 px-3.5 py-4">
              <Clock3 className="mb-2 h-4 w-4 text-sidebar-foreground/45" />
              <p className="text-xs leading-5 text-sidebar-foreground/55">Questions you ask today will appear here.</p>
            </div>
          ) : (
            turns.map((turn, index) => (
              <button
                key={turn.id}
                type="button"
                onClick={() => onQuestionSelect(turn.question)}
                data-testid={`button-history-question-${index}`}
                className="group flex w-full items-start gap-2.5 rounded-lg px-2.5 py-2.5 text-left transition hover:bg-white/[.09]"
              >
                <span className={`mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full ${turn.status === 'error' ? 'bg-[#e39783]' : 'bg-sidebar-primary'}`} />
                <span className="line-clamp-2 text-xs leading-[1.35] text-sidebar-foreground/72 group-hover:text-white">{turn.question}</span>
              </button>
            ))
          )}
        </div>
      </div>

      <div className="relative mt-auto rounded-2xl border border-white/10 bg-white/[.06] p-4">
        <div className="mb-3 flex h-8 w-8 items-center justify-center rounded-lg bg-[#8f75d0]/25 text-sidebar-primary">
          <Sparkles className="h-4 w-4" />
        </div>
        <p className="text-sm font-semibold text-white">A clearer next step</p>
        <p className="mt-1.5 text-xs leading-5 text-sidebar-foreground/55">Ask in plain language. We’ll point you toward the right campus answer.</p>
      </div>
      <p className="mt-5 px-1 text-[10px] text-sidebar-foreground/35">Private session · answers may change</p>
    </aside>
  );
}

function MobileHeader({ onNewConversation }: { onNewConversation: () => void }) {
  return (
    <header className="flex items-center justify-between border-b border-[#e8e3ef] bg-[#fbf9fd]/90 px-5 py-4 backdrop-blur lg:hidden">
      <div className="flex items-center gap-2.5">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#6543b6] text-white"><GraduationCap className="h-[18px] w-[18px]" /></div>
        <div>
          <p className="font-display text-[16px] leading-none text-[#302844]">Campus guide</p>
          <p className="mt-1 text-[9px] font-bold uppercase tracking-[.16em] text-[#918a9d]">Student assistance</p>
        </div>
      </div>
      <button type="button" onClick={onNewConversation} data-testid="button-new-conversation-mobile" className="rounded-lg p-2 text-[#7056ae] transition hover:bg-[#efeaff]">
        <ListRestart className="h-[19px] w-[19px]" />
        <span className="sr-only">Start a new conversation</span>
      </button>
    </header>
  );
}

function TopicCard({
  label,
  description,
  index,
  onClick,
}: {
  label: string;
  description: string;
  index: number;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      data-testid={`button-topic-${label.toLowerCase().replace(/\s+/g, '-')}`}
      className="group flex min-h-[108px] flex-col justify-between rounded-2xl border border-[#ebe7f1] bg-white p-4 text-left shadow-[0_3px_12px_rgba(59,39,94,.025)] transition duration-200 hover:-translate-y-0.5 hover:border-[#d4c7f3] hover:shadow-[0_10px_24px_rgba(84,57,143,.10)] active:translate-y-0"
    >
      <div className="flex items-start justify-between">
        <span className={`flex h-8 w-8 items-center justify-center rounded-[10px] ${topicTints[index % topicTints.length]}`}><TopicIcon index={index} /></span>
        <ChevronRight className="h-4 w-4 text-[#b7afc3] transition duration-200 group-hover:translate-x-0.5 group-hover:text-[#7858be]" />
      </div>
      <div className="mt-3">
        <p className="text-[13px] font-bold text-[#39334d]">{label}</p>
        <p className="mt-1 line-clamp-1 text-[11px] leading-4 text-[#9690a1]">{description}</p>
      </div>
    </button>
  );
}

function TopicSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
      {[0, 1, 2].map((item) => (
        <div key={item} className="min-h-[108px] animate-pulse rounded-2xl border border-[#eeeaf4] bg-white p-4">
          <div className="h-8 w-8 rounded-[10px] bg-[#eeeaf4]" />
          <div className="mt-4 h-3 w-20 rounded-full bg-[#eeeaf4]" />
          <div className="mt-2 h-2.5 w-28 rounded-full bg-[#f4f1f7]" />
        </div>
      ))}
    </div>
  );
}

function ChatThread({
  turns,
  onRetry,
  onSuggestedQuestion,
}: {
  turns: ChatTurn[];
  onRetry: (turn: ChatTurn) => void;
  onSuggestedQuestion: (question: string) => void;
}) {
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [turns]);

  return (
    <div className="space-y-8 pb-3">
      {turns.map((turn, index) => (
        <article key={turn.id} className="rise-in" style={{ animationDelay: `${Math.min(index * 45, 180)}ms` }}>
          <div className="flex justify-end">
            <div className="max-w-[min(86%,600px)] rounded-[18px] rounded-br-[5px] bg-[#6543b6] px-4 py-3 text-[14px] leading-6 text-white shadow-[0_7px_18px_rgba(101,67,182,.15)]">
              <p data-testid={`text-question-${turn.id}`}>{turn.question}</p>
            </div>
          </div>
          <div className="mt-4 flex items-start gap-3">
            <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-[11px] bg-[#eee8ff] text-[#6843bd]"><GraduationCap className="h-4 w-4" /></div>
            <div className="min-w-0 max-w-[680px] flex-1">
              {turn.status === 'pending' && (
                <div className="flex items-center gap-2 rounded-2xl border border-[#ebe7f1] bg-white px-4 py-3 text-sm text-[#80798f] shadow-[0_3px_12px_rgba(59,39,94,.025)]" data-testid={`status-answer-loading-${turn.id}`}>
                  <span className="flex gap-1"><i className="pulse-soft h-1.5 w-1.5 rounded-full bg-[#8060c5]" /><i className="pulse-soft h-1.5 w-1.5 rounded-full bg-[#8060c5]" style={{ animationDelay: '.2s' }} /><i className="pulse-soft h-1.5 w-1.5 rounded-full bg-[#8060c5]" style={{ animationDelay: '.4s' }} /></span>
                  Looking through the campus guide
                </div>
              )}
              {turn.status === 'error' && (
                <div className="rounded-2xl border border-[#f0d4d0] bg-[#fff8f6] px-4 py-3.5" data-testid={`status-answer-error-${turn.id}`}>
                  <div className="flex gap-3">
                    <CircleHelp className="mt-0.5 h-4 w-4 shrink-0 text-[#bd6557]" />
                    <div>
                      <p className="text-sm font-semibold text-[#743f39]">That answer didn’t come through.</p>
                      <p className="mt-1 text-xs leading-5 text-[#9c6a64]">Please try once more. Your question is still here.</p>
                      <button type="button" onClick={() => onRetry(turn)} data-testid={`button-retry-${turn.id}`} className="mt-3 inline-flex items-center gap-1.5 text-xs font-bold text-[#9b5148] transition hover:text-[#6f312a]"><RotateCcw className="h-3.5 w-3.5" /> Try again</button>
                    </div>
                  </div>
                </div>
              )}
              {turn.status === 'answered' && (
                <div className="rounded-2xl rounded-tl-[5px] border border-[#e9e5f0] bg-white px-4 py-4 shadow-[0_4px_16px_rgba(59,39,94,.035)]" data-testid={`card-answer-${turn.id}`}>
                  <div className="mb-3 flex items-center gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-[.15em] text-[#9175c9]">{turn.topic || 'Campus guide'}</span>
                    <span className="h-1 w-1 rounded-full bg-[#d6d0df]" />
                    <span className="text-[10px] text-[#aaa3b4]">Just now</span>
                  </div>
                  <AnswerText answer={turn.answer || ''} />
                  <div className="mt-4 flex items-center gap-2 border-t border-[#f0edf4] pt-3">
                    <span className="flex items-center gap-1.5 text-[11px] text-[#a19aaa]"><Check className="h-3 w-3 text-[#5a9f83]" /> Answered for this session</span>
                    <button type="button" onClick={() => navigator.clipboard?.writeText(turn.answer || '')} data-testid={`button-copy-answer-${turn.id}`} className="ml-auto inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-[11px] font-semibold text-[#8b8497] transition hover:bg-[#f5f1fc] hover:text-[#6543b6]"><Copy className="h-3 w-3" /> Copy</button>
                  </div>
                  {turn.suggestedQuestions && turn.suggestedQuestions.length > 0 && (
                    <div className="mt-4">
                      <p className="mb-2 text-[10px] font-bold uppercase tracking-[.14em] text-[#aaa3b4]">You might also ask</p>
                      <div className="flex flex-wrap gap-2">
                        {turn.suggestedQuestions.slice(0, 3).map((suggestion, suggestionIndex) => (
                          <button key={`${suggestion}-${suggestionIndex}`} type="button" onClick={() => onSuggestedQuestion(suggestion)} data-testid={`button-suggested-question-${turn.id}-${suggestionIndex}`} className="rounded-lg border border-[#e5ddf4] bg-[#fbf9ff] px-2.5 py-2 text-left text-[11px] font-semibold leading-4 text-[#7254a9] transition hover:border-[#cdbced] hover:bg-[#f4efff]">{suggestion}</button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </article>
      ))}
      <div ref={endRef} />
    </div>
  );
}

function EmptyWorkspace({
  topics,
  topicsLoading,
  topicsError,
  onTopicClick,
  onRetryTopics,
}: {
  topics: Array<{ id: string; label: string; description: string; prompt: string }>;
  topicsLoading: boolean;
  topicsError: boolean;
  onTopicClick: (prompt: string) => void;
  onRetryTopics: () => void;
}) {
  return (
    <section className="rise-in">
      <div className="relative overflow-hidden rounded-[25px] border border-[#e8e2f1] bg-[#f2edff] px-6 py-8 sm:px-10 sm:py-10">
        <div className="pointer-events-none absolute -right-12 -top-20 h-60 w-60 rounded-full border-[25px] border-[#e1d6fb] opacity-70" />
        <div className="pointer-events-none absolute -bottom-28 right-28 h-52 w-52 rounded-full bg-[#fff0d9]/80 blur-3xl" />
        <div className="relative max-w-[630px]">
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-[#dacdf5] bg-white/65 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[.16em] text-[#795cb5]">
            <span className="h-1.5 w-1.5 rounded-full bg-[#e2a05f]" /> Your digital campus desk
          </div>
          <h1 className="font-display text-[clamp(2.15rem,5vw,3.7rem)] leading-[1.04] tracking-[-.035em] text-[#322749]">Let’s find your<br /><em className="not-italic text-[#704dbd]">next answer.</em></h1>
          <p className="mt-5 max-w-[480px] text-[14px] leading-6 text-[#756b89] sm:text-[15px]">Ask about the small things that keep your semester moving — deadlines, forms, services, and where to go next.</p>
        </div>
        <div className="pointer-events-none absolute bottom-7 right-8 hidden h-24 w-24 rotate-12 sm:block">
          <div className="absolute inset-2 rounded-[28px] border-2 border-[#bda9e7]" />
          <div className="absolute right-0 top-1 h-8 w-8 rounded-full bg-[#f2c78f]" />
          <div className="absolute bottom-0 left-0 h-10 w-10 rounded-full bg-[#9f84dc]" />
          <div className="absolute left-8 top-7 h-4 w-4 rounded-full bg-[#fffaf0]" />
        </div>
      </div>

      <div className="mt-8 flex items-end justify-between">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[.18em] text-[#9b93a9]">Start with a shortcut</p>
          <p className="mt-1.5 text-sm text-[#666078]">Popular places students look for help.</p>
        </div>
        <span className="hidden items-center gap-1 text-[11px] text-[#aaa3b4] sm:flex"><Sparkles className="h-3.5 w-3.5 text-[#a486db]" /> Or ask anything below</span>
      </div>

      <div className="mt-4">
        {topicsLoading && <TopicSkeleton />}
        {topicsError && (
          <div className="flex items-center justify-between gap-4 rounded-2xl border border-[#eadfe9] bg-white px-4 py-4" data-testid="status-topics-error">
            <div className="flex items-center gap-3"><CircleHelp className="h-4 w-4 text-[#b36d81]" /><div><p className="text-sm font-semibold text-[#4f4057]">Shortcuts are taking a break.</p><p className="mt-0.5 text-xs text-[#9a8e9f]">You can still ask your question below.</p></div></div>
            <button type="button" onClick={onRetryTopics} data-testid="button-retry-topics" className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-[#f2edff] px-3 py-2 text-xs font-bold text-[#6c4bab] transition hover:bg-[#e9e0ff]"><RotateCcw className="h-3.5 w-3.5" /> Retry</button>
          </div>
        )}
        {!topicsLoading && !topicsError && topics.length === 0 && (
          <div className="rounded-2xl border border-dashed border-[#dcd3e8] bg-white/70 px-5 py-6 text-center" data-testid="status-topics-empty">
            <p className="text-sm font-semibold text-[#554d63]">No shortcuts available right now.</p>
            <p className="mt-1 text-xs text-[#968da0]">Type a question and I’ll still help you find the right place.</p>
          </div>
        )}
        {!topicsLoading && !topicsError && topics.length > 0 && (
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
            {topics.map((topic, index) => (
              <TopicCard key={topic.id} label={topic.label} description={topic.description} index={index} onClick={() => onTopicClick(topic.prompt)} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

function Home() {
  const [turns, setTurns] = useState<ChatTurn[]>([]);
  const [question, setQuestion] = useState('');
  const [copiedHint, setCopiedHint] = useState(false);
  const composerRef = useRef<HTMLTextAreaElement>(null);
  const topicsQuery = useGetStudentTopics({ query: { queryKey: getGetStudentTopicsQueryKey() } });
  const assistant = useAskStudentAssistant();

  const topics = topicsQuery.data ?? [];

  const startNewConversation = () => {
    setTurns([]);
    setQuestion('');
    composerRef.current?.focus();
  };

  const submitQuestion = (rawQuestion: string, retryId?: string) => {
    const cleanQuestion = rawQuestion.trim();
    if (!cleanQuestion || assistant.isPending) return;
    const turnId = retryId || `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    if (retryId) {
      setTurns((current) => current.map((turn) => turn.id === retryId ? { ...turn, status: 'pending', answer: undefined, suggestedQuestions: undefined } : turn));
    } else {
      setTurns((current) => [...current, { id: turnId, question: cleanQuestion, status: 'pending' }]);
    }
    setQuestion('');
    assistant.mutate({ data: { question: cleanQuestion } }, {
      onSuccess: (answer) => {
        setTurns((current) => current.map((turn) => turn.id === turnId ? { ...turn, answer: answer.answer, topic: answer.topic, suggestedQuestions: answer.suggestedQuestions, status: 'answered' } : turn));
      },
      onError: () => {
        setTurns((current) => current.map((turn) => turn.id === turnId ? { ...turn, status: 'error' } : turn));
      },
    });
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    submitQuestion(question);
  };

  const handleComposerKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      submitQuestion(question);
    }
  };

  const chooseSuggestion = (suggestion: string) => {
    setQuestion(suggestion);
    composerRef.current?.focus();
  };

  const handleCopyHint = () => {
    navigator.clipboard?.writeText('Ask about deadlines, forms, services, or where to go next.');
    setCopiedHint(true);
    window.setTimeout(() => setCopiedHint(false), 1800);
  };

  return (
    <div className="grain flex min-h-[100dvh] bg-[#faf8fc]">
      <Sidebar turns={turns} onNewConversation={startNewConversation} onQuestionSelect={chooseSuggestion} />
      <div className="flex min-w-0 flex-1 flex-col">
        <MobileHeader onNewConversation={startNewConversation} />
        <main className="mx-auto flex w-full max-w-[1030px] flex-1 flex-col px-5 pb-6 pt-5 sm:px-8 lg:px-12 lg:pt-8">
          <header className="mb-7 flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[.17em] text-[#9a93a8]"><span className="h-1.5 w-1.5 rounded-full bg-[#63a887]" /> Online now</div>
              <h2 className="mt-2 font-display text-[25px] tracking-[-.02em] text-[#342c47]">Ask the campus guide</h2>
            </div>
            <div className="hidden items-center gap-3 sm:flex">
              <button type="button" onClick={handleCopyHint} data-testid="button-copy-ask-hint" className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-2 text-xs font-semibold text-[#958da1] transition hover:bg-[#f0ebf8] hover:text-[#6543b6]">{copiedHint ? <Check className="h-3.5 w-3.5 text-[#5a9f83]" /> : <Copy className="h-3.5 w-3.5" />}{copiedHint ? 'Copied' : 'Copy prompt tip'}</button>
              <button type="button" onClick={startNewConversation} data-testid="button-new-conversation-top" className="inline-flex items-center gap-2 rounded-lg border border-[#e4ddec] bg-white px-3 py-2 text-xs font-bold text-[#695b79] transition hover:border-[#cdbced] hover:text-[#6543b6]"><ListRestart className="h-3.5 w-3.5" /> New conversation</button>
            </div>
          </header>

          <div className="flex flex-1 flex-col">
            {turns.length === 0 ? (
              <EmptyWorkspace topics={topics} topicsLoading={topicsQuery.isLoading} topicsError={topicsQuery.isError} onTopicClick={submitQuestion} onRetryTopics={() => topicsQuery.refetch()} />
            ) : (
              <ChatThread turns={turns} onRetry={(turn) => submitQuestion(turn.question, turn.id)} onSuggestedQuestion={chooseSuggestion} />
            )}
          </div>

          <div className="sticky bottom-0 mt-7 pt-3">
            <form onSubmit={handleSubmit} className={`relative rounded-[19px] border bg-white p-2 shadow-[0_8px_30px_rgba(62,39,103,.08)] transition ${assistant.isPending ? 'border-[#cfc0ec]' : 'border-[#e5deed] focus-within:border-[#bca6e5] focus-within:shadow-[0_8px_30px_rgba(101,67,182,.13)]'}`}>
              <textarea
                ref={composerRef}
                value={question}
                onChange={(event) => setQuestion(event.target.value)}
                onKeyDown={handleComposerKeyDown}
                disabled={assistant.isPending}
                data-testid="input-student-question"
                placeholder="What can I help you find?"
                rows={1}
                className="min-h-[50px] w-full resize-none bg-transparent px-3 py-3 pr-14 text-[14px] leading-6 text-[#3e374e] outline-none placeholder:text-[#aaa2b2] disabled:cursor-wait disabled:opacity-60"
                aria-label="Ask the student assistant a question"
              />
              <button type="submit" disabled={!question.trim() || assistant.isPending} data-testid="button-submit-question" className="absolute bottom-2.5 right-2.5 flex h-10 w-10 items-center justify-center rounded-[13px] bg-[#6543b6] text-white shadow-[0_5px_12px_rgba(101,67,182,.24)] transition duration-200 hover:bg-[#5738a3] active:scale-95 disabled:cursor-not-allowed disabled:bg-[#ddd5e8] disabled:text-[#a79eaf] disabled:shadow-none">
                {assistant.isPending ? <LoaderCircle className="h-[18px] w-[18px] animate-spin" /> : <ArrowUp className="h-[19px] w-[19px]" strokeWidth={2.4} />}
                <span className="sr-only">Send question</span>
              </button>
            </form>
            <div className="mt-2 flex items-center justify-between px-1 text-[10px] text-[#aaa3b3]">
              <span>Press Enter to send · Shift + Enter for a new line</span>
              <span className="hidden items-center gap-1 sm:flex"><Check className="h-3 w-3 text-[#66a486]" /> Built for quick answers</span>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

function Router() {
  return (
    <RoutedErrorBoundary>
      <Switch>
        <Route path="/" component={Home} />
        <Route component={NotFound} />
      </Switch>
    </RoutedErrorBoundary>
  );
}

function RoutedErrorBoundary({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  return <ErrorBoundary resetKey={location}>{children}</ErrorBoundary>;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
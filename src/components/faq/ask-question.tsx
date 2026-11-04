import { useEffect, useRef, useState } from "react";
import { Copy, Mail, MessageCircleQuestion } from "lucide-react";
import { Button } from "@/components/ui/button";
import { contactDetails } from "@/content/site";

export function AskQuestion() {
  const [question, setQuestion] = useState("");
  const [permission, setPermission] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [copyFallback, setCopyFallback] = useState(false);
  const field = useRef<HTMLTextAreaElement>(null);
  const draftField = useRef<HTMLTextAreaElement>(null);
  const body = `My question for Impact Investment Group:\n\n${question.trim()}\n\nPermission to publish an anonymous version of my question and your answer as an FAQ: ${permission ? "Yes" : "No, please reply privately only"}.`;
  const emailHref = `mailto:${contactDetails.email}?subject=${encodeURIComponent("Website FAQ question")}&body=${encodeURIComponent(body)}`;
  useEffect(() => {
    if (copyFallback) { draftField.current?.focus(); draftField.current?.select(); }
  }, [copyFallback]);

  function valid() {
    if (question.trim().length < 10) {
      setError("Please write your question in at least 10 characters.");
      field.current?.focus();
      return false;
    }
    setError("");
    return true;
  }

  async function copy() {
    if (!valid()) return;
    try {
      await navigator.clipboard.writeText(body);
      setCopyFallback(false);
      setNotice("Question copied. Paste it into an email to the address below.");
    } catch {
      setCopyFallback(true);
      draftField.current?.focus();
      draftField.current?.select();
      setNotice("Copy the full email draft below, then email it to the address above.");
    }
  }

  return (
    <section id="ask-a-question" aria-labelledby="ask-question-heading" className="faq-ask">
      <div className="faq-ask-intro">
        <span className="faq-conversation-mark"><MessageCircleQuestion aria-hidden="true" /></span>
        <h2 id="ask-question-heading" className="mt-5 font-heading text-3xl font-bold leading-tight text-ink">Still have a question?</h2>
        <p className="mt-3 text-base leading-relaxed text-ink-muted">Ask us directly. A member of the team can reply by email, and your question could help someone else too.</p>
        <p className="mt-4 text-sm leading-relaxed text-ink-muted">We only add questions to the FAQs after reviewing the answer and removing personal details.</p>
      </div>
      <div className="faq-question-panel">
        <label htmlFor="faq-question" className="text-base font-semibold text-ink">Your question</label>
        <textarea
          ref={field} id="faq-question" rows={5} maxLength={1200}
          className="faq-question-field mt-3" value={question}
          aria-invalid={!!error} aria-describedby={`faq-question-help${error ? " faq-question-error" : ""}`}
          onChange={(event) => { setQuestion(event.target.value); setError(""); setNotice(""); setCopyFallback(false); }}
        />
        <div id="faq-question-help" className="mt-2 flex justify-between gap-4 text-sm text-ink-muted">
          <span>Please leave out sensitive or personal information.</span><span className="shrink-0">{question.length}/1200</span>
        </div>
        {error && <p id="faq-question-error" role="alert" className="mt-3 text-sm text-destructive">{error}</p>}
        <label className="mt-5 flex min-h-11 cursor-pointer items-start gap-3 text-sm leading-relaxed text-ink-muted">
          <input type="checkbox" className="mt-1 size-5 shrink-0 accent-teal-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-600" checked={permission} onChange={(event) => { setPermission(event.target.checked); setNotice(""); setCopyFallback(false); }} />
          <span>You may publish an anonymous version of my question and your answer as an FAQ. <span className="font-semibold">Optional.</span></span>
        </label>
        <div className="mt-5 flex flex-wrap gap-3">
          <Button asChild variant="primary" withArrow={false}>
            <a href={emailHref} onClick={(event) => {
              if (!valid()) event.preventDefault();
              else setNotice("Send your email to finish. If your email app did not open, use Copy question and email us below.");
            }}><Mail aria-hidden="true" />Email my question</a>
          </Button>
          <Button type="button" variant="secondary" onClick={() => void copy()}><Copy aria-hidden="true" />Copy question</Button>
        </div>
        <p className="mt-4 text-sm leading-relaxed text-ink-muted">Opens your email app with your question ready to send. Nothing is sent or published automatically.</p>
        <a href={`mailto:${contactDetails.email}`} className="mt-1 inline-flex min-h-11 items-center break-all text-base font-semibold text-teal-600 underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-600">{contactDetails.email}</a>
        <p role="status" aria-live="polite" className="mt-2 text-sm leading-relaxed text-ink-muted">{notice}</p>
        {copyFallback && <div className="mt-3"><label htmlFor="faq-email-draft" className="text-sm font-semibold text-ink">Email draft</label><textarea id="faq-email-draft" ref={draftField} readOnly value={body} rows={7} className="faq-question-field mt-2" /></div>}
      </div>
    </section>
  );
}

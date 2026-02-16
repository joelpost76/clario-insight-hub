import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { useScrollReveal } from '@/hooks/useScrollReveal';

const FAQS = [
  {
    q: 'Do I need to disrupt my team for this?',
    a: 'Minimal disruption. Team interviews are 30–60 minutes each during normal work hours. Your personal time commitment is about 5 hours total over 2 weeks (kickoff, mid-point check, final readout).',
  },
  {
    q: "What if you can't find a constraint?",
    a: "Every system has a constraint—it's mathematical law. If we can't isolate ONE clear bottleneck, you get a full refund. But in 20 years, I've never seen a business without one.",
  },
  {
    q: 'How is this different from hiring a COO or business coach?',
    a: "A COO costs $150K+/year and takes 6 months to ramp. A business coach gives broad advice. Clario™ is surgical: find the ONE thing, fix it in 90 days, move on. It's $7,500 and 2 weeks.",
  },
  {
    q: 'What happens after the diagnostic?',
    a: 'You get the 90-day plan and can execute it yourself. If you want help implementing (Operating System Install), we can discuss that after you see the diagnostic results. No obligation.',
  },
  {
    q: 'Why only 3 founding clients?',
    a: "I'm testing the model and need case studies. I'm intentionally over-delivering on the first 3 to prove the value. After that, it's $10K and I'll be at capacity.",
  },
  {
    q: "What if I'm not in the $3M–$10M range?",
    a: 'Under $3M, constraints are usually different (sales/marketing vs. operational). Over $10M, you likely need a more comprehensive engagement. This diagnostic is optimized for $3M–$10M companies scaling past their first growth plateau.',
  },
];

export function FAQSection() {
  const { ref, className: revealClass } = useScrollReveal();
  return (
    <section className="py-20 px-4 bg-accent">
      <div ref={ref} className={`max-w-2xl mx-auto space-y-10 ${revealClass}`}>
        <h2 className="text-2xl md:text-3xl font-bold text-foreground text-center">
          Common Questions
        </h2>

        <Accordion type="single" collapsible className="space-y-2">
          {FAQS.map((faq, i) => (
            <AccordionItem key={i} value={`faq-${i}`} className="bg-card border border-border rounded-lg px-4">
              <AccordionTrigger className="text-sm font-medium text-foreground text-left">
                {faq.q}
              </AccordionTrigger>
              <AccordionContent className="text-sm text-muted-foreground leading-relaxed">
                {faq.a}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
}

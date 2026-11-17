import { Link } from "react-router-dom";

export default function MeAboutPage() {
  return (
    <div className="px-5 pt-6 pb-10">
      <h1 className="font-serif text-2xl font-bold text-ink">About this app</h1>
      <p className="text-sm text-mute mt-1">What the readings mean, and what they don't.</p>

      <div className="mt-5 p-4 bg-amber/10 border border-amber/30 rounded-xl text-sm text-[#8A5A00] leading-relaxed">
        <div className="font-semibold mb-1">Research instrument</div>
        This system produces <strong>experimental estimates</strong> of blood glucose from
        optical measurements. It is not a medical device, has not been clinically
        validated, and must not be used for any treatment or dosing decision.
      </div>

      <Section title="How it works">
        A small device shines three colors of light (green, red, infrared) into your
        fingertip and measures what comes back. From that signal, a machine-learning
        model estimates how much glucose is likely in your blood — without pricking you.
        <br/><br/>
        The device does <strong>not directly measure glucose</strong>. It measures
        patterns in blood flow and pulse shape that change along with glucose, and
        the model learns the relationship. That means the estimate can be off, and
        why we show a range, not just one number.
      </Section>

      <Section title="What the colored zones mean">
        <ZoneLine color="#02C39A" label="Normal" range="70–140 mg/dL" />
        <ZoneLine color="#F5A623" label="Elevated" range="140–180 mg/dL" />
        <ZoneLine color="#E63946" label="High or Low" range="&lt; 70 or &gt; 180 mg/dL" />
        <div className="text-xs text-mute mt-3 leading-snug">
          These are general reference bands. Your doctor's targets for you may differ.
          Do not use these colors to decide treatment.
        </div>
      </Section>

      <Section title="The estimate range">
        Each reading shows both a number and a range (e.g. 118 mg/dL · 103–133). The
        range is how confident the model is. A narrow range means more confidence; a
        wide range means the model is less sure. Pay attention to the range, not just
        the point.
      </Section>

      <Section title="When to not trust a reading">
        <ul className="text-sm text-ink space-y-1.5 list-disc pl-5">
          <li>You moved during the reading</li>
          <li>Your finger was cold or poorly placed</li>
          <li>The number is far from what you'd expect — always re-check with your finger-prick glucometer</li>
          <li>You feel unwell — trust how you feel first</li>
        </ul>
      </Section>

      <Section title="Your data">
        Readings from this device are stored on a secure server and used to improve the
        model. You are identified by a pseudonymous ID (not your name). Nothing on this
        screen is shared with insurers, employers, or anyone outside the study team.
      </Section>

      <Section title="Need help?">
        For questions about the device, contact your study operator.
        For a medical emergency, call your local emergency number. Do not use this app
        to decide whether to go to the hospital.
      </Section>

      <div className="mt-8 text-[11px] text-mute text-center">
        <Link to="/overview" className="text-teal hover:underline">Research dashboard</Link>
        <span className="mx-2">·</span>
        v0.1 · experimental build
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mt-6">
      <h2 className="font-serif text-base font-bold text-ink mb-2">{title}</h2>
      <div className="text-sm text-ink leading-relaxed">{children}</div>
    </div>
  );
}

function ZoneLine({ color, label, range }: { color: string; label: string; range: string }) {
  return (
    <div className="flex items-center justify-between py-1.5 border-b border-[#F0F4F4] last:border-0">
      <div className="flex items-center gap-2">
        <span className="w-2.5 h-2.5 rounded-full" style={{ background: color }} />
        <span className="text-sm text-ink font-medium">{label}</span>
      </div>
      <span className="text-xs text-mute" dangerouslySetInnerHTML={{ __html: range }} />
    </div>
  );
}

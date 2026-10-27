import { Section } from "../../components/Section";
import { Reveal } from "../../ui";
import SavingsCalculator from "./SavingsCalculator";
import { pillars } from "./why.data";

export default function Why() {
  return (
    <Section id="why">
      <div className="grid items-center gap-14 lg:grid-cols-2">
        <Reveal>
          <h2 className="text-4xl font-extrabold leading-[1.08] sm:text-5xl">
            Quality food at prices that make sense.
          </h2>
          <p className="mt-5 max-w-lg text-lg text-mute">
            Kitchens, bakeries, markets and shops near you run limited-time
            deals through the day. You get quality items at a real discount, and
            sellers fill their quiet hours with new customers.
          </p>
          <ul className="mt-8 grid gap-4">
            {pillars.map(([e, t, d]) => (
              <li key={t} className="flex gap-4">
                <span className="grid size-12 flex-none place-items-center rounded-xl bg-palm/30 text-2xl">
                  {e}
                </span>
                <div>
                  <h3 className="text-lg font-semibold">{t}</h3>
                  <p className="text-mute">{d}</p>
                </div>
              </li>
            ))}
          </ul>
        </Reveal>
        <Reveal delay={150}>
          <SavingsCalculator />
        </Reveal>
      </div>
    </Section>
  );
}

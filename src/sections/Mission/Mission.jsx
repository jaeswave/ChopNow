import { Section } from "../../components/Section";
import { Button, Reveal } from "../../ui";
import { pillars } from "./mission.data";

// onJoin: what happens when the visitor presses "Explore deals"
export default function Mission({ onJoin }) {
  return (
    <Section id="mission" className="bg-leaf text-white">
      <div className="grid items-center gap-14 lg:grid-cols-2">
        <Reveal>
          <h2 className="text-4xl font-extrabold leading-[1.08] sm:text-5xl">
            Great items deserve to be enjoyed.
          </h2>
          <p className="mt-5 max-w-lg text-lg text-white/85">
            GbaanJo is a marketplace on a mission to make wasting good items a
            thing of the past. Kitchens, bakeries, supermarkets and market
            traders have quality items that deserve a buyer, and people nearby
            want them at a fair price.
          </p>
          <p className="mt-4 max-w-lg text-lg text-white/85">
            We connect the two. The item gets used, the business earns more, and
            you pay less. Every order is a small win for your community.
          </p>
          <Button variant="palm" size="lg" className="mt-8" onClick={onJoin}>
            Explore deals
          </Button>
        </Reveal>
        <Reveal delay={150}>
          <div className="grid gap-4">
            {pillars.map(([e, t, d]) => (
              <div key={t} className="flex gap-4 rounded-2xl bg-white/10 p-5">
                <span className="grid size-12 flex-none place-items-center rounded-xl bg-palm text-2xl">
                  {e}
                </span>
                <div>
                  <h3 className="text-xl font-semibold">{t}</h3>
                  <p className="text-white/80">{d}</p>
                </div>
              </div>
            ))}
          </div>
        </Reveal>
      </div>
    </Section>
  );
}

import { useState } from "react";
import { useMeta } from "../../hooks/useMeta";
import { savings } from "../../config/market";

export default function SavingsCalculator() {
  const { money } = useMeta();
  const [purchases, setPurchases] = useState(12);
  const saved = Math.round(
    purchases * savings.avgPurchase * savings.avgDiscount,
  );

  return (
    <div className="rounded-3xl bg-white p-6 shadow-xl shadow-leaf/10 ring-[1.5px] ring-line sm:p-8">
      <h3 className="text-2xl font-bold">How much could you save?</h3>
      <p className="mt-1 text-mute">Slide to see an estimate.</p>
      <label className="mt-6 block font-semibold">
        Purchases per month: <span className="text-pepper">{purchases}</span>
        <input
          type="range"
          min="4"
          max="40"
          step="2"
          value={purchases}
          onChange={(e) => setPurchases(+e.target.value)}
          className="mt-3 w-full cursor-pointer accent-leaf"
        />
      </label>
      <div className="mt-6 rounded-2xl bg-leaf p-6 text-white">
        <p className="text-white/80">You could save about</p>
        <p className="font-display text-5xl font-extrabold text-palm">
          {money(saved)}
        </p>
        <p className="mt-1 text-sm text-white/70">a month</p>
      </div>
      <p className="mt-4 text-xs text-mute">
        Estimate only. Assumes an average purchase of{" "}
        {money(savings.avgPurchase)} at about{" "}
        {Math.round(savings.avgDiscount * 100)}% off. Real savings depend on
        what is listed near you.
      </p>
    </div>
  );
}

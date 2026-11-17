// Friendly card shown instead of the new-listing form while a setup step is missing.
// children: the buttons that fix it.
export default function SetupBlocker({ icon, title, text, children }) {
  return (
    <section aria-labelledby="blocker-title" className="mt-5 rounded-2xl bg-white p-6 text-center ring-2 ring-palm sm:p-8">
      <div className="text-5xl" aria-hidden="true">{icon}</div>
      <h2 id="blocker-title" className="mt-3 text-2xl font-extrabold">{title}</h2>
      <p className="mx-auto mt-2 max-w-md text-mute">{text}</p>
      <div className="mt-5 flex flex-wrap justify-center gap-3">{children}</div>
    </section>
  );
}

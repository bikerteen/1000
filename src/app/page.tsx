import { Suspense } from "react";
import { connection } from "next/server";
import { META } from "@/lib/meta";
import { store } from "@/lib/store";
import Tracker from "@/components/Tracker";

async function Board() {
  await connection();
  const data = { meta: META, shots: await store.list() };
  // Resolve "today" once on the server (London time) so client + server agree.
  const today = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/London",
  }).format(new Date());
  return <Tracker initial={data} today={today} />;
}

function Loading() {
  return (
    <div className="grid min-h-dvh place-items-center bg-ink text-paper">
      <p className="display animate-pulse text-6xl">
        Counting the <span className="text-acid">no&rsquo;s</span>…
      </p>
    </div>
  );
}

export default function Page() {
  return (
    <Suspense fallback={<Loading />}>
      <Board />
    </Suspense>
  );
}

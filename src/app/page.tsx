import { Suspense } from "react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { DOOR_HEADER, isDoorOpen, sessionToken } from "@/lib/auth";
import { META } from "@/lib/meta";
import { store } from "@/lib/store";
import Tracker from "@/components/Tracker";

async function Board() {
  await connection();
  // proxy.ts gates this too; checking here means data never renders without the door.
  const token = await sessionToken();
  if (!token || !(await isDoorOpen((await headers()).get(DOOR_HEADER) ?? undefined))) {
    redirect("/unlock");
  }
  const data = { meta: META, shots: await store.list() };
  // Resolve "today" once on the server (London time) so client + server agree.
  const today = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/London",
  }).format(new Date());
  return <Tracker initial={data} today={today} token={token} />;
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

import { auth } from "@/server/auth";
import { api, HydrateClient } from "@/trpc/server";
import { SignInButton, UserProfileModal } from "./_components/profileModal";
import { TripTable } from "./_components/table";

export default async function Home() {
  const session = await auth();

  let trips = null;
  let share = 1;
  if (session?.user) {
    trips = await api.trip.getUserTrips({
      year: new Date().getFullYear(),
      month: new Date().getMonth(),
    });
    const shareArray = await api.partnerShare.get();
    share = shareArray[0]?.sharePercentage ?? 1;
  }

  return (
    <HydrateClient>
      <main className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-gray-900 via-slate-900 to-gray-900 text-white">
        {session?.user ? <UserProfileModal /> : <SignInButton />}
        <div className="container flex flex-col items-center justify-center gap-12 px-4 py-12">
          <h1 className="text-2xl font-extrabold tracking-tight sm:text-[3rem]">
            Turo Fleet Management
          </h1>

          {session?.user && <TripTable data={trips ?? []} share={share} />}
        </div>
      </main>
    </HydrateClient>
  );
}

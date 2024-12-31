import { auth } from "@/server/auth";
import { api, HydrateClient } from "@/trpc/server";
import { FileUploadComponent } from "@/app/_components/upload";
import { PartnerShareTable } from "@/app/_components/partnerShareTable";

export default async function AdminPage() {
  const session = await auth();

  let partnerShares = null;
  if (session?.user) {
    partnerShares = await api.partnerShare.getAll();
  }

  return (
    <HydrateClient>
      <main className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-gray-900 via-slate-900 to-gray-900 text-white">
        <div className="container max-w-4xl flex flex-col items-center justify-center gap-12 px-4 py-12">
          <h1 className="text-2xl font-extrabold tracking-tight sm:text-[3rem]">
            Admin Panel
          </h1>
          {session?.user ? (
            <div className="w-full space-y-8">
              <FileUploadComponent />
              <PartnerShareTable data={partnerShares ?? []} />
            </div>
          ) : (
            <p className="text-xl">Please sign in to access admin features</p>
          )}
        </div>
      </main>
    </HydrateClient>
  );
}

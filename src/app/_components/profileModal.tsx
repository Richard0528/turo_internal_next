"use client";

import { useState } from "react";
import { api } from "@/trpc/react";
import Link from "next/link";

export function SignInButton() {
  return (
    <div className="fixed right-4 top-9 z-50">
      <Link
        href={"/api/auth/signin"}
        className="rounded-full bg-white/10 px-6 py-3 font-semibold transition hover:bg-white/20"
      >
        Sign in
      </Link>
    </div>
  );
}

export function UserProfileModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [isAddingVehicle, setIsAddingVehicle] = useState(false);
  const [selectedVehicleId, setSelectedVehicleId] = useState("");

  const { data: profile, refetch: refetchProfile } = api.user.getProfile.useQuery();
  const { data: allVehicles } = api.vehicle.getAll.useQuery();

  const addVehicleMutation = api.user.addVehicleToUser.useMutation({
    onSuccess: () => {
      void refetchProfile();
      setIsAddingVehicle(false);
      setSelectedVehicleId("");
    },
  });

  if (!profile) return null;

  return (
    <div className="fixed right-4 top-6 z-50">
      <button
        onClick={() => setIsOpen(true)}
        className="rounded-full bg-white/10 px-1 py-1 font-semibold transition hover:bg-white/20"
      >
        {profile?.image ? (
          <img
            src={profile.image}
            alt="Profile"
            className="h-10 w-10 rounded-full object-cover"
          />
        ) : (
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20">
            <span className="text-sm">
              {profile?.name?.charAt(0) ?? "?"}
            </span>
          </div>
        )}
      </button>
      
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-md rounded-lg bg-gradient-to-b from-gray-800 via-slate-800 to-gray-800 p-6 text-white shadow-xl">
            <div className="flex justify-between">
              <h2 className="text-2xl font-bold">User Profile</h2>
              <button onClick={() => setIsOpen(false)} className="text-gray-300 hover:text-gray-100">
                ✕
              </button>
            </div>

            <div className="mt-4 space-y-4">
              <div>
                <p className="font-semibold">Name:</p>
                <p>{profile.name}</p>
              </div>
              <div>
                <p className="font-semibold">Email:</p>
                <p>{profile.email}</p>
              </div>

              <div className="flex gap-4">
                <Link
                  href={"/api/auth/signout"}
                  className="rounded-full bg-white/10 px-10 py-3 font-semibold no-underline transition hover:bg-white/20"
                >
                  Sign out
                </Link>
                <Link
                  href={"/admin"}
                  className="rounded-full bg-white/10 px-10 py-3 font-semibold no-underline transition hover:bg-white/20"
                >
                  Admin control
                </Link>
              </div>

              <div>
                <div className="flex items-center justify-between">
                  <p className="font-semibold">Owned Vehicles:</p>
                  <button
                    onClick={() => setIsAddingVehicle(true)}
                    className="text-sm text-blue-600 hover:text-blue-800"
                  >
                    Add Vehicle
                  </button>
                </div>
                <ul className="mt-2 space-y-2">
                  {profile.vehiclesOwned.map((vehicle) => (
                    <li key={vehicle.id} className="rounded bg-white/20 p-2">
                      {vehicle.makeModel} ({vehicle.licensePlate})
                    </li>
                  ))}
                </ul>
              </div>

              {isAddingVehicle && allVehicles && (
                <div className="space-y-2">
                  <select
                    value={selectedVehicleId}
                    onChange={(e) => setSelectedVehicleId(e.target.value)}
                    className="w-full rounded border bg-gray-700 p-2 text-white"
                  >
                    <option value="">Select a vehicle</option>
                    {allVehicles
                      .filter((v) => !v.ownerId)
                      .map((vehicle) => (
                        <option key={vehicle.id} value={vehicle.id}>
                          {vehicle.makeModel} ({vehicle.licensePlate})
                        </option>
                      ))}
                  </select>
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => setIsAddingVehicle(false)}
                      className="rounded bg-gray-600 px-3 py-1 hover:bg-gray-500"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => {
                        if (selectedVehicleId) {
                          addVehicleMutation.mutate({ vehicleId: selectedVehicleId });
                        }
                      }}
                      disabled={!selectedVehicleId}
                      className="rounded bg-blue-500 px-3 py-1 text-white hover:bg-blue-600 disabled:opacity-50"
                    >
                      Add
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
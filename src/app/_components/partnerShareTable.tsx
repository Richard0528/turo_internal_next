"use client";

import { api } from "@/trpc/react";
import { useState } from "react";
import type { User, PartnerShare } from "@prisma/client";

type PartnerShareWithUser = PartnerShare & {
  user: User;
};

export function PartnerShareTable({ data }: { data: PartnerShareWithUser[] }) {
  const utils = api.useUtils();
  const updateMutation = api.partnerShare.update.useMutation({
    onSuccess: () => {
      void utils.partnerShare.getAll.invalidate();
    },
  });

  const addMissingUsersMutation = api.partnerShare.addMissingUsers.useMutation({
    onSuccess: () => {
      void utils.partnerShare.getAll.invalidate();
    },
  });

  const handleUpdateShare = (userId: string, year: number, newShare: number) => {
    updateMutation.mutate({
      userId,
      year,
      sharePercentage: newShare,
    });
  };

  return (
    <div className="rounded-lg bg-gray-800 p-4">
      <div className="mb-4 flex justify-between items-center">
        <h3 className="text-xl font-bold">Partner Shares</h3>
        <button
          onClick={() => addMissingUsersMutation.mutate()}
          className="rounded bg-blue-600 px-4 py-2 text-sm font-semibold hover:bg-blue-700"
          disabled={addMissingUsersMutation.isPending}
        >
          {addMissingUsersMutation.isPending ? "Adding..." : "Add Missing Users"}
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-full table-auto">
          <thead>
            <tr>
              <th className="border-b border-gray-700 px-4 py-2 text-left">Partner</th>
              <th className="border-b border-gray-700 px-4 py-2 text-left">Year</th>
              <th className="border-b border-gray-700 px-4 py-2 text-left">Share %</th>
              <th className="border-b border-gray-700 px-4 py-2 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {data.map((share) => (
              <TableRow
                key={`${share.userId}-${share.year}`}
                share={share}
                onUpdate={handleUpdateShare}
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function TableRow({
  share,
  onUpdate,
}: {
  share: PartnerShareWithUser;
  onUpdate: (userId: string, year: number, newShare: number) => void;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [newShare, setNewShare] = useState(share.sharePercentage);

  const handleSave = () => {
    onUpdate(share.userId, share.year, newShare);
    setIsEditing(false);
  };

  return (
    <tr>
      <td className="border-b border-gray-700 px-4 py-2">{share.user.name}</td>
      <td className="border-b border-gray-700 px-4 py-2">{share.year}</td>
      <td className="border-b border-gray-700 px-4 py-2">
        {isEditing ? (
          <input
            type="number"
            value={newShare}
            onChange={(e) => setNewShare(parseFloat(e.target.value))}
            className="w-20 rounded bg-gray-700 px-2 py-1 text-white"
            min="0"
            max="1"
            step="0.01"
          />
        ) : (
          `${share.sharePercentage * 100}%`
        )}
      </td>
      <td className="border-b border-gray-700 px-4 py-2">
        {isEditing ? (
          <div className="flex gap-2">
            <button
              onClick={handleSave}
              className="rounded bg-green-600 px-2 py-1 text-sm hover:bg-green-700"
            >
              Save
            </button>
            <button
              onClick={() => setIsEditing(false)}
              className="rounded bg-gray-600 px-2 py-1 text-sm hover:bg-gray-700"
            >
              Cancel
            </button>
          </div>
        ) : (
          <button
            onClick={() => setIsEditing(true)}
            className="rounded bg-blue-600 px-2 py-1 text-sm hover:bg-blue-700"
          >
            Edit
          </button>
        )}
      </td>
    </tr>
  );
}

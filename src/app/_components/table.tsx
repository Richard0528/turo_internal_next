"use client";

import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { type Trip, type Vehicle } from "@prisma/client";
import { useState } from "react";

type VehicleWithTrips = Vehicle & {
  trips: Trip[];
};

const columnHelper = createColumnHelper<Trip>();
function createColumns(share: number) {
  return [
    columnHelper.accessor("tripStart", {
      header: "Trip Start",
      cell: (info) => info.getValue().toLocaleDateString(),
    }),
    columnHelper.accessor("tripEnd", {
      header: "Trip End",
      cell: (info) => info.getValue().toLocaleDateString(),
    }),
    columnHelper.accessor("distanceTraveled", {
      header: "Mileage",
    }),
    columnHelper.accessor("tripDays", {
      header: "Days",
    }),
    columnHelper.accessor("grossEarned", {
      header: "Gross Earned",
      cell: (info) => `$${info.getValue().toFixed(2)}`,
    }),
    columnHelper.accessor("turoFee", {
      header: "Turo Fee",
      cell: (info) => {
        const value = info.getValue().toFixed(2);
        const color = "text-red-500";
        return <span className={color}>${value}</span>;
      },
    }),
    columnHelper.accessor("operationExpense", {
      header: "OpEx",
      cell: (info) => {
        const value = info.getValue().toFixed(2);
        const color = "text-red-500";
        return <span className={color}>${value}</span>;
      },
    }),
    columnHelper.accessor((row) => {
      const difference = row.netEarned * (1 - share);
      return difference;
    }, {
      id: "managementFee",  // unique ID required for custom accessors
      header: "ManageEx",
      cell: (info) => {
        const value = info.getValue().toFixed(2);
        const color = share != 1 ? "text-red-500" : "text-white";
        return <span className={color}>${value}</span>;
      },
    }),
    columnHelper.accessor((row) => {
      const difference = row.netEarned * share;
      return difference;
    }, {
      id: "actualNetEarned",  // unique ID required for custom accessors
      header: `Net (${share*100}%)`,
      cell: (info) => {
        const value = info.getValue().toFixed(2);
        const color = "text-green-500";
        return <span className={color}>${value}</span>;
      },
    }),
  ];
}

export function TripTable({ data, share }: { data: VehicleWithTrips[], share: number }) {
  const [view, setView] = useState<'detail' | 'monthly'>('detail');
  // Calculate totals across all vehicles
  const allTrips = data.flatMap(vehicle => vehicle.trips);

  return (
    <div className="w-full space-y-8">
      <div className="flex justify-end space-x-4 mb-4">
        <button
          onClick={() => setView('detail')}
          className={`px-4 py-2 rounded ${
            view === 'detail' 
              ? 'bg-blue-600 text-white' 
              : 'bg-gray-700 text-gray-300'
          }`}
        >
          Detail
        </button>
        <button
          onClick={() => setView('monthly')}
          className={`px-4 py-2 rounded ${
            view === 'monthly' 
              ? 'bg-blue-600 text-white' 
              : 'bg-gray-700 text-gray-300'
          }`}
        >
          Monthly
        </button>
      </div>
      <SummaryCards trips={allTrips} share={share} />
      {view === 'detail' ? (
        data.map((vehicle) => (
          <div key={vehicle.id} className="rounded-lg bg-gray-800 p-4">
            <h3 className="mb-4 text-xl font-bold">
              {vehicle.makeModel} ({vehicle.licensePlate})
            </h3>
            <TripTableForVehicle trips={vehicle.trips} share={share} />
          </div>
        ))
      ) : (
        <div className="rounded-lg bg-gray-800 p-4">
          <MonthlyTable data={data} share={share} />
        </div>
      )}
    </div>
  );
}

function TripTableForVehicle({ trips, share }: { trips: Trip[], share: number }) {
  const columns = createColumns(share);
  const table = useReactTable({
    data: trips,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
      <div className="overflow-x-auto">
        <table className="w-full min-w-full table-auto">
          <thead>
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <th
                    key={header.id}
                    className="border-b border-gray-700 px-4 py-2 text-left"
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext(),
                        )}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {trips.length === 0 ? (
              <tr>
                <td 
                  colSpan={table.getAllColumns().length}
                  className="border-b border-gray-700 px-4 py-2 text-center text-gray-500"
                >
                  No records found
                </td>
              </tr>
            ) : (
              table.getRowModel().rows.map((row) => (
                <tr key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id} className="border-b border-gray-700 px-4 py-2">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
  );
}

function SummaryCards({ trips, share }: { trips: Trip[], share: number }) {
  const totals = trips.reduce((acc, trip) => {
    acc.grossEarned += trip.grossEarned;
    acc.expenses += trip.turoFee + trip.operationExpense + (trip.netEarned * (1 - share));
    acc.netEarned += trip.netEarned * share;
    return acc;
  }, {
    grossEarned: 0,
    expenses: 0,
    netEarned: 0
  });

  const cards = [
    { title: "Gross", amount: totals.grossEarned, color: "text-white" },
    { title: "Expense", amount: totals.expenses, color: "text-red-500" },
    { title: "Net", amount: totals.netEarned, color: "text-green-500" }
  ];

  return (
    <div className="mb-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
      {cards.map((card) => (
        <div key={card.title} className="flex items-center justify-between rounded-lg bg-gray-700 p-4">
          <h3 className="text-lg font-semibold text-gray-300">{card.title}</h3>
          <p className={`text-xl font-bold ${card.color}`}>
            ${card.amount.toFixed(2)}
          </p>
        </div>
      ))}
    </div>
  );
}

function MonthlyTable({ data, share }: { data: VehicleWithTrips[], share: number }) {  
  // Calculate monthly summary for each vehicle
  const vehicleSummaries = data.map(vehicle => {
    const summary = vehicle.trips.reduce((acc, trip) => {
      acc.gross += trip.grossEarned;
      acc.turoFee += trip.turoFee;
      acc.operationExpense += trip.operationExpense;
      acc.managementFee += trip.netEarned * (1 - share);
      acc.net += trip.netEarned * share;
      return acc;
    }, {
      vehicleId: vehicle.id,
      makeModel: vehicle.makeModel,
      licensePlate: vehicle.licensePlate,
      gross: 0,
      turoFee: 0,
      operationExpense: 0,
      managementFee: 0,
      net: 0
    });

    return summary;
  });

  const today = new Date();
  today.setMonth(today.getMonth() - 1);
  const monthName = today.toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'long' 
  });

  return (
    <div className="overflow-x-auto">
      <h3 className="mb-4 text-xl font-bold">{monthName}</h3>
      <table className="w-full min-w-full table-auto">
        <thead>
          <tr>
            <th className="border-b border-gray-700 px-4 py-2 text-left">Vehicle</th>
            <th className="border-b border-gray-700 px-4 py-2 text-left">Gross</th>
            <th className="border-b border-gray-700 px-4 py-2 text-left">Turo Fee</th>
            <th className="border-b border-gray-700 px-4 py-2 text-left">OpEx</th>
            <th className="border-b border-gray-700 px-4 py-2 text-left">ManageEx</th>
            <th className="border-b border-gray-700 px-4 py-2 text-left">Net ({share*100}%)</th>
          </tr>
        </thead>
        <tbody>
          {vehicleSummaries.map((summary) => (
            <tr key={summary.vehicleId}>
              <td className="border-b border-gray-700 px-4 py-2">
                {summary.makeModel} ({summary.licensePlate})
              </td>
              <td className="border-b border-gray-700 px-4 py-2 text-white">
                ${summary.gross.toFixed(2)}
              </td>
              <td className="border-b border-gray-700 px-4 py-2 text-red-500">
                ${summary.turoFee.toFixed(2)}
              </td>
              <td className="border-b border-gray-700 px-4 py-2 text-red-500">
                ${summary.operationExpense.toFixed(2)}
              </td>
              <td className="border-b border-gray-700 px-4 py-2 text-red-500">
                ${summary.managementFee.toFixed(2)}
              </td>
              <td className="border-b border-gray-700 px-4 py-2 text-green-500">
                ${summary.net.toFixed(2)}
              </td>
            </tr>
          ))}
          {/* Total row */}
          <tr className="font-bold">
            <td className="border-b border-gray-700 px-4 py-2">Total</td>
            <td className="border-b border-gray-700 px-4 py-2 text-white">
              ${vehicleSummaries.reduce((sum, v) => sum + v.gross, 0).toFixed(2)}
            </td>
            <td className="border-b border-gray-700 px-4 py-2 text-red-500">
              ${vehicleSummaries.reduce((sum, v) => sum + v.turoFee, 0).toFixed(2)}
            </td>
            <td className="border-b border-gray-700 px-4 py-2 text-red-500">
              ${vehicleSummaries.reduce((sum, v) => sum + v.operationExpense, 0).toFixed(2)}
            </td>
            <td className="border-b border-gray-700 px-4 py-2 text-red-500">
              ${vehicleSummaries.reduce((sum, v) => sum + v.managementFee, 0).toFixed(2)}
            </td>
            <td className="border-b border-gray-700 px-4 py-2 text-green-500">
              ${vehicleSummaries.reduce((sum, v) => sum + v.net, 0).toFixed(2)}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

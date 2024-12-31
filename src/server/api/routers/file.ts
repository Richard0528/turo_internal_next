import { z } from "zod";
import { parse } from "csv-parse/sync";

import {
  createTRPCRouter,
  protectedProcedure,
} from "@/server/api/trpc";

const discountColumns = [
  'three_day_discount',
  'seven_day_discount',
  'fourteen_day_discount',
  'twentyone_day_discount',
  'thirty_day_discount',
  'sixty_day_discount',
  'ninety_day_discount',
  'early_bird_discount',
  'host_promotional_credit'
];

const bonusColumns = [
  'excess_distance',
  'additional_usage',
  'late_fee'
];

const opExpenseColumns = [
  'delivery',
  'smoking',
  'cleaning',
  'improper_return_fee'
];

const toInt = (currency: string | number | undefined): number => {
  if (typeof currency == 'string') {
    return +(currency.replace(/[^0-9e.-]+/g,""));
  }
  if (currency == undefined) {
    return 0;
  }
  return currency;
}

// Helper function to calculate total discount
const calculateColumnSum = (record: any, columns: string[]): number => {
  return columns.reduce((total, column) => {
    const value = toInt(record[column] || '0');
    return total + (isNaN(value) ? 0 : Math.abs(value)); // Using Math.abs since discounts are stored as negative values
  }, 0);
};

// trip price + excess distance + additional usage + late fee - discount
export const calculateRev = (record: any): number => {
  const totalDiscount = calculateColumnSum(record, discountColumns);
  const totalBonus = calculateColumnSum(record, bonusColumns);
  const total = toInt(record.trip_price || '0') + totalBonus - totalDiscount - 10;
  return total;
}
// delivery, smoking, cleaning, improper_return_fee, trinity_cleaning_fee $10
export const calculateOpExpense = (record: any): number => {
  const total = calculateColumnSum(record, opExpenseColumns) + 10;
  return total;
}
// (trip price + delivery fee - discount) / 9
export const calculateTuroFee = (record: any): number => {
  const totalDiscount = calculateColumnSum(record, discountColumns);
  const total = toInt(record.trip_price || '0') + toInt(record.delivery || '0') - totalDiscount;
  return total / 9;
}

export const fileRouter = createTRPCRouter({
  uploadTrips: protectedProcedure
    .input(
      z.object({
        csvContent: z.string(),
        fileName: z.string()
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        // Parse CSV content
        const records = parse(input.csvContent, {
          columns: true,
          skip_empty_lines: true
        });

        // Get all existing tripIds
        const existingTripIds = new Set(
          (await ctx.db.trip.findMany({ select: { tripId: true } }))
          .map((trip: any) => trip.tripId));
        // Filter out records that already exist and non-completed trips
        const newRecords = records.filter((record: any) => 
          record.trip_status === 'Completed' && !existingTripIds.has(record.reservation_id)
        );

        if (newRecords.length === 0) {
          return {
            success: true,
            recordsProcessed: 0,
            message: "No new records to process"
          };
        }

        // Extract unique vehicles from records
        const vehicles = new Map();
        newRecords.forEach((record: any) => {
          const licensePlate = record.vehicle.match(/\((.*?)\)/)?.[1] || ''; // Extracts plate from "Trinity RPM's Jeep (OR #097NVA)"
          const makeModel = record.vehicle_name; // e.g. "Jeep Grand Cherokee L 2022"
          
          if (licensePlate && !vehicles.has(licensePlate)) {
            vehicles.set(licensePlate, {
              licensePlate,
              makeModel
            });
          }
        });

        // First get all vehicles to map their licensePlate to id
        const vehicleMapping = new Map();
        const allVehicles = await ctx.db.vehicle.findMany();
        allVehicles.forEach(vehicle => {
          vehicleMapping.set(vehicle.licensePlate, vehicle.id);
        });

        // Create vehicles if not exist
        // Note: vehicle may have temporary license plate, and the official plate will update
        // all of the existing records with temporary plate.
        // So we need to delete the vehicle with temporary plate first(it will delete all the trips),
        // then run this function again to properly recreate the trips with correct vehicle id.
        for (const vehicle of vehicles.values()) {
          if (!vehicleMapping.has(vehicle.licensePlate)) {
            const newVehicle = await ctx.db.vehicle.create({
              data: {
                licensePlate: vehicle.licensePlate,
                makeModel: vehicle.makeModel,
              },
            });
            vehicleMapping.set(vehicle.licensePlate, newVehicle.id);
          }
        }

        // Batch create all records
        const result = await ctx.db.trip.createMany({
          data: newRecords.map((record: any) => {
            // Map CSV columns to your schema
            const licensePlate = record.vehicle.match(/\((.*?)\)/)?.[1] || '';
            const vehicleId = vehicleMapping.get(licensePlate);
            
            if (!vehicleId) {
              throw new Error(`Vehicle not found for license plate: ${licensePlate}`);
            }

            const totalDiscount = calculateColumnSum(record, discountColumns);
            const turoFee = calculateTuroFee(record);
            const opExpense = calculateOpExpense(record);
            const revenue = calculateRev(record);

            const grossEarned = revenue + turoFee + opExpense;

            return {
              tripId: record.reservation_id,
              vehicleId: vehicleId,
              tripStart: new Date(record.trip_start),
              tripEnd: new Date(record.trip_end),
              distanceTraveled: toInt(record.distance_traveled || '0'),
              tripDays: parseInt(record.trip_days),
              tripPrice: toInt(record.trip_price || '0'),
              totalDiscount: totalDiscount,
              deliveryFee: toInt(record.delivery || '0'),
              excessDistance: toInt(record.excess_distance || '0'),
              additionalUsage: toInt(record.additional_usage || '0'),
              lateFee: toInt(record.late_fee || '0'),
              grossEarned: grossEarned,
              turoFee: turoFee,
              operationExpense: opExpense,
              netEarned: revenue,
            };
          }),
        });

        return {
          success: true,
          recordsProcessed: result.count
        };

      } catch (error) {
        console.error('Error processing CSV:', error);
        throw new Error('Failed to process CSV file');
      }
    }),
});

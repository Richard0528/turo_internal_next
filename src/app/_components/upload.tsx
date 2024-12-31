"use client";

import { useState } from "react";
import { api } from "@/trpc/react";

export function FileUploadComponent() {
    const [file, setFile] = useState<File | null>(null);
    const [uploadStatus, setUploadStatus] = useState<string>("");
    
    const uploadMutation = api.file.uploadTrips.useMutation({
      onSuccess: (data) => {
        setUploadStatus(`Successfully processed ${data.recordsProcessed} records`);
      },
      onError: (error) => {
        setUploadStatus(`Error: ${error.message}`);
      },
    });
  
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const selectedFile = e.target.files?.[0];
      if (selectedFile) {
        setFile(selectedFile);
      }
    };
  
    const handleUpload = async () => {
      if (!file) {
        setUploadStatus("Please select a file first");
        return;
      }
  
      try {
        const content = await file.text();
        uploadMutation.mutate({
          csvContent: content,
          fileName: file.name,
        });
      } catch (error) {
        setUploadStatus("Error reading file");
      }
    };
  
    return (
      <div className="flex flex-col items-center gap-4 rounded-xl bg-white/10 p-4">
        <h3 className="text-2xl font-bold">Upload Trips CSV</h3>
        <input
          type="file"
          accept=".csv"
          onChange={handleFileChange}
          className="cursor-pointer rounded-lg bg-white/5 px-4 py-2"
        />
        <button
          onClick={handleUpload}
          disabled={!file || uploadMutation.isPending}
          className="rounded-full bg-white/10 px-10 py-3 font-semibold transition hover:bg-white/20 disabled:opacity-50"
        >
          {uploadMutation.isPending ? "Uploading..." : "Upload"}
        </button>
        {uploadStatus && (
          <p className={`text-center ${uploadStatus.includes("Error") ? "text-red-400" : "text-green-400"}`}>
            {uploadStatus}
          </p>
        )}
      </div>
    );
  }
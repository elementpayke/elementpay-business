"use client";

import { useRef, useState, type DragEvent } from "react";
import { FileText, Loader2, Upload } from "lucide-react";

type DropzoneState = "idle" | "parsing" | "valid" | "invalid";

type CsvUploadDropzoneProps = {
  state: DropzoneState;
  fileName?: string | null;
  summaryLine?: string | null;
  onFileSelected: (file: File) => void;
};

const STATE_STYLES: Record<DropzoneState, { border: string; bg: string; iconBg: string; iconColor: string }> = {
  idle: {
    border: "border-[#E1E4EE]",
    bg: "bg-[#FAFBFE]",
    iconBg: "bg-tertiary-100",
    iconColor: "text-tertiary-700",
  },
  parsing: {
    border: "border-[#E1E4EE]",
    bg: "bg-[#FAFBFE]",
    iconBg: "bg-primary-50",
    iconColor: "text-primary-600",
  },
  valid: {
    border: "border-tertiary-300",
    bg: "bg-tertiary-50",
    iconBg: "bg-tertiary-100",
    iconColor: "text-tertiary-700",
  },
  invalid: {
    border: "border-[#F5B4BE]",
    bg: "bg-[#FFF2F4]",
    iconBg: "bg-[#FFE3E7]",
    iconColor: "text-[#D1455C]",
  },
};

export default function CsvUploadDropzone({
  state,
  fileName,
  summaryLine,
  onFileSelected,
}: CsvUploadDropzoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);

  const styles = STATE_STYLES[state];

  function openPicker() {
    inputRef.current?.click();
  }

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setDragOver(false);
    const file = event.dataTransfer.files?.[0];
    if (file) onFileSelected(file);
  }

  return (
    <div
      onDragOver={(event) => {
        event.preventDefault();
        setDragOver(true);
      }}
      onDragLeave={() => setDragOver(false)}
      onDrop={handleDrop}
      onClick={openPicker}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          openPicker();
        }
      }}
      role="button"
      tabIndex={0}
      aria-label="Upload CSV file"
      className={`flex cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed px-6 py-10 text-center transition focus:outline-none focus:ring-2 focus:ring-primary-300 ${
        styles.border
      } ${styles.bg} ${dragOver ? "ring-2 ring-primary-300" : ""}`}
    >
      <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${styles.iconBg} ${styles.iconColor}`}>
        {state === "parsing" ? (
          <Loader2 className="h-5 w-5 animate-spin" />
        ) : (
          <FileText className="h-5 w-5" />
        )}
      </div>

      <h3 className="mt-4 text-sm font-semibold text-[#1D243C]">
        {state === "valid"
          ? fileName ?? "CSV uploaded"
          : state === "invalid"
          ? fileName ?? "Upload failed"
          : state === "parsing"
          ? "Parsing CSV…"
          : "Upload a CSV file"}
      </h3>
      <p className="mt-1 text-xs text-[#8E93A7]">
        {state === "idle"
          ? "Drag and drop your file here, or click to browse"
          : summaryLine ?? ""}
      </p>

      <button
        type="button"
        onClick={(event) => {
          event.stopPropagation();
          openPicker();
        }}
        className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-primary-600 transition hover:text-primary-700"
      >
        <Upload className="h-4 w-4" />
        {state === "idle" || state === "parsing" ? "Upload a file" : "Upload a different file"}
      </button>

      <input
        ref={inputRef}
        type="file"
        accept=".csv,text/csv"
        className="hidden"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) onFileSelected(file);
          event.target.value = "";
        }}
      />
    </div>
  );
}

import React, { useState } from "react";
import { Copy } from "lucide-react";
import ModalShell, { inputStyle, SubmitButton } from "./ModalShell.jsx";

export default function ExportModal({ title, text, onClose }) {
  const [status, setStatus] = useState("");
  const copy = async () => {
    try { await navigator.clipboard.writeText(text); setStatus("Copied ✓"); }
    catch { setStatus("Tap the text above and copy it manually"); }
    setTimeout(() => setStatus(""), 2500);
  };
  return (
    <ModalShell title={title} onClose={onClose}>
      <p className="text-[12px] mb-2" style={{ color: "#A9B29C" }}>
        Send this to someone else — they paste it into "Add species" → the import box to bring it into their own almanac. Nothing here is linked back to your data.
      </p>
      <textarea readOnly value={text} rows={10} onFocus={(e) => e.target.select()}
        className="w-full px-3 py-2 rounded-lg text-[11px] font-mono resize-none" style={inputStyle} />
      <SubmitButton onClick={copy} className="mt-3 flex items-center justify-center gap-1.5">
        <Copy size={14} /> {status || "Copy to clipboard"}
      </SubmitButton>
    </ModalShell>
  );
}

import { useState, useEffect, useCallback, useRef } from "react";

type ValidationResult = {
  message: string;
  isValid: boolean;
};

type ValidatorModule = {
  ccall: (
    funcName: string,
    returnType: string,
    artTypes: string[],
    args: unknown[],
  ) => unknown;
  UTF8ToString: (ptr: number) => string;
  _validate: (yangPtr: number, xmlPtr: number) => number;
  _malloc: (size: number) => number;
  _free: (ptr: number) => void;
};

declare global {
  interface Window {
    Validator: () => Promise<ValidatorModule>;
  }
}

export function YangValidator() {
  const [validator, setValidator] = useState<ValidatorModule | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ValidationResult | null>(null);
  const [yangContent, setYangContent] = useState("");
  const [yangFileName, setYangFileName] = useState("");
  const [xmlContent, setXmlContent] = useState("");
  const [xmlFileName, setXmlFileName] = useState("");

  const resultRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (result && resultRef.current) {
      resultRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [result]);

  // Initialize WASM module
  useEffect(() => {
    const init = async () => {
      try {
        const module = await window.Validator();
        setValidator(module);
      } catch (err) {
        console.error("WASM init error:", err);
        setResult({ message: "Failed to load validator", isValid: false });
      } finally {
        setLoading(false);
      }
    };
    init();
  }, []);
  const validate = useCallback(() => {
    if (!validator || !yangContent || !xmlContent) return;

    try {
      const validationResult = validator.ccall(
        "validate",
        "string",
        ["string", "string"],
        [yangContent, xmlContent],
      );
      const message = String(validationResult);
      const isValid = message.includes("Validation successful");

      setResult({ message, isValid });
    } catch (err) {
      setResult({
        message: `Validation error: ${err instanceof Error ? err.message : "Unknown error"}`,
        isValid: false,
      });
    }
  }, [validator, yangContent, xmlContent]);

  const handleFileChange = useCallback(
    (type: "yang" | "xml") =>
      async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        try {
          const content = await file.text();
          if (type === "yang") {
            setYangContent(content);
            setYangFileName(file.name);
          } else {
            setXmlContent(content);
            setXmlFileName(file.name);
          }
          setResult(null); // Clear previous result when files change
        } catch (err) {
          setError(
            `Error reading file: ${err instanceof Error ? err.message : "Unknown error"}`,
          );
        }
      },
    [],
  );

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      <div className="text-center py-8">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-green-400 to-emerald-600 bg-clip-text text-transparent">
          YANG-XML Validator
        </h1>
        <p className="text-gray-400 mt-2">
          Validate XML configurations against YANG schemas
        </p>
      </div>

      {loading && (
        <div className="flex items-center justify-center p-8 space-x-3">
          <div className="w-4 h-4 rounded-full bg-green-500 animate-pulse"></div>
          <div className="w-4 h-4 rounded-full bg-green-500 animate-pulse delay-150"></div>
          <div className="w-4 h-4 rounded-full bg-green-500 animate-pulse delay-300"></div>
          <span className="text-gray-400 ml-2">Loading WASM validator...</span>
        </div>
      )}

      {error && (
        <div className="p-4 bg-red-900-20 border border-red-700 text-red-400 rounded-lg">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <FileUpload
          type="yang"
          label="YANG Schema"
          onChange={handleFileChange("yang")}
          fileName={yangFileName}
          disabled={loading}
        />

        <FileUpload
          type="xml"
          label="XML Configuration"
          onChange={handleFileChange("xml")}
          fileName={xmlFileName}
          disabled={loading}
        />
      </div>

      <div className="flex justify-center mt-8">
        <button
          onClick={validate}
          disabled={!validator || !yangContent || !xmlContent || loading}
          className={`px-6 py-3 rounded-lg text-white font-medium transition-all duration-200 flex items-center space-x-2 ${
            !validator || !yangContent || !xmlContent || loading
              ? "bg-gray-700 cursor-not-allowed opacity-50"
              : "bg-green-600 hover:bg-green-700 shadow-lg hover:shadow-green-500-20"
          }`}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M9 12l2 2 4-4"></path>
            <circle cx="12" cy="12" r="10"></circle>
          </svg>
          <span>{loading ? "Loading Validator..." : "Validate"}</span>
        </button>
      </div>

      {result && (
        <div
          ref={resultRef}
          className={`mt-8 rounded-lg border ${
            result.isValid
              ? "bg-green-900-20 border-green-700"
              : "bg-red-900-20 border-red-700"
          }`}
        >
          <div
            className={`p-4 flex items-center ${
              result.isValid
                ? "border-b border-green-700"
                : "border-b border-red-700"
            }`}
          >
            {result.isValid ? (
              <div className="flex items-center text-green-400">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 mr-2"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                  <polyline points="22 4 12 14.01 9 11.01"></polyline>
                </svg>
                <span className="font-medium">Validation Successful</span>
              </div>
            ) : (
              <div className="flex items-center text-red-400">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 mr-2"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="12" cy="12" r="10"></circle>
                  <line x1="15" y1="9" x2="9" y2="15"></line>
                  <line x1="9" y1="9" x2="15" y2="15"></line>
                </svg>
                <span className="font-medium">Validation Failed</span>
              </div>
            )}
          </div>
          <div className="p-4 max-h-96 font-mono text-sm break-all">
            {result.message}
          </div>
        </div>
      )}
    </div>
  );
}

interface FileUploadProps {
  type: "yang" | "xml";
  label: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  fileName: string | null;
  disabled: boolean;
}

function FileUpload({
  type,
  label,
  onChange,
  fileName,
  disabled,
}: FileUploadProps) {
  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-300">{label}</label>
      <div className="relative">
        <input
          type="file"
          accept={`.${type}`}
          onChange={onChange}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
          disabled={disabled}
        />
        <div className="flex items-center justify-between px-4 py-3 border border-gray-700 bg-gray-800-50 rounded-lg text-gray-300 hover:bg-gray-800 transition-colors">
          <div className="flex items-center">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className={`h-5 w-5 mr-2 ${type === "yang" ? "text-green-500" : "text-emerald-500"}`}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"></path>
              <polyline points="13 2 13 9 20 9"></polyline>
            </svg>
            <span className="truncate max-w-[200px]">
              {fileName || `Choose ${type.toUpperCase()} file...`}
            </span>
          </div>
          <span
            className={`text-xs px-2 py-1 rounded ${
              type === "yang"
                ? "bg-green-900-50 text-green-400"
                : "bg-emerald-900-50 text-emerald-400"
            }`}
          >
            .{type}
          </span>
        </div>
      </div>
    </div>
  );
}

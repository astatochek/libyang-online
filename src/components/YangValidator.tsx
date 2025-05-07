import { useState, useEffect, useCallback } from "react";

type ValidationResult = {
  message: string;
  isValid: boolean;
};

declare global {
  interface Window {
    // eslint-disable-next-line
    Validator: any;
  }
}

export function YangValidator() {
  const [validator, setValidator] = useState<Window["Validator"]>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ValidationResult | null>(null);
  const [yangContent, setYangContent] = useState("");
  const [xmlContent, setXmlContent] = useState("");

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

      const isValid = !validationResult.toLowerCase().includes("error");
      setResult({
        message: validationResult,
        isValid,
      });
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
          } else {
            setXmlContent(content);
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
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-bold text-gray-800">YANG-XML Validator</h1>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded">
          {error}
        </div>
      )}

      <div className="space-y-4">
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            YANG Schema
          </label>
          <input
            type="file"
            accept=".yang"
            onChange={handleFileChange("yang")}
            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border file:border-gray-300 file:text-sm file:font-medium file:bg-white file:text-gray-700 hover:file:bg-gray-50"
            disabled={loading}
          />
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            XML Configuration
          </label>
          <input
            type="file"
            accept=".xml"
            onChange={handleFileChange("xml")}
            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border file:border-gray-300 file:text-sm file:font-medium file:bg-white file:text-gray-700 hover:file:bg-gray-50"
            disabled={loading}
          />
        </div>
      </div>

      <button
        onClick={validate}
        disabled={!validator || !yangContent || !xmlContent || loading}
        className={`px-4 py-2 rounded-md text-white ${
          !validator || !yangContent || !xmlContent || loading
            ? "bg-gray-400 cursor-not-allowed"
            : "bg-blue-600 hover:bg-blue-700"
        }`}
      >
        {loading ? "Loading Validator..." : "Validate"}
      </button>

      {result && (
        <div
          className={`p-4 rounded-md border ${
            result.isValid
              ? "bg-green-50 border-green-200 text-green-700"
              : "bg-red-50 border-red-200 text-red-700"
          }`}
        >
          {result.message}
        </div>
      )}
    </div>
  );
}

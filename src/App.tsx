import { useEffect, useState } from "react";

import { invoke } from "@tauri-apps/api/core";

import { getCurrentWindow } from "@tauri-apps/api/window";

import { open } from "@tauri-apps/plugin-dialog";

import toast, { Toaster } from "react-hot-toast";

function App() {
  const [isDragging, setIsDragging] = useState(false);

  const [filePaths, setFilePaths] = useState<string[]>([]);

  const [fileNames, setFileNames] = useState<string[]>([]);

  const [fromFormat, setFromFormat] = useState("image");

  const [toFormat, setToFormat] = useState("png");

  const [loading, setLoading] = useState(false);

  const [outputFolder, setOutputFolder] = useState("");

  const [customName, setCustomName] = useState("");

  const [pdfQuality, setPdfQuality] = useState("balanced");

  const [missingDeps, setMissingDeps] = useState<string[]>([]);

  useEffect(() => {
    const checkDeps = async () => {
      try {
        const result = await invoke<string[]>("check_dependencies");

        setMissingDeps(result);
      } catch (err) {
        console.error(err);
      }
    };

    checkDeps();

    const appWindow = getCurrentWindow();

    const setup = async () => {
      const unlisten = await appWindow.onDragDropEvent((event) => {
        if (event.payload.type === "drop") {
          const paths = event.payload.paths;

          if (paths && paths.length > 0) {
            setFilePaths((prev) => [...prev, ...paths]);

            const names = paths.map((path) => {
              const parts = path.split("\\");

              return parts[parts.length - 1];
            });

            setFileNames((prev) => [...prev, ...names]);

            setIsDragging(false);
          }
        }

        if (event.payload.type === "enter") {
          setIsDragging(true);
        }

        if (event.payload.type === "leave") {
          setIsDragging(false);
        }
      });

      return unlisten;
    };

    setup();
  }, []);

  const selectFile = async () => {
    let filters: {
      name: string;
      extensions: string[];
    }[] = [];

    // IMAGE INPUT
    if (fromFormat === "image") {
      filters = [
        {
          name: "Images",

          extensions: ["png", "jpg", "jpeg", "webp"],
        },
      ];
    }

    // PDF INPUT
    if (fromFormat === "pdf") {
      filters = [
        {
          name: "PDF",

          extensions: ["pdf"],
        },
      ];
    }

    const selected = await open({
      multiple: true,

      filters,
    });

    if (selected && Array.isArray(selected)) {
      setFilePaths((prev) => [...prev, ...selected]);

      const names = selected.map((path) => {
        const parts = path.split("\\");

        return parts[parts.length - 1];
      });

      setFileNames((prev) => [...prev, ...names]);
    }
  };

  const selectOutputFolder = async () => {
    const selected = await open({
      directory: true,

      multiple: false,
    });

    if (selected && typeof selected === "string") {
      setOutputFolder(selected);
    }
  };

  const handleConvert = async () => {
    if (filePaths.length === 0) {
      toast("Select files");

      return;
    }

    if (!outputFolder) {
      toast("Select output folder");

      return;
    }

    try {
      setLoading(true);

      // PDF -> COMPRESSED PDF
      if (fromFormat === "pdf" && toFormat === "compressed") {
        for (let i = 0; i < filePaths.length; i++) {
          const path = filePaths[i];

          const name = fileNames[i];

          const baseName =
            customName.trim() !== ""
              ? `${customName}_${i + 1}`
              : name.split(".")[0];

          const outputPath = `${outputFolder}\\${baseName}_compressed.pdf`;

          await invoke("compress_pdf", {
            inputPath: path,

            outputPath,

            quality: pdfQuality,
          });
        }

        toast.success("PDF compression completed");

        return;
      }

      // IMAGE -> PDF
      if (fromFormat === "image" && toFormat === "pdf") {
        const pdfName = customName.trim() !== "" ? customName : "converted";

        const outputPath = `${outputFolder}\\${pdfName}.pdf`;

        await invoke("images_to_pdf", {
          imagePaths: filePaths,

          outputPath,
        });

        toast.success("PDF created successfully");

        return;
      }

      // PDF -> PNG
      if (fromFormat === "pdf" && toFormat === "png") {
        for (let i = 0; i < filePaths.length; i++) {
          const path = filePaths[i];

          const name = fileNames[i];

          const baseName =
            customName.trim() !== ""
              ? `${customName}_${i + 1}`
              : name.split(".")[0];

          const outputPath = `${outputFolder}\\${baseName}`;

          await invoke("pdf_to_images", {
            inputPath: path,

            outputDir: outputPath,
          });
        }

        toast.success("PDF conversion completed");

        return;
      }

      // IMAGE -> IMAGE
      if (fromFormat === "image") {
        for (let i = 0; i < filePaths.length; i++) {
          const path = filePaths[i];

          const name = fileNames[i];

          const baseName =
            customName.trim() !== ""
              ? `${customName}_${i + 1}`
              : name.split(".")[0];

          const outputPath = `${outputFolder}\\${baseName}.${toFormat}`;

          await invoke("convert_image", {
            inputPath: path,

            outputPath,

            outputFormat: toFormat,
          });
        }

        toast.success("Batch conversion completed");
      }
    } catch (error) {
      console.error(error);

      toast.error(`Conversion failed:\n${error}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "flex-start",
        paddingTop: "40px",
        boxSizing: "border-box",
        backgroundColor: "#111",
        color: "white",
        fontFamily: "Arial",
      }}
    >
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: "#222",
            color: "#fff",
            border: "1px solid #444",
          },
        }}
      />
      <div
        style={{
          width: "100%",
          maxWidth: "700px",
          padding: "30px",
          borderRadius: "12px",
          backgroundColor: "#1e1e1e",
          display: "flex",
          flexDirection: "column",
          gap: "20px",
        }}
      >
        <h1
          style={{
            textAlign: "center",
          }}
        >
          Universal File Converter
        </h1>

        {missingDeps.length > 0 && (
          <div
            style={{
              backgroundColor: "#4b1d1d",

              padding: "12px",

              borderRadius: "8px",

              color: "#ffb3b3",

              fontSize: "14px",
            }}
          >
            <strong>Missing Dependencies:</strong>

            <ul
              style={{
                marginTop: "8px",
              }}
            >
              {missingDeps.map((dep) => (
                <li key={dep}>{dep}</li>
              ))}
            </ul>
          </div>
        )}

        <select
          value={fromFormat}
          onChange={(e) => {
            setFromFormat(e.target.value);

            setFileNames([]);

            setFilePaths([]);
          }}
          style={{
            padding: "10px",
            borderRadius: "6px",
          }}
        >
          <option value="image">Images</option>

          <option value="pdf">PDF</option>
        </select>

        <select
          value={toFormat}
          onChange={(e) => setToFormat(e.target.value)}
          style={{
            padding: "10px",
            borderRadius: "6px",
          }}
        >
          {fromFormat === "image" && (
            <>
              <option value="png">PNG</option>

              <option value="jpg">JPG</option>

              <option value="webp">WEBP</option>

              <option value="pdf">PDF</option>
            </>
          )}

          {fromFormat === "pdf" && (
            <>
              <option value="png">PNG</option>

              <option value="compressed">Compressed PDF</option>
            </>
          )}
        </select>

        {fromFormat === "pdf" && toFormat === "compressed" && (
          <select
            value={pdfQuality}
            onChange={(e) => setPdfQuality(e.target.value)}
            style={{
              padding: "10px",
              borderRadius: "6px",
            }}
          >
            <option value="extreme">Extreme Compression</option>

            <option value="very_small">Very Small File</option>

            <option value="small">Small Size</option>

            <option value="balanced">Balanced</option>

            <option value="high">High Quality</option>
          </select>
        )}

        <div
          onClick={selectFile}
          style={{
            padding: "40px",

            borderRadius: "12px",

            border: isDragging ? "2px solid #4f46e5" : "2px dashed gray",

            textAlign: "center",

            cursor: "pointer",

            backgroundColor: isDragging ? "#1f1f2e" : "#222",

            transition: "0.2s",
          }}
        >
          <p>Drag & Drop Files Here</p>

          <p>or click to browse</p>
        </div>

        {fileNames.length > 0 && (
          <div
            style={{
              backgroundColor: "#2a2a2a",
              padding: "15px",
              borderRadius: "8px",
            }}
          >
            <p>
              <strong>Selected Files:</strong>
            </p>

            <div
              style={{
                maxHeight: "150px",
                overflowY: "auto",
              }}
            >
              {fileNames.map((name, index) => (
                <div
                  key={index}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",

                    alignItems: "center",

                    marginBottom: "8px",
                  }}
                >
                  <p
                    style={{
                      margin: 0,
                    }}
                  >
                    {name}
                  </p>

                  <button
                    onClick={() => {
                      setFileNames((prev) =>
                        prev.filter((_, i) => i !== index),
                      );

                      setFilePaths((prev) =>
                        prev.filter((_, i) => i !== index),
                      );
                    }}
                    style={{
                      backgroundColor: "#ff4d4f",

                      border: "none",

                      color: "white",

                      borderRadius: "6px",

                      padding: "4px 8px",

                      cursor: "pointer",
                    }}
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        <button
          onClick={selectOutputFolder}
          style={{
            padding: "12px",

            border: "none",

            borderRadius: "8px",

            backgroundColor: "#2563eb",

            color: "white",

            fontSize: "16px",

            cursor: "pointer",
          }}
        >
          Select Output Folder
        </button>

        {fromFormat === "image" && toFormat === "pdf" && (
          <input
            type="text"
            placeholder="PDF file name"
            value={customName}
            onChange={(e) => setCustomName(e.target.value)}
            style={{
              padding: "12px",

              borderRadius: "8px",

              border: "none",

              backgroundColor: "#2a2a2a",

              color: "white",

              fontSize: "14px",
            }}
          />
        )}

        {outputFolder && (
          <p
            style={{
              fontSize: "14px",
              color: "#aaa",
            }}
          >
            Output Folder: {outputFolder}
          </p>
        )}

        <button
          onClick={handleConvert}
          disabled={loading}
          style={{
            padding: "12px",

            border: "none",

            borderRadius: "8px",

            backgroundColor: loading ? "gray" : "#4f46e5",

            color: "white",

            fontSize: "16px",

            cursor: "pointer",
          }}
        >
          {loading ? "Converting..." : "Convert Files"}
        </button>

        <button
          onClick={() => {
            setFileNames([]);

            setFilePaths([]);
          }}
          style={{
            padding: "12px",

            border: "none",

            borderRadius: "8px",

            backgroundColor: "#444",

            color: "white",

            fontSize: "16px",

            cursor: "pointer",
          }}
        >
          Clear All
        </button>
      </div>
    </div>
  );
}

export default App;

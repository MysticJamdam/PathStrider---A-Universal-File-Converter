import { useState } from "react";

import { invoke } from "@tauri-apps/api/core";

import {
  open,
  save
} from "@tauri-apps/plugin-dialog";

function App() {

  const [filePath, setFilePath] =
    useState("");

  const [fileName, setFileName] =
    useState("");

  const [targetFormat, setTargetFormat] =
    useState("png");

  const [loading, setLoading] =
    useState(false);

  const selectFile = async () => {

    const selected = await open({

      multiple: false,

      filters: [
        {
          name: "Images",
          extensions: [
            "png",
            "jpg",
            "jpeg",
            "webp"
          ]
        }
      ]
    });

    if (
      selected &&
      typeof selected === "string"
    ) {

      setFilePath(selected);

      const parts =
        selected.split("\\");

      setFileName(
        parts[parts.length - 1]
      );
    }
  };

  const handleConvert = async () => {

  if (!filePath) {

    alert("Select a file");

    return;
  }

  try {

    setLoading(true);

    const suggestedName =
      `${fileName.split(".")[0]}_converted.${targetFormat}`;

    const savePath = await save({

      defaultPath: suggestedName
    });

    if (!savePath) {

      setLoading(false);

      return;
    }

    const outputPath =
      await invoke<string>(
        "convert_image",
        {
          inputPath: filePath,
          outputPath: savePath,
          outputFormat: targetFormat
        }
      );

    alert(
      `Saved successfully:\n\n${outputPath}`
    );

  } catch (error) {

    console.error(error);

    alert(
      `Conversion failed:\n${error}`
    );

  } finally {

    setLoading(false);
  }
};

  return (

    <div
      style={{
        height: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "#111",
        color: "white",
        fontFamily: "Arial",
      }}
    >

      <div
        style={{
          width: "500px",
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

        <button
          onClick={selectFile}
          style={{
            padding: "12px",
            border: "none",
            borderRadius: "8px",
            backgroundColor: "#333",
            color: "white",
            cursor: "pointer",
          }}
        >
          Choose File
        </button>

        {
          fileName && (

            <div
              style={{
                backgroundColor: "#2a2a2a",
                padding: "15px",
                borderRadius: "8px",
              }}
            >

              <p>
                <strong>Selected:</strong>
              </p>

              <p>
                {fileName}
              </p>

            </div>
          )
        }

        <select
          value={targetFormat}
          onChange={(e) =>
            setTargetFormat(
              e.target.value
            )
          }
          style={{
            padding: "10px",
            borderRadius: "6px",
          }}
        >

          <option value="png">
            PNG
          </option>

          <option value="jpg">
            JPG
          </option>

          <option value="webp">
            WEBP
          </option>

        </select>

        <button
          onClick={handleConvert}
          disabled={loading}
          style={{
            padding: "12px",
            border: "none",
            borderRadius: "8px",
            backgroundColor:
              loading
                ? "gray"
                : "#4f46e5",
            color: "white",
            fontSize: "16px",
            cursor: "pointer",
          }}
        >

          {
            loading
              ? "Converting..."
              : "Convert File"
          }

        </button>

      </div>

    </div>
  );
}

export default App;
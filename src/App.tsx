import {
  useEffect,
  useState
} from "react";

import { invoke } from "@tauri-apps/api/core";

import {
  getCurrentWindow
} from "@tauri-apps/api/window";

import {
  open,
  save
} from "@tauri-apps/plugin-dialog";

function App() {

  const [isDragging, setIsDragging] =
    useState(false);

  const [filePath, setFilePath] =
    useState("");

  const [fileName, setFileName] =
    useState("");

  const [targetFormat, setTargetFormat] =
    useState("png");

  const [loading, setLoading] =
    useState(false);

  useEffect(() => {

  const appWindow =
    getCurrentWindow();

  const setup = async () => {

    const unlisten =
      await appWindow.onDragDropEvent(
        (event) => {

          if (
            event.payload.type === "drop"
          ) {

            const paths =
              event.payload.paths;

            if (
              paths &&
              paths.length > 0
            ) {

              const path =
                paths[0];

              setFilePath(path);

              const parts =
                path.split("\\");

              setFileName(
                parts[
                  parts.length - 1
                ]
              );

              setIsDragging(false);
            }
          }

          if (
            event.payload.type === "enter"
          ) {

            setIsDragging(true);
          }

          if (
            event.payload.type === "leave"
          ) {

            setIsDragging(false);
          }
        }
      );

    return unlisten;
  };

  setup();

}, []);

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

        <div
          onClick={selectFile}

          style={{

            padding: "40px",

            borderRadius: "12px",

            border: isDragging
              ? "2px solid #4f46e5"
              : "2px dashed gray",

            textAlign: "center",

            cursor: "pointer",

            backgroundColor:
              isDragging
                ? "#1f1f2e"
                : "#222",

            transition: "0.2s",
          }}
        >

          <p>
            Drag & Drop File Here
          </p>

          <p>
            or click to browse
          </p>

        </div>

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
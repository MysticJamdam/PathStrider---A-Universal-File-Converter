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

  const [filePaths, setFilePaths] =
    useState<string[]>([]);

  const [fileNames, setFileNames] =
    useState<string[]>([]);

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

                setFilePaths((prev) => [
                  ...prev,
                  ...paths
                ]);


                const names =
                  paths.map(
                    (path) => {

                      const parts =
                        path.split("\\");

                      return parts[
                        parts.length - 1
                      ];
                    }
                  );

                setFileNames((prev) => [
                  ...prev,
                  ...names
                ]);

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

      multiple: true,

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
      Array.isArray(selected)
    ) {
      setFilePaths((prev) => [
  ...prev,
  ...selected
]);

const names =
  selected.map(
    (path) => {

      const parts =
        path.split("\\");

      return parts[
        parts.length - 1
      ];
    }
  );

setFileNames((prev) => [
  ...prev,
  ...names
]);
    }
  };

  const handleConvert = async () => {

    if (
      filePaths.length === 0
    ) {

      alert("Select files");

      return;
    }

    try {

      setLoading(true);

      for (
        let i = 0;
        i < filePaths.length;
        i++
      ) {

        const path =
          filePaths[i];

        const name =
          fileNames[i];

        const suggestedName =
          `${name.split(".")[0]}_converted.${targetFormat}`;

        const savePath =
          await save({

            defaultPath:
              suggestedName
          });

        if (!savePath) {
          continue;
        }

        await invoke(
          "convert_image",
          {
            inputPath: path,

            outputPath:
              savePath,

            outputFormat:
              targetFormat
          }
        );
      }

      alert(
        "Batch conversion completed"
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
            Drag & Drop Files Here
          </p>

          <p>
            or click to browse
          </p>

        </div>

        {
          fileNames.length > 0 && (

            <div
              style={{
                backgroundColor: "#2a2a2a",
                padding: "15px",
                borderRadius: "8px",
              }}
            >

              <p>
                <strong>
                  Selected Files:
                </strong>
              </p>

              <div
                style={{
                  maxHeight: "150px",
                  overflowY: "auto",
                }}
              >

                {
                  fileNames.map(
                    (
                      name,
                      index
                    ) => (

                      <p key={index}>
                        {name}
                      </p>
                    )
                  )
                }

              </div>

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
              : "Convert Files"
          }

        </button>

      </div>

    </div>
  );
}

export default App;
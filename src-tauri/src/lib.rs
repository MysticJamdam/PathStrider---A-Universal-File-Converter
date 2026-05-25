use image::ImageFormat;

use std::process::Command;

#[tauri::command]
async fn convert_image(
    input_path: String,
    output_path: String,
    output_format: String,
) -> Result<String, String> {

    tokio::task::spawn_blocking(
        move || {

            let img = image::open(
                &input_path
            )
            .map_err(
                |e| e.to_string()
            )?;

            let format =
                match output_format.as_str() {

                    "png" =>
                        ImageFormat::Png,

                    "jpg" | "jpeg" =>
                        ImageFormat::Jpeg,

                    "webp" =>
                        ImageFormat::WebP,

                    _ => {

                        return Err(
                            "Unsupported format"
                                .into()
                        )
                    }
                };

            img.save_with_format(
                &output_path,
                format
            )
            .map_err(
                |e| e.to_string()
            )?;

            Ok::<String, String>(
                output_path
            )
        }
    )
    .await
    .map_err(
        |e| e.to_string()
    )?
}

#[tauri::command]
fn images_to_pdf(
    image_paths: Vec<String>,
    output_path: String,
) -> Result<String, String> {

    let mut command =
        Command::new("magick");

    for path in &image_paths {

        command.arg(path);
    }

    command.arg(&output_path);

    let status =
        command
            .status()
            .map_err(
                |e| e.to_string()
            )?;

    if status.success() {

        Ok(output_path)

    } else {

        Err(
            "Image to PDF failed"
                .into()
        )
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {

    tauri::Builder::default()

        .plugin(
            tauri_plugin_dialog::init()
        )

        .invoke_handler(
            tauri::generate_handler![
                convert_image,
                compress_pdf,
                images_to_pdf
            ]
        )

        .run(
            tauri::generate_context!()
        )

        .expect(
            "error while running tauri application"
        );
}
#[tauri::command]
async fn compress_pdf(
    input_path: String,
    output_path: String,
    quality: String,
) -> Result<String, String> {

    tokio::task::spawn_blocking(
        move || {

            let (
                preset,
                resolution
            ) = match quality.as_str() {

                "extreme" =>
                    ("/screen", "48"),

                "very_small" =>
                    ("/screen", "72"),

                "small" =>
                    ("/screen", "96"),

                "balanced" =>
                    ("/ebook", "150"),

                "high" =>
                    ("/printer", "300"),

                _ =>
                    ("/ebook", "150"),
            };

            let status =
                Command::new("gswin64c")

                .args([

                    "-sDEVICE=pdfwrite",

                    "-dCompatibilityLevel=1.4",

                    &format!(
                        "-dPDFSETTINGS={}",
                        preset
                    ),

                    "-dNOPAUSE",
                    "-dQUIET",
                    "-dBATCH",

                    // COLOR IMAGES
                    "-dDownsampleColorImages=true",

                    &format!(
                        "-dColorImageResolution={}",
                        resolution
                    ),

                    // GRAYSCALE IMAGES
                    "-dDownsampleGrayImages=true",

                    &format!(
                        "-dGrayImageResolution={}",
                        resolution
                    ),

                    // MONO IMAGES
                    "-dDownsampleMonoImages=true",

                    &format!(
                        "-dMonoImageResolution={}",
                        resolution
                    ),

                    &format!(
                        "-sOutputFile={}",
                        output_path
                    ),

                    &input_path,
                ])

                .status()

                .map_err(
                    |e| e.to_string()
                )?;

            if status.success() {

                Ok::<String, String>(
                    output_path
                )

            } else {

                Err(
                    "PDF compression failed"
                        .into()
                )
            }
        }
    )
    .await
    .map_err(
        |e| e.to_string()
    )?
}
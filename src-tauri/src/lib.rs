use image::ImageFormat;

use std::path::PathBuf;

use std::process::Command;

use tauri::Manager;



fn get_ghostscript_path(
    app: &tauri::AppHandle
) -> Result<PathBuf, String> {

    app.path()

        .resolve(
            "bin/gswin64c.exe",
            tauri::path::BaseDirectory::Resource
        )

        .map_err(
            |e| e.to_string()
        )
}



fn get_magick_path(
    app: &tauri::AppHandle
) -> Result<PathBuf, String> {

    app.path()

        .resolve(
            "bin/magick.exe",
            tauri::path::BaseDirectory::Resource
        )

        .map_err(
            |e| e.to_string()
        )
}



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

    app_handle: tauri::AppHandle,

    image_paths: Vec<String>,

    output_path: String,

) -> Result<String, String> {

    let magick_path =
        get_magick_path(
            &app_handle
        )?;

    let mut command =
        Command::new(
            magick_path
        );

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



#[tauri::command]
async fn compress_pdf(

    app_handle: tauri::AppHandle,

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

            let gs_path =
                get_ghostscript_path(
                    &app_handle
                )?;

            let status =
                Command::new(
                    gs_path
                )

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



#[tauri::command]
fn check_dependencies(
    app_handle: tauri::AppHandle
) -> Vec<String> {

    let mut missing =
        Vec::new();

    // Ghostscript
    if let Ok(gs_path) =
        get_ghostscript_path(
            &app_handle
        )
    {

        if Command::new(gs_path)

            .arg("-version")

            .output()

            .is_err()
        {

            missing.push(
                "Ghostscript".into()
            );
        }

    } else {

        missing.push(
            "Ghostscript".into()
        );
    }

    // ImageMagick
    if let Ok(magick_path) =
        get_magick_path(
            &app_handle
        )
    {

        if Command::new(magick_path)

            .arg("-version")

            .output()

            .is_err()
        {

            missing.push(
                "ImageMagick".into()
            );
        }

    } else {

        missing.push(
            "ImageMagick".into()
        );
    }

    missing
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

                images_to_pdf,

                compress_pdf,

                check_dependencies
            ]
        )

        .run(
            tauri::generate_context!()
        )

        .expect(
            "error while running tauri application"
        );
}
use image::ImageFormat;

use std::process::Command;

#[tauri::command]
fn convert_image(
    input_path: String,
    output_path: String,
    output_format: String,
) -> Result<String, String> {

    let img = image::open(&input_path)
        .map_err(|e| e.to_string())?;

    let format = match output_format.as_str() {

        "png" => ImageFormat::Png,

        "jpg" | "jpeg" =>
            ImageFormat::Jpeg,

        "webp" =>
            ImageFormat::WebP,

        _ => {
            return Err(
                "Unsupported format".into()
            )
        }
    };

    img.save_with_format(
        &output_path,
        format
    )
    .map_err(|e| e.to_string())?;

    Ok(output_path)
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
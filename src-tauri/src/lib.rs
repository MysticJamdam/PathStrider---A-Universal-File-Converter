use image::ImageFormat;

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

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {

    tauri::Builder::default()

        .plugin(
            tauri_plugin_dialog::init()
        )

        .invoke_handler(
            tauri::generate_handler![
                convert_image
            ]
        )

        .run(
            tauri::generate_context!()
        )

        .expect(
            "error while running tauri application"
        );
}
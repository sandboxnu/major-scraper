// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use std::fs;

#[tauri::command]
fn read_major_file(year: &str, college: &str, name: &str, form: &str) -> String {
    // TODO: ensure each path segment doesn't contain special path chars (ie. /, .., etc.)
    let path = format!("../../degrees/Major/{year}/{college}/{name}/{form}");
    match fs::read_to_string(&path) {
        Ok(str) => str,
        Err(err) => err.to_string()
    }
}

fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![read_major_file])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

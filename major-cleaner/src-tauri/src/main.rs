// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use std::fs;

// TODO: investigate strong typing for Tauri commands (maybe something like https://github.com/oscartbeaumont/tauri-specta ?).

#[tauri::command]
fn read_major_file(year: &str, college: &str, name: &str, form: &str) -> String {
    // TODO: ensure each path segment doesn't contain special path chars (ie. /, .., etc.)
    let path = format!("../../degrees/Major/{year}/{college}/{name}/{form}");
    match fs::read_to_string(&path) {
        Ok(str) => str,
        // TODO: setup a consistent error/normal result format to allow the frontend to read and display potential errors.
        Err(err) => err.to_string()
    }
}

// TODO: make a write_major_file function

fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![read_major_file])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

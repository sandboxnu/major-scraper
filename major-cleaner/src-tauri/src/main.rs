// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use std::fs;

const DEGREE_PATH: &str = "../../degrees";

// TODO: investigate strong typing for Tauri commands (maybe something like https://github.com/oscartbeaumont/tauri-specta ?).

#[tauri::command]
fn read_major_file(year: &str, college: &str, name: &str, form: &str) -> String {
    // TODO: ensure each path segment doesn't contain special path chars (ie. /, .., etc.)
    let path = format!("{DEGREE_PATH}/Major/{year}/{college}/{name}/{form}");
    match fs::read_to_string(&path) {
        Ok(str) => str,
        // TODO: setup a consistent error/normal result format to allow the frontend to read and display potential errors.
        Err(err) => err.to_string(),
    }
}

struct MajorFileData {
    entry: fs::DirEntry,
    path: Vec<String>,
}

fn iter_dirs(data: Vec<MajorFileData>) -> Vec<MajorFileData> {
    data.iter()
        .flat_map(|major_file_data| {
            let dir = fs::read_dir(major_file_data.entry.path()).expect("dir should exist");
            dir.into_iter().filter_map(|dir_entry| {
                let entry = dir_entry.expect("dir entry should exist");
                if (entry
                    .file_type()
                    .expect("failed getting file type")
                    .is_dir())
                {
                    let new_name = entry.file_name().into_string().expect("invalid file name");
                    let new_vec: Vec<String> = major_file_data
                        .path
                        .clone()
                        .into_iter()
                        .chain(vec![new_name].into_iter())
                        .collect();
                    Some(MajorFileData {
                        entry,
                        path: new_vec,
                    })
                } else {
                    None
                }
            })
        })
        .collect()
}

#[tauri::command]
fn generate_major_list() -> Vec<String> {
    let years = fs::read_dir(format!("{DEGREE_PATH}/Major"));
    let yearData: Vec<MajorFileData> = years
        .expect("Degrees directory should exist")
        .filter_map(|entry| {
            let entry = entry.expect("file should exist");
            let new_path = entry.file_name();
            let file_type = entry.file_type().expect("failed to determine file type");

            if file_type.is_dir() {
                Some(MajorFileData {
                    entry,
                    path: vec![new_path.into_string().expect("failed to convert string")],
                })
            } else {
                None
            }
        })
        .collect();

    let data = iter_dirs(iter_dirs(yearData));

    data.iter().map(|info| info.path.join("/")).collect()
}

// TODO: make a write_major_file function

fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![
            read_major_file,
            generate_major_list
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

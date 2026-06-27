use std::sync::Mutex;

use serde::Serialize;
use tauri::{
    image::Image,
    menu::MenuBuilder,
    tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent},
    AppHandle, Emitter, Manager, State,
};
use tauri_plugin_global_shortcut::{Code, GlobalShortcutExt, Modifiers, Shortcut, ShortcutState};

const TOGGLE_VISIBILITY_SHORTCUT: &str = "Alt+Shift+Space";
const TOGGLE_CLICK_THROUGH_SHORTCUT: &str = "Alt+Shift+C";

struct OverlayState {
    // Rust owns click-through state because the WebView cannot receive mouse
    // clicks after cursor events are ignored.
    click_through: Mutex<bool>,
}

#[derive(Clone, Serialize)]
struct ClickThroughPayload {
    enabled: bool,
}

fn main_window(app: &AppHandle) -> Result<tauri::WebviewWindow, String> {
    app.get_webview_window("main")
        .ok_or_else(|| "main window was not found".to_string())
}

fn emit_click_through(app: &AppHandle, enabled: bool) {
    // Keep the React UI synchronized when tray menu items or global shortcuts
    // change native window behavior.
    let _ = app.emit(
        "overlay://click-through-changed",
        ClickThroughPayload { enabled },
    );
}

#[tauri::command]
fn toggle_visibility(app: AppHandle) -> Result<(), String> {
    let window = main_window(&app)?;

    if window.is_visible().map_err(|error| error.to_string())? {
        window.hide().map_err(|error| error.to_string())?;
    } else {
        window.show().map_err(|error| error.to_string())?;
        window.set_focus().map_err(|error| error.to_string())?;
    }

    Ok(())
}

#[tauri::command]
fn show_overlay(app: AppHandle) -> Result<(), String> {
    let window = main_window(&app)?;

    window.show().map_err(|error| error.to_string())?;
    window.set_focus().map_err(|error| error.to_string())
}

#[tauri::command]
fn hide_overlay(app: AppHandle) -> Result<(), String> {
    main_window(&app)?.hide().map_err(|error| error.to_string())
}

#[tauri::command]
fn start_window_drag(app: AppHandle) -> Result<(), String> {
    main_window(&app)?
        .start_dragging()
        .map_err(|error| error.to_string())
}

fn apply_click_through(app: &AppHandle, enabled: bool) -> Result<(), String> {
    // `set_ignore_cursor_events(true)` makes the whole overlay click-through,
    // including the button that enabled it. Global shortcuts and tray actions
    // are therefore the reliable escape hatch.
    main_window(app)?
        .set_ignore_cursor_events(enabled)
        .map_err(|error| error.to_string())?;

    emit_click_through(app, enabled);
    Ok(())
}

#[tauri::command]
fn set_click_through(
    app: AppHandle,
    state: State<OverlayState>,
    enabled: bool,
) -> Result<(), String> {
    {
        let mut click_through = state
            .click_through
            .lock()
            .map_err(|_| "click-through state lock was poisoned".to_string())?;
        *click_through = enabled;
    }

    apply_click_through(&app, enabled)
}

#[tauri::command]
fn toggle_click_through(app: AppHandle, state: State<OverlayState>) -> Result<(), String> {
    let enabled = {
        let mut click_through = state
            .click_through
            .lock()
            .map_err(|_| "click-through state lock was poisoned".to_string())?;
        *click_through = !*click_through;
        *click_through
    };

    apply_click_through(&app, enabled)
}

fn install_tray(app: &tauri::App) -> tauri::Result<()> {
    // The tray is the process-level control surface when the overlay is hidden
    // or temporarily transparent to mouse input.
    let menu = MenuBuilder::new(app)
        .text("show", "Show overlay")
        .text("hide", "Hide to tray")
        .separator()
        .text("toggle_click_through", "Toggle click-through")
        .separator()
        .text("quit", "Quit")
        .build()?;

    let icon = tray_icon_image();

    TrayIconBuilder::with_id("basic-overlay")
        .tooltip(format!(
            "Basic Overlay ({TOGGLE_VISIBILITY_SHORTCUT}, {TOGGLE_CLICK_THROUGH_SHORTCUT})"
        ))
        .icon(icon)
        .menu(&menu)
        .show_menu_on_left_click(false)
        .on_menu_event(|app, event| match event.id().as_ref() {
            "show" => {
                let _ = show_overlay(app.clone());
            }
            "hide" => {
                let _ = hide_overlay(app.clone());
            }
            "toggle_click_through" => {
                let state = app.state::<OverlayState>();
                let _ = toggle_click_through(app.clone(), state);
            }
            "quit" => app.exit(0),
            _ => {}
        })
        .on_tray_icon_event(|tray, event| {
            if let TrayIconEvent::Click {
                button: MouseButton::Left,
                button_state: MouseButtonState::Up,
                ..
            } = event
            {
                let _ = toggle_visibility(tray.app_handle().clone());
            }
        })
        .build(app)?;

    Ok(())
}

fn tray_icon_image() -> Image<'static> {
    // Generate a tiny RGBA icon in code so the tray does not depend on image
    // decoding Cargo features.
    let width = 32;
    let height = 32;
    let mut rgba = Vec::with_capacity((width * height * 4) as usize);

    for y in 0..height {
        for x in 0..width {
            let dx = x as f32 - 15.5;
            let dy = y as f32 - 15.5;
            let distance = (dx * dx + dy * dy).sqrt();
            let inside = distance <= 13.5;
            let edge = distance > 12.2;

            let (r, g, b, a) = if inside && edge {
                (139, 211, 221, 255)
            } else if inside {
                (232, 237, 242, 255)
            } else {
                (0, 0, 0, 0)
            };

            rgba.extend_from_slice(&[r, g, b, a]);
        }
    }

    Image::new_owned(rgba, width, height)
}

pub fn run() {
    tauri::Builder::default()
        .manage(OverlayState {
            click_through: Mutex::new(false),
        })
        .on_window_event(|window, event| {
            if window.label() == "main" {
                if let tauri::WindowEvent::CloseRequested { api, .. } = event {
                    // Closing the overlay should keep the helper alive in tray.
                    api.prevent_close();
                    let _ = window.hide();
                }
            }
        })
        .invoke_handler(tauri::generate_handler![
            hide_overlay,
            show_overlay,
            start_window_drag,
            toggle_visibility,
            toggle_click_through,
            set_click_through
        ])
        .setup(|app| {
            #[cfg(desktop)]
            {
                let toggle_shortcut =
                    Shortcut::new(Some(Modifiers::ALT | Modifiers::SHIFT), Code::Space);
                let click_through_shortcut =
                    Shortcut::new(Some(Modifiers::ALT | Modifiers::SHIFT), Code::KeyC);

                app.handle().plugin(
                    tauri_plugin_global_shortcut::Builder::new()
                        .with_handler(move |app, shortcut, event| {
                            // Global shortcuts are handled in Rust so they work
                            // even when the overlay is hidden or click-through.
                            if event.state() != ShortcutState::Pressed {
                                return;
                            }

                            if shortcut == &toggle_shortcut {
                                let _ = toggle_visibility(app.clone());
                            } else if shortcut == &click_through_shortcut {
                                let state = app.state::<OverlayState>();
                                let _ = toggle_click_through(app.clone(), state);
                            }
                        })
                        .build(),
                )?;

                app.global_shortcut().register(toggle_shortcut)?;
                app.global_shortcut().register(click_through_shortcut)?;
                install_tray(app)?;
            }

            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running Basic Overlay");
}

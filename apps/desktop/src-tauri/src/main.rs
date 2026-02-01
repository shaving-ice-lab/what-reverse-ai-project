//! AgentFlow Desktop 入口点
//!
//! 启动 Tauri 桌面应用

// 在 Windows release 构建时隐藏控制台窗口
#![cfg_attr(
    all(not(debug_assertions), target_os = "windows"),
    windows_subsystem = "windows"
)]

fn main() {
    agentflow_desktop_lib::run();
}

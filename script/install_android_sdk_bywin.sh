#!/usr/bin/env bash
# install_android_sdk_bywin.sh — Windows (Git Bash / MSYS2) Android SDK 自动安装脚本
# 通过 sdkmanager 安装 Tauri 2 Android 编译所需的全部 SDK 组件
#
# 前置条件：
#   - 已安装 JDK 17+
#   - 已存在 sdkmanager.bat（默认路径：C:\DevDisk\DevTools\AndroidSDK\cmdline-tools\latest\bin\sdkmanager.bat）
#
# 用法：
#   ./install_android_sdk_bywin.sh              # 交互式安装（会提示确认）
#   ./install_android_sdk_bywin.sh -y           # 静默安装（自动确认所有许可）

set -euo pipefail

# ─── Colors ───────────────────────────────────────────────────────────────────
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
RESET='\033[0m'

ok()   { echo -e "${GREEN}  ✓${RESET} $*"; }
warn() { echo -e "${YELLOW}  ⚠${RESET} $*"; }
fail() { echo -e "${RED}  ✗${RESET} $*"; }

# ─── Parse args ───────────────────────────────────────────────────────────────
AUTO_ACCEPT=0
if [[ "${1:-}" == "-y" || "${1:-}" == "--yes" ]]; then
  AUTO_ACCEPT=1
fi

echo ""
echo -e "${CYAN}═══════════════════════════════════════════════════════${RESET}"
echo -e "${CYAN}  Android SDK 自动安装脚本（Windows Git Bash）         ${RESET}"
echo -e "${CYAN}═══════════════════════════════════════════════════════${RESET}"
echo ""

# ─── 1. Locate sdkmanager ─────────────────────────────────────────────────────
echo -e "${CYAN}[1/4] 定位 sdkmanager${RESET}"

# 优先使用用户指定的路径
SDKMANAGER="C:/DevDisk/DevTools/AndroidSDK/cmdline-tools/latest/bin/sdkmanager.bat"

# 如果指定路径不存在，尝试 ANDROID_HOME 下的路径
if [[ ! -f "$SDKMANAGER" ]]; then
  ANDROID_HOME_CANDIDATE="${ANDROID_HOME:-${ANDROID_SDK_ROOT:-}}"
  if [[ -n "$ANDROID_HOME_CANDIDATE" ]]; then
    ALT_SDKMANAGER="${ANDROID_HOME_CANDIDATE}/cmdline-tools/latest/bin/sdkmanager.bat"
    if [[ -f "$ALT_SDKMANAGER" ]]; then
      SDKMANAGER="$ALT_SDKMANAGER"
    fi
  fi
fi

# 尝试 Windows 默认 SDK 路径
if [[ ! -f "$SDKMANAGER" ]]; then
  WIN_SDK_PATH="$LOCALAPPDATA/Android/Sdk"
  if [[ -z "$WIN_SDK_PATH" ]]; then
    WIN_SDK_PATH="$(cygpath -u "$LOCALAPPDATA/Android/Sdk" 2>/dev/null || echo "$USERPROFILE/AppData/Local/Android/Sdk")"
  fi
  ALT_SDKMANAGER="${WIN_SDK_PATH}/cmdline-tools/latest/bin/sdkmanager.bat"
  if [[ -f "$ALT_SDKMANAGER" ]]; then
    SDKMANAGER="$ALT_SDKMANAGER"
  fi
fi

if [[ -f "$SDKMANAGER" ]]; then
  ok "sdkmanager 已找到：$SDKMANAGER"
else
  fail "sdkmanager 未找到：$SDKMANAGER"
  fail "请确认 sdkmanager.bat 已安装在上述路径，或设置 ANDROID_HOME 环境变量。"
  exit 1
fi

# 推导 ANDROID_HOME（sdkmanager 所在 SDK 根目录）
# 路径格式：.../cmdline-tools/latest/bin/sdkmanager.bat → 去掉 /cmdline-tools/latest/bin/sdkmanager.bat
SDKMANAGER_DIR="$(cd "$(dirname "$SDKMANAGER")" && pwd)"
ANDROID_HOME="$(cd "$SDKMANAGER_DIR/../../../.." && pwd)"
ok "ANDROID_HOME 推导为：$ANDROID_HOME"

# ─── 2. Check Java ────────────────────────────────────────────────────────────
echo -e "${CYAN}[2/4] 检查 Java 环境${RESET}"
if command -v java &>/dev/null; then
  JAVA_VER=$(java -version 2>&1 | head -1 | grep -oE '[0-9]+' | head -1)
  if [[ "$JAVA_VER" -ge 17 ]]; then
    ok "Java $JAVA_VER 已安装：$(which java)"
  else
    fail "检测到 Java $JAVA_VER，但 sdkmanager 需要 JDK 17+。"
    fail "请从 https://adoptium.net/ 下载 JDK 17+"
    exit 1
  fi
else
  fail "未找到 Java，sdkmanager 需要 JDK 17+ 才能运行。"
  fail "请从 https://adoptium.net/ 下载 JDK 17+"
  exit 1
fi

# ─── 3. Define SDK packages ──────────────────────────────────────────────────
echo -e "${CYAN}[3/4] 准备安装的 SDK 组件${RESET}"

# Tauri 2 Android 编译所需组件（对应 build_bywin.sh 的检查项）
# - platform-tools: 提供 adb（检查项 4）
# - cmdline-tools;latest: 提供 sdkmanager（检查项 4）
# - ndk-bundle: 提供 NDK（检查项 5）— 安装最新版 NDK
# - platforms;android-34: Android API 34 平台（Gradle 编译依赖）
# - build-tools;34.0.0: Android 构建工具（Gradle 编译依赖）

SDK_PACKAGES=(
  "platform-tools"
  "cmdline-tools;latest"
  "ndk-bundle"
  "platforms;android-34"
  "build-tools;34.0.0"
)

for pkg in "${SDK_PACKAGES[@]}"; do
  echo "    $pkg"
done
echo ""

# ─── 4. Install ───────────────────────────────────────────────────────────────
echo -e "${CYAN}[4/4] 安装 SDK 组件${RESET}"

# sdkmanager 在 Git Bash 中需要通过 cmd.exe 调用 .bat 文件
# 将 Unix 路径转换为 Windows 路径
SDKMANAGER_WIN="$(cygpath -w "$SDKMANAGER" 2>/dev/null || echo "$SDKMANAGER")"

# 构建安装参数
INSTALL_ARGS="${SDK_PACKAGES[*]}"

if [[ "$AUTO_ACCEPT" -eq 1 ]]; then
  echo -e "${YELLOW}  静默模式：自动接受所有许可协议${RESET}"
  echo ""
  cmd.exe /c "$SDKMANAGER_WIN" --sdk_root="$(cygpath -w "$ANDROID_HOME" 2>/dev/null || echo "$ANDROID_HOME")" $INSTALL_ARGS <<< "y" || {
    # 某些版本的 sdkmanager 不支持 stdin 管道传 y，尝试 --no-interactive
    cmd.exe /c "$SDKMANAGER_WIN" --sdk_root="$(cygpath -w "$ANDROID_HOME" 2>/dev/null || echo "$ANDROID_HOME")" --no-interactive $INSTALL_ARGS || {
      fail "SDK 组件安装失败"
      exit 1
    }
  }
else
  echo -e "${YELLOW}  交互模式：安装过程中需要手动接受许可协议${RESET}"
  echo ""
  cmd.exe /c "$SDKMANAGER_WIN" --sdk_root="$(cygpath -w "$ANDROID_HOME" 2>/dev/null || echo "$ANDROID_HOME")" $INSTALL_ARGS || {
    fail "SDK 组件安装失败"
    exit 1
  }
fi

echo ""
echo -e "${GREEN}  ✓ SDK 组件安装完成！${RESET}"
echo ""

# ─── 5. Install Rust Android targets ─────────────────────────────────────────
echo -e "${CYAN}[额外] 安装 Rust Android 编译目标${RESET}"
REQUIRED_TARGETS=(
  "aarch64-linux-android"
  "armv7-linux-androideabi"
  "i686-linux-android"
  "x86_64-linux-android"
)

if command -v rustup &>/dev/null; then
  INSTALLED_TARGETS=$(rustup target list --installed 2>/dev/null)
  MISSING_TARGETS=()
  for t in "${REQUIRED_TARGETS[@]}"; do
    if echo "$INSTALLED_TARGETS" | grep -q "$t"; then
      ok "  $t（已安装）"
    else
      MISSING_TARGETS+=("$t")
      warn "  $t（未安装）"
    fi
  done

  if [[ ${#MISSING_TARGETS[@]} -gt 0 ]]; then
    echo ""
    echo -e "${YELLOW}  正在安装缺失的 Rust 编译目标...${RESET}"
    for t in "${MISSING_TARGETS[@]}"; do
      echo -e "${CYAN}  rustup target add $t${RESET}"
      rustup target add "$t" || warn "  $t 安装失败，请手动运行：rustup target add $t"
    done
    ok "Rust Android 编译目标安装完成"
  else
    ok "所有 Rust Android 编译目标已就绪"
  fi
else
  warn "未找到 rustup，跳过 Rust Android 编译目标安装"
  warn "请从 https://rustup.rs 安装 Rust 后手动执行："
  for t in "${REQUIRED_TARGETS[@]}"; do
    echo "    rustup target add $t"
  done
fi

# ─── Summary ──────────────────────────────────────────────────────────────────
echo ""
echo -e "${CYAN}═══════════════════════════════════════════════════════${RESET}"
echo -e "${GREEN}  Android SDK 安装完成！${RESET}"
echo -e "${CYAN}═══════════════════════════════════════════════════════${RESET}"
echo ""
echo -e "${YELLOW}  请确认以下环境变量已设置：${RESET}"
echo "    ANDROID_HOME=$(cygpath -w "$ANDROID_HOME" 2>/dev/null || echo "$ANDROID_HOME")"
echo ""
echo -e "${YELLOW}  建议将以下内容添加到系统环境变量：${RESET}"
echo "    ANDROID_HOME=$(cygpath -w "$ANDROID_HOME" 2>/dev/null || echo "$ANDROID_HOME")"
echo "    ANDROID_NDK_HOME=%ANDROID_HOME%\\ndk\\<version>"
echo "    PATH=%ANDROID_HOME%\\platform-tools;%PATH%"
echo ""
echo -e "${CYAN}  现在可以运行构建脚本：${RESET}"
echo "    ./script/build_bywin.sh dev"
echo "    ./script/build_bywin.sh build"
echo ""

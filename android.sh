#!/usr/bin/env bash
# android.sh — macOS Android dev/build helper for Tauri 2
# 用法：
#   ./android.sh dev     # 启动 Android 开发模式
#   ./android.sh build   # 构建 Android APK/AAB

set -euo pipefail

COMMAND="${1:-}"

# ─── Colors ───────────────────────────────────────────────────────────────────
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
RESET='\033[0m'

ok()   { echo -e "${GREEN}  ✓${RESET} $*"; }
warn() { echo -e "${YELLOW}  ⚠${RESET} $*"; }
fail() { echo -e "${RED}  ✗${RESET} $*"; FAILED=1; }

# ─── Usage ────────────────────────────────────────────────────────────────────
if [[ "$COMMAND" != "dev" && "$COMMAND" != "build" ]]; then
  echo -e "${CYAN}用法：${RESET} $0 <dev|build>"
  echo ""
  echo "  dev    启动 Tauri Android 开发模式（热重载）"
  echo "  build  构建 Android APK/AAB 发布包"
  exit 1
fi

echo ""
echo -e "${CYAN}══════════════════════════════════════════${RESET}"
echo -e "${CYAN}  Android 环境检查（macOS）               ${RESET}"
echo -e "${CYAN}══════════════════════════════════════════${RESET}"
echo ""

FAILED=0

# ─── 1. Xcode Command Line Tools (clang) ──────────────────────────────────────
echo -e "${CYAN}[1/9] Xcode Command Line Tools${RESET}"
if xcode-select -p &>/dev/null && clang --version &>/dev/null; then
  ok "clang 已安装：$(clang --version 2>&1 | head -1)"
else
  fail "未安装 Xcode Command Line Tools，请运行：xcode-select --install"
fi

# ─── 2. Java (JDK 17+) ────────────────────────────────────────────────────────
echo -e "${CYAN}[2/9] Java JDK（17+）${RESET}"
if command -v java &>/dev/null; then
  JAVA_VER=$(java -version 2>&1 | head -1 | grep -oE '[0-9]+' | head -1)
  if [[ "$JAVA_VER" -ge 17 ]]; then
    ok "Java $JAVA_VER 已安装：$(which java)"
  else
    fail "检测到 Java $JAVA_VER，但需要 JDK 17+，请安装：brew install openjdk@17"
  fi
else
  fail "未找到 Java，请安装：brew install openjdk@17"
fi

# ─── 3. ANDROID_HOME ──────────────────────────────────────────────────────────
echo -e "${CYAN}[3/9] ANDROID_HOME${RESET}"
ANDROID_HOME="${ANDROID_HOME:-${ANDROID_SDK_ROOT:-}}"
if [[ -n "$ANDROID_HOME" && -d "$ANDROID_HOME" ]]; then
  ok "ANDROID_HOME=$ANDROID_HOME"
else
  if [[ -d "$HOME/Library/Android/sdk" ]]; then
    export ANDROID_HOME="$HOME/Library/Android/sdk"
    warn "ANDROID_HOME 未设置，使用默认路径：$ANDROID_HOME"
    warn "建议添加到 ~/.zshrc：export ANDROID_HOME=\$HOME/Library/Android/sdk"
  else
    fail "ANDROID_HOME 未设置且默认路径不存在。"
    fail "请通过 Android Studio 安装 Android SDK，再设置 ANDROID_HOME 环境变量。"
  fi
fi

# ─── 4. Android SDK Tools ─────────────────────────────────────────────────────
echo -e "${CYAN}[4/9] Android SDK 工具（adb、sdkmanager）${RESET}"
ADB="${ANDROID_HOME}/platform-tools/adb"
SDKMANAGER="${ANDROID_HOME}/cmdline-tools/latest/bin/sdkmanager"

if [[ -x "$ADB" ]]; then
  ok "adb 已找到：$ADB"
else
  fail "未找到 adb（路径：$ADB），请在 Android Studio SDK Manager 中安装 platform-tools。"
fi

if [[ -x "${SDKMANAGER}" ]]; then
  ok "sdkmanager found: ${SDKMANAGER}"
else
  warn "sdkmanager not found: ${SDKMANAGER}"
  warn "Install via Android Studio SDK Manager > SDK Tools > Android SDK Command-line Tools"
  warn "Or run: sdkmanager --install 'cmdline-tools;latest'"
fi

# ─── 5. NDK ───────────────────────────────────────────────────────────────────
echo -e "${CYAN}[5/9] Android NDK${RESET}"
NDK_DIR="${ANDROID_HOME}/ndk"
if [[ -d "$NDK_DIR" ]]; then
  NDK_VER=$(ls "$NDK_DIR" | sort -V | tail -1)
  NDK_PATH="${NDK_DIR}/${NDK_VER}"
  export ANDROID_NDK_HOME="${ANDROID_NDK_HOME:-$NDK_PATH}"
  if [[ -z "${NDK_VER}" ]]; then
    fail "NDK 目录存在但为空，请在 Android Studio SDK Manager → NDK (Side by side) 中安装。"
  else
    ok "NDK 版本：$NDK_VER → $NDK_PATH"
  fi
else
  fail "未找到 NDK（路径：$NDK_DIR），请在 Android Studio SDK Manager → NDK (Side by side) 中安装。"
fi

# ─── 6. Rust Android targets ──────────────────────────────────────────────────
echo -e "${CYAN}[6/9] Rust Android 编译目标${RESET}"
REQUIRED_TARGETS=(
  "aarch64-linux-android"
  "armv7-linux-androideabi"
  "i686-linux-android"
  "x86_64-linux-android"
)

if ! command -v rustup &>/dev/null; then
  fail "未找到 rustup，请从 https://rustup.rs 安装"
else
  INSTALLED_TARGETS=$(rustup target list --installed 2>/dev/null)
  MISSING_TARGETS=()
  for t in "${REQUIRED_TARGETS[@]}"; do
    if echo "$INSTALLED_TARGETS" | grep -q "$t"; then
      ok "  $t"
    else
      MISSING_TARGETS+=("$t")
      fail "  $t（未安装）"
    fi
  done

  if [[ ${#MISSING_TARGETS[@]} -gt 0 ]]; then
    echo ""
    warn "请运行以下命令安装缺失的编译目标："
    for t in "${MISSING_TARGETS[@]}"; do
      echo "    rustup target add $t"
    done
  fi
fi

# ─── 7. pnpm ──────────────────────────────────────────────────────────────────
echo -e "${CYAN}[7/9] pnpm${RESET}"
if command -v pnpm &>/dev/null; then
  ok "pnpm $(pnpm --version) 已安装"
else
  fail "未找到 pnpm，请安装：npm install -g pnpm"
fi

# ─── 8. keystore.properties ───────────────────────────────────────────────────
echo -e "${CYAN}[8/9] keystore.properties${RESET}"
KEYSTORE_PROPS="$(dirname "$0")/src-tauri/gen/android/keystore.properties"
if [[ -f "$KEYSTORE_PROPS" ]]; then
  ok "keystore.properties found: $KEYSTORE_PROPS"
else
  if [[ "$COMMAND" == "build" ]]; then
    fail "keystore.properties not found: $KEYSTORE_PROPS"
  else
    warn "keystore.properties not found: $KEYSTORE_PROPS"
  fi
  warn "Create the file with the following content:"
  echo "    storeFile=/path/to/release.keystore"
  echo "    storePassword=your_store_password"
  echo "    keyAlias=your_key_alias"
  echo "    keyPassword=your_key_password"
  warn "Generate a keystore with:"
  echo "    keytool -genkeypair -v -keystore release.keystore -alias my-key -keyalg RSA -keysize 2048 -validity 10000"
fi

# ─── 9. Device / Emulator check (dev only) ────────────────────────────────────
if [[ "$COMMAND" == "dev" ]]; then
  echo -e "${CYAN}[9/9] Android 设备或模拟器${RESET}"
  if [[ -x "$ADB" ]]; then
    DEVICES=$(${ADB} devices 2>/dev/null | grep -v "^List" | grep -v "^$" | grep "device$" | wc -l | tr -d ' ')
    if [[ "$DEVICES" -gt 0 ]]; then
      ok "检测到 $DEVICES 台设备："
      ${ADB} devices | grep "device$" | awk '{print "    "$1}'
    else
      warn "未检测到 Android 设备或模拟器。"
      warn "请启动 AVD 模拟器，或连接开启了 USB 调试的物理设备。"
    fi
  fi
else
  echo -e "${CYAN}[9/9] 构建模式，跳过设备检查${RESET}"
  ok "构建模式无需连接设备"
fi

# ─── Result ───────────────────────────────────────────────────────────────────
echo ""
echo -e "${CYAN}══════════════════════════════════════════${RESET}"
if [[ "$FAILED" -ne 0 ]]; then
  echo -e "${RED}  环境检查未通过，请修复以上问题后重试。${RESET}"
  echo -e "${CYAN}══════════════════════════════════════════${RESET}"
  exit 1
fi
echo -e "${GREEN}  所有检查通过！${RESET}"
echo -e "${CYAN}══════════════════════════════════════════${RESET}"
echo ""

# ─── Export common env vars ───────────────────────────────────────────────────
export ANDROID_HOME
export ANDROID_NDK_HOME
export PATH="${ANDROID_HOME}/platform-tools:${ANDROID_HOME}/tools:${PATH}"

# ─── Run ──────────────────────────────────────────────────────────────────────
echo -e "${CYAN}执行：pnpm tauri android ${COMMAND}${RESET}"
echo ""
exec pnpm tauri android "$COMMAND"

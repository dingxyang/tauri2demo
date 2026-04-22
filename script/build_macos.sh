#!/usr/bin/env bash
# build_macos.sh — macOS 多平台 dev/build 助手（Tauri 2）
# 用法：
#   ./build_macos.sh dev              # 启动 Android 开发模式（默认）
#   ./build_macos.sh dev macos        # 启动桌面端开发模式
#   ./build_macos.sh build android    # 构建 Android APK/AAB
#   ./build_macos.sh build ios        # 构建 iOS IPA 待验证
#   ./build_macos.sh build macos      # 构建 macOS dmg

set -euo pipefail

COMMAND="${1:-}"
PLATFORM="${2:-android}"   # dev 默认 android；build 须显式指定平台

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
usage() {
  echo -e "${CYAN}用法：${RESET} $0 <dev|build> [android|ios|macos]"
  echo ""
  echo "  dev                启动 Android 开发模式（热重载，默认平台）"
  echo "  dev macos          启动桌面端开发模式（热重载）"
  echo "  build android      构建 Android APK/AAB 发布包"
  echo "  build ios          构建 iOS IPA 发布包"
  echo "  build macos        构建 macOS dmg 发布包"
  exit 1
}

# 参数校验
if [[ "$COMMAND" != "dev" && "$COMMAND" != "build" ]]; then
  usage
fi
if [[ "$COMMAND" == "build" && "$PLATFORM" != "android" && "$PLATFORM" != "ios" && "$PLATFORM" != "macos" ]]; then
  echo -e "${RED}  ✗${RESET} build 命令需指定平台：android | ios | macos"
  usage
fi
if [[ "$COMMAND" == "dev" && "$PLATFORM" != "android" && "$PLATFORM" != "macos" ]]; then
  echo -e "${RED}  ✗${RESET} dev 命令支持的平台：android（默认）| macos"
  usage
fi

echo ""
echo -e "${CYAN}══════════════════════════════════════════${RESET}"
echo -e "${CYAN}  环境检查（目标平台：${PLATFORM}）         ${RESET}"
echo -e "${CYAN}══════════════════════════════════════════${RESET}"
echo ""

FAILED=0

# ─── 公共：Xcode Command Line Tools ──────────────────────────────────────────
echo -e "${CYAN}[*] Xcode Command Line Tools${RESET}"
if xcode-select -p &>/dev/null && clang --version &>/dev/null; then
  ok "clang 已安装：$(clang --version 2>&1 | head -1)"
else
  fail "未安装 Xcode Command Line Tools，请运行：xcode-select --install"
fi

# ─── 公共：pnpm ───────────────────────────────────────────────────────────────
echo -e "${CYAN}[*] pnpm${RESET}"
if command -v pnpm &>/dev/null; then
  ok "pnpm $(pnpm --version) 已安装"
else
  fail "未找到 pnpm，请安装：npm install -g pnpm"
fi

# ─── Android 专属检查 ─────────────────────────────────────────────────────────
if [[ "$PLATFORM" == "android" ]]; then

  # Java JDK 17+
  echo -e "${CYAN}[Android] Java JDK（17+）${RESET}"
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

  # ANDROID_HOME
  echo -e "${CYAN}[Android] ANDROID_HOME${RESET}"
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

  # Android SDK Tools
  echo -e "${CYAN}[Android] SDK 工具（adb、sdkmanager）${RESET}"
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
  fi

  # NDK
  echo -e "${CYAN}[Android] Android NDK${RESET}"
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

  # Rust Android targets
  echo -e "${CYAN}[Android] Rust 编译目标${RESET}"
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
        fail "  ${t}（未安装）"
      fi
    done
    if [[ ${#MISSING_TARGETS[@]} -gt 0 ]]; then
      echo ""
      warn "请运行以下命令安装缺失的编译目标："
      for t in "${MISSING_TARGETS[@]+"${MISSING_TARGETS[@]}"}"; do
        echo "    rustup target add $t"
      done
    fi
  fi

  # keystore.properties（仅 build）
  if [[ "$COMMAND" == "build" ]]; then
    echo -e "${CYAN}[Android] keystore.properties${RESET}"
    KEYSTORE_PROPS="$(cd "$(dirname "$0")/.." && pwd)/backend/src-tauri/gen/android/keystore.properties"
    if [[ -f "$KEYSTORE_PROPS" ]]; then
      ok "keystore.properties found: $KEYSTORE_PROPS"
    else
      fail "keystore.properties not found: $KEYSTORE_PROPS"
      warn "Create the file with the following content:"
      echo "    storeFile=/path/to/release.keystore"
      echo "    storePassword=your_store_password"
      echo "    keyAlias=your_key_alias"
      echo "    keyPassword=your_key_password"
      warn "Generate a keystore with:"
      echo "    keytool -genkeypair -v -keystore release.keystore -alias my-key -keyalg RSA -keysize 2048 -validity 10000"
    fi
  fi

fi  # end android

# ─── iOS 专属检查 ──────────────────────────────────────────────────────────────
if [[ "$PLATFORM" == "ios" ]]; then

  echo -e "${CYAN}[iOS] Rust 编译目标${RESET}"
  REQUIRED_TARGETS=(
    "aarch64-apple-ios"
    "x86_64-apple-ios"
    "aarch64-apple-ios-sim"
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
        fail "  ${t}（未安装）"
      fi
    done
    if [[ ${#MISSING_TARGETS[@]} -gt 0 ]]; then
      echo ""
      warn "请运行以下命令安装缺失的编译目标："
      for t in "${MISSING_TARGETS[@]+"${MISSING_TARGETS[@]}"}"; do
        echo "    rustup target add $t"
      done
    fi
  fi

fi  # end ios

# ─── macOS 专属检查 ────────────────────────────────────────────────────────────
if [[ "$PLATFORM" == "macos" ]]; then

  echo -e "${CYAN}[macOS] Rust 编译目标${RESET}"
  REQUIRED_TARGETS=(
    "aarch64-apple-darwin"
    "x86_64-apple-darwin"
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
        warn "  ${t}（未安装，构建当前架构时不影响，通用包需安装）"
      fi
    done
    if [[ ${#MISSING_TARGETS[@]} -gt 0 ]]; then
      echo ""
      warn "如需构建通用包（universal），请安装缺失目标："
      for t in "${MISSING_TARGETS[@]+"${MISSING_TARGETS[@]}"}"; do
        echo "    rustup target add $t"
      done
    fi
  fi

fi  # end macos

# ─── 汇总结果 ─────────────────────────────────────────────────────────────────
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

# ─── 导出 Android 环境变量（仅 Android）─────────────────────────────────────
# if [[ "$PLATFORM" == "android" ]]; then
#   export ANDROID_HOME
#   export ANDROID_NDK_HOME
#   export PATH="${ANDROID_HOME}/platform-tools:${ANDROID_HOME}/tools:${PATH}"

#   # Force real C compiler — /usr/local/bin/cc may alias claude CLI
#   export CC=/usr/bin/cc
#   export CXX=/usr/bin/c++

#   # 限制并发，避免 OOM
#   export CARGO_BUILD_JOBS=1
#   export GRADLE_OPTS="-Dorg.gradle.workers.max=1"
#   echo -e "${YELLOW}  CARGO_BUILD_JOBS=1, Gradle workers=1 (避免内存溢出)${RESET}"
#   echo ""
# fi



# ─── 替换 Android 签名和权限文件 ────────────────────────────────────────────────
# build android 时，需要用 script/android-permission-sign/ 下的文件
# 替换 gen/android/app/ 中对应的文件，以加入签名配置和录音权限
if [[ "$COMMAND" == "build" && "$PLATFORM" == "android" ]]; then
  SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
  GEN_ANDROID_APP="$(cd "$(dirname "$0")/.." && pwd)/backend/src-tauri/gen/android/app"

  echo -e "${CYAN}[*] 替换 Android 签名和权限文件${RESET}"
  cp "${SCRIPT_DIR}/android-permission-sign/build.gradle.kts" "${GEN_ANDROID_APP}/build.gradle.kts"
  ok "build.gradle.kts 已替换"
  cp "${SCRIPT_DIR}/android-permission-sign/AndroidManifest.xml" "${GEN_ANDROID_APP}/src/main/AndroidManifest.xml"
  ok "AndroidManifest.xml 已替换"
  echo ""
fi

# ─── 执行 Tauri 命令 ──────────────────────────────────────────────────────────
case "${COMMAND}/${PLATFORM}" in
  dev/android)
    echo -e "${CYAN}执行：pnpm tauri android dev${RESET}"
    echo ""
    exec pnpm tauri android dev
    ;;
  dev/macos)
    echo -e "${CYAN}执行：pnpm tauri dev${RESET}"
    echo ""
    exec pnpm tauri dev
    ;;
  build/android)
    echo -e "${CYAN}执行：pnpm tauri android build${RESET}"
    echo ""
    exec pnpm tauri android build
    ;;
  build/ios)
    echo -e "${CYAN}执行：pnpm tauri ios build${RESET}"
    echo ""
    exec pnpm tauri ios build
    ;;
  build/macos)
    echo -e "${CYAN}执行：pnpm tauri build${RESET}"
    echo ""
    exec pnpm tauri build
    ;;
esac

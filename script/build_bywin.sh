#!/usr/bin/env bash
# test_env_android_bywin.sh — Windows (Git Bash / MSYS2) Android dev/build helper for Tauri 2
# 用法：
#   ./test_env_android_bywin.sh dev     # 启动 Android 开发模式
#   ./test_env_android_bywin.sh build   # 构建 Android APK/AAB

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
echo -e "${CYAN}  Android 环境检查（Windows Git Bash）    ${RESET}"
echo -e "${CYAN}══════════════════════════════════════════${RESET}"
echo ""

FAILED=0

# ─── 1. C/C++ Build Tools ────────────────────────────────────────────────────
echo -e "${CYAN}[1/8] C/C++ 编译工具${RESET}"
# 检查策略：
#   1. 直接可用的 MSVC (cl.exe) 或 GNU (gcc/g++)
#   2. Rust GNU 工具链自带的 gcc（位于 rustup toolchain 深层目录，不在 PATH 中）
#   3. 通过 rustc 编译测试验证工具链可用性
FOUND_CC=0

if command -v cl.exe &>/dev/null; then
  ok "MSVC cl.exe 已找到：$(which cl.exe)"
  FOUND_CC=1
elif command -v gcc &>/dev/null && gcc --version &>/dev/null; then
  GCC_INFO=$(gcc --version 2>&1 | head -1)
  ok "GNU gcc 已找到：$(which gcc) — $GCC_INFO"
  if command -v g++ &>/dev/null && g++ --version &>/dev/null; then
    ok "GNU g++ 已找到：$(which g++) — $(g++ --version 2>&1 | head -1)"
  else
    warn "gcc 已找到但 g++ 未找到，部分 C++ 依赖可能编译失败"
  fi
  FOUND_CC=1
elif command -v cc &>/dev/null && cc --version &>/dev/null; then
  ok "C 编译器已找到：$(which cc) — $(cc --version 2>&1 | head -1)"
  FOUND_CC=1
fi

# 即使 gcc 不在 PATH 中，Rust GNU 工具链也自带了 gcc（x86_64-w64-mingw32-gcc）
# Rust 的 cc crate 会自动找到它，所以只需验证 rustc 能正常编译即可
if [[ "$FOUND_CC" -eq 0 ]]; then
  if command -v rustc &>/dev/null; then
    RUSTC_INFO=$(rustc --version --verbose 2>&1 | head -2 | tr '\n' ' ')
    ok "Rust 编译器已找到：$RUSTC_INFO"
    # 验证 Rust 能否正常编译链接（间接验证 gcc 可用）
    TEST_SRC=$(mktemp /tmp/test_rust_XXXXXX.rs)
    TEST_BIN=$(mktemp /tmp/test_rust_XXXXXX.exe)
    echo 'fn main() {}' > "$TEST_SRC"
    if rustc "$TEST_SRC" -o "$TEST_BIN" 2>/dev/null; then
      ok "Rust GNU 工具链编译链接正常（gcc 由 Rust 自带，无需手动安装）"
      FOUND_CC=1
      rm -f "$TEST_SRC" "$TEST_BIN"
    else
      fail "Rust 编译链接失败，GNU 工具链可能不完整"
      rm -f "$TEST_SRC" "$TEST_BIN"
    fi
  else
    fail "未找到 C/C++ 编译器，也未找到 Rust 编译器。"
  fi
fi

if [[ "$FOUND_CC" -eq 0 ]]; then
  fail "请安装以下任一工具链："
  fail "  • MSVC: https://visualstudio.microsoft.com/visual-cpp-build-tools/"
  fail "    安装时勾选「使用 C++ 的桌面开发」工作负载"
  fail "  • GNU: https://www.mingw-w64.org/ 或通过 MSYS2 安装"
  fail "    pacman -S mingw-w64-x86_64-gcc"
  fail "  • Rust + GNU: https://rustup.rs 安装时选择 x86_64-pc-windows-gnu"
fi

# ─── 2. Java (JDK 17+) ────────────────────────────────────────────────────────
echo -e "${CYAN}[2/8] Java JDK（17+）${RESET}"
if command -v java &>/dev/null; then
  JAVA_VER=$(java -version 2>&1 | head -1 | grep -oE '[0-9]+' | head -1)
  if [[ "$JAVA_VER" -ge 17 ]]; then
    ok "Java $JAVA_VER 已安装：$(which java)"
  else
    fail "检测到 Java $JAVA_VER，但需要 JDK 17+。"
    fail "请从 https://adoptium.net/ 下载 JDK 17+，或通过 winget 安装：winget install EclipseAdoptium.Temurin.17.JDK"
  fi
else
  fail "未找到 Java，请从 https://adoptium.net/ 下载 JDK 17+"
  fail "或运行：winget install EclipseAdoptium.Temurin.17.JDK"
fi

# ─── 3. ANDROID_HOME ──────────────────────────────────────────────────────────
echo -e "${CYAN}[3/8] ANDROID_HOME${RESET}"
ANDROID_HOME="${ANDROID_HOME:-${ANDROID_SDK_ROOT:-}}"

# 清理值中可能存在的引号（setx 命令可能将引号写入环境变量值）
ANDROID_HOME="${ANDROID_HOME#\"}"
ANDROID_HOME="${ANDROID_HOME%\"}"

# 将 Windows 格式路径转换为 Unix 格式（Git Bash 环境）
if [[ -n "$ANDROID_HOME" ]]; then
  # 检测是否为 Windows 格式路径（包含反斜杠或 X:\ 格式）
  if [[ "$ANDROID_HOME" == *'\\'* ]] || [[ "$ANDROID_HOME" =~ ^[A-Za-z]: ]]; then
    AH_UNIX="$(cygpath -u "$ANDROID_HOME" 2>/dev/null || echo "")"
    if [[ -n "$AH_UNIX" ]]; then
      ANDROID_HOME="$AH_UNIX"
    fi
  fi
fi

if [[ -n "$ANDROID_HOME" && -d "$ANDROID_HOME" ]]; then
  ok "ANDROID_HOME=$ANDROID_HOME"
else
  # 如果仍未找到，尝试已知的 SDK 安装路径
  CANDIDATE_PATHS=(
    "C:/DevDisk/DevTools/AndroidSDK"
    "$LOCALAPPDATA/Android/Sdk"
    "$HOME/AppData/Local/Android/Sdk"
  )

  FOUND_SDK=0
  for CANDIDATE in "${CANDIDATE_PATHS[@]}"; do
    if [[ -d "$CANDIDATE" ]]; then
      export ANDROID_HOME="$CANDIDATE"
      warn "ANDROID_HOME 未设置，使用检测到的路径：$ANDROID_HOME"
      warn "建议运行 ./script/install_android_sdk_bywin.sh 设置环境变量"
      FOUND_SDK=1
      break
    fi
  done

  if [[ "$FOUND_SDK" -eq 0 ]]; then
    fail "ANDROID_HOME 未设置且未检测到 Android SDK 安装路径。"
    fail "请运行 ./script/install_android_sdk_bywin.sh 安装 SDK，或手动设置 ANDROID_HOME 环境变量。"
  fi
fi

# ─── 4. Android SDK Tools ─────────────────────────────────────────────────────
echo -e "${CYAN}[4/8] Android SDK 工具（adb、sdkmanager）${RESET}"
# Windows 下可执行文件带 .exe 后缀
if [[ -f "${ANDROID_HOME}/platform-tools/adb.exe" ]]; then
  ok "adb 已找到：${ANDROID_HOME}/platform-tools/adb.exe"
else
  fail "未找到 adb.exe（路径：${ANDROID_HOME}/platform-tools/adb.exe），请在 Android Studio SDK Manager 中安装 platform-tools。"
fi

SDKMANAGER="${ANDROID_HOME}/cmdline-tools/latest/bin/sdkmanager.bat"
if [[ -f "$SDKMANAGER" ]]; then
  ok "sdkmanager 已找到：${SDKMANAGER}"
else
  warn "sdkmanager 未找到：${SDKMANAGER}"
  warn "请在 Android Studio SDK Manager > SDK Tools > Android SDK Command-line Tools 中安装"
  warn "或运行：sdkmanager --install 'cmdline-tools;latest'"
fi

# ─── 5. NDK ───────────────────────────────────────────────────────────────────
echo -e "${CYAN}[5/8] Android NDK${RESET}"
# NDK 可能安装在两种目录结构中：
#   1. ndk/<version>/ — 新版 NDK（推荐，通过 sdkmanager 安装 ndk;27.x.x）
#   2. ndk-bundle/     — 旧版 NDK（已废弃，通过 ndk-bundle 包安装）
NDK_DIR="${ANDROID_HOME}/ndk"
NDK_BUNDLE_DIR="${ANDROID_HOME}/ndk-bundle"
NDK_PATH=""
NDK_VER=""

if [[ -d "$NDK_DIR" ]]; then
  NDK_VER=$(ls "$NDK_DIR" | sort -V | tail -1)
  if [[ -n "$NDK_VER" ]]; then
    NDK_PATH="${NDK_DIR}/${NDK_VER}"
  fi
fi

# 如果 ndk/ 目录不存在或为空，尝试 ndk-bundle/
if [[ -z "$NDK_PATH" && -d "$NDK_BUNDLE_DIR" ]]; then
  # 从 source.properties 读取版本号
  if [[ -f "${NDK_BUNDLE_DIR}/source.properties" ]]; then
    NDK_VER=$(grep 'Pkg.Revision' "${NDK_BUNDLE_DIR}/source.properties" 2>/dev/null | awk '{print $NF}' || echo "unknown")
  else
    NDK_VER="ndk-bundle"
  fi
  NDK_PATH="$NDK_BUNDLE_DIR"
  warn "检测到旧版 ndk-bundle（版本 $NDK_VER），建议安装新版 NDK："
  warn "  sdkmanager --install 'ndk;27.0.12077973'"
fi

if [[ -n "$NDK_PATH" ]]; then
  export ANDROID_NDK_HOME="${ANDROID_NDK_HOME:-$NDK_PATH}"
  ok "NDK 版本：$NDK_VER → $NDK_PATH"
else
  fail "未找到 NDK（路径：$NDK_DIR 和 $NDK_BUNDLE_DIR 均不存在），请运行："
  fail "  ./script/install_android_sdk_bywin.sh"
  fail "或在 Android Studio SDK Manager → NDK (Side by side) 中安装。"
fi

# ─── 6. Rust Android targets ──────────────────────────────────────────────────
echo -e "${CYAN}[6/8] Rust Android 编译目标${RESET}"
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
echo -e "${CYAN}[7/8] pnpm${RESET}"
if command -v pnpm &>/dev/null; then
  ok "pnpm $(pnpm --version) 已安装"
else
  fail "未找到 pnpm，请安装：npm install -g pnpm"
fi

# ─── 8. keystore.properties ───────────────────────────────────────────────────
echo -e "${CYAN}[8/8] keystore.properties${RESET}"
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
KEYSTORE_PROPS="${SCRIPT_DIR}/../backend/src-tauri/gen/android/keystore.properties"
if [[ -f "$KEYSTORE_PROPS" ]]; then
  ok "keystore.properties 已找到：$KEYSTORE_PROPS"
else
  fail "keystore.properties 未找到：$KEYSTORE_PROPS"
  warn "请创建该文件，内容如下："
  echo "    storeFile=C:/path/to/release.keystore"
  echo "    storePassword=your_store_password"
  echo "    keyAlias=your_key_alias"
  echo "    keyPassword=your_key_password"
  warn "生成 keystore："
  echo "    keytool -genkeypair -v -keystore release.keystore -alias tauri2demo-key -keyalg RSA -keysize 2048 -validity 10000"
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

# ─── Build Preparation ────────────────────────────────────────────────────────
echo -e "${CYAN}══════════════════════════════════════════${RESET}"
echo -e "${CYAN}  构建准备                                  ${RESET}"
echo -e "${CYAN}══════════════════════════════════════════${RESET}"
echo ""

PROJECT_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
GEN_ANDROID_DIR="${PROJECT_ROOT}/backend/src-tauri/gen/android"

# ─── Prep 1: pnpm install ────────────────────────────────────────────────────
echo -e "${CYAN}[准备 1/4] npm 依赖${RESET}"
if [[ -d "${PROJECT_ROOT}/node_modules" ]]; then
  ok "node_modules 已存在"
else
  warn "node_modules 不存在，正在运行 pnpm install ..."
  (cd "$PROJECT_ROOT" && pnpm install)
  ok "pnpm install 完成"
fi

# ─── Prep 2: Tauri Android init ──────────────────────────────────────────────
echo -e "${CYAN}[准备 2/4] Tauri Android 项目${RESET}"
ANDROID_INIT_NEEDED=0

# 检查 gen/android 关键文件是否存在
if [[ ! -f "${GEN_ANDROID_DIR}/settings.gradle.kts" ]]; then
  warn "settings.gradle.kts 缺失"
  ANDROID_INIT_NEEDED=1
fi
if [[ ! -f "${GEN_ANDROID_DIR}/gradlew" ]]; then
  warn "gradlew 缺失"
  ANDROID_INIT_NEEDED=1
fi
if [[ ! -d "${GEN_ANDROID_DIR}/app/src/main/java" ]]; then
  warn "app/src/main/java/ 缺失"
  ANDROID_INIT_NEEDED=1
fi

if [[ "$ANDROID_INIT_NEEDED" -eq 1 ]]; then
  warn "gen/android 项目不完整，正在运行 pnpm tauri android init ..."
  (cd "$PROJECT_ROOT" && pnpm tauri android init)

  # init 可能覆盖 keystore.properties，需要重新写入
  KEYSTORE_PROPS="${GEN_ANDROID_DIR}/keystore.properties"
  if [[ ! -f "$KEYSTORE_PROPS" ]]; then
    warn "android init 后 keystore.properties 缺失，正在重新写入 ..."
    cat > "$KEYSTORE_PROPS" <<'KEYSTORE_EOF'
keyAlias=tauri2demo_key
password=abc009988
storeFile="C:\\SyncData\\release.keystore"
KEYSTORE_EOF
    ok "keystore.properties 已重新写入"
  fi

  ok "pnpm tauri android init 完成"
else
  ok "gen/android 项目完整"
fi

# ─── Prep 3: Frontend build ──────────────────────────────────────────────────
echo -e "${CYAN}[准备 3/4] 前端构建${RESET}"
if [[ -d "${PROJECT_ROOT}/frontend/dist" ]]; then
  ok "frontend/dist 已存在"
else
  warn "frontend/dist 不存在，正在运行前端构建 ..."
  (cd "$PROJECT_ROOT" && pnpm build)
  ok "前端构建完成"
fi

# ─── Prep 4: Keystore file ───────────────────────────────────────────────────
echo -e "${CYAN}[准备 4/4] Keystore 签名文件${RESET}"
KEYSTORE_PROPS="${GEN_ANDROID_DIR}/keystore.properties"
if [[ -f "$KEYSTORE_PROPS" ]]; then
  # 读取 storeFile 路径（去除引号）
  STORE_FILE_RAW=$(grep '^storeFile=' "$KEYSTORE_PROPS" | sed 's/^storeFile=//' | tr -d '"' | tr -d "'")
  # 将 Windows 路径转换为 Unix 路径
  STORE_FILE_UNIX=""
  if [[ -n "$STORE_FILE_RAW" ]]; then
    STORE_FILE_UNIX="$(cygpath -u "$STORE_FILE_RAW" 2>/dev/null || echo "$STORE_FILE_RAW")"
  fi

  if [[ -n "$STORE_FILE_UNIX" && -f "$STORE_FILE_UNIX" ]]; then
    ok "Keystore 文件已存在：$STORE_FILE_RAW"
  else
    warn "Keystore 文件不存在：$STORE_FILE_RAW"
    warn "正在自动生成 keystore ..."

    # 读取 keyAlias 和 password
    KEY_ALIAS=$(grep '^keyAlias=' "$KEYSTORE_PROPS" | sed 's/^keyAlias=//' | tr -d '"' | tr -d "'")
    KEY_PASSWORD=$(grep '^password=' "$KEYSTORE_PROPS" | sed 's/^password=//' | tr -d '"' | tr -d "'")

    # 确保 keystore 所在目录存在
    STORE_DIR="$(dirname "$STORE_FILE_UNIX")"
    mkdir -p "$STORE_DIR" 2>/dev/null || true

    # 使用 keytool 生成 keystore
    if command -v keytool &>/dev/null; then
      keytool -genkeypair -v \
        -keystore "$STORE_FILE_UNIX" \
        -alias "${KEY_ALIAS:-tauri2demo_key}" \
        -keyalg RSA \
        -keysize 2048 \
        -validity 10000 \
        -storepass "${KEY_PASSWORD:-changeit}" \
        -keypass "${KEY_PASSWORD:-changeit}" \
        -dname "CN=Tauri2Demo, OU=Dev, O=Dev, L=Unknown, ST=Unknown, C=CN"
      ok "Keystore 已生成：$STORE_FILE_RAW"
    else
      fail "keytool 未找到，无法自动生成 keystore"
      fail "请手动运行："
      fail "  keytool -genkeypair -v -keystore \"$STORE_FILE_RAW\" -alias ${KEY_ALIAS:-tauri2demo_key} -keyalg RSA -keysize 2048 -validity 10000"
    fi
  fi
else
  warn "keystore.properties 不存在，跳过 keystore 文件检查"
fi

echo ""
echo -e "${GREEN}  构建准备完成！${RESET}"
echo ""

# ─── Export common env vars ───────────────────────────────────────────────────
export ANDROID_HOME
export ANDROID_NDK_HOME
export PATH="${ANDROID_HOME}/platform-tools:${ANDROID_HOME}/tools:${PATH}"

# Windows 下 NDK 的编译器路径 — 优先使用 NDK bundled clang
if [[ -n "${ANDROID_NDK_HOME:-}" ]]; then
  NDK_TOOLCHAIN="${ANDROID_NDK_HOME}/toolchains/llvm/prebuilt/windows-x86_64/bin"
  if [[ -d "$NDK_TOOLCHAIN" ]]; then
    export CC="${NDK_TOOLCHAIN}/clang.exe"
    export CXX="${NDK_TOOLCHAIN}/clang++.exe"
    echo -e "${YELLOW}  使用 NDK clang：${NDK_TOOLCHAIN}${RESET}"
  else
    warn "NDK toolchain 目录未找到：$NDK_TOOLCHAIN"
    warn "将使用系统默认编译器"
  fi
fi

# ─── Limit parallelism to avoid OOM ──────────────────────────────────────────
export CARGO_BUILD_JOBS=1
export GRADLE_OPTS="-Dorg.gradle.workers.max=1"
echo -e "${YELLOW}  CARGO_BUILD_JOBS=1, Gradle workers=1（避免内存溢出）${RESET}"
echo ""

# ─── Run ──────────────────────────────────────────────────────────────────────
echo -e "${CYAN}执行：pnpm tauri android ${COMMAND}${RESET}"
echo ""
exec pnpm tauri android "$COMMAND"

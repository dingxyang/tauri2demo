#!/bin/bash

# 本地Android APK打包脚本
# 基于GitHub Actions配置改编

set -e  # 遇到错误时退出

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 日志函数
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 检查必要的工具
check_requirements() {
    log_info "检查构建环境..."
    
    # 检查 pnpm
    if ! command -v pnpm &> /dev/null; then
        log_error "pnpm 未安装，请先安装 pnpm"
        exit 1
    fi
    
    # 检查 Rust
    if ! command -v rustc &> /dev/null; then
        log_error "Rust 未安装，请先安装 Rust"
        exit 1
    fi
    
    # 检查 Java
    if ! command -v java &> /dev/null; then
        log_error "Java 未安装，请先安装 Java 17"
        exit 1
    fi
    
    # 检查 Android SDK
    if [ -z "$ANDROID_HOME" ]; then
        log_error "ANDROID_HOME 环境变量未设置，请先安装并配置 Android SDK"
        exit 1
    fi
    
    # 检查 NDK
    NDK_VERSION="27.0.11902837"
    NDK_PATH="$ANDROID_HOME/ndk/$NDK_VERSION"
    if [ ! -d "$NDK_PATH" ]; then
        log_warning "NDK $NDK_VERSION 未安装，尝试自动安装..."
        if command -v sdkmanager &> /dev/null; then
            sdkmanager "ndk;$NDK_VERSION"
        else
            log_error "sdkmanager 未找到，请手动安装 NDK $NDK_VERSION"
            exit 1
        fi
    fi
    
    export NDK_HOME="$NDK_PATH"
    
    log_success "环境检查完成"
}

# 安装依赖
install_dependencies() {
    log_info "安装项目依赖..."
    pnpm install
    log_success "依赖安装完成"
}

# 安装 Rust targets
install_rust_targets() {
    log_info "安装 Rust Android targets..."
    rustup target add aarch64-linux-android armv7-linux-androideabi i686-linux-android x86_64-linux-android
    log_success "Rust targets 安装完成"
}

# 获取版本号
get_version() {
    VERSION=$(node -p "require('./frontend/package.json').version")
    log_info "当前版本: $VERSION"
}

# 初始化 Android 项目
init_android() {
    log_info "初始化 Android 项目..."
    cd backend
    
    # 清理之前的构建
    if [ -d "src-tauri/gen/android" ]; then
        log_info "清理之前的构建文件..."
        rm -rf src-tauri/gen/android
    fi
    
    # 初始化 Android 项目
    pnpm tauri android init
    
    # 生成图标
    log_info "生成应用图标..."
    # pnpm tauri icon src-tauri/icons/icon.png
    
    # 恢复 git 状态（如果需要）
    if git status --porcelain | grep -q .; then
        log_info "恢复 git 状态..."
        git checkout .
    fi
    
    log_success "Android 项目初始化完成"
}

# 添加权限
add_permissions() {
    log_info "添加 Android 权限..."
    MANIFEST="src-tauri/gen/android/app/src/main/AndroidManifest.xml"
    PERMISSION_LINE='    <uses-permission android:name="android.permission.REQUEST_INSTALL_PACKAGES"/>'
    
    if [ -f "$MANIFEST" ]; then
        if ! grep -q 'REQUEST_INSTALL_PACKAGES' "$MANIFEST"; then
            sed -i.bak "/android.permission.INTERNET/a\\
$PERMISSION_LINE" "$MANIFEST"
            log_success "权限添加完成"
        else
            log_info "权限已存在，跳过"
        fi
    else
        log_error "AndroidManifest.xml 未找到"
        exit 1
    fi
}

# 配置签名
setup_signing() {
    log_info "配置 APK 签名..."
    
    KEYSTORE_PROPS="src-tauri/gen/android/keystore.properties"
    
    # 检查是否存在签名配置
    if [ -f "keystore.config" ]; then
        source keystore.config
        
        if [ -n "$ANDROID_KEY_ALIAS" ] && [ -n "$ANDROID_KEY_PASSWORD" ] && [ -n "$ANDROID_KEYSTORE_PATH" ]; then
            log_info "使用配置文件中的签名信息..."
            
            echo "keyAlias=$ANDROID_KEY_ALIAS" > "$KEYSTORE_PROPS"
            echo "password=$ANDROID_KEY_PASSWORD" >> "$KEYSTORE_PROPS"
            echo "storeFile=$ANDROID_KEYSTORE_PATH" >> "$KEYSTORE_PROPS"
            
            log_success "签名配置完成"
        else
            log_warning "签名配置不完整，将生成未签名的APK"
        fi
    else
        log_warning "未找到 keystore.config 文件，将生成未签名的APK"
        log_info "如需签名APK，请创建 keystore.config 文件，参考 keystore.config.example"
    fi
}

# 构建 APK
build_apk() {
    log_info "开始构建 APK..."
    
    # 构建 universal release APK
    log_info "构建 universal APK..."
    pnpm tauri android build
    
    if [ -f "src-tauri/gen/android/app/build/outputs/apk/universal/release/app-universal-release.apk" ]; then
        universal_apk="spanishassistant_${VERSION}_universal.apk"
        cp "src-tauri/gen/android/app/build/outputs/apk/universal/release/app-universal-release.apk" "$universal_apk"
        log_success "Universal APK 构建完成: $universal_apk"
    fi
    
    # 构建 arm64 release APK
    log_info "构建 arm64 APK..."
    pnpm tauri android build -t aarch64
    
    if [ -f "src-tauri/gen/android/app/build/outputs/apk/universal/release/app-universal-release.apk" ]; then
        arm64_apk="spanishassistant_${VERSION}_arm64.apk"
        cp "src-tauri/gen/android/app/build/outputs/apk/universal/release/app-universal-release.apk" "$arm64_apk"
        log_success "ARM64 APK 构建完成: $arm64_apk"
    fi
    
    # 显示构建结果
    log_success "APK 构建完成！"
    echo ""
    log_info "构建的 APK 文件:"
    ls -la *.apk 2>/dev/null || log_warning "未找到 APK 文件"
}

# 清理函数
cleanup() {
    log_info "清理临时文件..."
    cd ..
}

# 主函数
main() {
    log_info "开始 Android APK 本地构建流程..."
    echo ""
    
    # 检查环境
    check_requirements
    
    # 安装依赖
    install_dependencies
    
    # 安装 Rust targets
    install_rust_targets
    
    # 获取版本
    get_version
    
    # 初始化 Android 项目
    init_android
    
    # 添加权限
    add_permissions
    
    # 配置签名
    setup_signing
    
    # 构建 APK
    build_apk
    
    # 清理
    cleanup
    
    echo ""
    log_success "构建流程完成！"
    log_info "APK 文件位于 backend/ 目录下"
}

# 错误处理
trap 'log_error "构建过程中发生错误，退出中..."; cleanup; exit 1' ERR

# 运行主函数
main "$@"

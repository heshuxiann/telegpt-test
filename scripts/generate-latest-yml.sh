#!/bin/bash

# 生成 latest-mac.yml 和 latest.yml 文件的脚本
# 用法: ./scripts/generate-latest-yml.sh [platform]
# 平台选项: mac, win, all (默认: all)

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 获取平台参数
PLATFORM="${1:-all}"
DIST_DIR="dist-electron"

echo -e "${BLUE}🚀 生成 latest.yml 文件 - 平台: $PLATFORM${NC}"

# 检查macOS文件
check_mac_files() {
    local MAC_X64_ZIP="$DIST_DIR/TelyAI-x64.zip"
    local MAC_ARM64_ZIP="$DIST_DIR/TelyAI-arm64.zip"
    
    if [ ! -f "$MAC_X64_ZIP" ] || [ ! -f "$MAC_ARM64_ZIP" ]; then
        echo -e "${RED}❌ 错误: macOS 构建文件不完整${NC}"
        return 1
    fi
    return 0
}

# 检查Windows文件
check_win_files() {
    local WIN_X64_EXE="$DIST_DIR/TelyAI-x64.exe"
    
    if [ ! -f "$WIN_X64_EXE" ]; then
        echo -e "${RED}❌ 错误: Windows 构建文件不存在${NC}"
        return 1
    fi
    return 0
}

# 从 package.json 获取版本号
VERSION=$(grep '"version"' package.json | sed 's/.*"version": "\(.*\)".*/\1/')
echo -e "${GREEN}📦 版本号: $VERSION${NC}"

# 获取当前时间（ISO 8601 格式）
RELEASE_DATE=$(date -u +"%Y-%m-%dT%H:%M:%S.000Z")

# 生成macOS的latest-mac.yml
generate_mac_yml() {
    echo -e "${YELLOW}📝 生成 macOS latest-mac.yml...${NC}"
    
    if ! check_mac_files; then
        echo -e "${YELLOW}⚠️  跳过 macOS latest-mac.yml 生成${NC}"
        return 1
    fi
    
    local MAC_X64_ZIP="$DIST_DIR/TelyAI-x64.zip"
    local MAC_ARM64_ZIP="$DIST_DIR/TelyAI-arm64.zip"
    
    # 计算文件哈希和大小
    local X64_SHA512=$(shasum -a 512 "$MAC_X64_ZIP" | cut -d' ' -f1)
    local X64_SIZE=$(stat -f%z "$MAC_X64_ZIP" 2>/dev/null || stat -c%s "$MAC_X64_ZIP" 2>/dev/null)
    
    local ARM64_SHA512=$(shasum -a 512 "$MAC_ARM64_ZIP" | cut -d' ' -f1)
    local ARM64_SIZE=$(stat -f%z "$MAC_ARM64_ZIP" 2>/dev/null || stat -c%s "$MAC_ARM64_ZIP" 2>/dev/null)
    
    # 计算 blockmap 大小（如果存在）
    local X64_BLOCKMAP_SIZE=0
    local ARM64_BLOCKMAP_SIZE=0
    
    if [ -f "$DIST_DIR/TelyAI-x64.zip.blockmap" ]; then
        X64_BLOCKMAP_SIZE=$(stat -f%z "$DIST_DIR/TelyAI-x64.zip.blockmap" 2>/dev/null || stat -c%s "$DIST_DIR/TelyAI-x64.zip.blockmap" 2>/dev/null)
    fi
    
    if [ -f "$DIST_DIR/TelyAI-arm64.zip.blockmap" ]; then
        ARM64_BLOCKMAP_SIZE=$(stat -f%z "$DIST_DIR/TelyAI-arm64.zip.blockmap" 2>/dev/null || stat -c%s "$DIST_DIR/TelyAI-arm64.zip.blockmap" 2>/dev/null)
    fi
    
    # 生成 latest-mac.yml 文件
    local LATEST_MAC_YML="$DIST_DIR/latest-mac.yml"
    
    cat > "$LATEST_MAC_YML" << EOF
version: $VERSION
files:
  - url: TelyAI-x64.zip
    sha512: $X64_SHA512
    size: $X64_SIZE
    blockMapSize: $X64_BLOCKMAP_SIZE
  - url: TelyAI-arm64.zip
    sha512: $ARM64_SHA512
    size: $ARM64_SIZE
    blockMapSize: $ARM64_BLOCKMAP_SIZE
path: TelyAI-x64.zip
sha512: $X64_SHA512
releaseDate: '$RELEASE_DATE'
EOF
    
    echo -e "${GREEN}✅ 成功生成 $LATEST_MAC_YML${NC}"
    return 0
}

# 生成Windows的latest.yml
generate_win_yml() {
    echo -e "${YELLOW}📝 生成 Windows latest.yml...${NC}"
    
    if ! check_win_files; then
        echo -e "${YELLOW}⚠️  跳过 Windows latest.yml 生成${NC}"
        return 1
    fi
    
    local WIN_X64_EXE="$DIST_DIR/TelyAI-x64.exe"
    
    # 计算文件哈希和大小
    local WIN_SHA512=$(shasum -a 512 "$WIN_X64_EXE" | cut -d' ' -f1)
    local WIN_SIZE=$(stat -f%z "$WIN_X64_EXE" 2>/dev/null || stat -c%s "$WIN_X64_EXE" 2>/dev/null)
    
    # 计算 blockmap 大小（如果存在）
    local WIN_BLOCKMAP_SIZE=0
    if [ -f "$DIST_DIR/TelyAI-x64.exe.blockmap" ]; then
        WIN_BLOCKMAP_SIZE=$(stat -f%z "$DIST_DIR/TelyAI-x64.exe.blockmap" 2>/dev/null || stat -c%s "$DIST_DIR/TelyAI-x64.exe.blockmap" 2>/dev/null)
    fi
    
    # 生成 latest.yml 文件
    local LATEST_WIN_YML="$DIST_DIR/latest.yml"
    
    cat > "$LATEST_WIN_YML" << EOF
version: $VERSION
files:
  - url: TelyAI-x64.exe
    sha512: $WIN_SHA512
    size: $WIN_SIZE
    blockMapSize: $WIN_BLOCKMAP_SIZE
path: TelyAI-x64.exe
sha512: $WIN_SHA512
releaseDate: '$RELEASE_DATE'
EOF
    
    echo -e "${GREEN}✅ 成功生成 $LATEST_WIN_YML${NC}"
    return 0
}

# 主执行逻辑
case "$PLATFORM" in
    "mac")
        echo -e "${BLUE}🍎 仅生成 macOS latest-mac.yml${NC}"
        if generate_mac_yml; then
            echo -e "${GREEN}🎉 macOS latest-mac.yml 生成完成！${NC}"
        else
            echo -e "${RED}❌ macOS latest-mac.yml 生成失败${NC}"
            exit 1
        fi
        ;;
    "win")
        echo -e "${BLUE}🪟 仅生成 Windows latest.yml${NC}"
        if generate_win_yml; then
            echo -e "${GREEN}🎉 Windows latest.yml 生成完成！${NC}"
        else
            echo -e "${RED}❌ Windows latest.yml 生成失败${NC}"
            exit 1
        fi
        ;;
    "all")
        echo -e "${BLUE}🌍 生成所有平台的 latest.yml 文件${NC}"
        
        MAC_SUCCESS=false
        WIN_SUCCESS=false
        
        if generate_mac_yml; then
            MAC_SUCCESS=true
        fi
        
        if generate_win_yml; then
            WIN_SUCCESS=true
        fi
        
        if [ "$MAC_SUCCESS" = true ] || [ "$WIN_SUCCESS" = true ]; then
            echo -e "${GREEN}🎉 latest.yml 文件生成完成！${NC}"
            [ "$MAC_SUCCESS" = true ] && echo -e "${GREEN}  ✅ macOS: latest-mac.yml${NC}"
            [ "$WIN_SUCCESS" = true ] && echo -e "${GREEN}  ✅ Windows: latest.yml${NC}"
        else
            echo -e "${RED}❌ 所有平台的 latest.yml 生成都失败了${NC}"
            echo -e "${YELLOW}💡 请先运行构建命令生成相应的文件${NC}"
            exit 1
        fi
        ;;
    *)
        echo -e "${RED}❌ 错误: 不支持的平台 '$PLATFORM'${NC}"
        echo -e "${YELLOW}💡 支持的平台: mac, win, all${NC}"
        exit 1
        ;;
esac
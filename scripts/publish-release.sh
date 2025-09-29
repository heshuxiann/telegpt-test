#!/bin/bash

# 通过 GitHub CLI 发布 Release 的脚本
# 用法: ./scripts/publish-release.sh [版本号] [发布说明] [平台]
# 示例: ./scripts/publish-release.sh v0.0.18 "新功能和修复" all
# 平台选项: mac, win, all (默认: all)

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 配置
REPO="JsonSuCoder/ai-tg-web"
DIST_DIR="dist-electron"

# 获取参数
VERSION_TAG="$1"
RELEASE_NOTES="$2"
PLATFORM="${3:-all}"  # 默认为 all

# 如果没有提供版本号，从 package.json 获取
if [ -z "$VERSION_TAG" ]; then
    PACKAGE_VERSION=$(grep '"version"' package.json | sed 's/.*"version": "\(.*\)".*/\1/')
    VERSION_TAG="v$PACKAGE_VERSION"
    echo -e "${YELLOW}📦 使用 package.json 中的版本号: $VERSION_TAG${NC}"
fi

# 如果没有提供发布说明，使用默认值
if [ -z "$RELEASE_NOTES" ]; then
    RELEASE_NOTES="Automated release $VERSION_TAG"
    echo -e "${YELLOW}📝 使用默认发布说明: $RELEASE_NOTES${NC}"
fi

echo -e "${BLUE}🚀 开始发布 Release: $VERSION_TAG${NC}"

# 检查 gh CLI 是否已安装
if ! command -v gh &> /dev/null; then
    echo -e "${RED}❌ 错误: GitHub CLI (gh) 未安装${NC}"
    echo -e "${YELLOW}💡 请运行: brew install gh${NC}"
    exit 1
fi

# 检查是否已登录 GitHub
if ! gh auth status &> /dev/null; then
    echo -e "${RED}❌ 错误: 未登录 GitHub CLI${NC}"
    echo -e "${YELLOW}💡 请运行: gh auth login${NC}"
    exit 1
fi

# 检查构建文件是否存在
echo -e "${YELLOW}🔍 检查构建文件...${NC}"

# 根据平台检查不同的文件
check_mac_files() {
    local mac_files=(
        "$DIST_DIR/TelyAI-x64.zip"
        "$DIST_DIR/TelyAI-arm64.zip"
        "$DIST_DIR/TelyAI-x64.dmg"
        "$DIST_DIR/TelyAI-arm64.dmg"
    )
    
    for file in "${mac_files[@]}"; do
        if [ ! -f "$file" ]; then
            echo -e "${RED}❌ 错误: $file 不存在${NC}"
            return 1
        fi
    done
    return 0
}

check_win_files() {
    local win_files=(
        "$DIST_DIR/TelyAI-x64.exe"
        "$DIST_DIR/TelyAI-x64.zip"
        "$DIST_DIR/TelyAI-arm64.zip"
    )
    
    for file in "${win_files[@]}"; do
        if [ ! -f "$file" ]; then
            echo -e "${RED}❌ 错误: $file 不存在${NC}"
            return 1
        fi
    done
    return 0
}

# 根据平台检查文件
case "$PLATFORM" in
    "mac")
        if ! check_mac_files; then
            echo -e "${YELLOW}💡 请先运行: npm run electron:package${NC}"
            exit 1
        fi
        ;;
    "win")
        if ! check_win_files; then
            echo -e "${YELLOW}💡 请先运行: npm run electron:package${NC}"
            exit 1
        fi
        ;;
    "all")
        if ! check_mac_files || ! check_win_files; then
            echo -e "${YELLOW}💡 请先运行: npm run electron:package${NC}"
            exit 1
        fi
        ;;
    *)
        echo -e "${RED}❌ 错误: 不支持的平台 '$PLATFORM'${NC}"
        echo -e "${YELLOW}💡 支持的平台: mac, win, all${NC}"
        exit 1
        ;;
esac

# 生成 latest.yml 文件（如果不存在）
generate_latest_files() {
    case "$PLATFORM" in
        "mac")
            if [ ! -f "$DIST_DIR/latest-mac.yml" ]; then
                echo -e "${YELLOW}📝 生成 latest-mac.yml...${NC}"
                ./scripts/generate-latest-yml.sh mac
            fi
            ;;
        "win")
            if [ ! -f "$DIST_DIR/latest.yml" ]; then
                echo -e "${YELLOW}📝 生成 latest.yml...${NC}"
                ./scripts/generate-latest-yml.sh win
            fi
            ;;
        "all")
            if [ ! -f "$DIST_DIR/latest-mac.yml" ]; then
                echo -e "${YELLOW}📝 生成 latest-mac.yml...${NC}"
                ./scripts/generate-latest-yml.sh mac
            fi
            if [ ! -f "$DIST_DIR/latest.yml" ]; then
                echo -e "${YELLOW}📝 生成 latest.yml...${NC}"
                ./scripts/generate-latest-yml.sh win
            fi
            ;;
    esac
}

generate_latest_files

# 检查 Release 是否已存在
echo -e "${YELLOW}🔍 检查 Release 是否已存在...${NC}"
if gh release view "$VERSION_TAG" --repo "$REPO" &> /dev/null; then
    echo -e "${YELLOW}⚠️  Release $VERSION_TAG 已存在${NC}"
    read -p "是否要删除现有 Release 并重新创建？(y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo -e "${YELLOW}🗑️  删除现有 Release...${NC}"
        gh release delete "$VERSION_TAG" --repo "$REPO" --yes
    else
        echo -e "${BLUE}ℹ️  将向现有 Release 添加文件...${NC}"
    fi
fi

# 创建 Release（如果不存在）
if ! gh release view "$VERSION_TAG" --repo "$REPO" &> /dev/null; then
    echo -e "${YELLOW}📦 创建 Release: $VERSION_TAG${NC}"
    gh release create "$VERSION_TAG" \
        --repo "$REPO" \
        --title "Release $VERSION_TAG" \
        --notes "$RELEASE_NOTES"
fi

# 上传文件
echo -e "${YELLOW}📤 上传构建文件...${NC}"

# 根据平台准备上传文件列表
prepare_upload_files() {
    local upload_files=()
    
    case "$PLATFORM" in
        "mac")
            upload_files+=(
                "$DIST_DIR/TelyAI-x64.zip"
                "$DIST_DIR/TelyAI-arm64.zip"
                "$DIST_DIR/TelyAI-x64.dmg"
                "$DIST_DIR/TelyAI-arm64.dmg"
                "$DIST_DIR/latest-mac.yml"
            )
            ;;
        "win")
            upload_files+=(
                "$DIST_DIR/TelyAI-x64.exe"
                "$DIST_DIR/TelyAI-x64.zip"
                "$DIST_DIR/TelyAI-arm64.zip"
                "$DIST_DIR/latest.yml"
            )
            ;;
        "all")
            upload_files+=(
                "$DIST_DIR/TelyAI-x64.zip"
                "$DIST_DIR/TelyAI-arm64.zip"
                "$DIST_DIR/TelyAI-x64.dmg"
                "$DIST_DIR/TelyAI-arm64.dmg"
                "$DIST_DIR/TelyAI-x64.exe"
                "$DIST_DIR/latest-mac.yml"
                "$DIST_DIR/latest.yml"
            )
            ;;
    esac
    
    # 上传文件
    for file in "${upload_files[@]}"; do
        if [ -f "$file" ]; then
            echo -e "${BLUE}📤 上传: $(basename "$file")${NC}"
            gh release upload "$VERSION_TAG" "$file" --repo "$REPO" --clobber
        else
            echo -e "${YELLOW}⚠️  跳过不存在的文件: $file${NC}"
        fi
    done
}

prepare_upload_files

# 显示 Release 信息
echo -e "${GREEN}✅ Release 发布成功！${NC}"
echo -e "${BLUE}🔗 Release URL: https://github.com/$REPO/releases/tag/$VERSION_TAG${NC}"

# 显示上传的文件
echo -e "${YELLOW}📋 已上传的文件:${NC}"
gh release view "$VERSION_TAG" --repo "$REPO" | grep -A 20 "ASSETS"

echo -e "${GREEN}🎉 发布完成！${NC}"
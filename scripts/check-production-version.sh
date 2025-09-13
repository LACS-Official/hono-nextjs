#!/bin/bash

# 生产环境版本存在性检查脚本
# 请替换为你的生产环境API Key和域名

API_BASE_URL="https://api-g.lacs.cc"
API_KEY="your_production_api_key_here"

echo "检查生产环境版本ID 26是否存在..."

# 获取版本列表
echo "1. 获取软件ID 1的所有版本:"
curl -X GET "${API_BASE_URL}/app/software/id/1/versions" \
  -H "X-API-Key: ${API_KEY}" \
  -H "Content-Type: application/json"

echo -e "\n\n2. 尝试获取版本ID 26:"
curl -X GET "${API_BASE_URL}/app/software/id/1/versions/26" \
  -H "X-API-Key: ${API_KEY}" \
  -H "Content-Type: application/json"

echo -e "\n\n检查完成。"
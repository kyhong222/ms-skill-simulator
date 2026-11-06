#!/usr/bin/env bash
# Supabase CLI로 프로젝트 값을 찾아 .env.local을 만든다. WSL 터미널에서 실행: bash scripts/setup-env.sh
# anon key만 읽는다. service_role/secret 키는 브라우저 번들에 들어가면 안 되므로 절대 쓰지 말 것
set -euo pipefail

ENV_FILE="$(cd "$(dirname "$0")/.." && pwd)/.env.local"

if ! command -v supabase >/dev/null 2>&1; then
  echo "supabase CLI를 찾을 수 없습니다." >&2
  exit 1
fi

if ! supabase projects list >/dev/null 2>&1; then
  echo "Supabase 로그인이 필요합니다."
  supabase login
fi

echo
supabase projects list 2>/dev/null | grep -v -i "new version\|recommend updating" | sed '/^[[:space:]]*$/d'
echo

default_ref=$(supabase projects list -o json 2>/dev/null | sed -n 's/^ *"id": *"\([a-z0-9]\{20\}\)".*/\1/p' | head -1)
read -r -p "프로젝트 Reference ID [${default_ref}]: " ref
ref="${ref:-$default_ref}"
if [[ ! "$ref" =~ ^[a-z0-9]{20}$ ]]; then
  echo "Reference ID 형식이 아닙니다: $ref" >&2
  exit 1
fi

anon_key=$(supabase projects api-keys --project-ref "$ref" -o env 2>/dev/null |
  sed -n 's/^SUPABASE_ANON_KEY="\{0,1\}\([^"]*\)"\{0,1\}$/\1/p')

if [[ -n "$anon_key" ]]; then
  read -r -p "CLI에서 anon key를 찾았습니다. 그대로 쓰려면 Enter, 직접 입력하려면 붙여넣기: " typed
else
  read -r -p "anon key를 찾지 못했습니다. 직접 붙여넣기: " typed
fi
anon_key="${typed:-$anon_key}"
if [[ -z "$anon_key" ]]; then
  echo "anon key가 비어 있습니다." >&2
  exit 1
fi

url="https://${ref}.supabase.co"

if [[ -f "$ENV_FILE" ]]; then
  read -r -p ".env.local의 VITE_SUPABASE_* 값을 교체할까요? [y/N]: " overwrite
  if [[ ! "$overwrite" =~ ^[Yy]$ ]]; then
    echo "취소했습니다."
    exit 0
  fi
fi

# 다른 항목은 유지하고 두 값만 교체한다
tmp_file=$(mktemp)
if [[ -f "$ENV_FILE" ]]; then
  grep -v -E '^VITE_SUPABASE_(URL|ANON_KEY)=' "$ENV_FILE" > "$tmp_file" || true
fi
{
  echo "VITE_SUPABASE_URL=${url}"
  echo "VITE_SUPABASE_ANON_KEY=${anon_key}"
} >> "$tmp_file"
mv "$tmp_file" "$ENV_FILE"
chmod 600 "$ENV_FILE"
echo ".env.local 저장 완료: $ENV_FILE"

# 값이 맞는지와 디스코드 로그인이 켜져 있는지 확인
if command -v curl >/dev/null 2>&1; then
  settings=$(curl -s -m 10 -H "apikey: ${anon_key}" "${url}/auth/v1/settings" || true)
  if [[ "$settings" == *'"discord":true'* ]]; then
    echo "연결 확인: 디스코드 로그인 사용 가능"
  else
    echo "주의: 디스코드 로그인이 켜져 있는지 확인하지 못했습니다. URL과 키를 확인해 주세요."
  fi
fi

echo
read -r -p "Vercel에 붙여 넣을 값을 화면에 표시할까요? [y/N]: " show
if [[ "$show" =~ ^[Yy]$ ]]; then
  echo "VITE_SUPABASE_URL=${url}"
  echo "VITE_SUPABASE_ANON_KEY=${anon_key}"
fi

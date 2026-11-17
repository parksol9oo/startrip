# Startrip · 앱인토스(Apps in Toss) 빌드

저장소 루트의 `index.html`을 앱인토스 WebView 미니앱(`.ait`)으로 묶는 폴더예요.
앱 내용은 루트의 `index.html`만 고치면 돼요. 이 폴더는 묶는 설정만 담고 있어요.

## 1. 자동 빌드 (추천)
main에 `index.html` · 아이콘 · 이 폴더가 바뀌어 Push되면 GitHub Actions가 `startrip.ait`를 만들어요.
- GitHub › **Actions** › **앱인토스 .ait 빌드** › 최신 실행 › 아래 **Artifacts**의 `startrip-ait` 내려받기
- 손으로 다시 돌리려면 같은 화면에서 **Run workflow**

## 2. 내 컴퓨터에서 빌드
```sh
cd appsintoss
npm ci            # 처음 한 번
npm run build     # → appsintoss/startrip.ait
```

## 동작 방식
- `scripts/prepare.mjs`: 루트의 `index.html` · 아이콘을 `dist/`로 복사하고
  - 쿼리(`?app=zero`) 없이도 앱 모드(처음 시작)로 열리게 바꿔요.
  - `window.APPS_IN_TOSS = true` 를 넣어요. `index.html`에서 `if (window.APPS_IN_TOSS) { ... }`로 토스 전용 처리를 나눌 수 있어요.
- `ait build`: `dist/`를 `startrip.ait`로 묶어요.

## 올리기
앱인토스 콘솔 › 앱 › 출시 메뉴에서 `startrip.ait` 업로드 → 토스 앱 QR 테스트 → 검토 요청
(CLI: `npx ait token add`로 API 키 등록 후 `npm run deploy`)

## 주의
- `apps-in-toss.config.ts`의 `appName`(`startrip`)은 콘솔에 등록한 앱 이름과 같아야 해요.
- 쪼개기 AI 중계 서버(`proxy/wrangler.toml`)의 `ALLOWED_ORIGINS`에 앱인토스 주소가 있어야 토스 안에서 AI 쪼개기가 동작해요.
- SDK: `@apps-in-toss/web-framework` 3.10.0

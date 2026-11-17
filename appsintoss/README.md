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

## 상단 고정 배너 광고
- `scripts/prepare.mjs`가 빌드 때 광고 SDK(`@apps-in-toss/web-framework`의 `TossAds`)를 esbuild로 `dist/toss-ads.js`에 묶고, `window.TOSS_AD_IDS={banner:…}`와 함께 `dist/index.html` 머리에 넣어요.
- 루트 `index.html`의 광고 코드(파일 끝 "앱인토스 광고" 블록)는 `window.APPS_IN_TOSS`일 때만 동작해요. 시작 시 `TossAds.initialize()`를 하고, 화면이 그려질 때마다 빈 `.adslot[data-ad=banner]`(홈 · 가방 · 기록 · 마이 상단, 프리미엄 제외)에 `TossAds.attachBanner()`로 배너를 붙여요. 같은 화면이 다시 그려지면 새로 요청하지 않고 배너 요소를 옮겨 쓰고, 광고가 없으면(onNoFill) 자리를 접어요. 실행 화면 전광판은 비워 둬요(같은 화면에 같은 형식 광고 2개 금지).
- **광고 ID**: 기본은 테스트 ID `ait-ad-test-banner-id`예요. 출시용 번들만 콘솔에서 받은 광고 그룹 ID를 넣어 빌드해요. 실제 ID로 테스트하면 정책 위반으로 제재받을 수 있어요.
  ```sh
  TOSS_BANNER_AD_ID=<광고 그룹 ID> npm run build
  ```
  GitHub Actions 빌드는 저장소 Settings › Secrets and variables › Actions › **Variables**의 `TOSS_BANNER_AD_ID`를 읽어요. 비어 있으면 테스트 ID로 빌드돼요.
- 샌드박스는 광고를 지원하지 않아요. 콘솔 QR로 토스 앱(5.241.0 이상)에서 확인해요.

## 주의
- `apps-in-toss.config.ts`의 `appName`(`startrip`)은 콘솔에 등록한 앱 이름과 같아야 해요.
- 쪼개기 AI 중계 서버(`proxy/wrangler.toml`)의 `ALLOWED_ORIGINS`에 앱인토스 주소가 있어야 토스 안에서 AI 쪼개기가 동작해요.
- SDK: `@apps-in-toss/web-framework` 3.10.0

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

## 토스 안에서 다르게 동작하는 것
- **origin**: 콘솔 QR 테스트는 `https://startrip.private-apps.tossmini.com`, 정식 출시는 `https://startrip.apps.tossmini.com`에서 열려요. 둘은 다른 origin이라 `localStorage`(진행 저장)가 서로 공유되지 않아요. 쪼개기 AI(Cloudflare Worker)는 외부 HTTPS fetch라 그대로 동작하지만, 이 두 주소가 `proxy/wrangler.toml`의 `ALLOWED_ORIGINS`에 없으면 403으로 막혀 예시 단계로 떨어져요. 바꾼 뒤에는 `cd proxy && npx wrangler deploy`로 다시 배포해야 반영돼요.
- **웹 알림**(`Notification.requestPermission`): 토스 웹뷰에서는 동작하지 않아요. `index.html`은 try/catch로 감싸 두어 오류 없이 무시돼요. 실제 푸시는 앱인토스 SDK로 붙여야 해요.
- **말로 입력(마이크)**: `permissions`에 microphone을 선언해 두었지만, 웹뷰에서 `SpeechRecognition`이 되는지는 실기기 QR 테스트로 확인해야 해요.
- **배포 감지**(`index.html`이 HEAD 요청으로 수정 시각을 보는 기능): 토스에서는 새 `.ait` 업로드로 갱신되므로 의미가 없고, 실패해도 조용히 넘어가요.
- `test.html`은 토스에서 쓰지 않아요. `prepare.mjs`가 `index.html`을 앱 모드로 바꿔 넣기 때문이에요.

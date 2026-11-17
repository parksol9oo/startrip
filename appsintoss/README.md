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

## 토스 안에서 다르게 동작하는 것
- **origin**: 콘솔 QR 테스트는 `https://startrip.private-apps.tossmini.com`, 정식 출시는 `https://startrip.apps.tossmini.com`에서 열려요. 둘은 다른 origin이라 `localStorage`(진행 저장)가 서로 공유되지 않아요. 쪼개기 AI(Cloudflare Worker)는 외부 HTTPS fetch라 그대로 동작하지만, 이 두 주소가 `proxy/wrangler.toml`의 `ALLOWED_ORIGINS`에 없으면 403으로 막혀 예시 단계로 떨어져요. 바꾼 뒤에는 `cd proxy && npx wrangler deploy`로 다시 배포해야 반영돼요.
- **웹 알림**(`Notification.requestPermission`): 토스 웹뷰에서는 동작하지 않아요. `index.html`은 try/catch로 감싸 두어 오류 없이 무시돼요. 실제 푸시는 앱인토스 SDK로 붙여야 해요.
- **말로 입력(마이크)**: `permissions`에 microphone을 선언해 두었지만, 웹뷰에서 `SpeechRecognition`이 되는지는 실기기 QR 테스트로 확인해야 해요.
- **배포 감지**(`index.html`이 HEAD 요청으로 수정 시각을 보는 기능): 토스에서는 새 `.ait` 업로드로 갱신되므로 의미가 없고, 실패해도 조용히 넘어가요.
- `test.html`은 토스에서 쓰지 않아요. `prepare.mjs`가 `index.html`을 앱 모드로 바꿔 넣기 때문이에요.

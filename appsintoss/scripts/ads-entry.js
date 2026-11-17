// 앱인토스 광고 SDK 를 번들러 없는 index.html 에서 쓰기 위한 진입점.
// prepare.mjs 가 esbuild 로 dist/toss-ads.js 로 묶고 <script src> 로 넣어요.
import { TossAds } from "@apps-in-toss/web-framework";
window.TossAds = TossAds;

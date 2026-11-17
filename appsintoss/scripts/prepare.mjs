// 저장소 루트의 index.html·아이콘을 dist/로 복사하고, 앱인토스에서는 항상 '앱 모드(처음 시작)'로 열리게 바꿔요.
import { mkdirSync, copyFileSync, readFileSync, writeFileSync, existsSync } from "node:fs";
import { buildSync } from "esbuild";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
// 이 폴더는 저장소 안(appsintoss/)에 있어서 한 단계 위가 저장소 루트예요. 필요하면 STARTRIP_ROOT 로 바꿀 수 있어요.
const root = process.env.STARTRIP_ROOT || resolve(here, "..", "..");
const dist = resolve(here, "..", "dist");
if (!existsSync(resolve(root, "index.html"))) {
  console.error("startrip 저장소를 찾지 못했어요: " + root + "\nSTARTRIP_ROOT=저장소경로 npm run build 로 다시 실행해 주세요.");
  process.exit(1);
}
mkdirSync(dist, { recursive: true });

for (const f of ["icon.png", "icon-192.png", "apple-touch-icon-v2.png"]) {
  copyFileSync(resolve(root, f), resolve(dist, f));
}

const from = 'const q=new URLSearchParams(location.search); if(!q.has("app")) return;';
const to = 'const q=new URLSearchParams(location.search); /* 앱인토스 빌드: 항상 앱 모드(기본 처음 시작) */';
let html = readFileSync(resolve(root, "index.html"), "utf8");
if (!html.includes(from)) {
  console.error("index.html에서 앱 모드 코드를 찾지 못했어요. prepare.mjs의 문구를 확인해 주세요.");
  process.exit(1);
}
html = html.replace(from, to);
// 앱인토스 광고 ID. 개발·QR 테스트는 테스트 ID, 출시 빌드만 콘솔에서 받은 실제 ID 를 환경변수로 넣어요.
//   TOSS_BANNER_AD_ID=<광고 그룹 ID> npm run build
// 실제 ID 로 테스트하면 정책 위반으로 제재받을 수 있어요.
const TEST_BANNER_ID = "ait-ad-test-banner-id";
const bannerId = process.env.TOSS_BANNER_AD_ID || TEST_BANNER_ID;
console.log(bannerId === TEST_BANNER_ID ? "광고: 테스트 ID (출시 빌드는 TOSS_BANNER_AD_ID 를 넣어 주세요)" : "광고: 실제 ID " + bannerId);

// 광고 SDK(TossAds) 를 window 에 올리는 번들. index.html 이 <script src="toss-ads.js"> 로 불러요.
buildSync({
  entryPoints: [resolve(here, "ads-entry.js")],
  bundle: true,
  minify: true,
  format: "iife",
  target: "es2018",
  outfile: resolve(dist, "toss-ads.js"),
  logLevel: "warning",
});

// 앱인토스 버전 표시: index.html 안에서 window.APPS_IN_TOSS 로 토스 전용 처리를 나눌 수 있어요.
// window.TOSS_AD_IDS 는 index.html 의 광고 코드가 읽어요.
html = html.replace(
  "<head>",
  `<head><script>window.APPS_IN_TOSS=true;window.TOSS_AD_IDS=${JSON.stringify({ banner: bannerId })}</script><script src="toss-ads.js"></script>`,
);
writeFileSync(resolve(dist, "index.html"), html);
console.log("dist/ 준비 완료 → ait build");

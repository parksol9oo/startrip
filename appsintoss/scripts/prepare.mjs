// 저장소 루트의 index.html·아이콘을 dist/로 복사하고, 앱인토스에서는 항상 '앱 모드(처음 시작)'로 열리게 바꿔요.
import { mkdirSync, copyFileSync, readFileSync, writeFileSync, existsSync } from "node:fs";
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
// 앱인토스 버전 표시: index.html 안에서 window.APPS_IN_TOSS 로 토스 전용 처리를 나눌 수 있어요.
html = html.replace("<head>", '<head><script>window.APPS_IN_TOSS=true</script>');
writeFileSync(resolve(dist, "index.html"), html);
console.log("dist/ 준비 완료 → ait build");

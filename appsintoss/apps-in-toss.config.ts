import { defineConfig } from "@apps-in-toss/web-framework/config";

export default defineConfig({
  // 앱인토스 콘솔에 등록한 앱 이름과 똑같아야 업로드돼요.
  appName: "startrip",
  // S9 음성으로 목표 입력(마이크) 때문에 필요해요.
  permissions: [{ name: "microphone", access: "access" }],
  navigationBar: {
    withBackButton: true,
    withHomeButton: false,
    withTitle: true,
    theme: "light",
  },
  webView: {
    bounces: false,
    pullToRefreshEnabled: false,
    overScrollMode: "never",
    allowsBackForwardNavigationGestures: false,
  },
  // 이미 완성된 정적 웹(index.html)을 그대로 묶어요.
  webBundleDir: "dist",
});

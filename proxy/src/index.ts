// startrip 쪼개기 프록시 (Cloudflare Worker)
// 브라우저(index.html)가 { goal, level } 을 POST 하면 Claude 가 단계 배열을 돌려줘요.
// API 키는 이 Worker 의 secret 에만 있고, 정적 페이지에는 절대 들어가지 않아요.
import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";

interface Env {
  ANTHROPIC_API_KEY: string;
  ALLOWED_ORIGINS?: string;
  MODEL?: string;
}

// index.html 의 LEVELS 와 같은 순서 · 같은 단계 수여야 해요.
const LEVELS: [name: string, desc: string, count: number][] = [
  ["큼직하게", "단계 단위 · 예) 작업물 고르기, 페이지 구성하기", 3],
  ["적당히", "할 일 단위 · 예) 목차 정하기, 표지 만들기", 5],
  ["자세하게", "세부 단계 단위 · 예) 작업물 설명 한 줄씩 쓰기", 7],
  ["치밀하게", "동작 단위 · 예) 작업 폴더 열기", 9],
];
const MAX_GOAL_CHARS = 200;

const SYSTEM =
  "너는 할 일을 잘게 쪼개 주는 도우미야. 사용자가 미루지 않고 바로 시작할 수 있게 목표를 실행 단계로 나눠줘.\n" +
  "규칙:\n" +
  "- 요청한 개수만큼, 실제로 하는 순서대로\n" +
  "- 각 단계는 한국어로 20자 이내의 짧은 행동 문장 (예: \"목차 정하기\")\n" +
  "- 번호, 이모지, 설명을 붙이지 말 것\n" +
  "- 첫 단계는 5분 안에 끝낼 수 있을 만큼 작게";

function corsHeaders(origin: string | null, env: Env): Record<string, string> {
  const allowed = (env.ALLOWED_ORIGINS ?? "").split(",").map((s) => s.trim()).filter(Boolean);
  // 허용 목록이 비어 있으면 전부 허용(개발용). file:// 로 연 페이지는 origin 이 "null" 로 와요.
  const ok = allowed.length === 0 || (origin !== null && allowed.includes(origin));
  return {
    "Access-Control-Allow-Origin": ok && origin ? origin : allowed[0] ?? "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Max-Age": "86400",
    Vary: "Origin",
  };
}

function json(body: unknown, status: number, headers: Record<string, string>): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8", ...headers },
  });
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const origin = request.headers.get("Origin");
    const cors = corsHeaders(origin, env);

    if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: cors });
    if (request.method !== "POST") return json({ error: "method_not_allowed" }, 405, cors);

    const allowed = (env.ALLOWED_ORIGINS ?? "").split(",").map((s) => s.trim()).filter(Boolean);
    if (allowed.length > 0 && (origin === null || !allowed.includes(origin))) {
      return json({ error: "origin_not_allowed" }, 403, cors);
    }

    let body: { goal?: unknown; level?: unknown };
    try {
      body = (await request.json()) as typeof body;
    } catch {
      return json({ error: "bad_json" }, 400, cors);
    }
    const goal = typeof body.goal === "string" ? body.goal.trim() : "";
    const level = typeof body.level === "number" ? body.level : -1;
    if (!goal || goal.length > MAX_GOAL_CHARS) return json({ error: "bad_goal" }, 400, cors);
    if (!Number.isInteger(level) || level < 0 || level >= LEVELS.length) {
      return json({ error: "bad_level" }, 400, cors);
    }
    const [name, desc, n] = LEVELS[level];

    const Steps = z.object({ steps: z.array(z.string()).min(n).max(n) });
    const client = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY });

    try {
      const res = await client.messages.parse({
        model: env.MODEL || "claude-haiku-5-5",
        max_tokens: 1024,
        output_config: { effort: "low", format: zodOutputFormat(Steps) },
        system: SYSTEM,
        messages: [
          {
            role: "user",
            content: `목표: "${goal}"\n쪼개기 크기: ${name} (${desc})\n정확히 ${n}개 단계로 나눠줘.`,
          },
        ],
      });
      if (res.stop_reason === "refusal" || !res.parsed_output) {
        return json({ error: "no_output" }, 502, cors);
      }
      const steps = res.parsed_output.steps.map((s) => s.trim()).filter(Boolean).slice(0, n);
      if (steps.length < 2) return json({ error: "no_output" }, 502, cors);
      return json({ steps }, 200, cors);
    } catch (e) {
      if (e instanceof Anthropic.RateLimitError) return json({ error: "rate_limited" }, 429, cors);
      if (e instanceof Anthropic.AuthenticationError) return json({ error: "server_auth" }, 500, cors);
      if (e instanceof Anthropic.APIError) return json({ error: "upstream", status: e.status }, 502, cors);
      return json({ error: "unknown" }, 500, cors);
    }
  },
} satisfies ExportedHandler<Env>;

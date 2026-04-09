import { useState, useRef, useEffect } from "react";

const C = {
  bg: "#0a0e1a", surface: "#111827", card: "#151e2e", border: "#1e2d45",
  gold: "#c9a84c", goldLight: "#e8c97a", accent: "#3b82f6",
  red: "#ef4444", green: "#22c55e", text: "#e2e8f0", muted: "#64748b",
};

const STORAGE_KEY = "wealthai_v1";

function load(key, fallback) {
  try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : fallback; }
  catch { return fallback; }
}
function save(key, val) {
  try { localStorage.setItem(key, JSON.stringify(val)); } catch {}
}

function formatKRW(n) {
  if (!n && n !== 0) return "0원";
  if (Math.abs(n) >= 100000000) return `${(n / 100000000).toFixed(1)}억원`;
  if (Math.abs(n) >= 10000) return `${Math.floor(n / 10000).toLocaleString()}만원`;
  return `${n.toLocaleString()}원`;
}

function GaugeBar({ value, max, color }) {
  const pct = Math.min((value / (max || 1)) * 100, 100);
  return (
    <div style={{ background: "#1a2540", borderRadius: 8, height: 8, overflow: "hidden" }}>
      <div style={{ width: `${pct}%`, height: "100%", background: `linear-gradient(90deg,${color}88,${color})`, borderRadius: 8, transition: "width 0.6s ease" }} />
    </div>
  );
}

function StatCard({ label, value, color, icon }) {
  return (
    <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, padding: "16px 18px", flex: 1, minWidth: 130, position: "relative", overflow: "hidden" }}>
      <div style={{ position: "absolute", top: -8, right: -8, fontSize: 48, opacity: 0.05 }}>{icon}</div>
      <div style={{ fontSize: 10, color: C.muted, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 5 }}>{label}</div>
      <div style={{ fontSize: 18, fontWeight: 700, color: color || C.text, letterSpacing: -0.5 }}>{value}</div>
    </div>
  );
}

// ── API Key 설정 화면 ──
function ApiKeyScreen({ onSave }) {
  const [key, setKey] = useState("");
  return (
    <div style={{ minHeight: "100vh", background: C.bg, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Apple SD Gothic Neo',sans-serif" }}>
      <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 24, padding: "40px 36px", width: 400, textAlign: "center" }}>
        <div style={{ fontSize: 40, marginBottom: 16 }}>💰</div>
        <div style={{ fontSize: 20, fontWeight: 800, color: C.goldLight, marginBottom: 8 }}>WealthAI Private</div>
        <div style={{ fontSize: 13, color: C.muted, marginBottom: 28, lineHeight: 1.6 }}>
          AI 어드바이저 기능을 사용하려면<br />Anthropic API 키가 필요해요.<br />
          <a href="https://console.anthropic.com" target="_blank" rel="noreferrer" style={{ color: C.accent }}>console.anthropic.com</a>에서 발급받으세요.
        </div>
        <input
          type="password"
          placeholder="sk-ant-..."
          value={key}
          onChange={e => setKey(e.target.value)}
          style={{ width: "100%", background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: "12px 16px", color: C.text, fontSize: 14, outline: "none", marginBottom: 14 }}
        />
        <div style={{ fontSize: 11, color: C.muted, marginBottom: 18 }}>🔒 키는 이 기기 브라우저에만 저장됩니다. 서버로 전송되지 않아요.</div>
        <button
          onClick={() => { if (key.startsWith("sk-")) { save("wealthai_apikey", key); onSave(key); } else alert("올바른 API 키를 입력해주세요 (sk-ant-... 로 시작)"); }}
          style={{ width: "100%", background: `linear-gradient(135deg,${C.gold},${C.goldLight})`, border: "none", borderRadius: 12, padding: "13px", color: "#000", fontWeight: 800, fontSize: 14, cursor: "pointer" }}
        >시작하기 →</button>
        <div style={{ marginTop: 14, fontSize: 11, color: C.muted }}>API 없이 대시보드만 쓸 수도 있어요</div>
        <button onClick={() => onSave(null)} style={{ background: "none", border: "none", color: C.muted, fontSize: 12, cursor: "pointer", marginTop: 6, textDecoration: "underline" }}>대시보드만 사용</button>
      </div>
    </div>
  );
}

export default function App() {
  const [apiKey, setApiKey] = useState(() => load("wealthai_apikey", null));
  const [showApiInput, setShowApiInput] = useState(false);

  const [salary, setSalary] = useState(() => load(`${STORAGE_KEY}_salary`, 3800000));
  const [loans, setLoans] = useState(() => load(`${STORAGE_KEY}_loans`, [
    { id: 1, name: "신용대출", balance: 15000000, monthly: 350000, rate: 6.5, dueDay: 15 },
    { id: 2, name: "카드론", balance: 5000000, monthly: 200000, rate: 12.5, dueDay: 20 },
  ]));
  const [cards, setCards] = useState(() => load(`${STORAGE_KEY}_cards`, [
    { id: 1, name: "신한카드", amount: 800000, dueDay: 14 },
    { id: 2, name: "국민카드", amount: 450000, dueDay: 21 },
  ]));

  const [messages, setMessages] = useState([{
    role: "assistant",
    content: "안녕하세요! 💰 WealthAI Private입니다.\n\n대출·카드 정보를 입력하면 이 기기에 자동 저장돼요.\n재무 분석이나 상환 전략을 물어보세요!"
  }]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("대출");
  const [editingLoan, setEditingLoan] = useState(null);
  const [editingCard, setEditingCard] = useState(null);
  const chatEndRef = useRef(null);

  // 자동 저장
  useEffect(() => { save(`${STORAGE_KEY}_salary`, salary); }, [salary]);
  useEffect(() => { save(`${STORAGE_KEY}_loans`, loans); }, [loans]);
  useEffect(() => { save(`${STORAGE_KEY}_cards`, cards); }, [cards]);
  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  if (!apiKey && !showApiInput) {
    return <ApiKeyScreen onSave={(key) => { setApiKey(key); setShowApiInput(false); }} />;
  }

  const totalMonthly = loans.reduce((s, l) => s + l.monthly, 0) + cards.reduce((s, c) => s + c.amount, 0);
  const totalDebt = loans.reduce((s, l) => s + l.balance, 0);
  const remaining = salary - totalMonthly;
  const debtRatio = Math.round((totalMonthly / (salary || 1)) * 100);

  function buildContext() {
    return `당신은 세계 최고 수준의 개인 자산관리 AI입니다. 한국 직장인의 부채 관리를 전문적으로 분석해주세요.
재무 현황:
- 월 수령액: ${formatKRW(salary)}
- 대출: ${loans.map(l => `${l.name} 잔액${formatKRW(l.balance)} 월납부${formatKRW(l.monthly)} 금리${l.rate}% 납부일${l.dueDay}일`).join(" / ")}
- 카드: ${cards.map(c => `${c.name} ${formatKRW(c.amount)} 결제일${c.dueDay}일`).join(" / ")}
- 월총납부: ${formatKRW(totalMonthly)} / 월잔여: ${formatKRW(remaining)} / 부채비율: ${debtRatio}%
한국어로 친근하고 전문적으로, 구체적 숫자와 우선순위 중심으로 답변하세요.`;
  }

  async function sendMessage() {
    if (!input.trim() || loading) return;
    if (!apiKey) { alert("AI 기능을 쓰려면 API 키가 필요해요!"); setShowApiInput(true); return; }
    const userMsg = input.trim();
    setInput("");
    setMessages(prev => [...prev, { role: "user", content: userMsg }]);
    setLoading(true);
    try {
      const history = messages.slice(-6).map(m => ({ role: m.role, content: m.content }));
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-api-key": apiKey, "anthropic-version": "2023-06-01", "anthropic-dangerous-direct-browser-access": "true" },
        body: JSON.stringify({ model: "claude-opus-4-5", max_tokens: 1000, system: buildContext(), messages: [...history, { role: "user", content: userMsg }] })
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error.message);
      setMessages(prev => [...prev, { role: "assistant", content: data.content?.[0]?.text || "응답 오류" }]);
    } catch (e) {
      setMessages(prev => [...prev, { role: "assistant", content: `⚠️ 오류: ${e.message}` }]);
    }
    setLoading(false);
  }

  const today = new Date().getDate();
  const upcoming = [
    ...loans.map(l => ({ name: l.name, amount: l.monthly, day: l.dueDay, type: "대출" })),
    ...cards.map(c => ({ name: c.name, amount: c.amount, day: c.dueDay, type: "카드" }))
  ].sort((a, b) => {
    const da = a.day >= today ? a.day - today : a.day + 30 - today;
    const db = b.day >= today ? b.day - today : b.day + 30 - today;
    return da - db;
  });

  const IS = { flex: 1, background: "#0a0e1a", border: `1px solid ${C.border}`, borderRadius: 6, padding: "5px 8px", color: C.text, fontSize: 13 };

  return (
    <div style={{ minHeight: "100vh", background: C.bg, color: C.text, fontFamily: "'Apple SD Gothic Neo',sans-serif", display: "flex", flexDirection: "column" }}>
      {/* Header */}
      <div style={{ background: `linear-gradient(135deg,${C.surface},#0d1529)`, borderBottom: `1px solid ${C.border}`, padding: "13px 20px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 32, height: 32, borderRadius: 9, background: `linear-gradient(135deg,${C.gold},${C.goldLight})`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15 }}>💰</div>
          <div>
            <div style={{ fontWeight: 800, fontSize: 14, color: "#fff" }}>WealthAI <span style={{ color: C.gold }}>Private</span></div>
            <div style={{ fontSize: 10, color: C.muted }}>월드클래스 부채관리 시스템</div>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <button onClick={() => { if (confirm("API 키를 변경하시겠어요?")) { localStorage.removeItem("wealthai_apikey"); setApiKey(null); }}}
            style={{ background: "none", border: `1px solid ${C.border}`, borderRadius: 8, padding: "4px 10px", color: C.muted, fontSize: 11, cursor: "pointer" }}>
            🔑 API키
          </button>
          <div style={{ display: "flex", alignItems: "center", gap: 6, background: debtRatio > 50 ? "#ef444420" : debtRatio > 30 ? "#f59e0b20" : "#22c55e20", border: `1px solid ${debtRatio > 50 ? C.red : debtRatio > 30 ? "#f59e0b" : C.green}40`, borderRadius: 20, padding: "4px 11px" }}>
            <div style={{ width: 6, height: 6, borderRadius: "50%", background: debtRatio > 50 ? C.red : debtRatio > 30 ? "#f59e0b" : C.green }} />
            <span style={{ fontSize: 11, fontWeight: 600, color: debtRatio > 50 ? C.red : debtRatio > 30 ? "#f59e0b" : C.green }}>
              부채비율 {debtRatio}% {debtRatio > 50 ? "⚠️" : debtRatio > 30 ? "⚡" : "✅"}
            </span>
          </div>
        </div>
      </div>

      <div style={{ display: "flex", flex: 1, overflow: "hidden", height: "calc(100vh - 62px)" }}>
        {/* Left Panel */}
        <div style={{ width: 340, minWidth: 280, background: C.surface, borderRight: `1px solid ${C.border}`, display: "flex", flexDirection: "column", overflow: "hidden" }}>
          <div style={{ padding: "14px 14px 0" }}>
            <div style={{ display: "flex", gap: 7, marginBottom: 7 }}>
              <StatCard label="월 수령액" value={formatKRW(salary)} icon="💼" color={C.goldLight} />
              <StatCard label="월납부총액" value={formatKRW(totalMonthly)} icon="💳" color={C.red} />
            </div>
            <div style={{ display: "flex", gap: 7, marginBottom: 12 }}>
              <StatCard label="총부채" value={formatKRW(totalDebt)} icon="🏦" color="#f59e0b" />
              <StatCard label="월잔여" value={formatKRW(remaining)} icon="✨" color={remaining < 0 ? C.red : remaining < 300000 ? "#f59e0b" : C.green} />
            </div>
            <div style={{ background: C.card, borderRadius: 12, padding: "11px 13px", border: `1px solid ${C.border}`, marginBottom: 10 }}>
              <div style={{ fontSize: 10, color: C.muted, marginBottom: 5 }}>월 수령액 조정</div>
              <input type="range" min={1000000} max={10000000} step={100000} value={salary}
                onChange={e => setSalary(Number(e.target.value))}
                style={{ width: "100%", accentColor: C.gold, marginBottom: 3 }} />
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11 }}>
                <span style={{ color: C.muted }}>100만</span>
                <span style={{ color: C.goldLight, fontWeight: 700 }}>{formatKRW(salary)}</span>
                <span style={{ color: C.muted }}>1,000만</span>
              </div>
            </div>
            <GaugeBar value={totalMonthly} max={salary} color={debtRatio > 50 ? C.red : C.gold} />
            <div style={{ fontSize: 10, color: C.muted, marginTop: 4, marginBottom: 12 }}>월급의 {debtRatio}% 납부 중</div>
          </div>

          <div style={{ display: "flex", borderBottom: `1px solid ${C.border}`, paddingLeft: 14 }}>
            {["대출", "카드", "일정"].map(t => (
              <button key={t} onClick={() => setActiveTab(t)} style={{ background: "none", border: "none", cursor: "pointer", padding: "8px 12px", fontSize: 13, fontWeight: 600, color: activeTab === t ? C.goldLight : C.muted, borderBottom: activeTab === t ? `2px solid ${C.gold}` : "2px solid transparent" }}>{t}</button>
            ))}
          </div>

          <div style={{ flex: 1, overflowY: "auto", padding: "12px 14px" }}>
            {activeTab === "대출" && (
              <>
                {loans.map(loan => (
                  <div key={loan.id} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: 12, marginBottom: 10 }}>
                    {editingLoan === loan.id ? (
                      <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
                        {[["대출명","name","text"],["잔액(원)","balance","number"],["월납부(원)","monthly","number"],["금리(%)","rate","number"],["납부일","dueDay","number"]].map(([lbl,key,tp]) => (
                          <div key={key} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <span style={{ fontSize: 11, color: C.muted, width: 64, flexShrink: 0 }}>{lbl}</span>
                            <input type={tp} value={loan[key]} style={IS}
                              onChange={e => setLoans(p => p.map(l => l.id === loan.id ? { ...l, [key]: tp === "number" ? Number(e.target.value) : e.target.value } : l))} />
                          </div>
                        ))}
                        <button onClick={() => setEditingLoan(null)} style={{ background: C.gold, border: "none", borderRadius: 8, padding: "6px", color: "#000", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>저장 ✓</button>
                      </div>
                    ) : (
                      <>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 7 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                            <span style={{ fontSize: 13, fontWeight: 700 }}>{loan.name}</span>
                            <span style={{ fontSize: 10, background: "#f59e0b20", color: "#f59e0b", borderRadius: 4, padding: "1px 5px" }}>{loan.rate}%</span>
                          </div>
                          <div style={{ display: "flex", gap: 4 }}>
                            <button onClick={() => setEditingLoan(loan.id)} style={{ background: "none", border: `1px solid ${C.border}`, borderRadius: 5, padding: "2px 7px", color: C.muted, fontSize: 11, cursor: "pointer" }}>편집</button>
                            <button onClick={() => setLoans(p => p.filter(l => l.id !== loan.id))} style={{ background: "none", border: `1px solid ${C.red}40`, borderRadius: 5, padding: "2px 7px", color: C.red, fontSize: 11, cursor: "pointer" }}>삭제</button>
                          </div>
                        </div>
                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: C.muted, marginBottom: 7 }}>
                          <span>잔액 <b style={{ color: C.text }}>{formatKRW(loan.balance)}</b></span>
                          <span>월 <b style={{ color: C.red }}>{formatKRW(loan.monthly)}</b></span>
                          <span>매월 {loan.dueDay}일</span>
                        </div>
                        <GaugeBar value={loan.monthly} max={totalMonthly} color={C.accent} />
                      </>
                    )}
                  </div>
                ))}
                <button onClick={() => { const id = Date.now(); setLoans(p => [...p, { id, name: "새 대출", balance: 0, monthly: 0, rate: 5.0, dueDay: 15 }]); setEditingLoan(id); }}
                  style={{ width: "100%", background: "none", border: `1px dashed ${C.border}`, borderRadius: 12, padding: "9px", color: C.muted, fontSize: 13, cursor: "pointer" }}>
                  + 대출 추가
                </button>
              </>
            )}
            {activeTab === "카드" && (
              <>
                {cards.map(card => (
                  <div key={card.id} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: 12, marginBottom: 10 }}>
                    {editingCard === card.id ? (
                      <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
                        {[["카드명","name","text"],["청구액(원)","amount","number"],["결제일","dueDay","number"]].map(([lbl,key,tp]) => (
                          <div key={key} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <span style={{ fontSize: 11, color: C.muted, width: 64, flexShrink: 0 }}>{lbl}</span>
                            <input type={tp} value={card[key]} style={IS}
                              onChange={e => setCards(p => p.map(c => c.id === card.id ? { ...c, [key]: tp === "number" ? Number(e.target.value) : e.target.value } : c))} />
                          </div>
                        ))}
                        <button onClick={() => setEditingCard(null)} style={{ background: C.gold, border: "none", borderRadius: 8, padding: "6px", color: "#000", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>저장 ✓</button>
                      </div>
                    ) : (
                      <>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 7 }}>
                          <span style={{ fontSize: 13, fontWeight: 700 }}>💳 {card.name}</span>
                          <div style={{ display: "flex", gap: 4 }}>
                            <button onClick={() => setEditingCard(card.id)} style={{ background: "none", border: `1px solid ${C.border}`, borderRadius: 5, padding: "2px 7px", color: C.muted, fontSize: 11, cursor: "pointer" }}>편집</button>
                            <button onClick={() => setCards(p => p.filter(c => c.id !== card.id))} style={{ background: "none", border: `1px solid ${C.red}40`, borderRadius: 5, padding: "2px 7px", color: C.red, fontSize: 11, cursor: "pointer" }}>삭제</button>
                          </div>
                        </div>
                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: C.muted }}>
                          <span>청구액 <b style={{ color: C.red }}>{formatKRW(card.amount)}</b></span>
                          <span>결제일 매월 {card.dueDay}일</span>
                        </div>
                      </>
                    )}
                  </div>
                ))}
                <button onClick={() => { const id = Date.now(); setCards(p => [...p, { id, name: "새 카드", amount: 0, dueDay: 15 }]); setEditingCard(id); }}
                  style={{ width: "100%", background: "none", border: `1px dashed ${C.border}`, borderRadius: 12, padding: "9px", color: C.muted, fontSize: 13, cursor: "pointer" }}>
                  + 카드 추가
                </button>
              </>
            )}
            {activeTab === "일정" && (
              <>
                <div style={{ fontSize: 11, color: C.muted, marginBottom: 10 }}>오늘 {today}일 기준 납부 순서</div>
                {upcoming.map((item, i) => {
                  const daysLeft = item.day >= today ? item.day - today : item.day + 30 - today;
                  const isUrgent = daysLeft <= 3;
                  return (
                    <div key={i} style={{ background: C.card, border: `1px solid ${isUrgent ? C.red + "50" : C.border}`, borderRadius: 12, padding: "11px 13px", marginBottom: 8, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 600 }}>{item.name}</div>
                        <div style={{ fontSize: 10, color: C.muted, marginTop: 2 }}>
                          <span style={{ background: item.type === "대출" ? "#3b82f620" : "#8b5cf620", color: item.type === "대출" ? C.accent : "#a78bfa", padding: "1px 5px", borderRadius: 4, marginRight: 5 }}>{item.type}</span>
                          매월 {item.day}일
                        </div>
                      </div>
                      <div style={{ textAlign: "right" }}>
                        <div style={{ fontSize: 13, fontWeight: 700, color: C.red }}>{formatKRW(item.amount)}</div>
                        <div style={{ fontSize: 10, color: isUrgent ? C.red : C.muted, marginTop: 2 }}>{daysLeft === 0 ? "🔴 오늘!" : `D-${daysLeft}`}</div>
                      </div>
                    </div>
                  );
                })}
              </>
            )}
          </div>
        </div>

        {/* Chat Panel */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
          <div style={{ padding: "12px 20px", borderBottom: `1px solid ${C.border}`, background: C.surface }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: C.goldLight }}>🤖 AI 자산관리 어드바이저</div>
            <div style={{ fontSize: 10, color: C.muted }}>{apiKey ? "AI 연결됨 · 입력 데이터 기반 실시간 분석" : "⚠️ API 키 없음 · 대시보드만 사용 중"}</div>
          </div>
          <div style={{ flex: 1, overflowY: "auto", padding: "18px 20px", display: "flex", flexDirection: "column", gap: 12 }}>
            {messages.map((msg, i) => (
              <div key={i} style={{ display: "flex", justifyContent: msg.role === "user" ? "flex-end" : "flex-start" }}>
                {msg.role === "assistant" && (
                  <div style={{ width: 28, height: 28, borderRadius: 8, flexShrink: 0, marginRight: 9, background: `linear-gradient(135deg,${C.gold},${C.goldLight})`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12 }}>🤖</div>
                )}
                <div style={{ maxWidth: "75%", background: msg.role === "user" ? `linear-gradient(135deg,${C.accent},#2563eb)` : C.card, border: `1px solid ${msg.role === "user" ? "transparent" : C.border}`, borderRadius: msg.role === "user" ? "16px 16px 4px 16px" : "16px 16px 16px 4px", padding: "10px 14px", fontSize: 13, lineHeight: 1.65, whiteSpace: "pre-wrap" }}>
                  {msg.content}
                </div>
              </div>
            ))}
            {loading && (
              <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
                <div style={{ width: 28, height: 28, borderRadius: 8, background: `linear-gradient(135deg,${C.gold},${C.goldLight})`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12 }}>🤖</div>
                <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: "16px 16px 16px 4px", padding: "12px 16px", display: "flex", gap: 5 }}>
                  {[0,1,2].map(j => <div key={j} style={{ width: 7, height: 7, borderRadius: "50%", background: C.gold, animation: `bounce 1.2s ease-in-out ${j*0.2}s infinite` }} />)}
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>
          <div style={{ padding: "0 20px 10px", display: "flex", gap: 7, flexWrap: "wrap" }}>
            {["우선 갚아야 할 빚은?", "이번달 절약 포인트", "고금리부터 갚는 전략", "비상금 얼마 필요해?"].map(q => (
              <button key={q} onClick={() => setInput(q)}
                style={{ background: "none", border: `1px solid ${C.border}`, borderRadius: 20, padding: "4px 11px", color: C.muted, fontSize: 11, cursor: "pointer" }}>
                {q}
              </button>
            ))}
          </div>
          <div style={{ padding: "12px 20px", borderTop: `1px solid ${C.border}`, background: C.surface, display: "flex", gap: 9 }}>
            <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === "Enter" && sendMessage()}
              placeholder={apiKey ? "재무 상황을 물어보세요... (Enter)" : "API 키를 설정하면 AI와 대화할 수 있어요"}
              style={{ flex: 1, background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: "11px 15px", color: C.text, fontSize: 13, outline: "none" }} />
            <button onClick={sendMessage} disabled={loading || !input.trim()}
              style={{ background: loading ? C.border : `linear-gradient(135deg,${C.gold},${C.goldLight})`, border: "none", borderRadius: 12, padding: "11px 18px", color: "#000", fontWeight: 700, fontSize: 13, cursor: loading ? "not-allowed" : "pointer" }}>
              전송 →
            </button>
          </div>
        </div>
      </div>
      <style>{`@keyframes bounce{0%,80%,100%{transform:translateY(0)}40%{transform:translateY(-7px)}}`}</style>
    </div>
  );
}

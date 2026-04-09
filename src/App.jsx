import { useState, useEffect } from "react";

const C = {
  bg:"#0a0e1a", surface:"#111827", card:"#151e2e", border:"#1e2d45",
  gold:"#c9a84c", goldLight:"#e8c97a", accent:"#3b82f6",
  red:"#ef4444", green:"#22c55e", yellow:"#f59e0b",
  text:"#e2e8f0", muted:"#64748b", white:"#ffffff",
};

const KEY = "wai2";
function ld(k,fb){ try{ const v=localStorage.getItem(k); return v?JSON.parse(v):fb; }catch{ return fb; } }
function sv(k,v){ try{ localStorage.setItem(k,JSON.stringify(v)); }catch{} }

function won(n){
  if(!n&&n!==0) return "0원";
  const abs=Math.abs(n);
  const sign=n<0?"-":"";
  if(abs>=100000000) return `${sign}${(abs/100000000).toFixed(1)}억`;
  if(abs>=10000) return `${sign}${Math.floor(abs/10000).toLocaleString()}만원`;
  return `${sign}${abs.toLocaleString()}원`;
}

function Bar({value,max,color}){
  const pct=Math.min((value/(max||1))*100,100);
  return(
    <div style={{background:"#1a2540",borderRadius:8,height:7,overflow:"hidden"}}>
      <div style={{width:`${pct}%`,height:"100%",background:`linear-gradient(90deg,${color}77,${color})`,borderRadius:8,transition:"width .5s ease"}}/>
    </div>
  );
}

function NumInput({value,onChange,placeholder}){
  const [raw,setRaw]=useState(value===0?"":String(value));
  useEffect(()=>{ if(document.activeElement?.dataset?.numinput!=="1") setRaw(value===0?"":String(value)); },[value]);
  return(
    <input data-numinput="1" type="number" value={raw} placeholder={placeholder||"0"}
      onChange={e=>{ setRaw(e.target.value); onChange(Number(e.target.value)||0); }}
      style={{flex:1,background:"#0a0e1a",border:`1px solid ${C.border}`,borderRadius:6,padding:"5px 8px",color:C.text,fontSize:13,outline:"none"}}/>
  );
}

const DEFAULT_INCOME=[
  {id:1,name:"기본급",amount:3000000},
  {id:2,name:"식비",amount:200000},
  {id:3,name:"교통비",amount:100000},
];
const DEFAULT_LOANS=[
  {id:1,name:"신용대출",balance:15000000,monthly:350000,rate:6.5,dueDay:15},
  {id:2,name:"카드론",balance:5000000,monthly:200000,rate:12.5,dueDay:20},
];
const DEFAULT_CARDS=[
  {id:1,name:"신한카드",amount:800000,dueDay:14},
  {id:2,name:"국민카드",amount:450000,dueDay:21},
];

export default function App(){
  const [income,setIncome]=useState(()=>ld(`${KEY}_income`,DEFAULT_INCOME));
  const [loans,setLoans]=useState(()=>ld(`${KEY}_loans`,DEFAULT_LOANS));
  const [cards,setCards]=useState(()=>ld(`${KEY}_cards`,DEFAULT_CARDS));
  const [tab,setTab]=useState("수입");
  const [editL,setEditL]=useState(null);
  const [editC,setEditC]=useState(null);
  const [editI,setEditI]=useState(null);

  useEffect(()=>sv(`${KEY}_income`,income),[income]);
  useEffect(()=>sv(`${KEY}_loans`,loans),[loans]);
  useEffect(()=>sv(`${KEY}_cards`,cards),[cards]);

  const totalIncome=income.reduce((s,i)=>s+i.amount,0);
  const totalLoanMonthly=loans.reduce((s,l)=>s+l.monthly,0);
  const totalCardMonthly=cards.reduce((s,c)=>s+c.amount,0);
  const totalMonthly=totalLoanMonthly+totalCardMonthly;
  const totalDebt=loans.reduce((s,l)=>s+l.balance,0);
  const remaining=totalIncome-totalMonthly;
  const debtRatio=Math.round((totalMonthly/(totalIncome||1))*100);
  const today=new Date().getDate();

  const statusColor=debtRatio>50?C.red:debtRatio>30?C.yellow:C.green;
  const statusText=debtRatio>50?"⚠️ 위험":debtRatio>30?"⚡ 주의":"✅ 양호";

  const upcoming=[
    ...loans.map(l=>({name:l.name,amount:l.monthly,day:l.dueDay,type:"대출"})),
    ...cards.map(c=>({name:c.name,amount:c.amount,day:c.dueDay,type:"카드"}))
  ].sort((a,b)=>{
    const da=a.day>=today?a.day-today:a.day+30-today;
    const db=b.day>=today?b.day-today:b.day+30-today;
    return da-db;
  });

  const IS={flex:1,background:"#0a0e1a",border:`1px solid ${C.border}`,borderRadius:6,padding:"5px 8px",color:C.text,fontSize:13,outline:"none"};
  const BtnSm=(props)=>(
    <button {...props} style={{background:"none",border:`1px solid ${C.border}`,borderRadius:5,padding:"2px 8px",color:C.muted,fontSize:11,cursor:"pointer",...props.style}}/>
  );
  const BtnDel=(props)=>(
    <button {...props} style={{background:"none",border:`1px solid ${C.red}40`,borderRadius:5,padding:"2px 8px",color:C.red,fontSize:11,cursor:"pointer"}}/>
  );

  return(
    <div style={{minHeight:"100vh",background:C.bg,color:C.text,fontFamily:"'Apple SD Gothic Neo',Pretendard,sans-serif",display:"flex",flexDirection:"column"}}>

      {/* ── Header ── */}
      <div style={{background:`linear-gradient(135deg,${C.surface},#0d1529)`,borderBottom:`1px solid ${C.border}`,padding:"13px 22px",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          <div style={{width:32,height:32,borderRadius:9,background:`linear-gradient(135deg,${C.gold},${C.goldLight})`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:15}}>💰</div>
          <div>
            <div style={{fontWeight:800,fontSize:14,color:C.white}}>WealthAI <span style={{color:C.gold}}>Private</span></div>
            <div style={{fontSize:10,color:C.muted}}>개인 부채관리 대시보드 · 무료버전</div>
          </div>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:8,background:`${statusColor}18`,border:`1px solid ${statusColor}40`,borderRadius:20,padding:"5px 14px"}}>
          <div style={{width:7,height:7,borderRadius:"50%",background:statusColor}}/>
          <span style={{fontSize:12,fontWeight:700,color:statusColor}}>부채비율 {debtRatio}% {statusText}</span>
        </div>
      </div>

      {/* ── 요약 카드 ── */}
      <div style={{display:"flex",gap:10,padding:"16px 20px 0",flexWrap:"wrap"}}>
        {[
          {label:"총 월수입",value:won(totalIncome),color:C.goldLight,icon:"💼"},
          {label:"월 납부총액",value:won(totalMonthly),color:C.red,icon:"💳"},
          {label:"월 잔여",value:won(remaining),color:remaining<0?C.red:remaining<300000?C.yellow:C.green,icon:"✨"},
          {label:"총 부채잔액",value:won(totalDebt),color:C.yellow,icon:"🏦"},
        ].map(({label,value,color,icon})=>(
          <div key={label} style={{flex:"1 1 160px",background:C.card,border:`1px solid ${C.border}`,borderRadius:16,padding:"16px 18px",position:"relative",overflow:"hidden"}}>
            <div style={{position:"absolute",top:-8,right:-8,fontSize:46,opacity:0.05}}>{icon}</div>
            <div style={{fontSize:10,color:C.muted,letterSpacing:"0.1em",textTransform:"uppercase",marginBottom:5}}>{label}</div>
            <div style={{fontSize:20,fontWeight:800,color,letterSpacing:-0.5}}>{value}</div>
          </div>
        ))}
      </div>

      {/* ── 게이지 ── */}
      <div style={{padding:"14px 20px 0"}}>
        <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:14,padding:"14px 16px"}}>
          <div style={{display:"flex",justifyContent:"space-between",fontSize:12,marginBottom:8}}>
            <span style={{color:C.muted}}>납부액 비율</span>
            <span style={{color:statusColor,fontWeight:700}}>{won(totalMonthly)} / {won(totalIncome)}</span>
          </div>
          <Bar value={totalMonthly} max={totalIncome} color={statusColor}/>
          <div style={{display:"flex",gap:14,marginTop:10}}>
            <div style={{flex:1,textAlign:"center"}}>
              <div style={{fontSize:10,color:C.muted,marginBottom:3}}>대출 납부</div>
              <Bar value={totalLoanMonthly} max={totalIncome} color={C.accent}/>
              <div style={{fontSize:11,color:C.accent,fontWeight:600,marginTop:3}}>{won(totalLoanMonthly)}</div>
            </div>
            <div style={{flex:1,textAlign:"center"}}>
              <div style={{fontSize:10,color:C.muted,marginBottom:3}}>카드 납부</div>
              <Bar value={totalCardMonthly} max={totalIncome} color="#a78bfa"/>
              <div style={{fontSize:11,color:"#a78bfa",fontWeight:600,marginTop:3}}>{won(totalCardMonthly)}</div>
            </div>
            <div style={{flex:1,textAlign:"center"}}>
              <div style={{fontSize:10,color:C.muted,marginBottom:3}}>잔여</div>
              <Bar value={Math.max(remaining,0)} max={totalIncome} color={C.green}/>
              <div style={{fontSize:11,color:remaining<0?C.red:C.green,fontWeight:600,marginTop:3}}>{won(remaining)}</div>
            </div>
          </div>
        </div>
      </div>

      {/* ── 탭 ── */}
      <div style={{display:"flex",borderBottom:`1px solid ${C.border}`,margin:"16px 20px 0",paddingBottom:0}}>
        {["수입","대출","카드","일정"].map(t=>(
          <button key={t} onClick={()=>setTab(t)} style={{background:"none",border:"none",cursor:"pointer",padding:"9px 16px",fontSize:13,fontWeight:600,color:tab===t?C.goldLight:C.muted,borderBottom:tab===t?`2px solid ${C.gold}`:"2px solid transparent"}}>
            {t==="수입"?"💼 수입":t==="대출"?"🏦 대출":t==="카드"?"💳 카드":"📅 일정"}
          </button>
        ))}
      </div>

      {/* ── 탭 콘텐츠 ── */}
      <div style={{flex:1,overflowY:"auto",padding:"14px 20px 24px"}}>

        {/* 수입 탭 */}
        {tab==="수입"&&(
          <div style={{maxWidth:600}}>
            <div style={{fontSize:12,color:C.muted,marginBottom:12}}>급여·수당 항목을 입력하세요. 모두 합산해서 월수입을 계산합니다.</div>
            {income.map(item=>(
              <div key={item.id} style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:12,padding:13,marginBottom:10}}>
                {editI===item.id?(
                  <div style={{display:"flex",flexDirection:"column",gap:7}}>
                    {[["항목명","name","text"],["금액(원)","amount","number"]].map(([lbl,key,tp])=>(
                      <div key={key} style={{display:"flex",alignItems:"center",gap:8}}>
                        <span style={{fontSize:11,color:C.muted,width:60,flexShrink:0}}>{lbl}</span>
                        {tp==="number"
                          ?<NumInput value={item[key]} onChange={v=>setIncome(p=>p.map(i=>i.id===item.id?{...i,[key]:v}:i))}/>
                          :<input type="text" value={item[key]} style={IS} onChange={e=>setIncome(p=>p.map(i=>i.id===item.id?{...i,[key]:e.target.value}:i))}/>
                        }
                      </div>
                    ))}
                    <button onClick={()=>setEditI(null)} style={{background:C.gold,border:"none",borderRadius:8,padding:"6px",color:"#000",fontSize:12,fontWeight:700,cursor:"pointer"}}>저장 ✓</button>
                  </div>
                ):(
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                    <div style={{display:"flex",alignItems:"center",gap:8}}>
                      <span style={{fontSize:13,fontWeight:700}}>{item.name}</span>
                    </div>
                    <div style={{display:"flex",alignItems:"center",gap:12}}>
                      <span style={{fontSize:15,fontWeight:800,color:C.green}}>{won(item.amount)}</span>
                      <BtnSm onClick={()=>setEditI(item.id)}>편집</BtnSm>
                      <BtnDel onClick={()=>setIncome(p=>p.filter(i=>i.id!==item.id))}>삭제</BtnDel>
                    </div>
                  </div>
                )}
              </div>
            ))}
            <div style={{background:C.card,border:`1px solid ${C.gold}40`,borderRadius:12,padding:"12px 16px",marginBottom:14,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
              <span style={{fontSize:13,color:C.muted,fontWeight:600}}>월 총수입</span>
              <span style={{fontSize:20,fontWeight:800,color:C.goldLight}}>{won(totalIncome)}</span>
            </div>
            <button onClick={()=>{const id=Date.now();setIncome(p=>[...p,{id,name:"새 수당",amount:0}]);setEditI(id);}}
              style={{width:"100%",background:"none",border:`1px dashed ${C.border}`,borderRadius:12,padding:"10px",color:C.muted,fontSize:13,cursor:"pointer"}}>
              + 수당 항목 추가
            </button>
          </div>
        )}

        {/* 대출 탭 */}
        {tab==="대출"&&(
          <div style={{maxWidth:600}}>
            {loans.map(loan=>(
              <div key={loan.id} style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:12,padding:13,marginBottom:10}}>
                {editL===loan.id?(
                  <div style={{display:"flex",flexDirection:"column",gap:7}}>
                    {[["대출명","name","text"],["잔액(원)","balance","number"],["월납부(원)","monthly","number"],["금리(%)","rate","number"],["납부일","dueDay","number"]].map(([lbl,key,tp])=>(
                      <div key={key} style={{display:"flex",alignItems:"center",gap:8}}>
                        <span style={{fontSize:11,color:C.muted,width:68,flexShrink:0}}>{lbl}</span>
                        {tp==="number"
                          ?<NumInput value={loan[key]} onChange={v=>setLoans(p=>p.map(l=>l.id===loan.id?{...l,[key]:v}:l))}/>
                          :<input type="text" value={loan[key]} style={IS} onChange={e=>setLoans(p=>p.map(l=>l.id===loan.id?{...l,[key]:e.target.value}:l))}/>
                        }
                      </div>
                    ))}
                    <button onClick={()=>setEditL(null)} style={{background:C.gold,border:"none",borderRadius:8,padding:"6px",color:"#000",fontSize:12,fontWeight:700,cursor:"pointer"}}>저장 ✓</button>
                  </div>
                ):(
                  <>
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
                      <div style={{display:"flex",alignItems:"center",gap:7}}>
                        <span style={{fontSize:13,fontWeight:700}}>{loan.name}</span>
                        <span style={{fontSize:10,background:"#f59e0b20",color:C.yellow,borderRadius:4,padding:"1px 6px"}}>{loan.rate}%</span>
                      </div>
                      <div style={{display:"flex",gap:5}}>
                        <BtnSm onClick={()=>setEditL(loan.id)}>편집</BtnSm>
                        <BtnDel onClick={()=>setLoans(p=>p.filter(l=>l.id!==loan.id))}>삭제</BtnDel>
                      </div>
                    </div>
                    <div style={{display:"flex",justifyContent:"space-between",fontSize:11,color:C.muted,marginBottom:8}}>
                      <span>잔액 <b style={{color:C.text}}>{won(loan.balance)}</b></span>
                      <span>월납부 <b style={{color:C.red}}>{won(loan.monthly)}</b></span>
                      <span>매월 {loan.dueDay}일</span>
                    </div>
                    <Bar value={loan.monthly} max={totalMonthly} color={C.accent}/>
                    <div style={{fontSize:10,color:C.muted,marginTop:4}}>
                      예상 완납까지 약 {loan.monthly>0?Math.ceil(loan.balance/loan.monthly):"∞"}개월
                    </div>
                  </>
                )}
              </div>
            ))}
            <button onClick={()=>{const id=Date.now();setLoans(p=>[...p,{id,name:"새 대출",balance:0,monthly:0,rate:5.0,dueDay:15}]);setEditL(id);}}
              style={{width:"100%",background:"none",border:`1px dashed ${C.border}`,borderRadius:12,padding:"10px",color:C.muted,fontSize:13,cursor:"pointer"}}>
              + 대출 추가
            </button>
          </div>
        )}

        {/* 카드 탭 */}
        {tab==="카드"&&(
          <div style={{maxWidth:600}}>
            {cards.map(card=>(
              <div key={card.id} style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:12,padding:13,marginBottom:10}}>
                {editC===card.id?(
                  <div style={{display:"flex",flexDirection:"column",gap:7}}>
                    {[["카드명","name","text"],["청구액(원)","amount","number"],["결제일","dueDay","number"]].map(([lbl,key,tp])=>(
                      <div key={key} style={{display:"flex",alignItems:"center",gap:8}}>
                        <span style={{fontSize:11,color:C.muted,width:68,flexShrink:0}}>{lbl}</span>
                        {tp==="number"
                          ?<NumInput value={card[key]} onChange={v=>setCards(p=>p.map(c=>c.id===card.id?{...c,[key]:v}:c))}/>
                          :<input type="text" value={card[key]} style={IS} onChange={e=>setCards(p=>p.map(c=>c.id===card.id?{...c,[key]:e.target.value}:c))}/>
                        }
                      </div>
                    ))}
                    <button onClick={()=>setEditC(null)} style={{background:C.gold,border:"none",borderRadius:8,padding:"6px",color:"#000",fontSize:12,fontWeight:700,cursor:"pointer"}}>저장 ✓</button>
                  </div>
                ):(
                  <>
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:7}}>
                      <span style={{fontSize:13,fontWeight:700}}>💳 {card.name}</span>
                      <div style={{display:"flex",gap:5}}>
                        <BtnSm onClick={()=>setEditC(card.id)}>편집</BtnSm>
                        <BtnDel onClick={()=>setCards(p=>p.filter(c=>c.id!==card.id))}>삭제</BtnDel>
                      </div>
                    </div>
                    <div style={{display:"flex",justifyContent:"space-between",fontSize:11,color:C.muted}}>
                      <span>청구액 <b style={{color:C.red}}>{won(card.amount)}</b></span>
                      <span>결제일 매월 {card.dueDay}일</span>
                    </div>
                  </>
                )}
              </div>
            ))}
            <button onClick={()=>{const id=Date.now();setCards(p=>[...p,{id,name:"새 카드",amount:0,dueDay:15}]);setEditC(id);}}
              style={{width:"100%",background:"none",border:`1px dashed ${C.border}`,borderRadius:12,padding:"10px",color:C.muted,fontSize:13,cursor:"pointer"}}>
              + 카드 추가
            </button>
          </div>
        )}

        {/* 일정 탭 */}
        {tab==="일정"&&(
          <div style={{maxWidth:600}}>
            <div style={{fontSize:12,color:C.muted,marginBottom:12}}>오늘 {today}일 기준 · 가까운 납부일 순서</div>
            {upcoming.length===0&&<div style={{color:C.muted,fontSize:13,textAlign:"center",padding:"40px 0"}}>납부 일정이 없어요</div>}
            {upcoming.map((item,i)=>{
              const daysLeft=item.day>=today?item.day-today:item.day+30-today;
              const isToday=daysLeft===0;
              const isUrgent=daysLeft<=3;
              return(
                <div key={i} style={{background:C.card,border:`1px solid ${isUrgent?C.red+"50":C.border}`,borderRadius:12,padding:"13px 16px",marginBottom:10,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                  <div>
                    <div style={{fontSize:14,fontWeight:700,marginBottom:4}}>{item.name}</div>
                    <div style={{display:"flex",alignItems:"center",gap:6}}>
                      <span style={{fontSize:10,background:item.type==="대출"?"#3b82f620":"#8b5cf620",color:item.type==="대출"?C.accent:"#a78bfa",padding:"1px 6px",borderRadius:4}}>{item.type}</span>
                      <span style={{fontSize:11,color:C.muted}}>매월 {item.day}일</span>
                    </div>
                  </div>
                  <div style={{textAlign:"right"}}>
                    <div style={{fontSize:16,fontWeight:800,color:C.red,marginBottom:4}}>{won(item.amount)}</div>
                    <div style={{fontSize:12,fontWeight:700,color:isToday?C.red:isUrgent?C.yellow:C.muted}}>
                      {isToday?"🔴 오늘!":isUrgent?`⚡ D-${daysLeft}`:`D-${daysLeft}`}
                    </div>
                  </div>
                </div>
              );
            })}
            {/* 이달 납부 요약 */}
            <div style={{background:C.card,border:`1px solid ${C.gold}30`,borderRadius:12,padding:"14px 16px",marginTop:6}}>
              <div style={{fontSize:11,color:C.muted,marginBottom:10}}>이달 납부 요약</div>
              <div style={{display:"flex",justifyContent:"space-between",marginBottom:6}}>
                <span style={{fontSize:12,color:C.muted}}>대출 합계</span>
                <span style={{fontSize:13,fontWeight:700,color:C.accent}}>{won(totalLoanMonthly)}</span>
              </div>
              <div style={{display:"flex",justifyContent:"space-between",marginBottom:10}}>
                <span style={{fontSize:12,color:C.muted}}>카드 합계</span>
                <span style={{fontSize:13,fontWeight:700,color:"#a78bfa"}}>{won(totalCardMonthly)}</span>
              </div>
              <div style={{borderTop:`1px solid ${C.border}`,paddingTop:10,display:"flex",justifyContent:"space-between"}}>
                <span style={{fontSize:13,fontWeight:700,color:C.text}}>총 납부</span>
                <span style={{fontSize:16,fontWeight:800,color:C.red}}>{won(totalMonthly)}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

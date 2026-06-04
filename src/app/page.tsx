import Link from 'next/link'

export default function LandingPage() {
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;500;600;700;800&family=DM+Sans:ital,wght@0,300;0,400;0,500;1,300&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        :root {
          --black: #050508; --white: #f8f7f4; --blue: #2461ff; --blue-dim: #1a45cc;
          --blue-glow: rgba(36,97,255,0.15); --surface: #0d0d14; --surface2: #13131e;
          --border: rgba(255,255,255,0.07); --text: #e8e6f0; --muted: #7a788a; --green: #00e5a0;
        }
        .landing { font-family: 'DM Sans', sans-serif; background: var(--black); color: var(--text); overflow-x: hidden; line-height: 1.6; }
        .landing nav { position: fixed; top: 0; left: 0; right: 0; z-index: 100; display: flex; align-items: center; justify-content: space-between; padding: 20px 60px; background: rgba(5,5,8,0.85); backdrop-filter: blur(20px); border-bottom: 1px solid var(--border); }
        .landing .nav-logo { font-family: 'Syne', sans-serif; font-size: 20px; font-weight: 800; letter-spacing: -0.5px; color: var(--text); text-decoration: none; }
        .landing .nav-logo span { color: var(--blue); }
        .landing .nav-links { display: flex; gap: 36px; }
        .landing .nav-links a { color: var(--muted); font-size: 14px; text-decoration: none; transition: color 0.2s; }
        .landing .nav-links a:hover { color: var(--text); }
        .landing .nav-cta { background: var(--blue); color: #fff; border: none; padding: 10px 24px; border-radius: 8px; font-size: 14px; font-weight: 500; cursor: pointer; text-decoration: none; transition: background 0.2s; }
        .landing .nav-cta:hover { background: var(--blue-dim); }
        .landing .hero { min-height: 100vh; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; padding: 120px 40px 80px; position: relative; overflow: hidden; }
        .landing .hero::before { content: ''; position: absolute; top: -200px; left: 50%; transform: translateX(-50%); width: 1000px; height: 1000px; background: radial-gradient(circle, rgba(36,97,255,0.15) 0%, rgba(0,229,160,0.05) 40%, transparent 70%); pointer-events: none; }        .landing .hero-badge { display: inline-flex; align-items: center; gap: 8px; background: rgba(36,97,255,0.1); border: 1px solid rgba(36,97,255,0.3); color: #7aa3ff; font-size: 13px; padding: 6px 16px; border-radius: 100px; margin-bottom: 32px; animation: fadeUp 0.6s ease both; }
        .landing .hero::after { content: ''; position: absolute; inset: 0; background-image: linear-gradient(rgba(36,97,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(36,97,255,0.03) 1px, transparent 1px); background-size: 60px 60px; pointer-events: none; mask-image: radial-gradient(ellipse at center, black 20%, transparent 80%); }
        .landing .hero-badge::before { content: ''; width: 6px; height: 6px; background: var(--blue); border-radius: 50%; animation: pulse 2s infinite; }
        @keyframes pulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.5;transform:scale(1.3)} }
        @keyframes fadeUp { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
        @keyframes floatUp { 0%{opacity:0;transform:translateY(20px)} 100%{opacity:1;transform:translateY(0)} }
        .landing .hero [style*="opacity:0"] { animation-fill-mode: forwards !important; }
        .landing h1 { font-family: 'DM Sans', sans-serif; font-size: clamp(44px,6vw,80px); font-weight: 700; line-height: 1.1; letter-spacing: -1.5px; max-width: 900px; margin-bottom: 24px; animation: fadeUp 0.6s 0.1s ease both; }
        .landing h1 .accent { background: linear-gradient(135deg, #2461ff, #00e5a0); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; }
        .landing .hero p { font-size: 18px; color: var(--muted); max-width: 560px; line-height: 1.7; margin-bottom: 48px; animation: fadeUp 0.6s 0.2s ease both; font-weight: 300; }
        .landing .hero-actions { display: flex; gap: 16px; align-items: center; animation: fadeUp 0.6s 0.3s ease both; margin-bottom: 80px; }
        .landing .btn-primary { background: var(--blue); color: #fff; padding: 14px 32px; border-radius: 10px; font-size: 15px; font-weight: 500; text-decoration: none; display: inline-flex; align-items: center; gap: 8px; transition: all 0.2s; }
        .landing .btn-primary:hover { background: var(--blue-dim); transform: translateY(-2px); box-shadow: 0 8px 30px rgba(36,97,255,0.35); }
        .landing .btn-ghost { color: var(--muted); font-size: 15px; text-decoration: none; display: inline-flex; align-items: center; gap: 8px; transition: color 0.2s; }
        .landing .btn-ghost:hover { color: var(--text); }
        .landing .stats-bar { display: flex; border: 1px solid var(--border); border-radius: 16px; overflow: hidden; animation: fadeUp 0.6s 0.4s ease both; }
        .landing .stat-item { padding: 20px 40px; text-align: center; border-right: 1px solid var(--border); }
        .landing .stat-item:last-child { border-right: none; }
        .landing .stat-num { font-family: 'Syne', sans-serif; font-size: 32px; font-weight: 700; color: var(--white); letter-spacing: -1px; }
        .landing .stat-num span { color: var(--blue); }
        .landing .stat-label { font-size: 13px; color: var(--muted); margin-top: 4px; }
        .landing .section-eyebrow { font-size: 12px; letter-spacing: 0.1em; text-transform: uppercase; color: var(--blue); margin-bottom: 16px; font-weight: 500; }
        .landing .section-title { font-family: 'Syne', sans-serif; font-size: clamp(36px,4vw,54px); font-weight: 700; letter-spacing: -2px; line-height: 1.1; max-width: 600px; margin-bottom: 60px; }
        .landing .features-section { padding: 120px 60px; }
        .landing .features-grid { display: grid; grid-template-columns: repeat(3,1fr); gap: 1px; background: var(--border); border: 1px solid var(--border); border-radius: 20px; overflow: hidden; }
        .landing .feature-card { background: var(--surface); padding: 40px 36px; transition: background 0.3s; }
        .landing .feature-card:hover { background: var(--surface2); }
        .landing .feature-icon { width: 48px; height: 48px; background: var(--blue-glow); border: 1px solid rgba(36,97,255,0.2); border-radius: 12px; display: flex; align-items: center; justify-content: center; margin-bottom: 24px; font-size: 22px; }
        .landing .feature-title { font-family: 'Syne', sans-serif; font-size: 18px; font-weight: 700; margin-bottom: 12px; color: var(--white); }
        .landing .feature-desc { font-size: 14px; color: var(--muted); line-height: 1.7; font-weight: 300; }
        .landing .new-badge { display: inline-block; background: linear-gradient(135deg, #2461ff, #00e5a0); color: #fff; font-size: 10px; font-weight: 700; padding: 2px 8px; border-radius: 100px; margin-left: 8px; vertical-align: middle; letter-spacing: 0.05em; }
        .landing .how-section { padding: 120px 60px; background: var(--surface); border-top: 1px solid var(--border); border-bottom: 1px solid var(--border); }
        .landing .steps-grid { display: grid; grid-template-columns: repeat(4,1fr); position: relative; margin-top: 60px; }
        .landing .steps-grid::before { content: ''; position: absolute; top: 32px; left: 10%; width: 80%; height: 1px; background: linear-gradient(90deg, transparent, var(--blue), transparent); }
        .landing .step { padding: 0 24px; text-align: center; }
        .landing .step-num { width: 64px; height: 64px; border-radius: 50%; background: var(--black); border: 1px solid var(--border); display: flex; align-items: center; justify-content: center; font-family: 'Syne', sans-serif; font-size: 20px; font-weight: 700; color: var(--blue); margin: 0 auto 24px; position: relative; z-index: 1; transition: all 0.3s; }
        .landing .step:hover .step-num { background: var(--blue-glow); border-color: var(--blue); transform: scale(1.1); }
        .landing .step-title { font-family: 'Syne', sans-serif; font-size: 16px; font-weight: 600; margin-bottom: 10px; }
        .landing .step-desc { font-size: 13px; color: var(--muted); line-height: 1.6; font-weight: 300; }
        .landing .ai-section { padding: 120px 60px; position: relative; overflow: hidden; }
        .landing .ai-section::before { content: ''; position: absolute; top: 50%; left: 50%; transform: translate(-50%,-50%); width: 800px; height: 500px; background: radial-gradient(ellipse, rgba(36,97,255,0.08) 0%, transparent 70%); pointer-events: none; }
        .landing .ai-card { background: var(--surface); border: 1px solid var(--border); border-radius: 24px; padding: 48px; display: grid; grid-template-columns: 1fr 1fr; gap: 48px; align-items: center; position: relative; overflow: hidden; }
        .landing .ai-card::before { content: ''; position: absolute; top: 0; left: 0; right: 0; height: 1px; background: linear-gradient(90deg, transparent, var(--blue), transparent); }
        .landing .ai-chat-preview { background: var(--surface2); border: 1px solid var(--border); border-radius: 16px; padding: 20px; }
        .landing .chat-msg { margin-bottom: 12px; }
        .landing .chat-msg.user { display: flex; justify-content: flex-end; }
        .landing .chat-msg.ai { display: flex; justify-content: flex-start; }
        .landing .chat-bubble { max-width: 85%; padding: 10px 14px; border-radius: 12px; font-size: 13px; line-height: 1.5; }
        .landing .chat-bubble.user { background: var(--blue); color: #fff; border-bottom-right-radius: 4px; }
        .landing .chat-bubble.ai { background: #1a1a2e; color: var(--text); border-bottom-left-radius: 4px; border: 1px solid var(--border); }
        .landing .chat-input { display: flex; gap: 8px; margin-top: 12px; }
        .landing .chat-input-field { flex: 1; background: var(--black); border: 1px solid var(--border); border-radius: 8px; padding: 8px 12px; font-size: 12px; color: var(--muted); }
        .landing .chat-send { background: var(--blue); border: none; border-radius: 8px; padding: 8px 12px; color: #fff; font-size: 12px; cursor: pointer; }
        .landing .pricing-section { padding: 120px 60px; }
        .landing .pricing-grid { display: grid; grid-template-columns: repeat(3,1fr); gap: 24px; margin-top: 60px; max-width: 900px; margin-left: auto; margin-right: auto; }
        .landing .pricing-card { background: var(--surface); border: 1px solid var(--border); border-radius: 20px; padding: 36px 32px; transition: transform 0.3s, border-color 0.3s; position: relative; }
        .landing .pricing-card:hover { transform: translateY(-4px); }
        .landing .pricing-card.popular { border-color: var(--blue); background: linear-gradient(160deg, rgba(36,97,255,0.08) 0%, var(--surface) 60%); }
        .landing .popular-badge { position: absolute; top: -14px; left: 50%; transform: translateX(-50%); background: var(--blue); color: #fff; font-size: 11px; font-weight: 600; padding: 4px 16px; border-radius: 100px; text-transform: uppercase; white-space: nowrap; }
        .landing .plan-name { font-size: 13px; color: var(--muted); letter-spacing: 0.05em; text-transform: uppercase; margin-bottom: 12px; }
        .landing .plan-price { font-family: 'Syne', sans-serif; font-size: 48px; font-weight: 800; letter-spacing: -2px; color: var(--white); margin-bottom: 4px; }
        .landing .plan-price sup { font-size: 24px; vertical-align: super; }
        .landing .plan-period { font-size: 13px; color: var(--muted); margin-bottom: 28px; }
        .landing .plan-features { list-style: none; margin-bottom: 32px; }
        .landing .plan-features li { font-size: 14px; color: var(--muted); padding: 8px 0; border-bottom: 1px solid var(--border); display: flex; align-items: center; gap: 10px; }
        .landing .plan-features li::before { content: '✓'; color: var(--green); font-weight: 700; font-size: 12px; flex-shrink: 0; }
        .landing .plan-cta { display: block; text-align: center; padding: 12px; border-radius: 10px; font-size: 14px; font-weight: 500; text-decoration: none; transition: all 0.2s; }
        .landing .plan-cta.primary { background: var(--blue); color: #fff; }
        .landing .plan-cta.primary:hover { background: var(--blue-dim); }
        .landing .plan-cta.ghost { background: transparent; color: var(--text); border: 1px solid var(--border); }
        .landing .plan-cta.ghost:hover { border-color: rgba(255,255,255,0.2); }
        .landing .cta-section { padding: 120px 60px; text-align: center; position: relative; overflow: hidden; }
        .landing .cta-section::before { content: ''; position: absolute; top: 50%; left: 50%; transform: translate(-50%,-50%); width: 600px; height: 400px; background: radial-gradient(ellipse, rgba(36,97,255,0.1) 0%, transparent 70%); }
        .landing .cta-section h2 { font-family: 'Syne', sans-serif; font-size: clamp(36px,4vw,60px); font-weight: 800; letter-spacing: -2px; max-width: 700px; margin: 0 auto 24px; line-height: 1.1; }
        .landing .cta-section p { font-size: 17px; color: var(--muted); margin-bottom: 40px; font-weight: 300; }
        .landing footer { border-top: 1px solid var(--border); padding: 40px 60px; display: flex; justify-content: space-between; align-items: center; }
        .landing .footer-logo { font-family: 'Syne', sans-serif; font-size: 16px; font-weight: 700; color: var(--text); }
        .landing .footer-logo span { color: var(--blue); }
        .landing .footer-links { display: flex; gap: 24px; }
        .landing .footer-links a { font-size: 13px; color: var(--muted); text-decoration: none; transition: color 0.2s; }
        .landing .footer-links a:hover { color: var(--text); }
        .landing .footer-copy { font-size: 12px; color: var(--muted); }
        @media (max-width: 900px) {
          .landing nav { padding: 16px 24px; }
          .landing .nav-links { display: none; }
          .landing .hero { padding: 100px 24px 60px; }
          .landing .stats-bar { flex-direction: column; }
          .landing .stat-item { border-right: none; border-bottom: 1px solid var(--border); }
          .landing .features-grid, .landing .pricing-grid, .landing .steps-grid { grid-template-columns: 1fr; }
          .landing .ai-card { grid-template-columns: 1fr; }
          .landing .features-section, .landing .how-section, .landing .ai-section, .landing .pricing-section, .landing .cta-section { padding: 60px 24px; }
          .landing footer { flex-direction: column; gap: 20px; text-align: center; }
        }
      `}</style>

      <div className="landing">

        {/* NAV */}
        <nav>
          <a href="/" style={{display:'flex', alignItems:'center', textDecoration:'none'}}>
  <img
    src="/costpilot-logo.jpg"
    alt="UnifyTech CostPilot"
    style={{height:'44px', width:'auto', objectFit:'contain'}}
  />
</a>
          <div className="nav-links">
            <a href="#features">Özellikler</a>
            <a href="#ai">AI Asistan</a>
            <a href="#how">Nasıl Çalışır</a>
            <a href="#pricing">Fiyatlar</a>
            <Link href="/auth/login">Giriş Yap</Link>
          </div>
          <Link href="/auth/login" className="nav-cta">Ücretsiz Başla →</Link>
        </nav>

        {/* HERO */}
        <section className="hero">
          {/* Floating elements */}
          <div style={{position:'absolute',top:'15%',left:'8%',width:'300px',height:'300px',background:'radial-gradient(circle, rgba(36,97,255,0.08) 0%, transparent 70%)',borderRadius:'50%',filter:'blur(40px)',pointerEvents:'none'}} />
          <div style={{position:'absolute',bottom:'20%',right:'8%',width:'250px',height:'250px',background:'radial-gradient(circle, rgba(0,229,160,0.06) 0%, transparent 70%)',borderRadius:'50%',filter:'blur(40px)',pointerEvents:'none'}} />

          {/* Azure icon floating cards */}
          <div style={{position:'absolute',top:'20%',left:'5%',background:'rgba(13,13,20,0.8)',border:'1px solid rgba(255,255,255,0.07)',borderRadius:'16px',padding:'16px 20px',backdropFilter:'blur(12px)',animation:'fadeUp 0.8s 0.5s ease both',opacity:0}}>
            <div style={{display:'flex',alignItems:'center',gap:'10px'}}>
              <div style={{width:'36px',height:'36px',background:'rgba(36,97,255,0.15)',borderRadius:'10px',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'18px'}}>☁️</div>
              <div>
                <p style={{fontSize:'11px',color:'var(--muted)',margin:0}}>Aylık Tasarruf</p>
                <p style={{fontSize:'16px',fontWeight:'700',color:'var(--green)',margin:0}}>$4,280</p>
              </div>
            </div>
          </div>

          <div style={{position:'absolute',top:'35%',right:'5%',background:'rgba(13,13,20,0.8)',border:'1px solid rgba(255,255,255,0.07)',borderRadius:'16px',padding:'16px 20px',backdropFilter:'blur(12px)',animation:'fadeUp 0.8s 0.7s ease both',opacity:0}}>
            <div style={{display:'flex',alignItems:'center',gap:'10px'}}>
              <div style={{width:'36px',height:'36px',background:'rgba(0,229,160,0.15)',borderRadius:'10px',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'18px'}}>🔍</div>
              <div>
                <p style={{fontSize:'11px',color:'var(--muted)',margin:0}}>Taranan Kaynak</p>
                <p style={{fontSize:'16px',fontWeight:'700',color:'var(--white)',margin:0}}>847</p>
              </div>
            </div>
          </div>

          <div style={{position:'absolute',bottom:'25%',left:'6%',background:'rgba(13,13,20,0.8)',border:'1px solid rgba(255,255,255,0.07)',borderRadius:'16px',padding:'16px 20px',backdropFilter:'blur(12px)',animation:'fadeUp 0.8s 0.9s ease both',opacity:0}}>
            <div style={{display:'flex',alignItems:'center',gap:'10px'}}>
              <div style={{width:'36px',height:'36px',background:'rgba(255,193,7,0.15)',borderRadius:'10px',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'18px'}}>💡</div>
              <div>
                <p style={{fontSize:'11px',color:'var(--muted)',margin:0}}>Açık Öneri</p>
                <p style={{fontSize:'16px',fontWeight:'700',color:'#fbbf24',margin:0}}>23 öneri</p>
              </div>
            </div>
          </div>
          <div className="hero-badge">🆕 Yeni: Gemini AI Asistan eklendi!</div>
          <h1>Azure maliyetlerinizi<br /><span className="accent">akıllıca yönetin</span></h1>
          <p>8 saatte bir otomatik tarama, AI destekli maliyet analizi ve akıllı optimizasyon önerileri ile Azure faturanızı ortalama %40 azaltın.</p>
          <div className="hero-actions">
            <Link href="/auth/login" className="btn-primary">
              Ücretsiz Deneyin
              <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8l4 4m0 0l-4 4m4-4H3"/></svg>
            </Link>
            <a href="#features" className="btn-ghost">
              <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
              Özellikleri Keşfet
            </a>
          </div>
          <div className="stats-bar">
            <div className="stat-item"><div className="stat-num"><span>%</span>40</div><div className="stat-label">Ortalama Tasarruf</div></div>
            <div className="stat-item"><div className="stat-num">8<span>s</span></div><div className="stat-label">Tarama Sıklığı</div></div>
            <div className="stat-item"><div className="stat-num">7/24</div><div className="stat-label">Otomatik İzleme</div></div>
            <div className="stat-item"><div className="stat-num">AI</div><div className="stat-label">Destekli Analiz</div></div>
          </div>
        </section>

        {/* FEATURES */}
        <section className="features-section" id="features">
          <div className="section-eyebrow">Özellikler</div>
          <h2 className="section-title">Azure maliyetlerini kontrol altına alan her şey</h2>
          <div className="features-grid">
            {[
              { icon: '🔍', title: 'Otomatik Kaynak Tarama', desc: 'Azure subscription\'ınızı 8 saatte bir otomatik olarak tarar. VM\'ler, diskler, public IP\'ler ve tüm kaynakları anlık izler.', isNew: false },
              { icon: '🤖', title: 'Gemini AI Asistan', desc: '"Bu ay neden bu kadar harcadım?" gibi sorular sorun, AI gerçek verilerinizi analiz edip Türkçe cevaplar versin.', isNew: true },
              { icon: '💡', title: 'Akıllı Optimizasyon', desc: 'Boşta kalan VM\'leri, bağlantısız diskleri ve kullanılmayan IP\'leri tespit eder. Her öneri için tahmini aylık tasarruf gösterir.', isNew: false },
              { icon: '📊', title: 'Gelişmiş Maliyet Analizi', desc: 'Kaynak türüne göre maliyet dağılımı, aylık trend grafikleri ve ay sonu tahmini ile bütçenizi kontrol altında tutun.', isNew: false },
              { icon: '💰', title: 'Bütçe Yönetimi', desc: 'Aylık bütçe limiti belirleyin, eşik aşıldığında otomatik uyarı alın. Harcamalarınızı gerçek zamanlı takip edin.', isNew: true },
              { icon: '👥', title: 'Takım Yönetimi', desc: 'IT adminlerinizi platforma davet edin. E-posta ile davet gönderin, rol tabanlı erişim kontrolü yapın.', isNew: true },
              { icon: '📧', title: 'Otomatik Bildirimler', desc: 'Her tarama sonrası IT adminlerine detaylı rapor e-postası gönderilir. Maliyet alarmları ve haftalık özetler.', isNew: false },
              { icon: '🔐', title: 'Çoklu Giriş Seçeneği', desc: 'Microsoft iş hesabı veya Google hesabınızla güvenli giriş yapın. Azure AD entegrasyonu ile kurumsal SSO desteği.', isNew: true },
              { icon: '🏢', title: 'Multi-Tenant Mimari', desc: 'Her şirketin verileri tamamen izole edilmiş şekilde saklanır. Row Level Security ile güçlü veri güvenliği.', isNew: false },
            ].map((f, i) => (
              <div key={i} className="feature-card">
                <div className="feature-icon">{f.icon}</div>
                <div className="feature-title">
                  {f.title}
                  {f.isNew && <span className="new-badge">YENİ</span>}
                </div>
                <p className="feature-desc">{f.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* AI SECTION */}
        <section className="ai-section" id="ai">
          <div style={{maxWidth:'1100px',margin:'0 auto'}}>
            <div className="section-eyebrow">Yapay Zeka</div>
            <h2 className="section-title">Azure maliyetlerinizi AI ile anlayın</h2>
            <div className="ai-card">
              <div>
                <div style={{display:'inline-flex',alignItems:'center',gap:'8px',background:'rgba(36,97,255,0.1)',border:'1px solid rgba(36,97,255,0.3)',color:'#7aa3ff',fontSize:'12px',padding:'4px 12px',borderRadius:'100px',marginBottom:'24px'}}>
                  🤖 Gemini AI ile Güçlendirildi
                </div>
                <h3 style={{fontFamily:'Syne, sans-serif',fontSize:'28px',fontWeight:'700',letterSpacing:'-1px',color:'var(--white)',marginBottom:'16px',lineHeight:'1.2'}}>
                  Sorularınızı doğal dilde sorun
                </h3>
                <p style={{color:'var(--muted)',fontSize:'15px',lineHeight:'1.7',marginBottom:'32px',fontWeight:'300'}}>
                  AI asistan gerçek Azure verilerinizi analiz ederek maliyet optimizasyonu konusunda kişiselleştirilmiş öneriler sunar.
                </p>
                <div style={{display:'flex',flexDirection:'column',gap:'12px'}}>
                  {[
                    { icon: '💬', text: 'Türkçe doğal dil ile soru sorun' },
                    { icon: '📊', text: 'Gerçek verilerinize dayalı analizler' },
                    { icon: '💡', text: 'Kişiselleştirilmiş tasarruf önerileri' },
                    { icon: '⚡', text: 'Anlık cevaplar, sohbet geçmişi' },
                  ].map((item, i) => (
                    <div key={i} style={{display:'flex',alignItems:'center',gap:'12px'}}>
                      <span style={{fontSize:'18px'}}>{item.icon}</span>
                      <span style={{fontSize:'14px',color:'var(--muted)'}}>{item.text}</span>
                    </div>
                  ))}
                </div>
                <Link href="/auth/login" style={{display:'inline-flex',alignItems:'center',gap:'8px',background:'var(--blue)',color:'#fff',padding:'12px 24px',borderRadius:'10px',fontSize:'14px',fontWeight:'500',textDecoration:'none',marginTop:'32px',transition:'background 0.2s'}}>
                  AI Asistanı Deneyin →
                </Link>
              </div>

              {/* Chat Preview */}
              <div className="ai-chat-preview">
                <div style={{display:'flex',alignItems:'center',gap:'8px',marginBottom:'16px',paddingBottom:'12px',borderBottom:'1px solid var(--border)'}}>
                  <div style={{width:'8px',height:'8px',borderRadius:'50%',background:'var(--green)',animation:'pulse 2s infinite'}}></div>
                  <span style={{fontSize:'12px',color:'var(--muted)'}}>Azure AI Asistan · Çevrimiçi</span>
                </div>
                {[
                  { role: 'user', text: 'Bu ay neden bu kadar harcadım?' },
                  { role: 'ai', text: 'Analizime göre bu ay harcamanız geçen aya göre %12 arttı. Başlıca sebep: prod-vm-01 ve dev-vm-02 VM\'leri 7 gündür boşta çalışıyor. Bu iki kaynağı kapatarak aylık $1,160 tasarruf edebilirsiniz.' },
                  { role: 'user', text: 'Peki nasıl tasarruf edebilirim?' },
                  { role: 'ai', text: 'Önerilerim: 1) Boşta VM\'leri durdurun ($820/ay), 2) Orphan disk\'i silin ($410/ay), 3) Kullanılmayan Public IP\'yi kaldırın ($120/ay). Toplam potansiyel tasarruf: $1,350/ay 🎯' },
                ].map((msg, i) => (
                  <div key={i} className={`chat-msg ${msg.role}`}>
                    <div className={`chat-bubble ${msg.role}`}>{msg.text}</div>
                  </div>
                ))}
                <div className="chat-input">
                  <div className="chat-input-field">Soru sorun...</div>
                  <button className="chat-send">→</button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* HOW IT WORKS */}
        <section className="how-section" id="how">
          <div style={{maxWidth:'1200px',margin:'0 auto'}}>
            <div className="section-eyebrow">Nasıl Çalışır</div>
            <h2 className="section-title">5 dakikada kurulumu tamamlayın</h2>
            <div className="steps-grid">
              {[
                { num: 1, title: 'Hesap Oluşturun', desc: 'Microsoft veya Google hesabınızla saniyeler içinde kayıt olun.' },
                { num: 2, title: "Azure'u Bağlayın", desc: 'Service Principal oluşturun ve bilgilerinizi girin.' },
                { num: 3, title: 'Taramayı Başlatın', desc: 'İlk tarama dakikalar içinde tamamlanır.' },
                { num: 4, title: 'AI ile Analiz Edin', desc: 'AI asistana sorular sorun, tasarruf fırsatlarını keşfedin.' },
              ].map((s, i) => (
                <div key={i} className="step">
                  <div className="step-num">{s.num}</div>
                  <div className="step-title">{s.title}</div>
                  <p className="step-desc">{s.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* PRICING */}
        <section className="pricing-section" id="pricing">
          <div style={{textAlign:'center'}}>
            <div className="section-eyebrow">Fiyatlandırma</div>
            <h2 className="section-title" style={{maxWidth:'100%',textAlign:'center',marginLeft:'auto',marginRight:'auto'}}>Şirketinizin ihtiyacına uygun plan</h2>
          </div>
          <div className="pricing-grid">
            <div className="pricing-card">
              <div className="plan-name">Free / Haftalık</div>/div>
              <div className="plan-price"><sup>$</sup>0</div>
              <div className="plan-period">7 Günlük Kullanım </div>
              <ul className="plan-features">
                <li>100 kaynağa kadar</li>
                <li>8 saatlik tarama periyodu</li>
                <li>30 günlük veri saklama</li>
                <li>E-posta bildirimleri</li>
                <li>AI Asistan (günde 20 kredi)</li>
                <li>Google & Microsoft giriş</li>
                <li>1 Subscription ekleme</li>
              </ul>
              <Link href="/auth/login" className="plan-cta ghost">Ücretsiz Başla</Link>
            </div>
            <div className="pricing-card popular">
              <div className="popular-badge">En Popüler</div>
              <div className="plan-name">Pro / Yıllık</div>
              <div className="plan-price"><sup>$</sup>149</div>
              <div className="plan-period">aylık · yıllık ödemede %20 indirim</div>
              <ul className="plan-features">
                <li>Sınırsız kaynak</li>
                <li>1 saatlik tarama</li>
                <li>90 günlük veri saklama</li>
                <li>Sınırsız AI Asistan</li>
                <li>Takım yönetimi (10 kullanıcı)</li>
                <li>Slack & Teams bildirimleri</li>
                <li>Sınırsız Subscription ekleme</li>
                <li>7/24 Teknik Destek</li>
              </ul>
              <Link href="/auth/login" className="plan-cta primary">Pro&apos;ya Geç</Link>
            </div>
            <div className="pricing-card">
              <div className="plan-name">Enterprise</div>
              <div className="plan-price" style={{fontSize:'36px'}}>Özel</div>
              <div className="plan-period">ihtiyacınıza göre fiyatlandırma</div>
              <ul className="plan-features">
                <li>Birden fazla subscription</li>
                <li>15 dakikalık tarama</li>
                <li>Sınırsız veri saklama</li>
                <li>Özel AI modeli</li>
                <li>Sınırsız takım üyesi</li>
                <li>7/24 teknik destek</li>
              </ul>
              <a href="mailto:info@unifytech.com.tr" className="plan-cta ghost">Teklif Alın</a>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="cta-section">
          <h2>Azure faturanızı düşürmeye<br />bugün başlayın</h2>
          <p>Kredi kartı gerekmez. 5 dakikada kurulum. AI destekli analiz ücretsiz.</p>
          <Link href="/auth/login" className="btn-primary" style={{fontSize:'16px',padding:'16px 40px',display:'inline-flex',alignItems:'center',gap:'8px'}}>
            Ücretsiz Hesap Oluştur
            <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8l4 4m0 0l-4 4m4-4H3"/></svg>
          </Link>
        </section>

        {/* FOOTER */}
        <footer>
          <div className="footer-logo">Unify<span>Tech</span></div>
          <div className="footer-links">
            <a href="#features">Özellikler</a>
            <a href="#ai">AI Asistan</a>
            <a href="#pricing">Fiyatlar</a>
            <Link href="/auth/login">Uygulamaya Gir</Link>
            <a href="mailto:info@unifytech.com.tr">İletişim</a>
          </div>
          <div className="footer-copy">© 2025 UnifyTech Bilgi Sistemleri</div>
        </footer>

      </div>
    </>
  )
}
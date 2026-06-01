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
        .landing .hero::before { content: ''; position: absolute; top: -200px; left: 50%; transform: translateX(-50%); width: 800px; height: 800px; background: radial-gradient(circle, rgba(36,97,255,0.12) 0%, transparent 70%); pointer-events: none; }
        .landing .hero-badge { display: inline-flex; align-items: center; gap: 8px; background: rgba(36,97,255,0.1); border: 1px solid rgba(36,97,255,0.3); color: #7aa3ff; font-size: 13px; padding: 6px 16px; border-radius: 100px; margin-bottom: 32px; animation: fadeUp 0.6s ease both; }
        .landing .hero-badge::before { content: ''; width: 6px; height: 6px; background: var(--blue); border-radius: 50%; animation: pulse 2s infinite; }
        @keyframes pulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.5;transform:scale(1.3)} }
        @keyframes fadeUp { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
        .landing h1 { font-family: 'Syne', sans-serif; font-size: clamp(48px,7vw,88px); font-weight: 800; line-height: 1.05; letter-spacing: -3px; max-width: 900px; margin-bottom: 24px; animation: fadeUp 0.6s 0.1s ease both; }
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
        .landing .preview-section { padding: 40px 60px 120px; }
        .landing .preview-wrapper { background: var(--surface); border: 1px solid var(--border); border-radius: 20px; overflow: hidden; }
        .landing .preview-bar { display: flex; align-items: center; gap: 8px; padding: 16px 20px; background: var(--surface2); border-bottom: 1px solid var(--border); }
        .landing .dot { width: 12px; height: 12px; border-radius: 50%; }
        .landing .dot-red { background: #ff5f57; } .landing .dot-yellow { background: #ffbd2e; } .landing .dot-green { background: #28c840; }
        .landing .preview-url { flex: 1; text-align: center; font-size: 12px; color: var(--muted); }
        .landing .preview-content { display: grid; grid-template-columns: 200px 1fr; min-height: 480px; }
        .landing .preview-sidebar { background: #0a0a12; border-right: 1px solid var(--border); padding: 20px 0; }
        .landing .sidebar-logo { padding: 0 20px 20px; font-family: 'Syne', sans-serif; font-size: 14px; font-weight: 700; border-bottom: 1px solid var(--border); margin-bottom: 12px; }
        .landing .sidebar-logo span { color: var(--blue); }
        .landing .sidebar-item { display: flex; align-items: center; gap: 10px; padding: 10px 20px; font-size: 13px; color: var(--muted); }
        .landing .sidebar-item.active { color: #7aa3ff; background: rgba(36,97,255,0.08); border-right: 2px solid var(--blue); }
        .landing .sidebar-dot { width: 6px; height: 6px; border-radius: 50%; background: var(--muted); }
        .landing .sidebar-item.active .sidebar-dot { background: var(--blue); }
        .landing .preview-main { padding: 24px; }
        .landing .metric-row { display: grid; grid-template-columns: repeat(4,1fr); gap: 12px; margin-bottom: 20px; }
        .landing .metric-card { background: var(--surface2); border: 1px solid var(--border); border-radius: 12px; padding: 16px; }
        .landing .metric-label { font-size: 10px; color: var(--muted); text-transform: uppercase; letter-spacing: 0.05em; }
        .landing .metric-value { font-family: 'Syne', sans-serif; font-size: 22px; font-weight: 700; color: var(--white); margin-top: 6px; }
        .landing .metric-value.green { color: var(--green); } .landing .metric-value.orange { color: #ff9d4e; }
        .landing .metric-sub { font-size: 10px; color: var(--muted); margin-top: 4px; }
        .landing .chart-row { display: grid; grid-template-columns: 2fr 1fr; gap: 12px; }
        .landing .chart-card { background: var(--surface2); border: 1px solid var(--border); border-radius: 12px; padding: 16px; }
        .landing .chart-title { font-size: 12px; font-weight: 500; color: var(--text); margin-bottom: 12px; }
        .landing .mini-chart { display: flex; align-items: flex-end; gap: 4px; height: 80px; }
        .landing .bar { flex: 1; border-radius: 3px 3px 0 0; background: rgba(36,97,255,0.3); }
        .landing .bar.highlight { background: var(--blue); }
        .landing .features-section { padding: 120px 60px; }
        .landing .section-eyebrow { font-size: 12px; letter-spacing: 0.1em; text-transform: uppercase; color: var(--blue); margin-bottom: 16px; font-weight: 500; }
        .landing .section-title { font-family: 'Syne', sans-serif; font-size: clamp(36px,4vw,54px); font-weight: 700; letter-spacing: -2px; line-height: 1.1; max-width: 600px; margin-bottom: 60px; }
        .landing .features-grid { display: grid; grid-template-columns: repeat(3,1fr); gap: 1px; background: var(--border); border: 1px solid var(--border); border-radius: 20px; overflow: hidden; }
        .landing .feature-card { background: var(--surface); padding: 40px 36px; transition: background 0.3s; }
        .landing .feature-card:hover { background: var(--surface2); }
        .landing .feature-icon { width: 48px; height: 48px; background: var(--blue-glow); border: 1px solid rgba(36,97,255,0.2); border-radius: 12px; display: flex; align-items: center; justify-content: center; margin-bottom: 24px; font-size: 22px; }
        .landing .feature-title { font-family: 'Syne', sans-serif; font-size: 18px; font-weight: 700; margin-bottom: 12px; color: var(--white); }
        .landing .feature-desc { font-size: 14px; color: var(--muted); line-height: 1.7; font-weight: 300; }
        .landing .how-section { padding: 120px 60px; background: var(--surface); border-top: 1px solid var(--border); border-bottom: 1px solid var(--border); }
        .landing .steps-grid { display: grid; grid-template-columns: repeat(4,1fr); position: relative; margin-top: 60px; }
        .landing .steps-grid::before { content: ''; position: absolute; top: 32px; left: 10%; width: 80%; height: 1px; background: linear-gradient(90deg, transparent, var(--blue), transparent); }
        .landing .step { padding: 0 24px; text-align: center; }
        .landing .step-num { width: 64px; height: 64px; border-radius: 50%; background: var(--black); border: 1px solid var(--border); display: flex; align-items: center; justify-content: center; font-family: 'Syne', sans-serif; font-size: 20px; font-weight: 700; color: var(--blue); margin: 0 auto 24px; position: relative; z-index: 1; transition: all 0.3s; }
        .landing .step:hover .step-num { background: var(--blue-glow); border-color: var(--blue); transform: scale(1.1); }
        .landing .step-title { font-family: 'Syne', sans-serif; font-size: 16px; font-weight: 600; margin-bottom: 10px; }
        .landing .step-desc { font-size: 13px; color: var(--muted); line-height: 1.6; font-weight: 300; }
        .landing .pricing-section { padding: 120px 60px; }
        .landing .pricing-grid { display: grid; grid-template-columns: repeat(3,1fr); gap: 24px; margin-top: 60px; max-width: 900px; margin-left: auto; margin-right: auto; }
        .landing .pricing-card { background: var(--surface); border: 1px solid var(--border); border-radius: 20px; padding: 36px 32px; transition: transform 0.3s, border-color 0.3s; position: relative; }
        .landing .pricing-card:hover { transform: translateY(-4px); }
        .landing .pricing-card.popular { border-color: var(--blue); background: linear-gradient(160deg, rgba(36,97,255,0.08) 0%, var(--surface) 60%); }
        .landing .popular-badge { position: absolute; top: -14px; left: 50%; transform: translateX(-50%); background: var(--blue); color: #fff; font-size: 11px; font-weight: 600; letter-spacing: 0.05em; padding: 4px 16px; border-radius: 100px; text-transform: uppercase; white-space: nowrap; }
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
          .landing .preview-section, .landing .features-section, .landing .how-section, .landing .pricing-section, .landing .cta-section { padding: 60px 24px; }
          .landing footer { flex-direction: column; gap: 20px; text-align: center; }
          .landing .preview-content { grid-template-columns: 1fr; }
          .landing .preview-sidebar { display: none; }
          .landing .metric-row { grid-template-columns: repeat(2,1fr); }
          .landing .chart-row { grid-template-columns: 1fr; }
        }
      `}</style>

      <div className="landing">

        {/* NAV */}
        <nav>
          <a href="/" className="nav-logo">Unify<span>Tech</span></a>
          <div className="nav-links">
            <a href="#features">Özellikler</a>
            <a href="#how">Nasıl Çalışır</a>
            <a href="#pricing">Fiyatlar</a>
            <Link href="/dashboard">Giriş Yap</Link>
          </div>
          <Link href="/dashboard" className="nav-cta">Ücretsiz Başla →</Link>
        </nav>

        {/* HERO */}
        <section className="hero">
          <div className="hero-badge">Azure Cost Management Platform</div>
          <h1>Azure maliyetlerinizi<br /><span className="accent">akıllıca yönetin</span></h1>
          <p>8 saatte bir otomatik tarama yapın, kullanılmayan kaynakları tespit edin ve Azure faturanızı ortalama %40 azaltın.</p>
          <div className="hero-actions">
            <Link href="/dashboard" className="btn-primary">
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
            <div className="stat-item"><div className="stat-num">5<span>dk</span></div><div className="stat-label">Kurulum Süresi</div></div>
          </div>
        </section>

        {/* DASHBOARD PREVİEW */}
        <section className="preview-section">
          <div className="preview-wrapper">
            <div className="preview-bar">
              <div className="dot dot-red"></div>
              <div className="dot dot-yellow"></div>
              <div className="dot dot-green"></div>
              <div className="preview-url">azure-cost-saas.vercel.app/dashboard</div>
            </div>
            <div className="preview-content">
              <div className="preview-sidebar">
                <div className="sidebar-logo">Unify<span>Tech</span><br /><span style={{fontSize:'10px',color:'#5a5870',fontWeight:400}}>Azure Cost</span></div>
                <div className="sidebar-item active"><div className="sidebar-dot"></div>Dashboard</div>
                <div className="sidebar-item"><div className="sidebar-dot"></div>Kaynaklar</div>
                <div className="sidebar-item"><div className="sidebar-dot"></div>Öneriler</div>
                <div className="sidebar-item"><div className="sidebar-dot"></div>Raporlar</div>
                <div className="sidebar-item"><div className="sidebar-dot"></div>Ayarlar</div>
              </div>
              <div className="preview-main">
                <div className="metric-row">
                  <div className="metric-card"><div className="metric-label">Aylık Maliyet</div><div className="metric-value">$9,600</div><div className="metric-sub" style={{color:'#ff6b6b'}}>↑ %12 geçen ay</div></div>
                  <div className="metric-card"><div className="metric-label">Tasarruf Fırsatı</div><div className="metric-value green">$1,970</div><div className="metric-sub">%21 tasarruf mümkün</div></div>
                  <div className="metric-card"><div className="metric-label">Aktif Kaynak</div><div className="metric-value">47</div><div className="metric-sub" style={{color:'#ffbd2e'}}>5 dikkat gerektiriyor</div></div>
                  <div className="metric-card"><div className="metric-label">Ay Sonu Tahmini</div><div className="metric-value orange">$11,200</div><div className="metric-sub">Mevcut trendde</div></div>
                </div>
                <div className="chart-row">
                  <div className="chart-card">
                    <div className="chart-title">Son 7 Günlük Maliyet Trendi</div>
                    <div className="mini-chart">
                      <div className="bar" style={{height:'62%'}}></div>
                      <div className="bar" style={{height:'75%'}}></div>
                      <div className="bar" style={{height:'55%'}}></div>
                      <div className="bar highlight" style={{height:'82%'}}></div>
                      <div className="bar" style={{height:'70%'}}></div>
                      <div className="bar" style={{height:'45%'}}></div>
                      <div className="bar" style={{height:'52%'}}></div>
                    </div>
                  </div>
                  <div className="chart-card">
                    <div className="chart-title">Kaynak Dağılımı</div>
                    <div style={{display:'flex',flexDirection:'column',gap:'8px',marginTop:'8px'}}>
                      {[
                        {label:'VMs $4,200', pct:'44%', color:'#2461ff'},
                        {label:'SQL $2,100', pct:'22%', color:'#00e5a0'},
                        {label:'Storage $1,800', pct:'19%', color:'#8b5cf6'},
                        {label:'App $900', pct:'9%', color:'#ff9d4e'},
                      ].map((item,i) => (
                        <div key={i} style={{display:'flex',alignItems:'center',gap:'8px'}}>
                          <div style={{flex:1,height:'6px',background:'rgba(255,255,255,0.05)',borderRadius:'3px',overflow:'hidden'}}>
                            <div style={{width:item.pct,height:'100%',background:item.color,borderRadius:'3px'}}></div>
                          </div>
                          <span style={{fontSize:'11px',color:'#7a788a',width:'90px'}}>{item.label}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* FEATURES */}
        <section className="features-section" id="features">
          <div className="section-eyebrow">Özellikler</div>
          <h2 className="section-title">Azure maliyetlerini kontrol altına alan her şey</h2>
          <div className="features-grid">
            {[
              { icon: '🔍', title: 'Otomatik Kaynak Tarama', desc: 'Azure subscription\'ınızı 8 saatte bir otomatik olarak tarar. VM\'ler, diskler, public IP\'ler ve tüm kaynakları anlık olarak izler.' },
              { icon: '💡', title: 'Akıllı Optimizasyon Önerileri', desc: 'Boşta kalan VM\'leri, bağlantısız diskleri ve kullanılmayan IP adreslerini tespit eder. Her öneri için tahmini aylık tasarruf gösterir.' },
              { icon: '📊', title: 'Gelişmiş Maliyet Analizi', desc: 'Kaynak türüne göre maliyet dağılımı, aylık trend grafikleri ve ay sonu tahmini ile bütçenizi her zaman kontrol altında tutun.' },
              { icon: '📧', title: 'Otomatik E-posta Bildirimleri', desc: 'Her tarama sonrası IT adminlerine detaylı rapor e-postası gönderilir. Maliyet alarmları ve haftalık özetlerle hiçbir şeyi kaçırmayın.' },
              { icon: '🔐', title: 'Microsoft SSO ile Güvenli Giriş', desc: 'Azure AD entegrasyonu sayesinde çalışanlarınız kendi Microsoft iş hesaplarıyla güvenli bir şekilde sisteme erişir.' },
              { icon: '🏢', title: 'Multi-Tenant Mimari', desc: 'Her şirketin verileri tamamen izole edilmiş şekilde saklanır. Row Level Security ile güçlü veri güvenliği sağlanır.' },
            ].map((f, i) => (
              <div key={i} className="feature-card">
                <div className="feature-icon">{f.icon}</div>
                <div className="feature-title">{f.title}</div>
                <p className="feature-desc">{f.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* HOW IT WORKS */}
        <section className="how-section" id="how">
          <div style={{maxWidth:'1200px',margin:'0 auto'}}>
            <div className="section-eyebrow">Nasıl Çalışır</div>
            <h2 className="section-title">5 dakikada kurulumu tamamlayın</h2>
            <div className="steps-grid">
              {[
                { num: 1, title: 'Hesap Oluşturun', desc: 'Microsoft iş hesabınızla saniyeler içinde kayıt olun.' },
                { num: 2, title: "Azure'u Bağlayın", desc: 'Service Principal oluşturun ve bilgilerinizi girin.' },
                { num: 3, title: 'Taramayı Başlatın', desc: 'İlk tarama dakikalar içinde tamamlanır.' },
                { num: 4, title: 'Tasarruf Edin', desc: 'Önerileri uygulayın, Azure faturanızı düşürün.' },
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
              <div className="plan-name">Free</div>
              <div className="plan-price"><sup>$</sup>0</div>
              <div className="plan-period">sonsuza kadar ücretsiz</div>
              <ul className="plan-features">
                <li>100 kaynağa kadar</li>
                <li>8 saatlik tarama</li>
                <li>30 günlük veri saklama</li>
                <li>E-posta bildirimleri</li>
                <li>Temel dashboard</li>
              </ul>
              <Link href="/dashboard" className="plan-cta ghost">Ücretsiz Başla</Link>
            </div>
            <div className="pricing-card popular">
              <div className="popular-badge">En Popüler</div>
              <div className="plan-name">Pro</div>
              <div className="plan-price"><sup>$</sup>49</div>
              <div className="plan-period">aylık · yıllık ödemede %20 indirim</div>
              <ul className="plan-features">
                <li>Sınırsız kaynak</li>
                <li>1 saatlik tarama</li>
                <li>90 günlük veri saklama</li>
                <li>Öncelikli e-posta desteği</li>
                <li>Gelişmiş raporlama</li>
                <li>Slack & Teams bildirimleri</li>
              </ul>
              <Link href="/dashboard" className="plan-cta primary">Pro&apos;ya Geç</Link>
            </div>
            <div className="pricing-card">
              <div className="plan-name">Enterprise</div>
              <div className="plan-price" style={{fontSize:'36px'}}>Özel</div>
              <div className="plan-period">ihtiyacınıza göre fiyatlandırma</div>
              <ul className="plan-features">
                <li>Birden fazla subscription</li>
                <li>15 dakikalık tarama</li>
                <li>Sınırsız veri saklama</li>
                <li>Özel SLA garantisi</li>
                <li>On-premise kurulum</li>
                <li>7/24 teknik destek</li>
              </ul>
              <a href="mailto:info@unifytech.com.tr" className="plan-cta ghost">Teklif Alın</a>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="cta-section">
          <h2>Azure faturanızı düşürmeye<br />bugün başlayın</h2>
          <p>Kredi kartı gerekmez. 5 dakikada kurulum. İlk tarama ücretsiz.</p>
          <Link href="/dashboard" className="btn-primary" style={{fontSize:'16px',padding:'16px 40px',display:'inline-flex',alignItems:'center',gap:'8px'}}>
            Ücretsiz Hesap Oluştur
            <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8l4 4m0 0l-4 4m4-4H3"/></svg>
          </Link>
        </section>

        {/* FOOTER */}
        <footer>
          <div className="footer-logo">Unify<span>Tech</span></div>
          <div className="footer-links">
            <a href="#features">Özellikler</a>
            <a href="#pricing">Fiyatlar</a>
            <Link href="/dashboard">Uygulamaya Gir</Link>
            <a href="mailto:info@unifytech.com.tr">İletişim</a>
          </div>
          <div className="footer-copy">© 2025 UnifyTech Bilgi Sistemleri</div>
        </footer>

      </div>
    </>
  )
}
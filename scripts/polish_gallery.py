from pathlib import Path

PAGE = Path('app/profile/page.tsx')
CSS = Path('app/profile/profile.module.css')

p = PAGE.read_text(encoding='utf-8')
c = CSS.read_text(encoding='utf-8')

if 'NEXA_GALLERY_V4' not in c:
    c += '''\n/* NEXA_GALLERY_V4 */\n.mediaGalleryV4{display:grid !important;grid-template-columns:repeat(2,minmax(0,1fr)) !important;gap:12px !important;margin-top:4px}.mediaCardV4{position:relative;overflow:hidden;border:1px solid rgba(255,255,255,.1) !important;border-radius:22px !important;background:linear-gradient(145deg,#10131b,#07080c) !important;box-shadow:0 14px 40px rgba(0,0,0,.24)}.mediaImageV4{display:block;width:100%;aspect-ratio:1/1;object-fit:cover;cursor:zoom-in;transition:transform .28s ease,filter .28s ease}.mediaCardV4:hover .mediaImageV4{transform:scale(1.025);filter:saturate(1.06)}.mediaActionsV4{display:grid !important;grid-template-columns:1fr 1fr 1fr;gap:7px !important;padding:9px !important;background:rgba(8,10,15,.96)}.mediaActionsV4 button{min-width:0 !important;min-height:38px;padding:7px 5px !important;border:1px solid rgba(255,255,255,.1) !important;border-radius:12px !important;background:#11141c !important;color:#f5f6fa !important;font:600 14px/1 system-ui,sans-serif !important;cursor:pointer}.mediaActionsV4 button:hover{border-color:rgba(145,100,255,.55) !important;background:#171a25 !important}.mediaActionsV4 button.liked{color:#ff4f91 !important}@media(max-width:520px){.mediaGalleryV4{gap:8px !important}.mediaActionsV4{gap:5px !important;padding:7px !important}.mediaActionsV4 button{min-height:36px;font-size:13px !important}}\n'''
    CSS.write_text(c, encoding='utf-8')

replacements = [
    ("<div style={{display:'grid',gridTemplateColumns:'repeat(2,minmax(0,1fr))',gap:10}}>", "<div className={styles.mediaGalleryV4}>"),
    ("<div key={post.id} style={{position:'relative',borderRadius:18,overflow:'hidden',background:'#090b10',border:'1px solid #242936'}}>", "<div key={post.id} className={styles.mediaCardV4}>"),
    ("<img src={post.media_url||''} alt=\"Фото\" style={{display:'block',width:'100%',aspectRatio:'1/1',objectFit:'cover'}}/>", "<img src={post.media_url||''} alt=\"Фото\" className={styles.mediaImageV4} onClick={()=>window.open(post.media_url||'', '_blank')}/>") ,
    ("<div style={{display:'flex',justifyContent:'space-between',gap:6,padding:8}}>", "<div className={styles.mediaActionsV4}>")
]

changed = False
for old, new in replacements:
    if old in p:
        p = p.replace(old, new, 1)
        changed = True

if changed:
    PAGE.write_text(p, encoding='utf-8')
    print('NEXA media gallery polished')
else:
    print('NEXA media gallery already polished or markup changed')

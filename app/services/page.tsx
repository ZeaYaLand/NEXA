'use client';
import Link from 'next/link';
import styles from './services.module.css';

const groups = [
  {title:'Общение', items:[['Сообщения','Личные и групповые чаты','/messages','✉'],['Уведомления','Лайки, комментарии и события','/notifications','♡'],['Поиск','Люди, публикации и сообщества','/search','⌕']]},
  {title:'Контент', items:[['Лента','Публикации и подписки','/','⌂'],['Медиа','Фотографии, истории, видео и музыка','/media','▣'],['Сохранённое','Закладки публикаций','/bookmarks','★'],['Музыка','Загружай и слушай треки','/media?tab=music','♫'],['Видео','Загружай и смотри видео','/media?tab=video','▶'],['Истории','Фото и видео на 24 часа','/media','◉']]},
  {title:'Люди и сообщества', items:[['Друзья','Поиск людей и управление подписками','/friends','♧'],['Группы и каналы','Сообщества, подписки и страницы','/communities','◈'],['События','Встречи и мероприятия','/services/events','◷']]},
  {title:'Твой аккаунт', items:[['Профиль','Фото, посты, лайки и информация','/profile','●'],['Настройки','Приватность, уведомления и безопасность','/settings','⚙'],['Безопасность','Сессии и управление доступом','/settings','⌁']]},
];

export default function ServicesPage(){
 return <main className="shell"><aside className="sidebar"><div className="brand">NEXA<span>.</span></div><nav><Link href="/">Главная</Link><Link href="/search">Поиск</Link><Link href="/messages">Сообщения</Link><Link href="/notifications">Уведомления</Link><Link href="/profile">Профиль</Link><Link href="/friends">Друзья</Link><Link href="/communities">Сообщества</Link><Link className="active" href="/services">Сервисы</Link><Link href="/settings">Настройки</Link></nav></aside><section className="feed"><header className="topbar"><div><p className="eyebrow">NEXA ECOSYSTEM</p><h1>Сервисы</h1></div><Link className="avatar" href="/profile">N</Link></header><section className={styles.hero}><span>NEXA / SOCIAL PLATFORM</span><h2>Всё общение — в одном месте.</h2><p>Основные возможности социальной сети собраны здесь. Открывай раздел и используй его без лишних переходов.</p></section>{groups.map(g=><section className={styles.group} key={g.title}><h3>{g.title}</h3><div className={styles.grid}>{g.items.map(([name,desc,href,icon])=><Link className={styles.card} href={href} key={name}><span className={styles.icon}>{icon}</span><span className={styles.copy}><b>{name}</b><small>{desc}</small></span><span className={styles.arrow}>›</span></Link>)}</div></section>)}</section></main>
}

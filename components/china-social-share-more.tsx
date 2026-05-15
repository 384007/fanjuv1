const morePlatforms = [
  ["朋友圈", "Moments", "朋", "#1AAD19", "二维码或复制链接后分享到微信朋友圈"],
  ["微信视频号", "Channels", "视", "#07C160", "复制链接后分享到视频号简介或评论区"],
  ["公众号", "Official Account", "公", "#07C160", "复制链接后放入公众号文章或菜单"],
  ["企业微信", "WeCom", "企", "#2A8CFF", "复制链接后分享到企业微信群"],
  ["QQ频道", "QQ Channel", "频", "#12B7F5", "复制链接后分享到 QQ 频道"],
  ["腾讯会议", "Tencent Meeting", "会", "#006EFF", "用于线上预热或饭局前说明"],
  ["腾讯文档", "Tencent Docs", "文", "#2B74FF", "用于饭局报名表或补充说明"],
  ["得物", "Dewu", "得", "#00C2B3", "复制链接后分享到得物社区"],
  ["闲鱼", "Xianyu", "闲", "#FFD21E", "复制链接后分享到闲鱼社区"],
  ["网易云", "NetEase Music", "云", "#D43C33", "复制链接后分享到动态或歌单评论"],
  ["虎扑", "Hupu", "虎", "#D0021B", "复制链接后分享到虎扑社区"],
  ["即刻", "Jike", "即", "#FFE411", "复制链接后分享到即刻动态"],
]

export function ChinaSocialShareMore({ url = "https://fanju.app/invite" }: { url?: string }) {
  return (
    <section className="border-b border-border/60">
      <div className="mx-auto max-w-[1200px] px-4 py-12 md:px-8 md:py-16">
        <div className="font-mono text-[11px] tracking-[0.25em] text-accent uppercase">MORE CHINA CHANNELS</div>
        <h2 className="mt-4 font-serif text-3xl text-foreground md:text-4xl">更多中国社交入口</h2>
        <div className="mt-8 grid grid-cols-2 gap-px border border-border/60 bg-border/60 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
          {morePlatforms.map(([name, en, mark, color, note]) => (
            <a key={name} href={url} target="_blank" rel="noreferrer" className="group bg-card/40 p-4 transition-colors hover:bg-card/70">
              <div className="flex items-center gap-3">
                <span className="flex h-11 w-11 items-center justify-center rounded-2xl text-base font-bold text-white shadow-sm" style={{ backgroundColor: color }}>{mark}</span>
                <span>
                  <span className="block font-serif text-lg text-foreground group-hover:text-accent">{name}</span>
                  <span className="block font-mono text-[9px] tracking-[0.16em] text-muted-foreground uppercase">{en}</span>
                </span>
              </div>
              <p className="mt-3 text-xs leading-relaxed text-muted-foreground">{note}</p>
            </a>
          ))}
        </div>
      </div>
    </section>
  )
}

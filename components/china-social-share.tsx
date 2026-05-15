const platforms = [
  ["微信", "WeChat", "微", "#07C160", "生成二维码后分享到微信聊天或朋友圈"],
  ["小红书", "RED", "红", "#FF2442", "复制饭局链接后发布到小红书笔记或群聊"],
  ["抖音", "Douyin", "抖", "#111111", "复制饭局链接后分享到抖音私信或主页介绍"],
  ["微博", "Weibo", "博", "#E6162D", "分享到微博动态"],
  ["QQ", "QQ", "Q", "#12B7F5", "分享到 QQ 好友"],
  ["QQ空间", "Qzone", "空", "#F7C600", "分享到 QQ 空间"],
  ["哔哩哔哩", "Bilibili", "B", "#00A1D6", "复制链接后分享到 B 站动态"],
  ["快手", "Kuaishou", "快", "#FF4906", "复制链接后分享到快手私信或主页"],
  ["知乎", "Zhihu", "知", "#1677FF", "复制链接后分享到知乎想法或回答"],
  ["百度贴吧", "Tieba", "贴", "#3385FF", "复制链接后分享到贴吧"],
  ["豆瓣", "Douban", "豆", "#2E963D", "复制链接后分享到豆瓣小组或动态"],
  ["今日头条", "Toutiao", "头", "#F04142", "复制链接后分享到头条动态"],
  ["飞书", "Feishu", "飞", "#3370FF", "复制链接后分享到飞书群"],
  ["钉钉", "DingTalk", "钉", "#1677FF", "复制链接后分享到钉钉群"],
]

export function ChinaSocialShare({ url = "https://fanju.app/invite", title = "饭局 Fanju 邀请链接" }: { url?: string; title?: string }) {
  const encodedUrl = encodeURIComponent(url)
  const encodedTitle = encodeURIComponent(title)

  const shareHref = (name: string) => {
    if (name === "微博") return `https://service.weibo.com/share/share.php?url=${encodedUrl}&title=${encodedTitle}`
    if (name === "QQ") return `https://connect.qq.com/widget/shareqq/index.html?url=${encodedUrl}&title=${encodedTitle}`
    if (name === "QQ空间") return `https://sns.qzone.qq.com/cgi-bin/qzshare/cgi_qzshare_onekey?url=${encodedUrl}&title=${encodedTitle}`
    if (name === "豆瓣") return `https://www.douban.com/share/service?href=${encodedUrl}&name=${encodedTitle}`
    return url
  }

  return (
    <section className="border-b border-border/60">
      <div className="mx-auto max-w-[1200px] px-4 py-12 md:px-8 md:py-16">
        <div className="flex items-center justify-between gap-4">
          <div>
            <div className="font-mono text-[11px] tracking-[0.25em] text-accent uppercase">CHINA SOCIAL SHARE</div>
            <h2 className="mt-4 font-serif text-3xl text-foreground md:text-4xl">中国主流社交平台分享</h2>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground">微信、小红书、抖音、微博、QQ、QQ空间、B站、快手、知乎、贴吧、豆瓣、头条、飞书、钉钉都显示为可识别图标入口。</p>
          </div>
          <a href="/qr" className="hidden border border-border bg-secondary/40 px-4 py-3 font-mono text-[11px] tracking-[0.2em] text-foreground uppercase hover:border-accent/70 hover:text-accent md:inline-flex">QR</a>
        </div>
        <div className="mt-8 grid grid-cols-2 gap-px border border-border/60 bg-border/60 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7">
          {platforms.map(([name, en, mark, color, note]) => (
            <a key={name} href={shareHref(name)} target="_blank" rel="noreferrer" className="group bg-card/40 p-4 transition-colors hover:bg-card/70">
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

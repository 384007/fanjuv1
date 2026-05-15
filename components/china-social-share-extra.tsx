const extraPlatforms = [
  ["支付宝", "Alipay", "支", "#1677FF", "复制链接后分享到支付宝好友或生活号"],
  ["微视", "Weishi", "微", "#00C2FF", "复制链接后分享到微视"],
  ["西瓜视频", "Xigua", "西", "#FF4D4F", "复制链接后分享到西瓜视频"],
  ["AcFun", "AcFun", "A", "#FD4C5B", "复制链接后分享到 AcFun 动态"],
  ["LOFTER", "LOFTER", "L", "#00B96B", "复制链接后分享到 LOFTER"],
  ["米游社", "Miyoushe", "米", "#00A6FF", "复制链接后分享到米游社"],
  ["TapTap", "TapTap", "T", "#12C2E9", "复制链接后分享到 TapTap 社区"],
  ["Soul", "Soul", "S", "#4B5BFF", "复制链接后分享到 Soul"],
  ["陌陌", "Momo", "陌", "#1E90FF", "复制链接后分享到陌陌"],
  ["探探", "Tantan", "探", "#FF5A5F", "复制链接后分享到探探"],
  ["小宇宙", "Xiaoyuzhou", "播", "#F5A623", "复制链接后分享到播客简介或动态"],
  ["微博超话", "Super Topic", "超", "#E6162D", "复制链接后分享到微博超话"],
]

export function ChinaSocialShareExtra({ url = "https://fanju.app/invite" }: { url?: string }) {
  return (
    <section className="border-b border-border/60">
      <div className="mx-auto max-w-[1200px] px-4 py-12 md:px-8 md:py-16">
        <div className="font-mono text-[11px] tracking-[0.25em] text-accent uppercase">EXTRA CHINA CHANNELS</div>
        <h2 className="mt-4 font-serif text-3xl text-foreground md:text-4xl">内容社区和兴趣社交入口</h2>
        <div className="mt-8 grid grid-cols-2 gap-px border border-border/60 bg-border/60 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
          {extraPlatforms.map(([name, en, mark, color, note]) => (
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

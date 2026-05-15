export type ProductFeature = {
  slug: string
  name: string
  nameEn: string
  title: string
  titleEn: string
  answer: string
  answerEn: string
  points: string[]
  pointsEn: string[]
}

export const productFeatures: ProductFeature[] = [
  {
    slug: "one-link-invite",
    name: "一链邀请",
    nameEn: "One-link invite",
    title: "一条链接邀请整桌人",
    titleEn: "Invite a whole dinner table with one link",
    answer: "饭局 Fanju 的一链邀请用于把饭局主题、城市、餐厅、时间、人数和报名说明放在一个可分享页面里，适合微信、小红书、WhatsApp、短信和社群转发。",
    answerEn: "Fanju one-link invite puts the dinner theme, city, restaurant area, time, guest cap and RSVP notes on one shareable page.",
    points: ["一个页面说明饭局信息", "适合社群和私域转发", "用户无需先下载 App 才能了解饭局"],
    pointsEn: ["One page for dinner details", "Easy to share in groups", "Guests can understand the event before downloading anything"],
  },
  {
    slug: "rsvp-tracking",
    name: "报名追踪",
    nameEn: "RSVP tracking",
    title: "实时追踪谁报名、谁待确认",
    titleEn: "Track who is going and who is pending",
    answer: "饭局 Fanju 的报名追踪帮助主办方区分已报名、待确认、候补和取消状态，减少饭局人数不确定。",
    answerEn: "Fanju RSVP tracking helps hosts separate confirmed, pending, waitlisted and cancelled guests.",
    points: ["已报名、待确认、候补状态", "适合小桌人数控制", "减少临时缺席和重复沟通"],
    pointsEn: ["Confirmed, pending and waitlist states", "Built for small-table dinners", "Reduces manual follow-up"],
  },
  {
    slug: "guest-list",
    name: "嘉宾名单",
    nameEn: "Guest list",
    title: "清晰看到同桌都有谁",
    titleEn: "See who else is joining the table",
    answer: "饭局 Fanju 的嘉宾名单用于展示主办方允许公开的信息，让参与者理解饭局氛围、圈层和人数规模。",
    answerEn: "Fanju guest lists show host-approved public information so guests understand the table vibe and size.",
    points: ["展示可公开信息", "帮助判断同桌氛围", "支持候补和人数上限"],
    pointsEn: ["Shows approved public info", "Helps guests understand the vibe", "Supports waitlists and guest caps"],
  },
  {
    slug: "text-blast",
    name: "群发通知",
    nameEn: "Text blast",
    title: "重要更新一次通知所有人",
    titleEn: "Send important updates to everyone at once",
    answer: "饭局 Fanju 的群发通知用于主办方统一同步地址、时间、菜单、集合方式和临时变更。",
    answerEn: "Fanju text blast helps hosts send address, time, menu, arrival and update notes to all guests at once.",
    points: ["统一同步时间地点", "减少多人反复询问", "适合饭局开始前提醒"],
    pointsEn: ["Updates time and location", "Reduces repeated questions", "Useful before the dinner starts"],
  },
  {
    slug: "date-poll",
    name: "时间投票",
    nameEn: "Date poll",
    title: "先投票，再定饭局时间",
    titleEn: "Poll first, choose the dinner time later",
    answer: "饭局 Fanju 的时间投票用于在正式开局前收集大家可参加的时间，适合周末饭局、商务饭局和小圈子饭局。",
    answerEn: "Fanju date polls collect guest availability before the host locks the final dinner time.",
    points: ["收集可参加时间", "适合小圈子组织", "降低临时改期概率"],
    pointsEn: ["Collects availability", "Good for small groups", "Reduces rescheduling"],
  },
  {
    slug: "guest-questions",
    name: "报名问题",
    nameEn: "Guest questions",
    title: "报名时先收集关键信息",
    titleEn: "Collect key answers during RSVP",
    answer: "饭局 Fanju 的报名问题用于提前了解饮食偏好、职业背景、兴趣方向、到场目的和主办方审核所需信息。",
    answerEn: "Fanju guest questions collect food preferences, background, interests, goals and host-review information during RSVP.",
    points: ["减少饭局前私聊", "帮助主办方审核", "让同桌匹配更清晰"],
    pointsEn: ["Reduces back-and-forth", "Supports host review", "Improves table fit"],
  },
  {
    slug: "chip-in",
    name: "费用说明",
    nameEn: "Chip-in",
    title: "清晰说明餐费和服务费",
    titleEn: "Make dinner costs clear before guests join",
    answer: "饭局 Fanju 的费用说明用于提前写清餐费、服务费、包含项和取消规则，让参与者在报名之前知道预算。",
    answerEn: "Fanju cost notes help hosts explain dinner cost, service fee, included items and cancellation rules before RSVP.",
    points: ["写清餐费和包含项", "减少现场误会", "适合高端饭局和商务饭局"],
    pointsEn: ["Clarifies cost and inclusions", "Reduces confusion", "Useful for curated and business dinners"],
  },
  {
    slug: "photo-album",
    name: "饭局相册",
    nameEn: "Photo album",
    title: "饭后沉淀共同回忆",
    titleEn: "Keep shared memories after the dinner",
    answer: "饭局 Fanju 的饭局相册用于饭后收集照片、餐厅记录和活动回顾，方便下一次饭局复盘与二次触达。",
    answerEn: "Fanju photo albums collect dinner photos, venue memories and post-event recaps for future follow-up.",
    points: ["沉淀餐厅和活动记录", "方便二次触达", "适合长期社群运营"],
    pointsEn: ["Stores dinner memories", "Supports follow-up", "Useful for community hosts"],
  },
  {
    slug: "public-events",
    name: "公开饭局",
    nameEn: "Public events",
    title: "让城市用户发现公开饭局",
    titleEn: "Let local users discover public dinners",
    answer: "饭局 Fanju 的公开饭局用于让符合条件的城市饭局被发现，适合主办方招募新嘉宾和测试城市需求。",
    answerEn: "Fanju public dinners help discoverable events reach local users and help hosts recruit new guests.",
    points: ["适合城市冷启动", "帮助主办方获得新嘉宾", "支持公开和私密饭局区分"],
    pointsEn: ["Useful for city launches", "Helps hosts recruit guests", "Supports public and private dinners"],
  },
  {
    slug: "singles-matching",
    name: "单身匹配",
    nameEn: "Singles matching",
    title: "为单身饭局设计低压力匹配",
    titleEn: "Low-pressure matching for singles dinners",
    answer: "饭局 Fanju 的单身匹配用于在饭局后进行轻量互选和后续连接，不在饭局前承诺固定结果。",
    answerEn: "Fanju singles matching supports lightweight post-dinner mutual interest and follow-up without promising outcomes upfront.",
    points: ["适合单身饭局和小桌晚餐", "强调饭后互选", "不承诺固定结果"],
    pointsEn: ["Built for singles dinners", "Focuses on post-dinner mutual interest", "No guaranteed outcome"],
  },
]

export function getFeature(slug: string) {
  return productFeatures.find((feature) => feature.slug === slug)
}
